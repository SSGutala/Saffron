import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { runAriaPMAgent, buildPMContext } from "@/lib/aria/aria-pm-agent";
import { executeAriaPMActions } from "@/lib/aria/pm-tool-executor";
import { runCodeAgent } from "@/lib/code-agent";
import { runDesignGeneration } from "@/lib/lifecycle/orchestrator";
import { logProductActivity } from "@/lib/aria/activity";
import prisma from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import type { InspirationImage } from "@/types/lifecycle";

const imageSchema = z.object({
  id: z.string(),
  name: z.string(),
  dataUrl: z.string(),
  mimeType: z.string(),
});

function parseImages(raw: string | null | undefined): InspirationImage[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as InspirationImage[];
  } catch {
    return [];
  }
}

function mergeImages(
  existing: InspirationImage[],
  incoming?: InspirationImage[],
): InspirationImage[] {
  if (!incoming?.length) return existing;
  return [...existing, ...incoming].slice(0, 6);
}

function resolveDisplayName(project: { displayName: string | null; sourcePrompt: string | null; name: string }): string {
  if (project.displayName) return project.displayName;
  if (project.sourcePrompt) {
    const trimmed = project.sourcePrompt.slice(0, 60);
    return trimmed.length < project.sourcePrompt.length ? `${trimmed}…` : trimmed;
  }
  return project.name;
}

export const messagesRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { message: "projectId is required" }),
      })
    )
    .query(async ({ input, ctx }) => {
      const messages = await prisma.message.findMany({
        where: {
          projectId: input.projectId,
          project: {
            userId: ctx.auth.userId,
          },
        },
        orderBy: {
          updatedAt: "asc",
        },
        include: {
          fragment: true,
        },
      });

      return messages;
    }),

  create: protectedProcedure
    .input(
      z.object({
        value: z.string().min(1).max(10_000),
        projectId: z.string().min(1),
        images: z.array(imageSchema).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // ─── Load project with full context ────────────────────────────────────
      const existingProject = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
        include: {
          messages: {
            include: { fragment: true },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          artifacts: {
            orderBy: [{ stageOrder: "asc" }, { updatedAt: "desc" }],
          },
        },
      });

      if (!existingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      // ─── Save inspiration images ────────────────────────────────────────────
      const mergedImages = mergeImages(
        parseImages(existingProject.inspirationImages),
        input.images,
      );
      if (mergedImages.length !== parseImages(existingProject.inspirationImages).length) {
        await prisma.project.update({
          where: { id: existingProject.id },
          data: { inspirationImages: JSON.stringify(mergedImages) },
        });
      }

      // ─── Store user message ─────────────────────────────────────────────────
      const createdMessage = await prisma.message.create({
        data: {
          projectId: existingProject.id,
          content: input.value,
          role: "USER",
          type: "RESULT",
          metadata: input.images?.length
            ? JSON.stringify({ images: input.images })
            : undefined,
        },
      });

      // ─── Route: App Builder (code agent) ────────────────────────────────────
      const hasApp = existingProject.messages.some((m) => m.fragment);
      const lifecycleState = existingProject.lifecycleState;

      if (hasApp || lifecycleState === "APP_READY" || lifecycleState === "BUILDING") {
        let chosenStyle;
        if (existingProject.chosenStyleJson) {
          try {
            chosenStyle = JSON.parse(existingProject.chosenStyleJson);
          } catch {
            chosenStyle = undefined;
          }
        }
        void runCodeAgent({
          value: input.value,
          projectId: existingProject.id,
          chosenStyle,
          briefJson: existingProject.briefJson ?? undefined,
        });
        return createdMessage;
      }

      // ─── Route: Design generation ────────────────────────────────────────────
      const lower = input.value.toLowerCase();
      const wantsDesigns =
        lifecycleState === "DESIGNS_READY" ||
        lower.includes("design") ||
        lower.includes("style") ||
        lower.includes("regenerate");

      if (wantsDesigns && lifecycleState !== "INTAKE" && lifecycleState !== "BRIEF_READY") {
        void runDesignGeneration({
          projectId: existingProject.id,
          userId: ctx.auth.userId,
          feedback: input.value,
          images: input.images,
        });
        await prisma.message.create({
          data: {
            projectId: existingProject.id,
            role: "ASSISTANT",
            type: "RESULT",
            content:
              "Regenerating design directions with your feedback and inspiration images…",
          },
        });
        return createdMessage;
      }

      // ─── Route: INTAKE (still generating) ───────────────────────────────────
      if (lifecycleState === "INTAKE") {
        await prisma.message.create({
          data: {
            projectId: existingProject.id,
            role: "ASSISTANT",
            type: "RESULT",
            content:
              "Still mapping your product lifecycle — hang tight. Your inspiration images are saved.",
          },
        });
        return createdMessage;
      }

      // ─── Route: AI PM Agent (main path) ─────────────────────────────────────
      void runAriaPMInBackground({
        projectId: existingProject.id,
        userId: ctx.auth.userId,
        userMessage: input.value,
        project: existingProject,
        artifacts: existingProject.artifacts,
        recentMessages: [...existingProject.messages]
          .reverse()
          .map((m) => ({ role: m.role, content: m.content })),
      });

      return createdMessage;
    }),
});

// ─── Background AI PM Execution ───────────────────────────────────────────────
// Runs async so the user message is immediately returned to the UI

async function runAriaPMInBackground({
  projectId,
  userId,
  userMessage,
  project,
  artifacts,
  recentMessages,
}: {
  projectId: string;
  userId: string;
  userMessage: string;
  project: {
    id: string;
    name: string;
    displayName: string | null;
    lifecycleState: "INTAKE" | "BRIEF_READY" | "DESIGNS_READY" | "BUILDING" | "APP_READY";
    sourcePrompt: string | null;
  };
  artifacts: {
    id: string;
    title: string;
    artifactType: string;
    stageKey: string | null;
    status: "DRAFT" | "APPROVED" | "SUPERSEDED";
    version: number;
    sourceType: string;
    connectorProvider: "NATIVE" | "FIGMA" | "GOOGLE_DOCS" | "GOOGLE_SHEETS" | "GOOGLE_SLIDES" | "LUCIDCHART";
    connectorEmbedUrl: string | null;
    connectorExternalUrl: string | null;
    externalUrl: string | null;
    lastSyncedAt: Date | null;
    content: string;
  }[];
  recentMessages: { role: string; content: string }[];
}) {
  try {
    // Load user connections for Google status
    const userConnections = await prisma.userConnection.findMany({
      where: { userId, status: "connected" },
      select: { providerId: true, accountId: true },
    });

    // Build context for the AI PM agent
    const ctx = buildPMContext({
      project: {
        ...project,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        currentPhase: null,
        briefJson: null,
        stylePreviewsJson: null,
        chosenStyleJson: null,
        inspirationImages: null,
      },
      artifacts: artifacts.map((a) => ({
        ...a,
        userId,
        projectId,
        kind: "DOCUMENT" as const,
        description: null,
        stageOrder: null,
        sourcePrompt: null,
        syncStatus: "native",
        owner: null,
        dependenciesJson: null,
        relatedArtifactsJson: null,
        previewAvailable: true,
        fileUrls: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })) as unknown as import("@/generated/prisma").Artifact[],
      userConnections,
      recentMessages,
    });

    // Run the AI PM agent
    const agentResponse = await runAriaPMAgent(ctx, userMessage);

    // Execute any actions the agent determined
    const displayName = resolveDisplayName(project);
    const executionResult = await executeAriaPMActions(agentResponse, {
      projectId,
      userId,
      projectName: displayName,
      userMessage,
      allArtifacts: artifacts,
    });

    // Compose final response
    let finalResponse = agentResponse.response;

    // Append impact analysis if artifacts were changed
    if (executionResult.impactedArtifactTitles.length > 0) {
      finalResponse += `\n\n**Downstream impact:** The following artifacts may need review — ${executionResult.impactedArtifactTitles.slice(0, 5).join(", ")}.`;
    }

    // Append any error/amendment notes
    if (executionResult.responseAmendment) {
      finalResponse += executionResult.responseAmendment;
    }

    // Append suggested next action
    if (agentResponse.suggestedNext) {
      finalResponse += `\n\n_Next: ${agentResponse.suggestedNext}_`;
    }

    // Store the assistant message with rich metadata
    await prisma.message.create({
      data: {
        projectId,
        role: "ASSISTANT",
        type: "RESULT",
        cardType: agentResponse.intent,
        content: finalResponse,
        metadata: JSON.stringify({
          intent: agentResponse.intent,
          actions: agentResponse.actions.map((a) => a.type),
          changedArtifactIds: executionResult.changedArtifactIds,
          impactedArtifactTitles: executionResult.impactedArtifactTitles,
        }),
      },
    });

    // Log the AI PM interaction as activity
    if (executionResult.changedArtifactIds.length > 0) {
      await logProductActivity({
        projectId,
        eventType: "aria_pm_action",
        title: `Aria completed: ${agentResponse.intent.replace(/_/g, " ")}`,
        metadata: {
          intent: agentResponse.intent,
          changedCount: executionResult.changedArtifactIds.length,
        },
      });
    }
  } catch (err) {
    console.error("[AriaPM] Background execution failed:", err);
    // Store a graceful error message so the user sees something
    await prisma.message.create({
      data: {
        projectId,
        role: "ASSISTANT",
        type: "ERROR",
        content:
          "I ran into an issue processing your request. Please try again, or open the artifact directly from the Files tab.",
      },
    });
  }
}
