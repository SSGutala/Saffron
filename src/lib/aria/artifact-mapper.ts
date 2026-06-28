import type { Artifact, LifecycleState, Project } from "@/generated/prisma";
import type {
  AriaArtifactType,
  AriaArtifactView,
  AriaRecommendation,
  ArtifactSourceType,
  ArtifactSyncStatus,
  LifecycleArtifactGroupId,
  LifecyclePhase,
  WorkspaceSectionId,
} from "@/types/aria";
import {
  STAGE_TO_ARTIFACT_TYPE,
  STAGE_TO_LIFECYCLE_GROUP,
  STAGE_TO_WORKSPACE_SECTION,
} from "@/types/aria";
import { getConnectorBySourceType } from "@/lib/aria/connectors";
import { getImpactedTypes } from "@/lib/aria/knowledge-graph";

const PROVIDER_TO_SOURCE: Record<string, ArtifactSourceType> = {
  NATIVE: "native",
  GOOGLE_DOCS: "google_docs",
  GOOGLE_SHEETS: "google_sheets",
  GOOGLE_SLIDES: "google_docs",
  FIGMA: "figma",
  LUCIDCHART: "lucidchart",
};

const SOURCE_APP_LABELS: Record<ArtifactSourceType, string> = {
  native: "Aria (Native Draft)",
  google_docs: "Google Docs",
  microsoft_word: "Microsoft Word",
  google_sheets: "Google Sheets",
  excel: "Microsoft Excel",
  confluence: "Confluence",
  jira: "Jira",
  linear: "Linear",
  figma: "Figma",
  lucidchart: "Lucidchart",
  notion: "Notion",
  power_automate: "Power Automate",
  github: "GitHub",
  sharepoint: "SharePoint",
  external_link: "External",
  mock_connector: "Connector (mock)",
};

function parseJsonArray(raw?: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function extractSummary(content: string): string | null {
  try {
    const parsed = JSON.parse(content) as {
      sections?: { title: string; body?: string }[];
      meta?: { title?: string };
    };
    const first = parsed.sections?.[0];
    if (first?.body) return first.body.slice(0, 160);
    return parsed.meta?.title ?? null;
  } catch {
    return null;
  }
}

export function resolveArtifactType(artifact: Artifact): AriaArtifactType {
  if (artifact.stageKey && STAGE_TO_ARTIFACT_TYPE[artifact.stageKey]) {
    return STAGE_TO_ARTIFACT_TYPE[artifact.stageKey];
  }
  return (artifact.artifactType as AriaArtifactType) || "document";
}

export function resolveLifecycleGroup(artifact: Artifact): LifecycleArtifactGroupId {
  if (artifact.stageKey && STAGE_TO_LIFECYCLE_GROUP[artifact.stageKey]) {
    return STAGE_TO_LIFECYCLE_GROUP[artifact.stageKey];
  }
  const type = resolveArtifactType(artifact);
  if (type === "epic" || type === "user_story" || type === "jira_backlog") return "development";
  if (type === "test_case" || type === "acceptance_criteria") return "testing";
  if (type === "release_plan") return "deployment";
  if (type === "design" || type === "ux_recommendation") return "design";
  return "requirements";
}

export function resolveWorkspaceSection(artifact: Artifact): WorkspaceSectionId {
  if (artifact.stageKey && STAGE_TO_WORKSPACE_SECTION[artifact.stageKey]) {
    return STAGE_TO_WORKSPACE_SECTION[artifact.stageKey];
  }
  const type = resolveArtifactType(artifact);
  if (type === "epic" || type === "user_story" || type === "jira_backlog") return "backlog";
  if (type === "test_case" || type === "acceptance_criteria") return "testing";
  if (type === "release_plan") return "releases";
  if (type === "automation_model" || type === "power_automate_flow") return "automations";
  return "artifacts";
}

export function resolveSyncStatus(artifact: Artifact): ArtifactSyncStatus {
  if (artifact.syncStatus && artifact.syncStatus !== "native") {
    return artifact.syncStatus as ArtifactSyncStatus;
  }
  if (artifact.connectorEmbedUrl) return "embedded";
  if (artifact.connectorExternalUrl && artifact.connectorProvider !== "NATIVE") {
    return "external";
  }
  return "native_draft";
}

export function mapArtifactToView(
  artifact: Artifact,
  allArtifacts?: Artifact[],
): AriaArtifactView {
  const sourceType =
    (artifact.sourceType as ArtifactSourceType) ||
    PROVIDER_TO_SOURCE[artifact.connectorProvider] ||
    "native";

  const sourceAppLabel =
    SOURCE_APP_LABELS[sourceType] ||
    getConnectorBySourceType(sourceType)?.name ||
    "Aria (Native Draft)";

  const impactedTypes = getImpactedTypes(artifact.stageKey);
  const impactedArtifacts =
    allArtifacts
      ?.filter(
        (a) =>
          a.id !== artifact.id &&
          (impactedTypes.includes(a.stageKey ?? "") ||
            impactedTypes.includes(a.artifactType)),
      )
      .map((a) => a.title) ?? [];

  return {
    id: artifact.id,
    productId: artifact.projectId,
    title: artifact.title,
    artifactType: resolveArtifactType(artifact),
    description: artifact.description,
    status: artifact.status,
    approvalStatus: artifact.status,
    version: artifact.version,
    sourceType,
    syncStatus: resolveSyncStatus(artifact),
    externalUrl: artifact.connectorExternalUrl ?? artifact.externalUrl,
    embedUrl: artifact.connectorEmbedUrl,
    previewAvailable: artifact.previewAvailable ?? true,
    lastSyncedAt: artifact.lastSyncedAt?.toISOString() ?? null,
    owner: artifact.owner,
    dependencies: parseJsonArray(artifact.dependenciesJson),
    relatedArtifacts: parseJsonArray(artifact.relatedArtifactsJson),
    lifecycleGroup: resolveLifecycleGroup(artifact),
    workspaceSection: resolveWorkspaceSection(artifact),
    sourceAppLabel,
    hasDownstreamImpact: impactedTypes.length > 0,
    impactedArtifacts,
    summary: extractSummary(artifact.content),
    stageKey: artifact.stageKey,
    createdAt: artifact.createdAt.toISOString(),
    updatedAt: artifact.updatedAt.toISOString(),
  };
}

export function lifecycleToPhase(state: LifecycleState): LifecyclePhase {
  switch (state) {
    case "INTAKE":
      return "idea";
    case "BRIEF_READY":
      return "discovery";
    case "DESIGNS_READY":
      return "design";
    case "BUILDING":
      return "build";
    case "APP_READY":
      return "live";
    default:
      return "discovery";
  }
}

export const PHASE_LABELS: Record<LifecyclePhase, string> = {
  idea: "Idea",
  discovery: "Discovery",
  requirements: "Requirements",
  planning: "Planning",
  design: "Design",
  build: "Build",
  delivery: "Delivery",
  live: "Live",
};

export function resolveDisplayName(project: Project): string {
  if (project.displayName) return project.displayName;
  if (project.sourcePrompt) {
    const trimmed = project.sourcePrompt.slice(0, 60);
    return trimmed.length < project.sourcePrompt.length ? `${trimmed}…` : trimmed;
  }
  return project.name;
}

const CORE_STAGE_KEYS = [
  "intake_summary",
  "product_brief",
  "workflow_map",
  "data_model",
  "automation_model",
  "ux_recommendation",
  "app_spec",
];

export function computeRecommendations({
  project,
  artifacts,
}: {
  project: Project;
  artifacts: Artifact[];
}): AriaRecommendation[] {
  const recs: AriaRecommendation[] = [];
  const stageArtifacts = artifacts.filter((a) => a.stageKey);
  const approved = stageArtifacts.filter((a) => a.status === "APPROVED");
  const allCorePresent = CORE_STAGE_KEYS.every((k) =>
    stageArtifacts.some((a) => a.stageKey === k),
  );
  const allCoreApproved =
    allCorePresent &&
    CORE_STAGE_KEYS.every((k) =>
      stageArtifacts.some((a) => a.stageKey === k && a.status === "APPROVED"),
    );

  if (project.lifecycleState === "INTAKE") {
    recs.push({
      id: "generating",
      severity: "info",
      title: "Building your product model",
      body: "Aria is turning your idea into a structured product workspace with connected artifacts.",
    });
  }

  if (stageArtifacts.length === 0 && project.lifecycleState !== "INTAKE") {
    recs.push({
      id: "missing-artifacts",
      severity: "warning",
      title: "Product model incomplete",
      body: "Ask Aria to generate the discovery and requirements artifacts for this product.",
      actionLabel: "Ask Aria",
      actionType: "navigate",
    });
  }

  const unapproved = stageArtifacts.filter((a) => a.status !== "APPROVED");
  if (unapproved.length > 0 && project.lifecycleState === "BRIEF_READY") {
    recs.push({
      id: "unapproved",
      severity: "warning",
      title: `${unapproved.length} artifact${unapproved.length > 1 ? "s" : ""} awaiting approval`,
      body: "Review and approve artifacts before generating designs or delivery outputs.",
      actionLabel: "Review artifacts",
      actionType: "navigate",
      actionTarget: "artifacts",
    });
  }

  if (allCoreApproved && project.lifecycleState === "BRIEF_READY") {
    recs.push({
      id: "ready-designs",
      severity: "success",
      title: "Ready to generate designs",
      body: "All core artifacts are approved. Aria can now propose UX directions.",
      actionLabel: "Generate designs",
      actionType: "generate_designs",
    });
  }

  if (project.lifecycleState === "DESIGNS_READY") {
    recs.push({
      id: "pick-design",
      severity: "info",
      title: "Pick a design direction",
      body: "Choose a UX direction in chat so Aria can build the application.",
    });
  }

  if (project.lifecycleState === "BUILDING") {
    recs.push({
      id: "building",
      severity: "info",
      title: "Building your application",
      body: "Aria is generating the working application from approved requirements and design.",
    });
  }

  if (project.lifecycleState === "APP_READY") {
    recs.push({
      id: "app-ready",
      severity: "success",
      title: "Application ready",
      body: "Preview the built application and prepare release artifacts.",
      actionLabel: "View releases",
      actionType: "navigate",
      actionTarget: "releases",
    });
  }

  const hasStories = artifacts.some(
    (a) => a.artifactType === "user_story" || a.stageKey === "user_story",
  );
  const specApproved = stageArtifacts.some(
    (a) => a.stageKey === "app_spec" && a.status === "APPROVED",
  );
  if (specApproved && !hasStories) {
    recs.push({
      id: "no-stories",
      severity: "warning",
      title: "App Spec approved, backlog not generated",
      body: "Ask Aria to generate epics and user stories from the approved spec.",
      actionLabel: "Generate backlog",
      actionType: "navigate",
      actionTarget: "backlog",
    });
  }

  const workflow = stageArtifacts.find((a) => a.stageKey === "workflow_map");
  if (workflow && workflow.version > 1) {
    recs.push({
      id: "workflow-changed",
      severity: "risk",
      title: "Workflow changed — downstream impact",
      body: "Automation, stories, acceptance criteria, and test cases may need updates.",
      actionLabel: "Review impact",
      actionType: "review",
      actionTarget: "artifacts",
    });
  }

  const automationPending = stageArtifacts.find(
    (a) => a.stageKey === "automation_model" && a.status !== "APPROVED",
  );
  if (automationPending && project.lifecycleState !== "INTAKE") {
    recs.push({
      id: "automation-pending",
      severity: "warning",
      title: "Automation plan pending approval",
      body: "Power Automate flows should not be generated until the automation model is approved.",
      actionLabel: "Review automation",
      actionType: "navigate",
      actionTarget: "automations",
    });
  }

  return recs;
}
