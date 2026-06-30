/**
 * pm-tool-executor.ts
 * Executes structured actions returned by the Aria PM Agent.
 * All DB mutations happen here — the agent only returns intent + action specs.
 */

import prisma from "@/lib/prisma";
import { logProductActivity } from "@/lib/aria/activity";
import { computeImpactForArtifact } from "@/lib/aria/impact-engine";
import { refineArtifactContent, generateArtifactContent } from "@/lib/artifacts/document-agent";
import { generateExports } from "@/lib/artifacts/export";
import { resolveTemplate } from "@/lib/ai-generate";
import type { AriaPMAction, AriaPMResponse } from "@/lib/aria/aria-pm-agent";

// ─── Result Types ─────────────────────────────────────────────────────────────

export interface ActionResult {
  type: AriaPMAction["type"];
  success: boolean;
  artifactId?: string;
  artifactTitle?: string;
  error?: string;
  nativeUpdated?: boolean;
  googleUpdated?: boolean;
  syncError?: string;
}

export interface ExecutionResult {
  actionResults: ActionResult[];
  /** Appended to Aria's response if any actions failed with specific errors */
  responseAmendment?: string;
  /** IDs of artifacts that were actually changed */
  changedArtifactIds: string[];
  /** Titles of impacted downstream artifacts */
  impactedArtifactTitles: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseContent(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

// ─── Individual Action Executors ──────────────────────────────────────────────

async function executeUpdateArtifact(
  action: AriaPMAction,
  projectId: string,
  userId: string,
  projectName: string,
): Promise<ActionResult> {
  if (!action.artifactId) {
    return { type: "update_artifact", success: false, error: "No artifactId provided" };
  }
  if (!action.instruction) {
    return { type: "update_artifact", success: false, error: "No instruction provided" };
  }

  const artifact = await prisma.artifact.findFirst({
    where: { id: action.artifactId, userId },
  });

  if (!artifact) {
    return {
      type: "update_artifact",
      success: false,
      artifactId: action.artifactId,
      error: "Artifact not found",
    };
  }


  try {
    const template = resolveTemplate(artifact.artifactType);
    const currentContent = parseContent(artifact.content);

    const result = await refineArtifactContent({
      template,
      currentContent: currentContent as Parameters<typeof refineArtifactContent>[0]["currentContent"],
      instruction: action.instruction,
      projectName,
    });

    let fileUrls: Record<string, string> = {};
    try {
      fileUrls = await generateExports(result.content, result.title ?? artifact.title, [
        "pdf",
        "docx",
        "md",
      ]);
    } catch {
      // Non-fatal — exports are nice-to-have
    }

    await prisma.artifact.update({
      where: { id: artifact.id },
      data: {
        content: JSON.stringify(result.content),
        title: result.title ?? artifact.title,
        version: artifact.version + 1,
        fileUrls: JSON.stringify(fileUrls),
      },
    });

    await logProductActivity({
      projectId,
      eventType: "artifact_updated",
      title: `"${result.title ?? artifact.title}" updated by Aria`,
      metadata: { artifactId: artifact.id, instruction: action.instruction.slice(0, 100) },
    });

    let externalUpdated = false;
    let syncError: string | null = null;
    
    if (artifact.connectorProvider !== "NATIVE" && artifact.externalFileId) {
      try {
        const providerMap: Record<string, string> = {
          GOOGLE_DOCS: "google",
          GOOGLE_SHEETS: "google",
          GOOGLE_SLIDES: "google",
          MICROSOFT_WORD: "microsoft",
        };
        const pid = providerMap[artifact.connectorProvider];
        if (pid) {
          const userConnection = await prisma.userConnection.findFirst({
            where: { userId, providerId: pid, status: "connected" },
          });
          if (userConnection) {
            const { ProviderManager } = await import("@/lib/connectors/ProviderManager");
            const provider = ProviderManager.getProvider(pid as "google");
            if (provider.updateArtifact) {
              await provider.updateArtifact(userConnection, artifact);
              externalUpdated = true;
            }
          }
        }
      } catch (err) {
        console.error("[PMToolExecutor] Failed to update connected artifact", err);
        syncError = err instanceof Error ? err.message : "Failed to sync update to external provider";
        
        await prisma.artifact.update({
          where: { id: artifact.id },
          data: {
            sourceStatus: "sync_error",
            syncError,
          },
        });
      }
    }

    return {
      type: "update_artifact",
      success: true,
      artifactId: artifact.id,
      artifactTitle: result.title ?? artifact.title,
      nativeUpdated: true,
      externalUpdated,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[PMToolExecutor] update_artifact failed:", msg);
    return {
      type: "update_artifact",
      success: false,
      artifactId: artifact.id,
      artifactTitle: artifact.title,
      error: msg,
    };
  }
}

async function executeCreateArtifact(
  action: AriaPMAction,
  projectId: string,
  userId: string,
  projectName: string,
  sourcePrompt: string,
): Promise<ActionResult> {
  if (!action.artifactType) {
    return { type: "create_artifact", success: false, error: "No artifactType provided" };
  }

  try {
    const template = resolveTemplate(action.artifactType);

    const result = await generateArtifactContent({
      template,
      prompt: sourcePrompt,
      projectName,
    });

    const kindMap = {
      DOCUMENT: "DOCUMENT",
      DIAGRAM: "DIAGRAM",
      DESIGN: "DESIGN",
      SPREADSHEET: "SPREADSHEET",
      PRESENTATION: "PRESENTATION",
    } as const;

    let fileUrls: Record<string, string> = {};
    try {
      fileUrls = await generateExports(result.content, result.title, template.exportFormats);
    } catch {
      // Non-fatal
    }

    const artifact = await prisma.artifact.create({
      data: {
        projectId,
        userId,
        kind: kindMap[template.kind],
        artifactType: template.documentType,
        title: result.title,
        content: JSON.stringify(result.content),
        sourcePrompt,
        fileUrls: JSON.stringify(fileUrls),
      },
    });

    await logProductActivity({
      projectId,
      eventType: "artifact_created",
      title: `"${result.title}" created by Aria`,
      metadata: { artifactId: artifact.id, artifactType: action.artifactType },
    });

    return {
      type: "create_artifact",
      success: true,
      artifactId: artifact.id,
      artifactTitle: result.title,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[PMToolExecutor] create_artifact failed:", msg);
    return {
      type: "create_artifact",
      success: false,
      error: msg,
    };
  }
}

async function executePublishToGoogle(
  action: AriaPMAction,
  userId: string,
  projectId: string,
): Promise<ActionResult> {
  if (!action.artifactId) {
    return { type: "publish_to_google", success: false, error: "No artifactId provided" };
  }

  // Phase 3/5: Real Google publishing
  const artifact = await prisma.artifact.findFirst({
    where: { id: action.artifactId, userId },
    include: { project: true },
  });

  if (!artifact) {
    return { type: "publish_to_google", success: false, error: "Artifact not found" };
  }
  if (!artifact.project) {
    return { type: "publish_to_google", success: false, error: "Project not found" };
  }

  const connection = await prisma.userConnection.findFirst({
    where: { userId, providerId: "google", status: "connected" },
  });

  if (!connection) {
    return {
      type: "publish_to_google",
      success: false,
      artifactId: artifact.id,
      artifactTitle: artifact.title,
      error: "Google Workspace is not connected. Please connect it from the Integrations panel.",
    };
  }

  try {
    const { GoogleWorkspaceProvider } = await import("@/lib/connectors/providers/google-workspace");
    const { resolveDisplayName } = await import("@/lib/aria/artifact-mapper");
    
    const provider = new GoogleWorkspaceProvider();
    const displayName = resolveDisplayName(artifact.project);
    
    const result = await provider.publishArtifact(connection, artifact, displayName);
    const folderId = result.folderId ?? artifact.externalFolderId;

    await prisma.artifact.update({
      where: { id: artifact.id },
      data: {
        connectorProvider: artifact.kind === "SPREADSHEET" ? "GOOGLE_SHEETS" : "GOOGLE_DOCS",
        connectorExternalUrl: result.externalUrl,
        connectorEmbedUrl: result.embedUrl ?? result.externalUrl,
        externalFileId: result.externalId,
        externalFolderId: folderId,
        sourceType: artifact.kind === "SPREADSHEET" ? "google_sheets" : "google_docs",
        sourceStatus: "published",
        lastSyncedAt: new Date(),
        syncError: null,
        version: artifact.version + 1,
      },
    });

    await logProductActivity({
      projectId,
      eventType: "artifact_published",
      title: `"${artifact.title}" published to Google ${artifact.kind === "SPREADSHEET" ? "Sheets" : "Docs"}`,
      metadata: { artifactId: artifact.id, url: result.externalUrl },
    });

    return {
      type: "publish_to_google",
      success: true,
      artifactId: artifact.id,
      artifactTitle: artifact.title,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Publish failed";
    await prisma.artifact.update({
      where: { id: artifact.id },
      data: { sourceStatus: "sync_error", syncError: msg },
    });
    
    await logProductActivity({
      projectId,
      eventType: "artifact_sync_failed",
      title: `Failed to publish "${artifact.title}" to Google`,
      metadata: { artifactId: artifact.id, error: msg },
    });
    
    return {
      type: "publish_to_google",
      success: false,
      artifactId: artifact.id,
      artifactTitle: artifact.title,
      error: msg,
    };
  }
}

// ─── Main Executor ────────────────────────────────────────────────────────────

export async function executeAriaPMActions(
  agentResponse: AriaPMResponse,
  context: {
    projectId: string;
    userId: string;
    projectName: string;
    userMessage: string;
    allArtifacts: { id: string; stageKey: string | null; artifactType: string; title: string; status: string; version: number; content: string; connectorProvider: string; connectorEmbedUrl: string | null }[];
  },
): Promise<ExecutionResult> {
  const actionResults: ActionResult[] = [];
  const changedArtifactIds: string[] = [];
  const responseAmendments: string[] = [];

  for (const action of agentResponse.actions) {
    let result: ActionResult;

    switch (action.type) {
      case "update_artifact":
        result = await executeUpdateArtifact(
          action,
          context.projectId,
          context.userId,
          context.projectName,
        );
        break;

      case "create_artifact":
        result = await executeCreateArtifact(
          action,
          context.projectId,
          context.userId,
          context.projectName,
          context.userMessage,
        );
        break;

      case "publish_to_google":
        result = await executePublishToGoogle(action, context.userId, context.projectId);
        break;

      case "record_activity":
        // Internal only — agent shouldn't return this but handle gracefully
        result = { type: "record_activity", success: true };
        break;

      default:
        result = { type: action.type, success: false, error: "Unknown action type" };
    }

    actionResults.push(result);

    if (result.success && result.artifactId) {
      changedArtifactIds.push(result.artifactId);
    }

    if (!result.success && result.error) {
      responseAmendments.push(`\n\n⚠️ Note: Could not ${action.type.replace(/_/g, " ")} "${result.artifactTitle ?? ""}" — ${result.error}`);
    }
  }


  // Compute downstream impact for changed artifacts
  const impactedArtifactTitles: string[] = [];
  if (changedArtifactIds.length > 0) {
    for (const changedId of changedArtifactIds) {
      const changed = context.allArtifacts.find((a) => a.id === changedId);
      if (!changed) continue;

      const impact = computeImpactForArtifact(
        changed as Parameters<typeof computeImpactForArtifact>[0],
        context.allArtifacts as Parameters<typeof computeImpactForArtifact>[1],
      );

      if (impact) {
        impact.affected.forEach((a) => {
          if (!impactedArtifactTitles.includes(a.title)) {
            impactedArtifactTitles.push(a.title);
          }
        });
      }
    }
  }

  return {
    actionResults,
    responseAmendment: responseAmendments.join("") || undefined,
    changedArtifactIds,
    impactedArtifactTitles,
  };
}
