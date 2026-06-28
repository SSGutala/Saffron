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

    return {
      briefing: homeBriefing,
      products,
      continueProduct: products[0] ?? null,
      recentActivity,
      connectedTools: ARIA_CONNECTORS.slice(0, 8).map((c) => ({
        ...c,
        status: "disconnected" as const,
      })),
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

      return ARIA_CONNECTORS.map((def) => {
        const installed = project.connectors.find((c) => c.connectorId === def.id);
        const usedByProduct = project.artifacts.some((a) => {
          const source = a.sourceType ?? "native";
          return source === def.sourceType || a.connectorProvider !== "NATIVE";
        });

        return {
          ...def,
          status: (installed?.status ?? "disconnected") as
            | "connected"
            | "mock"
            | "disconnected"
            | "syncing",
          lastSyncAt: installed?.lastSyncAt?.toISOString() ?? null,
          usedByProduct,
        };
      });
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
          status: "mock",
          lastSyncAt: new Date(),
          configJson: JSON.stringify({ mock: true }),
        },
        update: {
          status: "mock",
          lastSyncAt: new Date(),
        },
      });

      await prisma.activityEvent.create({
        data: {
          projectId: input.projectId,
          eventType: "connector_mock_connected",
          title: `Connected ${def.name} (mock)`,
          metadataJson: JSON.stringify({ connectorId: def.id }),
        },
      });

      return connector;
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
});
