export type InspirationImage = {
  id: string;
  name: string;
  dataUrl: string;
  mimeType: string;
};

export const LIFECYCLE_STAGES = [
  { key: "intake_summary", label: "Intake Summary", kind: "DOCUMENT" as const, order: 1 },
  { key: "product_brief", label: "Product Brief", kind: "DOCUMENT" as const, order: 2 },
  { key: "workflow_map", label: "Workflow Map", kind: "DIAGRAM" as const, order: 3 },
  { key: "data_model", label: "Data Model", kind: "SPREADSHEET" as const, order: 4 },
  { key: "automation_model", label: "Automation Model", kind: "DOCUMENT" as const, order: 5 },
  { key: "ux_recommendation", label: "UX Recommendation", kind: "DESIGN" as const, order: 6 },
  { key: "app_spec", label: "App Spec", kind: "DOCUMENT" as const, order: 7 },
] as const;

export type BriefJson = Record<string, unknown>;

export type StylePreview = {
  id: string;
  label: string;
  vibe: string;
  direction: string;
  previewCode: string;
  previewColors: string[];
};

export type ChosenStyle = {
  id: string;
  label: string;
  vibe: string;
  direction: string;
  previewCode?: string;
  opinion?: string;
};
