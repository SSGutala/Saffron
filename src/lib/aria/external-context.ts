import type {
  ExternalContextEvent,
  ExternalContextEventType,
} from "@/types/aria";

export type { ExternalContextEvent, ExternalContextEventType };

export interface ExternalContextIngestPayload {
  projectId?: string;
  events: ExternalContextEvent[];
  source: "browser_extension" | "desktop_companion" | "manual_paste" | "ask_aria_button";
}

export interface ExternalContextIngestResult {
  accepted: number;
  suggestedArtifactIds: string[];
  suggestedActions: Array<{
    type: "update_artifact" | "create_artifact" | "navigate";
    label: string;
    targetId?: string;
  }>;
}

/** Stub handler — wire to PM agent when extension ships */
export function ingestExternalContext(
  _payload: ExternalContextIngestPayload,
): ExternalContextIngestResult {
  return {
    accepted: 0,
    suggestedArtifactIds: [],
    suggestedActions: [],
  };
}
