"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  ExternalLinkIcon,
  PlugIcon,
  RefreshCwIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Artifact } from "@/generated/prisma";
import type { ArtifactContent } from "@/types/artifacts";
import {
  CONNECTOR_META,
  connectorProviderForArtifactKind,
  isArtifactConnected,
} from "@/types/artifacts";
import { useTRPC } from "@/trpc/client";
import { ConnectConnectorSheet } from "./connect-connector-sheet";
import { ConnectedArtifactViewer, parseFileUrls } from "./connected-artifact-viewer";
import { ImpactPanel } from "@/modules/workspace/ui/components/impact-panel";
import { computeImpactForArtifact } from "@/lib/aria/impact-engine";

interface ConnectedArtifactViewerPageProps {
  artifact: Artifact;
  allArtifacts?: Artifact[];
  onClose: () => void;
}

function parseArtifactContent(raw: string): ArtifactContent {
  try {
    const parsed = JSON.parse(raw) as ArtifactContent & {
      handedOff?: boolean;
      title?: string;
    };
    if (parsed.handedOff) {
      return { meta: { title: parsed.title } };
    }
    return parsed;
  } catch {
    return {};
  }
}

const SYNC_LABELS: Record<string, string> = {
  native_draft: "Native Draft",
  embedded: "Embedded",
  synced: "Synced",
  external: "External",
  mock: "Mock",
  pending_update: "Pending Update",
};

export function ConnectedArtifactViewerPage({
  artifact,
  allArtifacts = [],
  onClose,
}: ConnectedArtifactViewerPageProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [connectOpen, setConnectOpen] = useState(false);
  const [showImpact, setShowImpact] = useState(false);
  const connected = isArtifactConnected(artifact);
  const targetProvider = connectorProviderForArtifactKind(artifact.kind);
  const connectorLabel = CONNECTOR_META[targetProvider].label;

  const { data: connections = [] } = useQuery(trpc.workspace.getUserConnections.queryOptions());

  const content = parseArtifactContent(artifact.content);
  const impact = computeImpactForArtifact(artifact, allArtifacts);

  const invalidate = () => {
    queryClient.invalidateQueries(
      trpc.artifacts.getMany.queryOptions({ projectId: artifact.projectId }),
    );
    queryClient.invalidateQueries(
      trpc.workspace.getProductWorkspace.queryOptions({ projectId: artifact.projectId }),
    );
  };

  const connect = useMutation(
    trpc.artifacts.connect.mutationOptions({
      onSuccess: () => {
        toast.success(`Connected to ${connectorLabel}`);
        setConnectOpen(false);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const approve = useMutation(
    trpc.lifecycle.approveStage.mutationOptions({
      onSuccess: () => {
        toast.success("Approved");
        invalidate();
      },
    }),
  );

  const publish = useMutation(
    trpc.artifacts.publishToIntegration.mutationOptions({
      onSuccess: () => {
        toast.success(`Connected and published to ${connectorLabel}`);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const handleConnectClick = () => {
    // Map target providers to user connection IDs
    const providerMap: Record<string, string> = {
      GOOGLE_DOCS: "google",
      GOOGLE_SHEETS: "google",
      GOOGLE_SLIDES: "google",
    };
    const connectionId = providerMap[targetProvider as string];
    const isAuthorized = connectionId && connections.some((c: { providerId: string }) => c.providerId === connectionId);

    if (isAuthorized) {
      toast.loading(`Publishing to ${connectorLabel}...`, { id: "publish" });
      publish.mutate(
        { id: artifact.id, providerId: connectionId },
        { onSettled: () => toast.dismiss("publish") }
      );
    } else {
      setConnectOpen(true);
    }
  };

  const syncStatus = connected ? "embedded" : "native_draft";

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b shrink-0">
        <div className="flex items-center gap-2 p-3 flex-wrap">
          <Button size="sm" variant="ghost" onClick={onClose}>
            <XIcon className="size-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-sm truncate">{artifact.title}</h1>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <Badge variant="outline" className="text-[10px] capitalize">
                {artifact.artifactType.replace(/_/g, " ")}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {connectorLabel}
              </Badge>
              <Badge
                variant={artifact.status === "APPROVED" ? "default" : "outline"}
                className="text-[10px]"
              >
                {artifact.status === "APPROVED" ? "Approved" : "Draft"}
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                v{artifact.version} · {SYNC_LABELS[syncStatus]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {(artifact.connectorExternalUrl || parseFileUrls(artifact.fileUrls).docx) && (
              <Button size="sm" variant="outline" asChild>
                <a
                  href={artifact.connectorExternalUrl ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLinkIcon className="size-3.5 mr-1" />
                  Open in {connectorLabel}
                </a>
              </Button>
            )}

            {!connected && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleConnectClick}
                disabled={publish.isPending}
              >
                <PlugIcon className="size-3.5 mr-1" />
                {publish.isPending ? "Connecting..." : "Connect"}
              </Button>
            )}

            <Button
              size="sm"
              variant="outline"
              onClick={() => toast.message("Sync queued", { description: "Connector sync will run when OAuth is enabled." })}
            >
              <RefreshCwIcon className="size-3.5 mr-1" />
              Refresh
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                toast.message("Update with Aria", {
                  description: "Aria will propose changes based on product context and downstream impact.",
                })
              }
            >
              <SparklesIcon className="size-3.5 mr-1" />
              Update with Aria
            </Button>

            {artifact.stageKey && artifact.status !== "APPROVED" && (
              <Button
                size="sm"
                onClick={() => approve.mutate({ artifactId: artifact.id })}
                disabled={approve.isPending}
              >
                <CheckIcon className="size-3.5 mr-1" />
                Approve
              </Button>
            )}
          </div>
        </div>

        {impact && (
          <div className="px-3 pb-2">
            <button
              type="button"
              className="text-xs text-amber-600 dark:text-amber-400 hover:underline"
              onClick={() => setShowImpact((s) => !s)}
            >
              {showImpact ? "Hide" : "Show"} downstream impact ({impact.affected.length} artifacts)
            </button>
          </div>
        )}
      </div>

      {showImpact && impact && (
        <div className="border-b shrink-0 max-h-48 overflow-auto">
          <ImpactPanel impact={impact} />
        </div>
      )}

      <div className="flex-1 min-h-0">
        <ConnectedArtifactViewer
          kind={artifact.kind}
          content={content}
          connectorProvider={artifact.connectorProvider}
          connectorEmbedUrl={artifact.connectorEmbedUrl}
          connectorExternalUrl={artifact.connectorExternalUrl}
        />
      </div>

      <ConnectConnectorSheet
        open={connectOpen}
        onOpenChange={setConnectOpen}
        provider={targetProvider}
        artifactTitle={artifact.title}
        isPending={connect.isPending}
        onConnect={(embedUrl, externalUrl) =>
          connect.mutate({ id: artifact.id, embedUrl, externalUrl })
        }
      />
    </div>
  );
}

/** @deprecated Use ConnectedArtifactViewerPage */
export { ConnectedArtifactViewerPage as ArtifactViewer };
