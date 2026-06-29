import type { AriaArtifactView } from "@/types/aria";

export type GlobalArtifactFilter =
  | "all"
  | "artifacts"
  | "backlog"
  | "workflows"
  | "automations"
  | "designs"
  | "tests"
  | "releases";

export type ProductSectionFilter =
  | "brief"
  | "requirements"
  | "workflow"
  | "data"
  | "automation"
  | "ux"
  | "backlog"
  | "testing"
  | "release";

export function filterArtifactsGlobal(
  artifacts: AriaArtifactView[],
  filter: GlobalArtifactFilter,
): AriaArtifactView[] {
  switch (filter) {
    case "backlog":
      return artifacts.filter(
        (a) =>
          a.workspaceSection === "backlog" ||
          ["epic", "user_story", "jira_backlog"].includes(a.artifactType),
      );
    case "workflows":
      return artifacts.filter(
        (a) => a.stageKey === "workflow_map" || a.artifactType === "workflow_map",
      );
    case "automations":
      return artifacts.filter(
        (a) =>
          a.workspaceSection === "automations" ||
          a.stageKey === "automation_model" ||
          a.artifactType === "automation_model" ||
          a.artifactType === "power_automate_flow",
      );
    case "designs":
      return artifacts.filter(
        (a) =>
          a.stageKey === "ux_recommendation" ||
          ["design", "ux_recommendation"].includes(a.artifactType),
      );
    case "tests":
      return artifacts.filter(
        (a) =>
          a.workspaceSection === "testing" ||
          ["test_case", "acceptance_criteria"].includes(a.artifactType),
      );
    case "releases":
      return artifacts.filter(
        (a) =>
          a.workspaceSection === "releases" || a.artifactType === "release_plan",
      );
    case "artifacts":
    case "all":
    default:
      return artifacts;
  }
}

export function filterArtifactsForProductSection(
  artifacts: AriaArtifactView[],
  section: ProductSectionFilter,
): AriaArtifactView[] {
  switch (section) {
    case "brief":
      return artifacts.filter(
        (a) =>
          a.lifecycleGroup === "discovery" ||
          ["intake_summary", "product_brief"].includes(a.stageKey ?? ""),
      );
    case "requirements":
      return artifacts.filter((a) => a.lifecycleGroup === "requirements");
    case "workflow":
      return artifacts.filter((a) => a.stageKey === "workflow_map");
    case "data":
      return artifacts.filter((a) => a.stageKey === "data_model");
    case "automation":
      return filterArtifactsGlobal(artifacts, "automations");
    case "ux":
      return filterArtifactsGlobal(artifacts, "designs");
    case "backlog":
      return filterArtifactsGlobal(artifacts, "backlog");
    case "testing":
      return filterArtifactsGlobal(artifacts, "tests");
    case "release":
      return filterArtifactsGlobal(artifacts, "releases");
    default:
      return artifacts;
  }
}

export const GLOBAL_FILTER_LABELS: Record<GlobalArtifactFilter, string> = {
  all: "All Artifacts",
  artifacts: "Artifacts",
  backlog: "Backlog",
  workflows: "Workflows",
  automations: "Automations",
  designs: "Designs",
  tests: "Tests",
  releases: "Releases",
};

export const PRODUCT_SECTION_LABELS: Record<ProductSectionFilter, string> = {
  brief: "Product Brief",
  requirements: "Requirements",
  workflow: "Workflow",
  data: "Data Model",
  automation: "Automation",
  ux: "UX / Design",
  backlog: "Backlog",
  testing: "Testing",
  release: "Release",
};
