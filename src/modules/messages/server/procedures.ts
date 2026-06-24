import { z } from "zod";

import { runCodeAgent } from "@/lib/code-agent";
import { refineArtifactContent } from "@/lib/artifacts/document-agent";
import { generateExports } from "@/lib/artifacts/export";
import { resolveTemplate } from "@/lib/ai-generate";
import { runDesignGeneration } from "@/lib/lifecycle/orchestrator";
import prisma from "@/lib/prisma";
import { consumeCredits } from "@/lib/usage";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import type { InspirationImage } from "@/types/lifecycle";
import type { ArtifactContent } from "@/types/artifacts";

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
      const existingProject = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
        include: {
          messages: { include: { fragment: true }, orderBy: { createdAt: "desc" }, take: 5 },
          artifacts: { where: { stageKey: { not: null } }, orderBy: { stageOrder: "asc" } },
        },
      });

      if (!existingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      try {
        await consumeCredits();
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Something went wrong." });
        }
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You ran out of credits" });
      }

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

      const lower = input.value.toLowerCase();
      const wantsDesigns =
        lifecycleState === "DESIGNS_READY" ||
        lower.includes("design") ||
        lower.includes("style") ||
        lower.includes("regenerate");

      if (wantsDesigns && lifecycleState !== "INTAKE") {
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

      if (lifecycleState === "BRIEF_READY" && existingProject.artifacts.length > 0) {
        const target =
          existingProject.artifacts.find((a) => a.status !== "APPROVED") ??
          existingProject.artifacts[existingProject.artifacts.length - 1];

        void (async () => {
          try {
            const template = resolveTemplate(target.artifactType);
            let currentContent: ArtifactContent = {};
            try {
              currentContent = JSON.parse(target.content) as ArtifactContent;
            } catch {
              currentContent = {};
            }

            const result = await refineArtifactContent({
              template,
              currentContent,
              instruction: input.value,
              projectName: existingProject.name,
              images: input.images,
            });

            const fileUrls = await generateExports(
              result.content,
              result.title ?? target.title,
              ["pdf", "docx", "md"],
            );

            await prisma.artifact.update({
              where: { id: target.id },
              data: {
                content: JSON.stringify(result.content),
                title: result.title ?? target.title,
                version: target.version + 1,
                fileUrls: JSON.stringify(fileUrls),
              },
            });

            await prisma.message.create({
              data: {
                projectId: existingProject.id,
                role: "ASSISTANT",
                type: "RESULT",
                content: `Updated "${target.title}" based on your feedback. Open the Files tab to review.`,
              },
            });
          } catch {
            await prisma.message.create({
              data: {
                projectId: existingProject.id,
                role: "ASSISTANT",
                type: "ERROR",
                content:
                  "Couldn't apply that edit automatically — try opening the artifact in the Files tab.",
              },
            });
          }
        })();
        return createdMessage;
      }

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
      }

      return createdMessage;
    }),
});
