import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { runCodeAgent } from "@/lib/code-agent";
import {
  runDesignGeneration,
  runLifecycleBrief,
} from "@/lib/lifecycle/orchestrator";
import prisma from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import type { InspirationImage, StylePreview } from "@/types/lifecycle";

const imageSchema = z.object({
  id: z.string(),
  name: z.string(),
  dataUrl: z.string(),
  mimeType: z.string(),
});

export const lifecycleRouter = createTRPCRouter({
  getStatus: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return {
        lifecycleState: project.lifecycleState,
        briefJson: project.briefJson,
        stylePreviewsJson: project.stylePreviewsJson,
        chosenStyleJson: project.chosenStyleJson,
      };
    }),

  runBrief: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        prompt: z.string().min(1),
        images: z.array(imageSchema).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return runLifecycleBrief({
        projectId: input.projectId,
        userId: ctx.auth.userId,
        prompt: input.prompt,
        images: input.images as InspirationImage[],
      });
    }),

  generateDesigns: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        feedback: z.string().optional(),
        images: z.array(imageSchema).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      return runDesignGeneration({
        projectId: input.projectId,
        userId: ctx.auth.userId,
        feedback: input.feedback,
        images: input.images as InspirationImage[],
      });
    }),

  buildApp: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        /** Multi-select supported */
        styleIds: z.array(z.string()).min(1),
        styleId: z.string().optional(),
        opinion: z.string().optional(),
        images: z.array(imageSchema).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      if (project.lifecycleState !== "DESIGNS_READY" && project.lifecycleState !== "BRIEF_READY") {
        const hasFragment = await prisma.fragment.findFirst({
          where: { message: { projectId: project.id } },
        });
        if (!hasFragment && project.lifecycleState !== "APP_READY") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Complete design selection before building the app.",
          });
        }
      }

      if (input.images?.length) {
        let existing: InspirationImage[] = [];
        if (project.inspirationImages) {
          try {
            existing = JSON.parse(project.inspirationImages) as InspirationImage[];
          } catch {
            existing = [];
          }
        }
        await prisma.project.update({
          where: { id: project.id },
          data: {
            inspirationImages: JSON.stringify(
              [...existing, ...(input.images as InspirationImage[])].slice(0, 6),
            ),
          },
        });
      }

      const ids = input.styleIds.length ? input.styleIds : input.styleId ? [input.styleId] : [];
      if (!ids.length) throw new TRPCError({ code: "BAD_REQUEST", message: "Select at least one design" });

      let styles: StylePreview[] = [];
      if (project.stylePreviewsJson) {
        try {
          styles = JSON.parse(project.stylePreviewsJson) as StylePreview[];
        } catch {
          styles = [];
        }
      }

      const chosenStyles = styles.filter((s) => ids.includes(s.id));
      if (!chosenStyles.length) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Selected designs not found" });
      }

      const combinedDirection = chosenStyles.map((s) => `${s.label}: ${s.direction}`).join("\n");
      const combinedLabels = chosenStyles.map((s) => s.label).join(" + ");

      const chosenStyle = {
        id: chosenStyles.map((s) => s.id).join(","),
        label: combinedLabels,
        vibe: chosenStyles.map((s) => s.vibe).join(" · "),
        direction: combinedDirection,
        previewImageUrl: chosenStyles[0]?.previewImageUrl,
        selectedIds: ids,
        opinion: input.opinion,
      };

      await prisma.project.update({
        where: { id: project.id },
        data: {
          chosenStyleJson: JSON.stringify(chosenStyle),
          lifecycleState: "BUILDING",
        },
      });

      await prisma.message.create({
        data: {
          projectId: project.id,
          role: "ASSISTANT",
          type: "RESULT",
          content: `Building your app using: ${combinedLabels}. Applying your design feedback…`,
          cardType: "building",
        },
      });

      void runCodeAgent({
        value: project.sourcePrompt ?? "Build the app",
        projectId: project.id,
        chosenStyle,
        briefJson: project.briefJson ?? undefined,
      });

      return { ok: true };
    }),

  approveStage: protectedProcedure
    .input(z.object({ artifactId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const artifact = await prisma.artifact.findFirst({
        where: { id: input.artifactId, userId: ctx.auth.userId },
      });
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND" });
      return prisma.artifact.update({
        where: { id: artifact.id },
        data: { status: "APPROVED" },
      });
    }),

  repairApp: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        errorText: z.string().min(1),
        userNote: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const { runCodeRepair } = await import("@/lib/code-agent");
      void runCodeRepair({
        projectId: input.projectId,
        errorText: input.errorText,
        userNote: input.userNote,
      });
      return { ok: true };
    }),
});
