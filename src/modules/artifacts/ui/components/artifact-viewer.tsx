"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  DownloadIcon,
  ExternalLinkIcon,
  PencilIcon,
  PlugIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import {
  ArtifactViewerBody,
  downloadFileUrl,
  parseFileUrls,
} from "./artifact-viewer-body";

interface ArtifactViewerProps {
  artifact: Artifact;
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

export function ArtifactViewer({ artifact, onClose }: ArtifactViewerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const connected = isArtifactConnected(artifact);
  const targetProvider = connectorProviderForArtifactKind(artifact.kind);
  const connectorLabel = CONNECTOR_META[targetProvider].label;

  const [content, setContent] = useState<ArtifactContent>(() =>
    parseArtifactContent(artifact.content),
  );

  const invalidate = () => {
    queryClient.invalidateQueries(
      trpc.artifacts.getMany.queryOptions({ projectId: artifact.projectId }),
    );
  };

  const save = useMutation(
    trpc.artifacts.updateContent.mutationOptions({
      onSuccess: () => {
        toast.success("Saved");
        invalidate();
        setEditMode(false);
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const connect = useMutation(
    trpc.artifacts.connect.mutationOptions({
      onSuccess: () => {
        toast.success(`Connected to ${connectorLabel}`);
        setConnectOpen(false);
        setEditMode(false);
        invalidate();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const exportFiles = useMutation(
    trpc.artifacts.exportFiles.mutationOptions({
      onSuccess: (updated) => {
        const urls = parseFileUrls(updated.fileUrls);
        if (urls.pdf) downloadFileUrl(urls.pdf, `${artifact.title}.pdf`);
        toast.success("Export ready — PDF downloaded");
      },
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

  const handleSave = () => {
    save.mutate({
      id: artifact.id,
      content: JSON.stringify(content),
      title: content.meta?.title ?? artifact.title,
    });
  };

  const fileUrls = parseFileUrls(artifact.fileUrls);

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-2 p-2 border-b shrink-0 flex-wrap">
        <Button size="sm" variant="ghost" onClick={onClose}>
          <XIcon className="size-4" />
        </Button>
        <span className="font-semibold text-sm truncate flex-1">{artifact.title}</span>

        {!connected && (
          <>
            <Button
              size="sm"
              variant={editMode ? "default" : "outline"}
              onClick={() => setEditMode((e) => !e)}
            >
              <PencilIcon className="size-3.5" />
              {editMode ? "Editing" : "Manual edit"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConnectOpen(true)}
            >
              <PlugIcon className="size-3.5" />
              Connect {connectorLabel}
            </Button>
            {editMode && (
              <Button size="sm" onClick={handleSave} disabled={save.isPending}>
                <SaveIcon className="size-3.5" />
                Save
              </Button>
            )}
          </>
        )}

        {artifact.stageKey && artifact.status !== "APPROVED" && !connected && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => approve.mutate({ artifactId: artifact.id })}
            disabled={approve.isPending}
          >
            <CheckIcon className="size-3.5" />
            Approve
          </Button>
        )}

        {!connected && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => exportFiles.mutate({ id: artifact.id })}
            disabled={exportFiles.isPending}
          >
            <DownloadIcon className="size-3.5" />
            Export PDF
          </Button>
        )}

        {!connected && fileUrls.docx && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFileUrl(fileUrls.docx!, `${artifact.title}.docx`)}
          >
            Word
          </Button>
        )}
        {!connected && fileUrls.xlsx && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFileUrl(fileUrls.xlsx!, `${artifact.title}.xlsx`)}
          >
            Excel
          </Button>
        )}
        {connected && artifact.connectorExternalUrl && (
          <Button size="sm" variant="outline" asChild>
            <a href={artifact.connectorExternalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="size-3.5" />
              Open in {connectorLabel}
            </a>
          </Button>
        )}
      </div>

      <div className="flex-1 min-h-0">
        <ArtifactViewerBody
          kind={artifact.kind}
          content={content}
          connectorProvider={artifact.connectorProvider}
          connectorEmbedUrl={artifact.connectorEmbedUrl}
          connectorExternalUrl={artifact.connectorExternalUrl}
          editMode={editMode}
          onChange={setContent}
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
