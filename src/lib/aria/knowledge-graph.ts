import type { AriaArtifactType } from "@/types/aria";

/** Knowledge graph: downstream relationships between artifact types */
export const ARTIFACT_IMPACT_GRAPH: Record<
  string,
  Array<{ type: AriaArtifactType; label: string; reason: string }>
> = {
  workflow_map: [
    { type: "automation_model", label: "Automation Model", reason: "Workflow steps drive automations" },
    { type: "power_automate_flow", label: "Power Automate Flow", reason: "Flow logic mirrors workflow" },
    { type: "user_story", label: "User Stories", reason: "Stories reflect workflow paths" },
    { type: "acceptance_criteria", label: "Acceptance Criteria", reason: "Criteria must cover workflow branches" },
    { type: "test_case", label: "Test Cases", reason: "Tests validate workflow paths" },
    { type: "app_spec", label: "App Spec", reason: "Application flows follow workflow" },
    { type: "release_plan", label: "Release Plan", reason: "Release may include workflow rollout" },
  ],
  product_brief: [
    { type: "prd", label: "PRD", reason: "Brief informs requirements" },
    { type: "brd", label: "BRD", reason: "Business context from brief" },
    { type: "app_spec", label: "App Spec", reason: "Spec derives from brief scope" },
  ],
  prd: [
    { type: "workflow_map", label: "Workflow Map", reason: "Processes defined in PRD" },
    { type: "data_model", label: "Data Model", reason: "Entities defined in PRD" },
    { type: "user_story", label: "User Stories", reason: "Stories implement PRD requirements" },
    { type: "test_case", label: "Test Cases", reason: "Tests validate PRD acceptance" },
  ],
  app_spec: [
    { type: "user_story", label: "User Stories", reason: "Stories implement spec features" },
    { type: "test_case", label: "Test Cases", reason: "Tests cover spec behavior" },
    { type: "built_app", label: "Built App", reason: "App implements spec" },
  ],
  automation_model: [
    { type: "power_automate_flow", label: "Power Automate Flow", reason: "Flow implements automation plan" },
    { type: "test_case", label: "Test Cases", reason: "Automation triggers need test coverage" },
  ],
  data_model: [
    { type: "app_spec", label: "App Spec", reason: "Data structures inform application design" },
    { type: "test_case", label: "Test Cases", reason: "Data validation needs tests" },
  ],
  ux_recommendation: [
    { type: "design", label: "Figma Design", reason: "Design implements UX direction" },
    { type: "app_spec", label: "App Spec", reason: "UI patterns inform spec" },
  ],
};

export const STAGE_KEY_IMPACT: Record<string, string[]> = {
  workflow_map: [
    "automation_model",
    "app_spec",
    "user_story",
    "acceptance_criteria",
    "test_case",
    "release_plan",
  ],
  product_brief: ["prd", "brd", "app_spec"],
  automation_model: ["power_automate_flow", "test_case"],
  data_model: ["app_spec", "test_case"],
  app_spec: ["user_story", "test_case", "built_app"],
  ux_recommendation: ["design", "app_spec"],
};

export function getImpactedTypes(stageKey?: string | null): string[] {
  if (!stageKey) return [];
  return STAGE_KEY_IMPACT[stageKey] ?? [];
}
