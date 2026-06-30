import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  computeRecommendations,
  lifecycleToPhase,
  mapArtifactToView,
  PHASE_LABELS,
  resolveDisplayName,
} from "@/lib/aria/artifact-mapper";
import {
  buildTimeline,
  computeAiBriefing,
  computeHomeBriefing,
  computeProductPulse,
} from "@/lib/aria/briefing";
import { computeProjectImpacts } from "@/lib/aria/impact-engine";
import { ARIA_CONNECTORS } from "@/lib/aria/connectors";
import prisma from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import type { ProductWorkspaceSummary } from "@/types/aria";

import type { Artifact, Project } from "@/generated/prisma";

type ActivityRow = {
  id: string;
  eventType: string;
  title: string;
  createdAt: string;
};

function buildWorkspaceSummary(
  project: Project & {
    artifacts: Artifact[];
    connectors: { status: string }[];
    activityEvents?: { id: string; eventType: string; title: string; createdAt: Date }[];
  },
): ProductWorkspaceSummary {
  const artifacts = project.artifacts;
  const stageArtifacts = artifacts.filter((a) => a.stageKey);
  const approved = stageArtifacts.filter((a) => a.status === "APPROVED");
  const phase = lifecycleToPhase(project.lifecycleState);
  const displayName = resolveDisplayName(project);
  const recommendations = computeRecommendations({ project, artifacts });
  const views = artifacts
    .map((a) => mapArtifactToView(a, artifacts))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const activity: ActivityRow[] = (project.activityEvents ?? []).map((e) => ({
    id: e.id,
    eventType: e.eventType,
    title: e.title,
    createdAt: e.createdAt.toISOString(),
  }));

  const pulse = computeProductPulse({ project, artifacts, recommendations });
  const briefing = computeAiBriefing({
    project,
    artifacts,
    recommendations,
    activity,
    displayName,
  });

  return {
    id: project.id,
    name: project.name,
    displayName,
    lifecycleState: project.lifecycleState,
    phase,
    phaseLabel: PHASE_LABELS[phase],
    sourcePrompt: project.sourcePrompt,
    artifactTotal: stageArtifacts.length || artifacts.length,
    artifactApproved: approved.length,
    connectedToolsCount: project.connectors.filter(
      (c) => c.status === "connected" || c.status === "mock",
    ).length,
    pulse,
    briefing,
    recommendations,
    recentlyUpdated: views.slice(0, 6),
    continueLabel: `Continue ${displayName}`,
  };
}

async function fetchProject(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      artifacts: { orderBy: [{ stageOrder: "asc" }, { updatedAt: "desc" }] },
      connectors: true,
      activityEvents: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export const workspaceRouter = createTRPCRouter({
  getDashboard: protectedProcedure.query(async ({ ctx }) => {
    const projects = await prisma.project.findMany({
      where: { userId: ctx.auth.userId },
      include: {
        artifacts: true,
        connectors: true,
        activityEvents: { orderBy: { createdAt: "desc" }, take: 10 },
      },
      orderBy: { updatedAt: "desc" },
    });

    const products = projects.map((p) => buildWorkspaceSummary(p));
    const homeBriefing = computeHomeBriefing(products);

    const recentActivity = projects
      .flatMap((p) =>
        (p.activityEvents ?? []).map((e) => ({
          id: e.id,
          productId: p.id,
          productName: resolveDisplayName(p),
          title: e.title,
          createdAt: e.createdAt.toISOString(),
        })),
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    const connectedCount = projects.reduce(
      (sum, p) =>
        sum +
        p.connectors.filter((c) => c.status === "connected" || c.status === "mock").length,
      0,
    );

    return {
      briefing: homeBriefing,
      products,
      continueProduct: products[0] ?? null,
      recentActivity,
      stats: {
        productCount: products.length,
        artifactCount: products.reduce((s, p) => s + p.artifactTotal, 0),
        approvedCount: products.reduce((s, p) => s + p.artifactApproved, 0),
        approvalsWaiting: products.reduce((s, p) => s + p.pulse.approvalsWaiting, 0),
        riskCount: products.filter((p) => p.pulse.riskLevel === "high").length,
        healthPercent:
          products.length > 0
            ? Math.round(
                products.reduce((s, p) => {
                  const pct =
                    p.artifactTotal > 0
                      ? (p.artifactApproved / p.artifactTotal) * 100
                      : 0;
                  return s + pct;
                }, 0) / products.length,
              )
            : 0,
        connectedToolsCount: connectedCount,
      },
    };
  }),

  getProductWorkspace: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const project = await fetchProject(input.projectId, ctx.auth.userId);
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const summary = buildWorkspaceSummary(project);
      const artifacts = project.artifacts.map((a) => mapArtifactToView(a, project.artifacts));
      const activity = project.activityEvents.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        title: e.title,
        metadata: e.metadataJson ? JSON.parse(e.metadataJson) : null,
        createdAt: e.createdAt.toISOString(),
      }));

      const timeline = buildTimeline({ project, artifacts: project.artifacts, activity });
      const impacts = computeProjectImpacts(project, project.artifacts);

      return {
        summary,
        artifacts,
        activity,
        timeline,
        impacts,
      };
    }),

  getConnectors: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
        include: { connectors: true, artifacts: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const userConnections = await prisma.userConnection.findMany({
        where: { userId: ctx.auth.userId, status: "connected" }
      });

      const REAL_PROVIDER_MAP: Record<string, string> = {
        google_docs: "google",
        google_sheets: "google",
        google_slides: "google",
        microsoft_word: "microsoft",
        excel: "microsoft",
      };

      return ARIA_CONNECTORS.map((def) => {
        const installed = project.connectors.find((c) => c.connectorId === def.id);
        const usedByProduct = project.artifacts.some((a) => {
          const source = a.sourceType ?? "native";
          return source === def.sourceType || a.connectorProvider !== "NATIVE";
        });
        
        const realProvider = REAL_PROVIDER_MAP[def.id];
        const isRealConnected = realProvider && userConnections.some(c => c.providerId === realProvider);
        const status = isRealConnected ? "connected" : (installed?.status ?? "disconnected");

        return {
          ...def,
          status: status as
            | "connected"
            | "mock"
            | "disconnected"
            | "syncing",
          lastSyncAt: installed?.lastSyncAt?.toISOString() ?? null,
          usedByProduct,
        };
      });
    }),

  connectConnector: protectedProcedure
    .input(z.object({ projectId: z.string(), connectorId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const def = ARIA_CONNECTORS.find((c) => c.id === input.connectorId);
      if (!def) throw new TRPCError({ code: "BAD_REQUEST" });

      const connector = await prisma.projectConnector.upsert({
        where: {
          projectId_connectorId: {
            projectId: input.projectId,
            connectorId: input.connectorId,
          },
        },
        create: {
          projectId: input.projectId,
          connectorId: input.connectorId,
          status: "connected",
          lastSyncAt: new Date(),
          configJson: JSON.stringify({ connectedAt: new Date().toISOString() }),
        },
        update: {
          status: "connected",
          lastSyncAt: new Date(),
        },
      });

      await prisma.activityEvent.create({
        data: {
          projectId: input.projectId,
          eventType: "connector_connected",
          title: `Connected ${def.name}`,
          metadataJson: JSON.stringify({ connectorId: def.id }),
        },
      });

      return connector;
    }),

  mockConnect: protectedProcedure
    .input(z.object({ projectId: z.string(), connectorId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      const def = ARIA_CONNECTORS.find((c) => c.id === input.connectorId);
      if (!def) throw new TRPCError({ code: "BAD_REQUEST" });
      return prisma.projectConnector.upsert({
        where: {
          projectId_connectorId: {
            projectId: input.projectId,
            connectorId: input.connectorId,
          },
        },
        create: {
          projectId: input.projectId,
          connectorId: input.connectorId,
          status: "connected",
          lastSyncAt: new Date(),
        },
        update: { status: "connected", lastSyncAt: new Date() },
      });
    }),

  getGlobalArtifacts: protectedProcedure
    .input(
      z.object({
        filter: z
          .enum([
            "all",
            "artifacts",
            "backlog",
            "workflows",
            "automations",
            "designs",
            "tests",
            "releases",
          ])
          .default("all"),
        projectId: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const projects = await prisma.project.findMany({
        where: {
          userId: ctx.auth.userId,
          ...(input.projectId ? { id: input.projectId } : {}),
        },
        include: { artifacts: true },
        orderBy: { updatedAt: "desc" },
      });

      const { filterArtifactsGlobal } = await import("@/lib/aria/global-filters");

      const items = projects.flatMap((p) => {
        const displayName = resolveDisplayName(p);
        return p.artifacts.map((a) => ({
          ...mapArtifactToView(a, p.artifacts),
          productName: displayName,
        }));
      });

      return filterArtifactsGlobal(items, input.filter);
    }),

  getGlobalActivity: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(50) }))
    .query(async ({ input, ctx }) => {
      const events = await prisma.activityEvent.findMany({
        where: { project: { userId: ctx.auth.userId } },
        include: { project: true },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });

      return events.map((e) => ({
        id: e.id,
        projectId: e.projectId,
        productName: resolveDisplayName(e.project),
        eventType: e.eventType,
        title: e.title,
        createdAt: e.createdAt.toISOString(),
      }));
    }),

  getGlobalIntegrations: protectedProcedure.query(async ({ ctx }) => {
    const projects = await prisma.project.findMany({
      where: { userId: ctx.auth.userId },
      include: { connectors: true, artifacts: true },
    });

    const userConnections = await prisma.userConnection.findMany({
      where: { userId: ctx.auth.userId, status: "connected" }
    });

    const REAL_PROVIDER_MAP: Record<string, string> = {
      google_docs: "google",
      google_sheets: "google",
      google_slides: "google",
      microsoft_word: "microsoft",
      excel: "microsoft",
    };

    const allConnectors = projects.flatMap((p) => p.connectors);
    const allArtifacts = projects.flatMap((p) => p.artifacts);

    return ARIA_CONNECTORS.map((def) => {
      const installed = allConnectors.filter((c) => c.connectorId === def.id);
      
      const realProvider = REAL_PROVIDER_MAP[def.id];
      let connected = false;
      if (realProvider) {
        connected = userConnections.some(c => c.providerId === realProvider);
      } else {
        connected = installed.some(
          (c) => c.status === "connected" || c.status === "mock",
        );
      }

      const artifactCount = allArtifacts.filter((a) => {
        if (a.connectorProvider !== "NATIVE") {
          const providerMap: Record<string, string> = {
            GOOGLE_DOCS: "google_docs",
            GOOGLE_SHEETS: "google_sheets",
            FIGMA: "figma",
            LUCIDCHART: "lucidchart",
          };
          return providerMap[a.connectorProvider] === def.sourceType;
        }
        return a.sourceType === def.sourceType;
      }).length;

      return {
        ...def,
        status: connected ? ("connected" as const) : ("disconnected" as const),
        artifactCount,
        productCount: new Set(installed.map((c) => c.projectId)).size,
      };
    });
  }),

  logActivity: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        eventType: z.string(),
        title: z.string(),
        metadata: z.record(z.unknown()).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return prisma.activityEvent.create({
        data: {
          projectId: input.projectId,
          eventType: input.eventType,
          title: input.title,
          metadataJson: input.metadata ? JSON.stringify(input.metadata) : undefined,
        },
      });
    }),


  getUserConnections: protectedProcedure.query(async ({ ctx }) => {
    return prisma.userConnection.findMany({
      where: { userId: ctx.auth.userId, status: "connected" },
      select: { providerId: true, accountId: true, scopes: true, status: true, expiresAt: true }
    });
  }),

  disconnectProvider: protectedProcedure
    .input(z.object({ providerId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await prisma.userConnection.deleteMany({
        where: { userId: ctx.auth.userId, providerId: input.providerId },
      });
      return { ok: true };
    }),

  publishAllToGoogle: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
        include: { artifacts: true },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const connection = await prisma.userConnection.findFirst({
        where: { userId: ctx.auth.userId, providerId: "google", status: "connected" },
      });
      if (!connection) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Google Workspace is not connected. Connect it from the Integrations page first.",
        });
      }

      const { GoogleWorkspaceProvider } = await import(
        "@/lib/connectors/providers/google-workspace"
      );
      const provider = new GoogleWorkspaceProvider();
      const displayName = resolveDisplayName(project);

      const results: { artifactId: string; title: string; success: boolean; error?: string; url?: string }[] = [];

      // Only publish native artifacts
      const nativeArtifacts = project.artifacts.filter(
        (a) => a.connectorProvider === "NATIVE" && !a.connectorEmbedUrl,
      );

      for (const artifact of nativeArtifacts) {
        try {
          const result = await provider.publishArtifact(connection, artifact, displayName);

          const folderId = result.folderId ?? artifact.externalFolderId;

          await prisma.artifact.update({
            where: { id: artifact.id },
            data: {
              connectorProvider: artifact.kind === "SPREADSHEET" ? "GOOGLE_SHEETS" : "GOOGLE_DOCS",
              connectorExternalUrl: result.externalUrl,
              connectorEmbedUrl: result.embedUrl ?? result.externalUrl,
              externalFileId: result.externalId,
              externalFolderId: folderId,
              sourceType: artifact.kind === "SPREADSHEET" ? "google_sheets" : "google_docs",
              sourceStatus: "published",
              lastSyncedAt: new Date(),
              syncError: null,
              version: artifact.version + 1,
            },
          });

          await prisma.activityEvent.create({
            data: {
              projectId: input.projectId,
              eventType: "artifact_published",
              title: `"${artifact.title}" published to Google ${artifact.kind === "SPREADSHEET" ? "Sheets" : "Docs"}`,
              metadataJson: JSON.stringify({ artifactId: artifact.id, url: result.externalUrl }),
            },
          });

          results.push({ artifactId: artifact.id, title: artifact.title, success: true, url: result.externalUrl });
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          await prisma.artifact.update({
            where: { id: artifact.id },
            data: { sourceStatus: "sync_error", syncError: msg },
          });

          await prisma.activityEvent.create({
            data: {
              projectId: input.projectId,
              eventType: "artifact_sync_failed",
              title: `Failed to publish "${artifact.title}" to Google`,
              metadataJson: JSON.stringify({ artifactId: artifact.id, error: msg }),
            },
          });

          results.push({ artifactId: artifact.id, title: artifact.title, success: false, error: msg });
        }
      }

      return { results, publishedCount: results.filter((r) => r.success).length };
    }),

  publishOneToGoogle: protectedProcedure
    .input(z.object({ projectId: z.string(), artifactId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.projectId, userId: ctx.auth.userId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const artifact = await prisma.artifact.findFirst({
        where: { id: input.artifactId, userId: ctx.auth.userId },
      });
      if (!artifact) throw new TRPCError({ code: "NOT_FOUND" });

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
      const displayName = resolveDisplayName(project);

      const result = await provider.publishArtifact(connection, artifact, displayName);
      const folderId = result.folderId ?? artifact.externalFolderId;

      await prisma.artifact.update({
        where: { id: artifact.id },
        data: {
          connectorProvider: artifact.kind === "SPREADSHEET" ? "GOOGLE_SHEETS" : "GOOGLE_DOCS",
          connectorExternalUrl: result.externalUrl,
          connectorEmbedUrl: result.embedUrl ?? result.externalUrl,
          externalFileId: result.externalId,
          externalFolderId: folderId,
          sourceType: artifact.kind === "SPREADSHEET" ? "google_sheets" : "google_docs",
          sourceStatus: "published",
          lastSyncedAt: new Date(),
          syncError: null,
          version: artifact.version + 1,
        },
      });

      await prisma.activityEvent.create({
        data: {
          projectId: input.projectId,
          eventType: "artifact_published",
          title: `"${artifact.title}" published to Google ${artifact.kind === "SPREADSHEET" ? "Sheets" : "Docs"}`,
          metadataJson: JSON.stringify({ artifactId: artifact.id, url: result.externalUrl }),
        },
      });

      return { success: true, url: result.externalUrl, embedUrl: result.embedUrl };
    }),
});

