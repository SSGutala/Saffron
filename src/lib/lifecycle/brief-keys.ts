import type { BriefJson } from "@/types/lifecycle";

/** Maps lifecycle stage keys (snake_case) to brief JSON keys (camelCase). */
export const STAGE_TO_BRIEF_KEY: Record<string, string> = {
  intake_summary: "intakeSummary",
  product_brief: "productBrief",
  workflow_map: "workflowMap",
  data_model: "dataModel",
  automation_model: "automationModel",
  ux_recommendation: "uxRecommendation",
  app_spec: "appSpec",
};

export function getBriefStageData(brief: BriefJson, stageKey: string): unknown {
  const camelKey = STAGE_TO_BRIEF_KEY[stageKey];
  return brief[stageKey] ?? (camelKey ? brief[camelKey] : undefined);
}

export function previewStageData(data: unknown, maxLen = 1200): string {
  if (data == null) return "No data for this stage yet.";
  try {
    return JSON.stringify(data, null, 2).slice(0, maxLen);
  } catch {
    return String(data).slice(0, maxLen);
  }
}
