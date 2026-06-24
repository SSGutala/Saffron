import { TRPCError } from "@trpc/server";
import { generateSlug } from "random-word-slugs";
import { z } from "zod";

import { runCodeAgent } from "@/lib/code-agent";
import { runLifecycleBrief } from "@/lib/lifecycle/orchestrator";
import prisma from "@/lib/prisma";
import { consumeCredits } from "@/lib/usage";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const projectsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, { message: "id is required" }),
      })
    )
    .query(async ({ input, ctx }) => {
      const existingProject = await prisma.project.findUnique({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
      });

      if (!existingProject) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return existingProject;
    }),
  getMany: protectedProcedure.query(async ({ ctx }) => {
    const projects = await prisma.project.findMany({
      where: {
        userId: ctx.auth.userId,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return projects;
  }),
  create: protectedProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Value is required" })
          .max(10_000, { message: "Value is too long" }),
        images: z
          .array(
            z.object({
              id: z.string(),
              name: z.string(),
              dataUrl: z.string(),
              mimeType: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        await consumeCredits();
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Something went wrong.",
          });
        } else {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "You ran out of credits",
          });
        }
      }

      const createdProject = await prisma.project.create({
        data: {
          userId: ctx.auth.userId,
          name: generateSlug(2, { format: "kebab" }),
          sourcePrompt: input.value,
          inspirationImages: input.images?.length
            ? JSON.stringify(input.images)
            : undefined,
          messages: {
            create: {
              content: input.value,
              role: "USER",
              type: "RESULT",
              metadata: input.images?.length
                ? JSON.stringify({ images: input.images })
                : undefined,
            },
          },
        },
      });

      await prisma.message.create({
        data: {
          projectId: createdProject.id,
          role: "ASSISTANT",
          type: "RESULT",
          content:
            "Building your app now. I'm also generating your full product lifecycle (7 artifacts) in parallel — watch the Demo tab for your live preview.",
          cardType: "building",
        },
      });

      await prisma.project.update({
        where: { id: createdProject.id },
        data: { lifecycleState: "BUILDING" },
      });

      void runCodeAgent({
        value: input.value,
        projectId: createdProject.id,
      });

      void runLifecycleBrief({
        projectId: createdProject.id,
        userId: ctx.auth.userId,
        prompt: input.value,
        images: input.images,
      });

      return createdProject;
    }),
});
