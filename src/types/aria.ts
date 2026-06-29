/** Aria Product Delivery OS — core domain types */

export const WORKSPACE_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "timeline", label: "Timeline" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "artifacts", label: "Artifacts" },
  { id: "backlog", label: "Backlog" },
  { id: "automations", label: "Automations" },
  { id: "testing", label: "Testing" },
  { id: "releases", label: "Releases" },
  { id: "integrations", label: "Integrations" },
  { id: "activity", label: "Activity" },
] as const;

export type WorkspaceSectionId = (typeof WORKSPACE_SECTIONS)[number]["id"];

/** Artifacts are grouped by delivery lifecycle — not file type or alphabet */
export const LIFECYCLE_ARTIFACT_GROUPS = [
  { id: "discovery", label: "Discovery" },
  { id: "requirements", label: "Requirements" },
  { id: "design", label: "Design" },
  { id: "development", label: "Development" },
  { id: "testing", label: "Testing" },
  { id: "deployment", label: "Deployment" },
] as const;

export type LifecycleArtifactGroupId =
  (typeof LIFECYCLE_ARTIFACT_GROUPS)[number]["id"];

export type ArtifactSourceType =
  | "native"
  | "google_docs"
  | "microsoft_word"
  | "google_sheets"
  | "excel"
  | "confluence"
  | "jira"
  | "linear"
  | "figma"
  | "lucidchart"
  | "notion"
  | "power_automate"
  | "github"
  | "sharepoint"
  | "external_link"
  | "mock_connector";

export type ArtifactSyncStatus =
  | "native_draft"
  | "embedded"
  | "synced"
  | "external"
  | "mock"
  | "pending_update";

export type AriaArtifactType =
  | "product_brief"
  | "prd"
  | "brd"
  | "workflow_map"
  | "data_model"
  | "automation_model"
  | "ux_recommendation"
  | "app_spec"
  | "epic"
  | "user_story"
  | "acceptance_criteria"
  | "test_case"
  | "release_plan"
  | "meeting_notes"
  | "decision_log"
  | "risk_register"
  | "design"
  | "power_automate_flow"
  | "sharepoint_list"
  | "jira_backlog"
  | "github_repo"
  | "built_app"
  | "document";

export type LifecyclePhase =
  | "idea"
  | "discovery"
  | "requirements"
  | "planning"
  | "design"
  | "build"
  | "delivery"
  | "live";

export type ConnectorCategory =
  | "documents"
  | "spreadsheets"
  | "delivery"
  | "design"
  | "automation"
  | "storage"
  | "engineering";

export type ConnectorStatus = "connected" | "mock" | "disconnected" | "syncing";

export interface AriaConnectorDefinition {
  id: string;
  name: string;
  category: ConnectorCategory;
  icon: string;
  artifactTypes: AriaArtifactType[];
  sourceType: ArtifactSourceType;
  description: string;
}

export interface AriaArtifactView {
  id: string;
  productId: string;
  title: string;
  artifactType: AriaArtifactType;
  description?: string | null;
  status: string;
  approvalStatus: string;
  version: number;
  sourceType: ArtifactSourceType;
  syncStatus: ArtifactSyncStatus;
  externalUrl?: string | null;
  embedUrl?: string | null;
  previewAvailable: boolean;
  lastSyncedAt?: string | null;
  owner?: string | null;
  dependencies: string[];
  relatedArtifacts: string[];
  lifecycleGroup: LifecycleArtifactGroupId;
  workspaceSection: WorkspaceSectionId;
  sourceAppLabel: string;
  hasDownstreamImpact: boolean;
  impactedArtifacts: string[];
  summary?: string | null;
  productName?: string;
  stageKey?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AriaRecommendation {
  id: string;
  severity: "info" | "warning" | "success" | "risk";
  title: string;
  body: string;
  actionLabel?: string;
  actionType?: "approve" | "generate_designs" | "generate_app" | "navigate" | "update" | "review";
  actionTarget?: string;
}

export interface ProductPulse {
  lifecyclePhase: LifecyclePhase;
  lifecycleLabel: string;
  momentum: "low" | "steady" | "high";
  riskLevel: "low" | "medium" | "high";
  blockers: number;
  approvalsWaiting: number;
  recentlyChangedCount: number;
  upcomingMilestone?: string;
  recommendedAction?: AriaRecommendation;
}

export interface BriefingItem {
  type: "success" | "info" | "warning" | "risk";
  text: string;
}

export interface AiBriefing {
  greeting: string;
  yesterday: BriefingItem[];
  recommendation: string;
  actionLabel?: string;
  actionType?: AriaRecommendation["actionType"];
  actionTarget?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  actor: "aria" | "human" | "connector";
  category: "created" | "approved" | "updated" | "generated" | "connected" | "waiting" | "ready";
  title: string;
  detail?: string;
}

export interface ImpactAnalysis {
  sourceArtifactId: string;
  sourceTitle: string;
  sourceType: AriaArtifactType;
  affected: Array<{
    artifactId?: string;
    title: string;
    artifactType: AriaArtifactType;
    reason: string;
    status?: string;
  }>;
  recommendation: string;
}

export interface ProductWorkspaceSummary {
  id: string;
  name: string;
  displayName: string;
  lifecycleState: string;
  phase: LifecyclePhase;
  phaseLabel: string;
  sourcePrompt?: string | null;
  artifactTotal: number;
  artifactApproved: number;
  connectedToolsCount: number;
  pulse: ProductPulse;
  briefing: AiBriefing;
  recommendations: AriaRecommendation[];
  recentlyUpdated: AriaArtifactView[];
  continueLabel?: string;
}

/** Stage key → lifecycle artifact group */
export const STAGE_TO_LIFECYCLE_GROUP: Record<string, LifecycleArtifactGroupId> = {
  intake_summary: "discovery",
  product_brief: "discovery",
  prd: "requirements",
  brd: "requirements",
  workflow_map: "requirements",
  app_spec: "requirements",
  ux_recommendation: "design",
  data_model: "development",
  automation_model: "development",
  acceptance_criteria: "testing",
  test_case: "testing",
  release_plan: "deployment",
};

export const STAGE_TO_ARTIFACT_TYPE: Record<string, AriaArtifactType> = {
  intake_summary: "product_brief",
  product_brief: "product_brief",
  prd: "prd",
  brd: "brd",
  workflow_map: "workflow_map",
  data_model: "data_model",
  automation_model: "automation_model",
  ux_recommendation: "ux_recommendation",
  app_spec: "app_spec",
};

/** Stage key → workspace section for navigation */
export const STAGE_TO_WORKSPACE_SECTION: Record<string, WorkspaceSectionId> = {
  intake_summary: "artifacts",
  product_brief: "artifacts",
  prd: "artifacts",
  brd: "artifacts",
  workflow_map: "artifacts",
  data_model: "artifacts",
  automation_model: "automations",
  ux_recommendation: "artifacts",
  app_spec: "artifacts",
  epic: "backlog",
  user_story: "backlog",
  test_case: "testing",
  acceptance_criteria: "testing",
  release_plan: "releases",
};

/** Future extension / browser companion context */
export type ExternalContextEventType =
  | "viewing_jira_ticket"
  | "editing_confluence_prd"
  | "viewing_figma_design"
  | "building_power_automate_flow"
  | "selected_webpage_text"
  | "uploaded_transcript"
  | "pasted_feedback"
  | "ask_aria_update_related";

export interface ExternalContextEvent {
  type: ExternalContextEventType;
  sourceApp?: string;
  url?: string;
  title?: string;
  snippet?: string;
  relatedArtifactIds?: string[];
  timestamp: string;
}
