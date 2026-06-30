import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  handedOffContent,
  prepareConnectorHandoff,
} from "@/lib/connectors/handoff";
import { generateArtifactContent, refineArtifactContent } from "@/lib/artifacts/document-agent";
import { generateExports } from "@/lib/artifacts/export";
import { resolveTemplate } from "@/lib/ai-generate";
import {
  isLegacyArtifactContent,
  normalizeBriefJson,
} from "@/lib/lifecycle/brief-pipeline";
import { createLifecycleArtifactsFromBrief } from "@/lib/lifecycle/create-artifacts";
import { listDocumentTypes } from "@/lib/document-templates";
import prisma from "@/lib/prisma";
import type { ArtifactContent } from "@/types/artifacts";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import type { ConnectorProvider } from "@/generated/prisma";

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
      let artifacts = await prisma.artifact.findMany({
        where: {
          projectId: input.projectId,
          userId: ctx.auth.userId,
        },
        orderBy: [{ stageOrder: "asc" }, { updatedAt: "desc" }],
      });

      const stageArtifacts = artifacts.filter((a) => a.stageKey);
      if (stageArtifacts.length === 0 || stageArtifacts.some((a) => isLegacyArtifactContent(a.content))) {
        const project = await prisma.project.findFirst({
          where: { id: input.projectId, userId: ctx.auth.userId },
        });
        if (project?.briefJson) {
          try {
            const brief = normalizeBriefJson(
              JSON.parse(project.briefJson) as Record<string, unknown>,
            );
            await createLifecycleArtifactsFromBrief({
              projectId: input.projectId,
              userId: ctx.auth.userId,
              brief,
              prompt: project.sourcePrompt ?? "Product brief",
            });
            artifacts = await prisma.artifact.findMany({
              where: {
                projectId: input.projectId,
                userId: ctx.auth.userId,
              },
              orderBy: [{ stageOrder: "asc" }, { updatedAt: "desc" }],
            });
          } catch (err) {
            console.error("[artifacts] lifecycle sync failed:", err);
          }
        }
      }

      for (const artifact of artifacts) {
        if (
          artifact.connectorProvider !== "NATIVE" &&
          !artifact.connectorEmbedUrl
        ) {
          await prisma.artifact.update({
            where: { id: artifact.id },
            data: { connectorProvider: "NATIVE" },
          });
          artifact.connectorProvider = "NATIVE";
        }
      }

      return artifacts;
    }),

  connect: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        embedUrl: z.string().url(),
        externalUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const artifact = await prisma.artifact.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND" });

      if (artifact.connectorProvider !== "NATIVE" && artifact.connectorEmbedUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This file is already connected to an external app.",
        });
      }

      const content = parseContent(artifact.content);
      const { provider, fileUrls } = await prepareConnectorHandoff({
        kind: artifact.kind,
        content,
        title: artifact.title,
      });

      return prisma.artifact.update({
        where: { id: artifact.id },
        data: {
          connectorProvider: provider,
          connectorEmbedUrl: input.embedUrl,
          connectorExternalUrl: input.externalUrl ?? input.embedUrl,
          content: handedOffContent(artifact.title),
          fileUrls: JSON.stringify(fileUrls),
          version: artifact.version + 1,
        },
      });
    }),

  publishToIntegration: protectedProcedure
    .input(z.object({ id: z.string(), providerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const artifact = await prisma.artifact.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND" });

      if (artifact.connectorProvider !== "NATIVE" && artifact.connectorEmbedUrl) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This file is already connected to an external app.",
        });
      }

      const connection = await prisma.userConnection.findFirst({
        where: { userId: ctx.auth.userId, providerId: input.providerId, status: "connected" }
      });

      if (!connection) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Provider not connected.",
        });
      }

      const { SyncManager } = await import("@/lib/sync/SyncManager");
      const result = await SyncManager.publishArtifact(connection, artifact);
      
      const content = parseContent(artifact.content);
      const { provider, fileUrls } = await prepareConnectorHandoff({
        kind: artifact.kind,
        content,
        title: artifact.title,
      });

      return prisma.artifact.update({
        where: { id: artifact.id },
        data: {
          connectorProvider: provider,
          connectorEmbedUrl: result.externalUrl,
          connectorExternalUrl: result.externalUrl,
          content: handedOffContent(artifact.title),
          fileUrls: JSON.stringify(fileUrls),
          version: artifact.version + 1,
        },
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
      
      let syncError: string | null = null;
      let sourceStatus = existing.sourceStatus;
      
      if (existing.connectorProvider !== "NATIVE" && existing.externalFileId) {
        try {
          const providerMap: Record<string, string> = {
            GOOGLE_DOCS: "google",
            GOOGLE_SHEETS: "google",
            GOOGLE_SLIDES: "google",
            MICROSOFT_WORD: "microsoft",
          };
          const pid = providerMap[existing.connectorProvider];
          if (pid) {
            const userConnection = await prisma.userConnection.findFirst({
              where: { userId: ctx.auth.userId, providerId: pid, status: "connected" },
            });
            if (userConnection) {
              const { ProviderManager } = await import("@/lib/connectors/ProviderManager");
              const provider = ProviderManager.getProvider(pid as "google");
              if (provider.updateArtifact) {
                await provider.updateArtifact(userConnection, {
                  ...existing,
                  content: JSON.stringify(result.content),
                  title: result.title ?? existing.title
                } as any);
                sourceStatus = "synced";
              }
            }
          }
        } catch (err) {
          console.error("[aiRefine] Failed to update connected artifact", err);
          syncError = err instanceof Error ? err.message : "Failed to sync update";
          sourceStatus = "sync_error";
        }
      }

      return prisma.artifact.update({
        where: { id: input.id },
        data: {
          content: JSON.stringify(result.content),
          title: result.title ?? existing.title,
          version: existing.version + 1,
          fileUrls: JSON.stringify(fileUrls),
          sourceStatus,
          syncError,
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
        },
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

  syncOne: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const artifact = await prisma.artifact.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND" });

      if (artifact.connectorProvider === "NATIVE" || !artifact.externalFileId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Artifact is not connected to an external source" });
      }

      const connection = await prisma.userConnection.findFirst({
        where: { userId: ctx.auth.userId, providerId: "google", status: "connected" },
      });
      if (!connection) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Google Workspace is not connected.",
        });
      }

      const { GoogleWorkspaceProvider } = await import(
        "@/lib/connectors/providers/google-workspace"
      );
      const provider = new GoogleWorkspaceProvider();

      try {
        await provider.syncArtifact(connection, artifact);
        
        await prisma.activityEvent.create({
          data: {
            projectId: artifact.projectId,
            eventType: "artifact_sync_completed",
            title: `Synced "${artifact.title}" with Google Workspace`,
            metadataJson: JSON.stringify({ artifactId: artifact.id }),
          },
        });
        
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sync failed";
        await prisma.activityEvent.create({
          data: {
            projectId: artifact.projectId,
            eventType: "artifact_sync_failed",
            title: `Failed to sync "${artifact.title}"`,
            metadataJson: JSON.stringify({ artifactId: artifact.id, error: msg }),
          },
        });
        return { success: false, error: msg };
      }
    }),
});
