import { completeChat } from "@/lib/ai-provider";
import type { Artifact, Project } from "@/generated/prisma";
import { ARTIFACT_IMPACT_GRAPH } from "@/lib/aria/knowledge-graph";
import { resolveArtifactType } from "@/lib/aria/artifact-mapper";

// ─── Intent Types ────────────────────────────────────────────────────────────

export type AriaPMIntent =
  | "create_artifact"
  | "update_artifact"
  | "explain_artifact"
  | "publish_artifact"
  | "sync_artifact"
  | "impact_analysis"
  | "next_action"
  | "connector_help"
  | "integration_status"
  | "artifact_status"
  | "product_status"
  | "fallback_chat";

// ─── Action Types ─────────────────────────────────────────────────────────────

export type AriaPMActionType =
  | "update_artifact"
  | "create_artifact"
  | "record_activity"
  | "publish_to_google"
  | "sync_from_google";

export interface AriaPMAction {
  type: AriaPMActionType;
  /** ID of artifact to update/publish/sync */
  artifactId?: string;
  /** Artifact type for creation */
  artifactType?: string;
  /** Refinement instruction for update_artifact */
  instruction?: string;
}

export interface AriaPMResponse {
  intent: AriaPMIntent;
  /** Human-readable reply shown to user */
  response: string;
  /** Structured actions to execute server-side */
  actions: AriaPMAction[];
  /** Artifact IDs that may be impacted (for display) */
  impactedArtifactIds?: string[];
  /** Suggested next thing the user could do */
  suggestedNext?: string;
}

// ─── Context Types ────────────────────────────────────────────────────────────

export interface ArtifactContext {
  id: string;
  title: string;
  artifactType: string;
  stageKey: string | null;
  status: string;
  version: number;
  sourceType: string;
  connectorProvider: string;
  hasExternalUrl: boolean;
  lastSyncedAt: string | null;
  summary: string | null;
}

export interface PMAgentContext {
  project: {
    id: string;
    name: string;
    displayName: string;
    lifecycleState: string;
    sourcePrompt: string | null;
  };
  artifacts: ArtifactContext[];
  connectedProviders: string[];
  googleWorkspaceConnected: boolean;
  googleAccountEmail: string | null;
  recentMessages: { role: string; content: string }[];
}

// ─── Context Builder ──────────────────────────────────────────────────────────

function extractSummary(content: string): string | null {
  try {
    const parsed = JSON.parse(content) as {
      sections?: { title: string; body?: string }[];
      meta?: { title?: string };
    };
    const first = parsed.sections?.[0];
    if (first?.body) return first.body.slice(0, 200);
    return parsed.meta?.title ?? null;
  } catch {
    return null;
  }
}

function resolveDisplayName(project: Project): string {
  if (project.displayName) return project.displayName;
  if (project.sourcePrompt) {
    const trimmed = project.sourcePrompt.slice(0, 60);
    return trimmed.length < project.sourcePrompt.length ? `${trimmed}…` : trimmed;
  }
  return project.name;
}

export function buildPMContext({
  project,
  artifacts,
  userConnections,
  recentMessages,
}: {
  project: Project;
  artifacts: Artifact[];
  userConnections: { providerId: string; accountId: string | null }[];
  recentMessages: { role: string; content: string }[];
}): PMAgentContext {
  const googleConn = userConnections.find((c) => c.providerId === "google");

  const artifactContexts: ArtifactContext[] = artifacts.map((a) => ({
    id: a.id,
    title: a.title,
    artifactType: a.artifactType,
    stageKey: a.stageKey,
    status: a.status,
    version: a.version,
    sourceType: a.sourceType ?? "native",
    connectorProvider: a.connectorProvider,
    hasExternalUrl: !!(a.connectorExternalUrl ?? a.externalUrl),
    lastSyncedAt: a.lastSyncedAt?.toISOString() ?? null,
    summary: extractSummary(a.content),
  }));

  return {
    project: {
      id: project.id,
      name: project.name,
      displayName: resolveDisplayName(project),
      lifecycleState: project.lifecycleState,
      sourcePrompt: project.sourcePrompt,
    },
    artifacts: artifactContexts,
    connectedProviders: userConnections.map((c) => c.providerId),
    googleWorkspaceConnected: !!googleConn,
    googleAccountEmail: googleConn?.accountId ?? null,
    recentMessages: recentMessages.slice(-8),
  };
}

// ─── System Prompt Builder ─────────────────────────────────────────────────────

function buildSystemPrompt(ctx: PMAgentContext): string {
  const artifactList = ctx.artifacts
    .map((a) => {
      const source =
        a.connectorProvider !== "NATIVE" ? `${a.connectorProvider} (connected)` : "Native Draft";
      const sync = a.hasExternalUrl ? " [has external URL]" : "";
      return `  - [${a.id.slice(0, 8)}] "${a.title}" | type: ${a.artifactType}${a.stageKey ? ` | stage: ${a.stageKey}` : ""} | status: ${a.status} | v${a.version} | source: ${source}${sync}`;
    })
    .join("\n");

  const impactGraphSummary = Object.entries(ARTIFACT_IMPACT_GRAPH)
    .map(([from, targets]) => `  ${from} → ${targets.map((t) => t.type).join(", ")}`)
    .join("\n");

  const googleStatus = ctx.googleWorkspaceConnected
    ? `CONNECTED (account: ${ctx.googleAccountEmail ?? "unknown"})`
    : "NOT CONNECTED";

  return `You are Aria, an AI Product Delivery OS. You are a practical, intelligent product teammate.
You help PMs create, update, explain, and publish product artifacts.

CURRENT PRODUCT CONTEXT:
  Product: "${ctx.project.displayName}"
  Lifecycle Phase: ${ctx.project.lifecycleState}
  ${ctx.project.sourcePrompt ? `Original Prompt: "${ctx.project.sourcePrompt.slice(0, 200)}"` : ""}

ARTIFACTS (${ctx.artifacts.length} total):
${artifactList || "  (no artifacts yet)"}

CONNECTED TOOLS:
  Google Workspace: ${googleStatus}
  Other providers: ${ctx.connectedProviders.filter((p) => p !== "google").join(", ") || "none"}

IMPACT KNOWLEDGE GRAPH (downstream dependencies):
${impactGraphSummary}

BEHAVIOR RULES:
1. Be specific and direct. Name artifacts by title when referencing them.
2. If you update something, say exactly what you changed and which artifact.
3. If you cannot do something (e.g., Google not connected), say clearly WHY and offer concrete next steps.
4. If a change will impact downstream artifacts, list them by name.
5. Never say "I updated it" unless the action will actually execute.
6. If the user wants to publish to Google and Google Workspace is NOT connected, do NOT queue a publish_to_google action — instead explain and suggest connecting.
7. Respond like a sharp product teammate, not a formal assistant.
8. Suggest a logical next action at the end of your response.
9. DO NOT ask for clarification if the question is answerable (e.g., "what's the status on integrations?"). Answer it directly based on the context.
10. For integration status questions: Check connected tools. Google Workspace is the primary integration. Microsoft 365, Jira, GitHub, Figma, Slack, and Power Automate are planned but not active yet. State whether artifacts are native drafts or synced.
11. Answer directly, explain current state, explain what that means, and give a recommended next action.

INTENT TYPES (choose one):
- integration_status: User asks about connected tools, integrations, or Google Workspace status
- artifact_status: User asks about existing artifacts, what is done, or what still needs work
- product_status: User asks about the overall product state, lifecycle, or progress
- create_artifact: User wants to generate a new artifact
- update_artifact: User wants to modify an existing artifact
- explain_artifact: User wants to understand an artifact
- publish_artifact: User wants to publish to Google or external tool
- sync_artifact: User wants to refresh from external source
- impact_analysis: User asks what else a change affects
- next_action: User asks what to do next
- connector_help: User asks about integrations generally
- fallback_chat: General product conversation, no specific action

ACTION TYPES (you can include multiple):
- update_artifact: { artifactId, instruction } — refine an existing artifact
- create_artifact: { artifactType } — generate a new artifact
- record_activity: (used internally, do not return this)
- publish_to_google: { artifactId } — only if Google Workspace IS connected

RESPONSE FORMAT (respond ONLY with this JSON — no markdown, no text outside):
{
  "intent": "<intent_type>",
  "response": "<your response to the user, 1-4 paragraphs, conversational but specific>",
  "actions": [],
  "impactedArtifactIds": [],
  "suggestedNext": "<one sentence suggestion>"
}`;
}

// ─── Response Parser ──────────────────────────────────────────────────────────

function parseJson(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const text = fenced ? fenced[1].trim() : raw.trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("No JSON object found in response");
  return JSON.parse(text.slice(start, end + 1));
}

function fallbackResponse(userMessage: string, ctx?: PMAgentContext): AriaPMResponse {
  if (ctx) {
    const googleStatus = ctx.googleWorkspaceConnected ? "is connected" : "is not connected yet";
    return {
      intent: "fallback_chat",
      response: `I can help with that. I don't see a specific action for this yet, but based on this workspace, Google Workspace ${googleStatus}. Artifacts are currently ${ctx.artifacts.length > 0 ? "being managed" : "not yet created"}. To give exact details, I might need access to specific connector records.`,
      actions: [],
      suggestedNext: "Try asking: 'What should I do next?' or 'What's the status of integrations?'",
    };
  }

  return {
    intent: "fallback_chat",
    response: `I can help with that. Based on this workspace, I can create or update artifacts, explain what's in your product workspace, help you understand what to do next, or assist with publishing.`,
    actions: [],
    suggestedNext: "Try: 'What should I do next?' or 'Draft me a PRD'",
  };
}

// ─── Main Agent Function ──────────────────────────────────────────────────────

export async function runAriaPMAgent(
  ctx: PMAgentContext,
  userMessage: string,
): Promise<AriaPMResponse> {
  const system = buildSystemPrompt(ctx);

  // Build conversation history for multi-turn context
  const historyParts = ctx.recentMessages
    .slice(-6)
    .map((m) => `${m.role === "USER" ? "User" : "Aria"}: ${m.content.slice(0, 400)}`)
    .join("\n");

  const user = historyParts
    ? `Previous conversation:\n${historyParts}\n\nNew message from user: ${userMessage}`
    : userMessage;

  try {
    const raw = await completeChat({ system, user, maxTokens: 2000 });
    const parsed = parseJson(raw) as Partial<AriaPMResponse>;

    // Validate and sanitize the response
    const intent: AriaPMIntent =
      (parsed.intent as AriaPMIntent) ?? "fallback_chat";
    const response = parsed.response?.trim() || fallbackResponse(userMessage, ctx).response;
    const actions: AriaPMAction[] = Array.isArray(parsed.actions) ? parsed.actions : [];

    // Safety: don't queue publish_to_google if Google isn't connected
    const safeActions = actions.filter((a) => {
      if (a.type === "publish_to_google" && !ctx.googleWorkspaceConnected) return false;
      return true;
    });

    return {
      intent,
      response,
      actions: safeActions,
      impactedArtifactIds: Array.isArray(parsed.impactedArtifactIds)
        ? parsed.impactedArtifactIds
        : [],
      suggestedNext: parsed.suggestedNext,
    };
  } catch (err) {
    console.error("[AriaPMAgent] Failed to parse response:", err);
    return fallbackResponse(userMessage, ctx);
  }
}
