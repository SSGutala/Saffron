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
  const [content, setContent] = useState<ArtifactContent>(() => {
    try {
      return JSON.parse(artifact.content) as ArtifactContent;
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

  const approve = useMutation(
    trpc.lifecycle.approveStage.mutationOptions({
      onSuccess: () => {
        toast.success("Approved");
        queryClient.invalidateQueries(
          trpc.artifacts.getMany.queryOptions({ projectId: artifact.projectId }),
        );
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

  const toggleConnector = () => {
    const next = !useConnector;
    setUseConnector(next);
    setConnector.mutate({ id: artifact.id, useConnector: next });
  };

  const fileUrls = parseFileUrls(artifact.fileUrls);

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
        <Button size="sm" variant={useConnector ? "default" : "outline"} onClick={toggleConnector}>
          <PlugIcon className="size-3.5" />
          {useConnector ? "Connector" : "Chai native"}
        </Button>
        {editMode && (
          <Button size="sm" onClick={handleSave} disabled={save.isPending}>
            <SaveIcon className="size-3.5" />
            Save
          </Button>
        )}
        {artifact.stageKey && artifact.status !== "APPROVED" && (
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
          useConnector={useConnector}
          editMode={editMode}
          onChange={setContent}
        />
      </div>
    </div>
  );
}
