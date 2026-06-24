"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileTextIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Artifact } from "@/generated/prisma";
import { useTRPC } from "@/trpc/client";
import { AddDocumentModal } from "./add-document-modal";
import { ArtifactViewer } from "./artifact-viewer";

const KIND_ICON: Record<string, string> = {
  DOCUMENT: "📝",
  DIAGRAM: "🔀",
  SPREADSHEET: "📊",
  PRESENTATION: "📽️",
  DESIGN: "🎨",
};

interface ArtifactPanelProps {
  projectId: string;
  initialArtifactId?: string | null;
}

export function ArtifactPanel({ projectId, initialArtifactId }: ArtifactPanelProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Artifact | null>(null);

  const { data: artifacts } = useQuery(
    trpc.artifacts.getMany.queryOptions({ projectId }),
  );

  useEffect(() => {
    if (!initialArtifactId || !artifacts?.length) return;
    const found = artifacts.find((a) => a.id === initialArtifactId);
    if (found) setActive(found);
  }, [initialArtifactId, artifacts]);

  const remove = useMutation(
    trpc.artifacts.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.artifacts.getMany.queryOptions({ projectId }));
        setActive(null);
      },
    }),
  );

  if (active) {
    return (
      <ArtifactViewer
        artifact={active}
        onClose={() => setActive(null)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b shrink-0">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <FileTextIcon className="size-4" />
          Files & Documents
        </h2>
        <Button size="sm" onClick={() => setOpen(true)}>
          <PlusIcon className="size-3.5" />
          Request file
        </Button>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {!artifacts?.length && (
          <p className="text-sm text-muted-foreground text-center py-12">
            No documents yet. Request a PRD, workflow diagram, finance sheet, pitch deck, or UX design.
          </p>
        )}
        {artifacts?.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:border-primary/40 transition-colors group"
          >
            <button
              type="button"
              className="flex-1 text-left min-w-0"
              onClick={() => setActive(a)}
            >
              <span className="mr-2">{KIND_ICON[a.kind] ?? "📄"}</span>
              <span className="font-medium text-sm truncate">{a.title}</span>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {a.artifactType.replace(/_/g, " ")} · v{a.version}
              </p>
            </button>
            <Button
              size="sm"
              variant="ghost"
              className="opacity-0 group-hover:opacity-100"
              onClick={() => remove.mutate({ id: a.id })}
            >
              <TrashIcon className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <AddDocumentModal
        projectId={projectId}
        open={open}
        onOpenChange={setOpen}
        onCreated={(a) => {
          setOpen(false);
          setActive(a);
          toast.success("Document created");
        }}
      />
    </div>
  );
}
