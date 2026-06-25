"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, FileTextIcon, PlusIcon, TrashIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Artifact } from "@/generated/prisma";
import { LIFECYCLE_STAGES } from "@/types/lifecycle";
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
  const { data: lifecycle } = useQuery(
    trpc.lifecycle.getStatus.queryOptions({ projectId }),
  );

  const stageArtifacts = useMemo(
    () => artifacts?.filter((a) => a.stageKey) ?? [],
    [artifacts],
  );
  const approvedStageCount =
    stageArtifacts.filter((a) => a.status === "APPROVED").length;
  const allStagesApproved =
    stageArtifacts.length >= LIFECYCLE_STAGES.length &&
    approvedStageCount >= LIFECYCLE_STAGES.length;

  const approve = useMutation(
    trpc.lifecycle.approveStage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.artifacts.getMany.queryOptions({ projectId }));
        queryClient.invalidateQueries(trpc.lifecycle.getStatus.queryOptions({ projectId }));
      },
    }),
  );

  const generateDesigns = useMutation(
    trpc.lifecycle.generateDesigns.mutationOptions({
      onMutate: () => {
        toast.message("Generating design directions…");
      },
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.messages.getMany.queryOptions({ projectId }));
        queryClient.invalidateQueries(trpc.lifecycle.getStatus.queryOptions({ projectId }));
        queryClient.invalidateQueries(trpc.projects.getOne.queryOptions({ id: projectId }));
        toast.success("Design directions ready — pick one in chat");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  useEffect(() => {
    if (!initialArtifactId || !artifacts?.length) return;
    const found = artifacts.find((a) => a.id === initialArtifactId);
    if (found) setActive(found);
  }, [initialArtifactId, artifacts]);

  useEffect(() => {
    if (!active?.id || !artifacts?.length) return;
    const fresh = artifacts.find((a) => a.id === active.id);
    if (fresh) setActive(fresh);
  }, [artifacts, active?.id]);

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
        <div className="flex items-center gap-2">
          {lifecycle?.lifecycleState === "BRIEF_READY" && stageArtifacts.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              disabled={!allStagesApproved || generateDesigns.isPending}
              onClick={() => generateDesigns.mutate({ projectId })}
            >
              {generateDesigns.isPending ? "Generating…" : "Generate designs"}
            </Button>
          )}
          <Button size="sm" onClick={() => setOpen(true)}>
            <PlusIcon className="size-3.5" />
            Request file
          </Button>
        </div>
      </div>
      {stageArtifacts.length > 0 && lifecycle?.lifecycleState === "BRIEF_READY" && (
        <p className="text-xs text-muted-foreground px-3 py-2 border-b shrink-0">
          {approvedStageCount}/{LIFECYCLE_STAGES.length} documents approved
          {!allStagesApproved && " — approve all to generate designs"}
        </p>
      )}
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
                {a.status === "APPROVED" && " · Approved"}
              </p>
            </button>
            {a.stageKey && a.status !== "APPROVED" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => approve.mutate({ artifactId: a.id })}
                disabled={approve.isPending}
              >
                Approve
              </Button>
            )}
            {a.status === "APPROVED" && (
              <CheckIcon className="size-4 text-primary shrink-0" />
            )}
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
