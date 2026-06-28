import type { Artifact, LifecycleState, Project } from "@/generated/prisma";
import type {
  AiBriefing,
  AriaRecommendation,
  ProductPulse,
  TimelineEvent,
} from "@/types/aria";
import { computeRecommendations, lifecycleToPhase, PHASE_LABELS } from "./artifact-mapper";

interface ActivityRow {
  id: string;
  eventType: string;
  title: string;
  createdAt: string;
}

function timeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function computeProductPulse({
  project,
  artifacts,
  recommendations,
}: {
  project: Project;
  artifacts: Artifact[];
  recommendations: AriaRecommendation[];
}): ProductPulse {
  const stageArtifacts = artifacts.filter((a) => a.stageKey);
  const unapproved = stageArtifacts.filter((a) => a.status !== "APPROVED");
  const recentlyChanged = artifacts.filter((a) => {
    const days = (Date.now() - new Date(a.updatedAt).getTime()) / 86400000;
    return days < 3;
  });

  const riskRecs = recommendations.filter((r) => r.severity === "risk" || r.severity === "warning");
  const blockers = riskRecs.length + (project.lifecycleState === "DESIGNS_READY" ? 1 : 0);

  let momentum: ProductPulse["momentum"] = "steady";
  if (recentlyChanged.length >= 3 || unapproved.length === 0) momentum = "high";
  if (project.lifecycleState === "INTAKE" || recentlyChanged.length === 0) momentum = "low";

  let riskLevel: ProductPulse["riskLevel"] = "low";
  if (riskRecs.some((r) => r.severity === "risk")) riskLevel = "high";
  else if (riskRecs.length > 0) riskLevel = "medium";

  const phase = lifecycleToPhase(project.lifecycleState);
  const topRec = recommendations.find((r) => r.actionLabel);

  let upcomingMilestone: string | undefined;
  switch (project.lifecycleState) {
    case "INTAKE":
      upcomingMilestone = "Product workspace generation";
      break;
    case "BRIEF_READY":
      upcomingMilestone = unapproved.length > 0 ? "Artifact approvals" : "Design generation";
      break;
    case "DESIGNS_READY":
      upcomingMilestone = "Design selection & app build";
      break;
    case "BUILDING":
      upcomingMilestone = "Application preview";
      break;
    case "APP_READY":
      upcomingMilestone = "Release & delivery";
      break;
  }

  return {
    lifecyclePhase: phase,
    lifecycleLabel: PHASE_LABELS[phase],
    momentum,
    riskLevel,
    blockers,
    approvalsWaiting: unapproved.length,
    recentlyChangedCount: recentlyChanged.length,
    upcomingMilestone,
    recommendedAction: topRec,
  };
}

export function computeAiBriefing({
  project,
  artifacts,
  recommendations,
  activity,
  displayName,
}: {
  project: Project;
  artifacts: Artifact[];
  recommendations: AriaRecommendation[];
  activity: ActivityRow[];
  displayName: string;
}): AiBriefing {
  const yesterday: AiBriefing["yesterday"] = [];

  const approved = artifacts.filter((a) => a.status === "APPROVED");
  const recentApproved = approved.filter((a) => {
    const days = (Date.now() - new Date(a.updatedAt).getTime()) / 86400000;
    return days < 2;
  });
  for (const a of recentApproved.slice(0, 2)) {
    yesterday.push({ type: "success", text: `${a.title} approved` });
  }

  const stories = artifacts.filter((a) => a.artifactType === "user_story");
  if (stories.length > 0) {
    yesterday.push({ type: "info", text: `Backlog has ${stories.length} user stories` });
  }

  const workflow = artifacts.find((a) => a.stageKey === "workflow_map" && a.version > 1);
  if (workflow) {
    yesterday.push({
      type: "warning",
      text: "Workflow changes may impact Power Automate and test cases",
    });
  }

  for (const evt of activity.slice(0, 2)) {
    if (evt.eventType.includes("connect")) {
      yesterday.push({ type: "info", text: evt.title });
    }
  }

  if (yesterday.length === 0 && project.lifecycleState === "INTAKE") {
    yesterday.push({ type: "info", text: "Aria is building your product workspace" });
  }
  if (yesterday.length === 0) {
    yesterday.push({ type: "info", text: "No recent changes — review artifacts to keep momentum" });
  }

  const topRec = recommendations.find((r) => r.actionLabel) ?? recommendations[0];
  let recommendation = "Continue reviewing artifacts and approvals to keep delivery on track.";
  if (topRec) recommendation = topRec.body;

  if (project.lifecycleState === "BRIEF_READY") {
    const unapproved = artifacts.filter((a) => a.stageKey && a.status !== "APPROVED");
    if (unapproved.length === 0) {
      recommendation =
        "All core artifacts are approved. I recommend generating UX directions before building the application.";
    } else {
      recommendation = `I recommend reviewing and approving ${unapproved.length} artifact${unapproved.length > 1 ? "s" : ""} before moving to design generation.`;
    }
  }

  if (workflow && project.lifecycleState !== "INTAKE") {
    recommendation =
      "Workflow changes impact automation and test coverage. I recommend reviewing the automation plan before generating the application.";
  }

  return {
    greeting: `${timeGreeting()}. Here's what's happening with ${displayName}.`,
    yesterday,
    recommendation,
    actionLabel: topRec?.actionLabel,
    actionType: topRec?.actionType,
    actionTarget: topRec?.actionTarget,
  };
}

export function buildTimeline({
  project,
  artifacts,
  activity,
}: {
  project: Project;
  artifacts: Artifact[];
  activity: ActivityRow[];
}): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  events.push({
    id: `created-${project.id}`,
    timestamp: project.createdAt.toISOString(),
    actor: "aria",
    category: "created",
    title: "Product created",
    detail: project.sourcePrompt ?? undefined,
  });

  for (const a of artifacts) {
    events.push({
      id: `gen-${a.id}`,
      timestamp: a.createdAt.toISOString(),
      actor: "aria",
      category: "generated",
      title: `${a.title} generated`,
      detail: a.stageKey ? undefined : a.artifactType,
    });
    if (a.status === "APPROVED") {
      events.push({
        id: `appr-${a.id}`,
        timestamp: a.updatedAt.toISOString(),
        actor: "human",
        category: "approved",
        title: `${a.title} approved`,
      });
    }
    if (a.version > 1) {
      events.push({
        id: `upd-${a.id}-v${a.version}`,
        timestamp: a.updatedAt.toISOString(),
        actor: a.connectorProvider !== "NATIVE" ? "connector" : "aria",
        category: "updated",
        title: `${a.title} updated`,
        detail: `Version ${a.version}`,
      });
    }
    if (a.connectorEmbedUrl) {
      events.push({
        id: `conn-${a.id}`,
        timestamp: a.updatedAt.toISOString(),
        actor: "connector",
        category: "connected",
        title: `${a.title} connected to external source`,
      });
    }
  }

  for (const evt of activity) {
    events.push({
      id: evt.id,
      timestamp: evt.createdAt,
      actor: evt.eventType.includes("connector") ? "connector" : "aria",
      category: evt.eventType.includes("approve")
        ? "approved"
        : evt.eventType.includes("connect")
          ? "connected"
          : "updated",
      title: evt.title,
    });
  }

  const stateEvents: Array<{ state: LifecycleState; label: string; category: TimelineEvent["category"] }> = [
    { state: "BRIEF_READY", label: "Product model ready for review", category: "ready" },
    { state: "DESIGNS_READY", label: "Design directions ready", category: "ready" },
    { state: "BUILDING", label: "Application generation started", category: "generated" },
    { state: "APP_READY", label: "Application ready for preview", category: "ready" },
  ];

  if (project.lifecycleState !== "INTAKE") {
    const match = stateEvents.find((s) => s.state === project.lifecycleState);
    if (match) {
      events.push({
        id: `state-${project.lifecycleState}`,
        timestamp: project.updatedAt.toISOString(),
        actor: "aria",
        category: match.category,
        title: match.label,
      });
    }
  }

  const unapproved = artifacts.filter((a) => a.stageKey && a.status !== "APPROVED");
  if (unapproved.length > 0 && project.lifecycleState === "BRIEF_READY") {
    events.push({
      id: "waiting-approval",
      timestamp: new Date().toISOString(),
      actor: "aria",
      category: "waiting",
      title: `Waiting for ${unapproved.length} artifact approval${unapproved.length > 1 ? "s" : ""}`,
    });
  }

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function computeHomeBriefing(
  products: Array<{
    displayName: string;
    briefing: AiBriefing;
    pulse: ProductPulse;
    id: string;
  }>,
): AiBriefing {
  if (products.length === 0) {
    return {
      greeting: `${timeGreeting()}. What are we building today?`,
      yesterday: [],
      recommendation:
        "Describe a product, feature, or workflow and Aria will create a living product workspace with connected artifacts.",
      actionLabel: "Create product",
      actionType: "navigate",
    };
  }

  const active = products[0];
  const crossProduct: AiBriefing["yesterday"] = [];
  for (const p of products.slice(0, 3)) {
    if (p.pulse.approvalsWaiting > 0) {
      crossProduct.push({
        type: "warning",
        text: `${p.displayName}: ${p.pulse.approvalsWaiting} approvals waiting`,
      });
    }
    if (p.pulse.riskLevel === "high") {
      crossProduct.push({
        type: "risk",
        text: `${p.displayName}: delivery risk detected`,
      });
    }
  }

  return {
    greeting: `${timeGreeting()}. You have ${products.length} active product${products.length > 1 ? "s" : ""}.`,
    yesterday: crossProduct.length > 0 ? crossProduct : active.briefing.yesterday,
    recommendation: active.briefing.recommendation,
    actionLabel: active.briefing.actionLabel ?? "Continue",
    actionType: active.briefing.actionType,
    actionTarget: active.id,
  };
}
