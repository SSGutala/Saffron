import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { generateArtifactContent, refineArtifactContent } from "@/lib/artifacts/document-agent";
import { generateExports } from "@/lib/artifacts/export";
import { resolveTemplate } from "@/lib/ai-generate";
import { listDocumentTypes } from "@/lib/document-templates";
import prisma from "@/lib/prisma";
import type { ArtifactContent } from "@/types/artifacts";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { ConnectorProvider } from "@/generated/prisma";

const imageSchema = z.object({
  id: z.string(),
  name: z.string(),
  dataUrl: z.string(),
  mimeType: z.string(),
});

function parseContent(raw: string): ArtifactContent {
  try {
    return JSON.parse(raw) as ArtifactContent;
  } catch {
    return {};
  }
}

export const artifactsRouter = createTRPCRouter({
  listTypes: protectedProcedure.query(() => listDocumentTypes()),

  getMany: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      return prisma.artifact.findMany({
        where: {
          projectId: input.projectId,
          userId: ctx.auth.userId,
        },
        orderBy: [{ stageOrder: "asc" }, { updatedAt: "desc" }],
      });
    }),

  getOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const artifact = await prisma.artifact.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND" });
      return artifact;
    }),

  generate: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        documentType: z.string(),
        prompt: z.string().min(1).max(10000),
        customName: z.string().optional(),
        customDescription: z.string().optional(),
        images: z.array(imageSchema).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const template = resolveTemplate(
        input.documentType,
        input.customName,
        input.customDescription,
      );

      const result = await generateArtifactContent({
        template,
        prompt: input.prompt,
        projectName: project.name,
        images: input.images,
      });

      const kindMap = {
        DOCUMENT: "DOCUMENT",
        DIAGRAM: "DIAGRAM",
        DESIGN: "DESIGN",
        SPREADSHEET: "SPREADSHEET",
        PRESENTATION: "PRESENTATION",
      } as const;

      const fileUrls = await generateExports(
        result.content,
        result.title,
        template.exportFormats,
      );

      return prisma.artifact.create({
        data: {
          projectId: input.projectId,
          userId: ctx.auth.userId,
          kind: kindMap[template.kind],
          artifactType: template.documentType,
          title: result.title,
          content: JSON.stringify(result.content),
          sourcePrompt: input.prompt,
          connectorProvider:
            (result.connectorProvider as ConnectorProvider) ?? "NATIVE",
          connectorEmbedUrl: result.connectorEmbedUrl,
          connectorExternalUrl: result.connectorExternalUrl,
          fileUrls: JSON.stringify(fileUrls),
        },
      });
    }),

  aiRefine: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        instruction: z.string().min(1).max(10000),
        images: z.array(imageSchema).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.artifact.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
        include: { project: true },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const template = resolveTemplate(existing.artifactType);
      const currentContent = parseContent(existing.content);

      const result = await refineArtifactContent({
        template,
        currentContent,
        instruction: input.instruction,
        projectName: existing.project.name,
        images: input.images,
      });

      const fileUrls = await generateExports(
        result.content,
        result.title ?? existing.title,
        ["pdf", "docx", "md", "xlsx"],
      );

      return prisma.artifact.update({
        where: { id: input.id },
        data: {
          content: JSON.stringify(result.content),
          title: result.title ?? existing.title,
          version: existing.version + 1,
          fileUrls: JSON.stringify(fileUrls),
        },
      });
    }),

  updateContent: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string(),
        title: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await prisma.artifact.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      const content = parseContent(input.content);
      const fileUrls = await generateExports(
        content,
        input.title ?? existing.title,
        ["pdf", "docx", "md", "xlsx"],
      );

      return prisma.artifact.update({
        where: { id: input.id },
        data: {
          content: input.content,
          title: input.title ?? existing.title,
          version: existing.version + 1,
          fileUrls: JSON.stringify(fileUrls),
        },
      });
    }),

  connectDesign: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        designId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const artifact = await prisma.artifact.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND" });

      const content = parseContent(artifact.content);
      const variant = content.designVariants?.find((d) => d.id === input.designId);
      if (!variant) throw new TRPCError({ code: "BAD_REQUEST" });

      content.selectedDesignId = input.designId;
      return prisma.artifact.update({
        where: { id: input.id },
        data: {
          content: JSON.stringify(content),
          connectorProvider: "FIGMA",
          connectorEmbedUrl: variant.figmaEmbedUrl,
          connectorExternalUrl: variant.figmaExternalUrl,
        },
      });
    }),

  setConnectorMode: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        useConnector: z.boolean(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const artifact = await prisma.artifact.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND" });

      const provider = input.useConnector
        ? artifact.kind === "DIAGRAM"
          ? "LUCIDCHART"
          : artifact.kind === "SPREADSHEET"
            ? "GOOGLE_SHEETS"
            : artifact.kind === "PRESENTATION"
              ? "GOOGLE_SLIDES"
              : artifact.kind === "DESIGN"
                ? "FIGMA"
                : "GOOGLE_DOCS"
        : "NATIVE";

      return prisma.artifact.update({
        where: { id: input.id },
        data: { connectorProvider: provider as ConnectorProvider },
      });
    }),

  exportFiles: protectedProcedure
    .input(z.object({ id: z.string(), formats: z.array(z.string()).optional() }))
    .mutation(async ({ input, ctx }) => {
      const artifact = await prisma.artifact.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND" });

      const content = parseContent(artifact.content);
      const fileUrls = await generateExports(
        content,
        artifact.title,
        input.formats ?? ["pdf", "docx", "md", "xlsx"],
      );

      return prisma.artifact.update({
        where: { id: input.id },
        data: { fileUrls: JSON.stringify(fileUrls) },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const artifact = await prisma.artifact.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND" });
      await prisma.artifact.delete({ where: { id: input.id } });
      return { ok: true };
    }),
});
