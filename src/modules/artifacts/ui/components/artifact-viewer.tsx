"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
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
import { normalizeArtifactContent } from "@/lib/artifacts/prose-formatter";
import { CONNECTOR_CATALOG, suggestedProviderForKind } from "@/lib/connectors/types";
import type { ArtifactContent } from "@/types/artifacts";
import { useTRPC } from "@/trpc/client";
import {
  ArtifactViewerBody,
  downloadFileUrl,
  parseFileUrls,
} from "./artifact-viewer-body";

interface ArtifactViewerProps {
  artifact: Artifact;
  onClose: () => void;
}

export function ArtifactViewer({ artifact, onClose }: ArtifactViewerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [useConnector, setUseConnector] = useState(
    artifact.connectorProvider !== "NATIVE",
  );
  const [showConnectors, setShowConnectors] = useState(false);
  const [content, setContent] = useState<ArtifactContent>(() => {
    try {
      return normalizeArtifactContent(JSON.parse(artifact.content) as ArtifactContent);
    } catch {
      return {};
    }
  });

  const save = useMutation(
    trpc.artifacts.updateContent.mutationOptions({
      onSuccess: () => {
        toast.success("Saved");
        queryClient.invalidateQueries(
          trpc.artifacts.getMany.queryOptions({ projectId: artifact.projectId }),
        );
        setEditMode(false);
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const connectDesign = useMutation(
    trpc.artifacts.connectDesign.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.artifacts.getMany.queryOptions({ projectId: artifact.projectId }),
        );
      },
    }),
  );
  void connectDesign;

  const connectArtifact = useMutation(
    trpc.connectors.connectArtifact.mutationOptions({
      onSuccess: () => {
        toast.success("Connected — opening in embedded editor");
        queryClient.invalidateQueries(
          trpc.artifacts.getMany.queryOptions({ projectId: artifact.projectId }),
        );
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const setConnector = useMutation(
    trpc.artifacts.setConnectorMode.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.artifacts.getMany.queryOptions({ projectId: artifact.projectId }),
        );
      },
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

  const handleSave = () => {
    save.mutate({
      id: artifact.id,
      content: JSON.stringify(content),
      title: content.meta?.title ?? artifact.title,
    });
  };

  const fileUrls = parseFileUrls(artifact.fileUrls);

  const disconnect = () => {
    setUseConnector(false);
    setConnector.mutate({ id: artifact.id, useConnector: false });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <div className="flex items-center gap-2 p-2 border-b shrink-0 flex-wrap">
        <Button size="sm" variant="ghost" onClick={onClose}>
          <XIcon className="size-4" />
        </Button>
        <span className="font-semibold text-sm truncate flex-1">{artifact.title}</span>
        <Button
          size="sm"
          variant={editMode ? "default" : "outline"}
          onClick={() => setEditMode((e) => !e)}
        >
          <PencilIcon className="size-3.5" />
          {editMode ? "Editing" : "Manual edit"}
        </Button>
        <Button size="sm" variant={useConnector ? "default" : "outline"} onClick={() => setShowConnectors((s) => !s)}>
          <PlugIcon className="size-3.5" />
          {useConnector ? "Connected" : "Connect tool"}
        </Button>
        {useConnector && (
          <Button size="sm" variant="outline" onClick={disconnect}>
            Use native editor
          </Button>
        )}
        {showConnectors && !useConnector && (
          <div className="w-full basis-full flex flex-wrap gap-1.5 py-2 border-t mt-1">
            {CONNECTOR_CATALOG.filter(
              (c) => c.kinds.includes("*") || c.kinds.includes(artifact.kind),
            ).map((c) => (
              <Button
                key={c.id}
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => {
                  connectArtifact.mutate({ artifactId: artifact.id, provider: c.id });
                  setShowConnectors(false);
                }}
              >
                {c.icon} {c.label}
              </Button>
            ))}
          </div>
        )}
        {editMode && (
          <Button size="sm" onClick={handleSave} disabled={save.isPending}>
            <SaveIcon className="size-3.5" />
            Save
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => exportFiles.mutate({ id: artifact.id })}
          disabled={exportFiles.isPending}
        >
          <DownloadIcon className="size-3.5" />
          Export PDF
        </Button>
        {fileUrls.docx && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFileUrl(fileUrls.docx!, `${artifact.title}.docx`)}
          >
            Word
          </Button>
        )}
        {fileUrls.xlsx && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadFileUrl(fileUrls.xlsx!, `${artifact.title}.xlsx`)}
          >
            Excel
          </Button>
        )}
        {artifact.connectorExternalUrl && (
          <Button size="sm" variant="outline" asChild>
            <a href={artifact.connectorExternalUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="size-3.5" />
              Open app
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
          connectorExternalId={artifact.connectorExternalId}
          useConnector={useConnector}
          editMode={editMode && !useConnector}
          onChange={setContent}
          onConnectRequest={() => {
            const provider =
              suggestedProviderForKind(artifact.kind) ?? "GOOGLE_DOCS";
            connectArtifact.mutate({ artifactId: artifact.id, provider });
          }}
        />
      </div>
    </div>
  );
}
