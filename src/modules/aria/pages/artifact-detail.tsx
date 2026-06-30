"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparklesIcon,
  CloudIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AriaShell, AriaTopBar } from "@/components/aria/aria-shell";
import { AriaStatusBadge, mapApprovalStatus } from "@/components/aria/aria-ui";
import { ConnectedArtifactViewer } from "@/modules/artifacts/ui/components/connected-artifact-viewer";
import { ImpactPanel } from "@/modules/workspace/ui/components/impact-panel";
import { ProductTimeline } from "@/modules/workspace/ui/components/product-timeline";
import { computeImpactForArtifact } from "@/lib/aria/impact-engine";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";

const DETAIL_TABS = ["Preview", "Details", "Activity", "Impact"] as const;

function parseContent(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function ArtifactDetailPage({
  projectId,
  artifactId,
}: {
  projectId: string;
  artifactId: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tab, setTab] = useState<(typeof DETAIL_TABS)[number]>("Preview");

  const { data: artifacts, isLoading } = useQuery(
    trpc.artifacts.getMany.queryOptions({ projectId }),
  );

  const { data: connections = [] } = useQuery(
    trpc.workspace.getUserConnections.queryOptions()
  );

  const { data: workspace } = useQuery(
    trpc.workspace.getProductWorkspace.queryOptions({ projectId }),
  );

  const artifact = artifacts?.find((a) => a.id === artifactId);
  const impact = artifact
    ? computeImpactForArtifact(artifact, artifacts ?? [])
    : null;

  const approve = useMutation(
    trpc.lifecycle.approveStage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.artifacts.getMany.queryOptions({ projectId }));
        queryClient.invalidateQueries(
          trpc.workspace.getProductWorkspace.queryOptions({ projectId }),
        );
        toast.success("Approved");
      },
    }),
  );

  const refine = useMutation(
    trpc.artifacts.aiRefine.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.artifacts.getMany.queryOptions({ projectId }));
        toast.success("Aria updated the artifact");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const publishToGoogle = useMutation(
    trpc.workspace.publishOneToGoogle.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.artifacts.getMany.queryOptions({ projectId }));
        toast.success("Published to Google Workspace");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const syncOne = useMutation(
    trpc.artifacts.syncOne.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.artifacts.getMany.queryOptions({ projectId }));
        toast.success("Sync completed");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: () => {
        router.push(`/ai-pm/${projectId}`);
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (isLoading || !artifact) {
    return (
      <AriaShell topBar={<AriaTopBar />}>
        <div className="flex justify-center py-32">
          <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
        </div>
      </AriaShell>
    );
  }

  const content = parseContent(artifact.content);
  const related = (workspace?.artifacts ?? []).filter(
    (a) =>
      a.id !== artifactId &&
      (impact?.affected.some((x) => x.artifactId === a.id) ||
        a.stageKey !== artifact.stageKey),
  ).slice(0, 5);

  const sourceLabel =
    artifact.connectorProvider === "NATIVE"
      ? "Aria (Native Draft)"
      : artifact.connectorProvider.replace(/_/g, " ");

  const activityEvents =
    workspace?.timeline.filter(
      (e) => e.title.includes(artifact.title) || e.detail?.includes(artifact.title),
    ) ?? [];

  const handleAskSubmit = (value: string) => {
    toast.info("Aria is updating the artifact...");
    refine.mutate({
      id: artifact.id,
      instruction: value,
    });
  };

  return (
    <AriaShell
      projectId={projectId}
      topBar={<AriaTopBar searchPlaceholder="Search artifacts…" />}
      onAskSubmit={handleAskSubmit}
    >
      <div className="flex flex-col h-[calc(100vh-130px)]">
        <div className="bg-white border-b border-[#e2e8f0] px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={() => router.push(`/products/${projectId}/artifacts`)}
            className="inline-flex items-center gap-1 text-sm text-[#64748b] hover:text-[#6366f1] mb-3"
          >
            <ArrowLeftIcon className="size-4" />
            Back to Artifacts
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold text-[#1e293b] flex items-center gap-2">
                {artifact.title}
                {artifact.sourceStatus === "sync_error" && (
                  <span className="text-xs text-red-500 font-normal bg-red-50 px-2 py-0.5 rounded-full border border-red-200">Sync Error</span>
                )}
              </h1>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-xs text-[#64748b]">{sourceLabel}</span>
                <span className="text-[#e2e8f0]">|</span>
                <span className="text-xs text-[#64748b] capitalize">{artifact.sourceStatus.replace(/_/g, " ")}</span>
                <AriaStatusBadge status={mapApprovalStatus(artifact.status)} />
                <span className="text-xs text-[#94a3b8]">v{artifact.version}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {artifact.connectorExternalUrl && (
                <a
                  href={artifact.connectorExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b] flex items-center gap-2 hover:bg-[#f8f9fb]"
                >
                  <ExternalLinkIcon className="size-4" />
                  Open in {artifact.connectorProvider === "GOOGLE_DOCS" ? "Docs" : artifact.connectorProvider === "GOOGLE_SHEETS" ? "Sheets" : "source"}
                </a>
              )}
              {artifact.connectorProvider === "NATIVE" && connections.some(c => c.providerId === "google") && (
                <button
                  type="button"
                  disabled={publishToGoogle.isPending}
                  onClick={() => publishToGoogle.mutate({ projectId, artifactId: artifact.id })}
                  className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b] flex items-center gap-2 hover:bg-[#f8f9fb]"
                >
                  <CloudIcon className="size-4" />
                  {publishToGoogle.isPending ? "Publishing..." : "Publish to Google"}
                </button>
              )}
              <button
                type="button"
                disabled={syncOne.isPending}
                onClick={() => {
                  if (artifact.connectorProvider !== "NATIVE") {
                    syncOne.mutate({ id: artifact.id });
                  } else {
                    queryClient.invalidateQueries(trpc.artifacts.getMany.queryOptions({ projectId }));
                    toast.success("Refreshed");
                  }
                }}
                className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b] flex items-center gap-2 hover:bg-[#f8f9fb]"
              >
                <RefreshCwIcon className={cn("size-4", syncOne.isPending && "animate-spin")} />
                Refresh
              </button>
              <button
                type="button"
                disabled={refine.isPending}
                onClick={() => {
                  const input = document.querySelector('input[placeholder*="Ask Aria"]') as HTMLInputElement;
                  if (input) {
                    input.focus();
                    input.value = `Update "${artifact.title}": `;
                    // Trigger react synthetic event for onChange
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                      window.HTMLInputElement.prototype,
                      "value"
                    )?.set;
                    nativeInputValueSetter?.call(input, input.value);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }}
                className="h-9 px-3 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b] flex items-center gap-2 hover:bg-[#f8f9fb]"
              >
                <SparklesIcon className="size-4" />
                Update with Aria
              </button>
              {artifact.status !== "APPROVED" && (
                <button
                  type="button"
                  onClick={() => approve.mutate({ artifactId: artifact.id })}
                  disabled={approve.isPending}
                  className="aria-btn-primary h-9 px-5 text-sm"
                >
                  Approve
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-1 mt-4 border-b border-[#e2e8f0] -mb-px">
            {DETAIL_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  tab === t
                    ? "border-[#6366f1] text-[#6366f1]"
                    : "border-transparent text-[#64748b]",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="flex-1 min-w-0 bg-[#f8f9fb] overflow-auto">
            {tab === "Preview" && (
              <ConnectedArtifactViewer
                kind={artifact.kind}
                content={content}
                connectorProvider={artifact.connectorProvider}
                connectorEmbedUrl={artifact.connectorEmbedUrl}
                connectorExternalUrl={artifact.connectorExternalUrl}
                version={artifact.version}
              />
            )}
            {tab === "Details" && (
              <div className="p-8 max-w-2xl space-y-3 text-sm bg-white m-6 rounded-xl border border-[#e2e8f0]">
                <p><strong>Type:</strong> {artifact.artifactType}</p>
                <p><strong>Stage:</strong> {artifact.stageKey ?? "—"}</p>
                <p><strong>Owner:</strong> {artifact.owner ?? "Aria"}</p>
                <p><strong>Created:</strong> {new Date(artifact.createdAt).toLocaleString()}</p>
                <p><strong>Status:</strong> {artifact.status}</p>
                <p><strong>Sync Source:</strong> {artifact.sourceStatus ?? "native_draft"}</p>
                {artifact.lastSyncedAt && <p><strong>Last Synced:</strong> {new Date(artifact.lastSyncedAt).toLocaleString()}</p>}
                {artifact.syncError && <p className="text-red-500"><strong>Sync Error:</strong> {artifact.syncError}</p>}
              </div>
            )}
            {tab === "Activity" && (
              <div className="p-6 max-w-2xl">
                {activityEvents.length > 0 ? (
                  <ProductTimeline events={activityEvents} />
                ) : (
                  <p className="text-sm text-[#64748b]">
                    No activity recorded for this artifact yet. Approve or update it to create events.
                  </p>
                )}
              </div>
            )}
            {tab === "Impact" && impact && <ImpactPanel impact={impact} />}
            {tab === "Impact" && !impact && (
              <p className="p-8 text-sm text-[#64748b]">No downstream impact mapped for this artifact.</p>
            )}
          </div>

          <aside className="w-[280px] shrink-0 bg-white border-l border-[#e2e8f0] overflow-y-auto p-5 space-y-6">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-3">
                About this artifact
              </h3>
              <dl className="space-y-2 text-sm">
                {[
                  ["Type", artifact.artifactType.replace(/_/g, " ")],
                  ["Source", sourceLabel],
                  ["Owner", artifact.owner ?? "Aria"],
                  ["Created", new Date(artifact.createdAt).toLocaleDateString()],
                  ["Status", artifact.status],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-[#64748b]">{k}</dt>
                    <dd className="text-[#1e293b] font-medium text-right capitalize">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-3">
                Related artifacts
              </h3>
              <ul className="space-y-2">
                {related.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/products/${projectId}/artifacts/${a.id}`)}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#f8f9fb] text-sm text-left"
                    >
                      <span className="text-[#1e293b] truncate">{a.title}</span>
                      <AriaStatusBadge
                        status={mapApprovalStatus(a.approvalStatus)}
                        className="shrink-0 ml-2 scale-90"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </AriaShell>
  );
}
