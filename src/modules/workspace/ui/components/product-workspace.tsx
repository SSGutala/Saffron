"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import type { Artifact } from "@/generated/prisma";
import { ArtifactViewer } from "@/modules/artifacts/ui/components/artifact-viewer";
import { LIFECYCLE_STAGES } from "@/types/lifecycle";
import type { WorkspaceSectionId } from "@/types/aria";
import { useTRPC } from "@/trpc/client";
import { ArtifactsByLifecycle } from "./artifacts-by-lifecycle";
import { IntegrationsPanel } from "./integrations-panel";
import { LifecycleView } from "./lifecycle-view";
import { ProductTimeline } from "./product-timeline";
import { WorkspaceNav } from "./workspace-nav";
import { WorkspaceOverview } from "./workspace-overview";

interface ProductWorkspaceProps {
  projectId: string;
  initialArtifactId?: string | null;
  initialSection?: WorkspaceSectionId;
}

export function ProductWorkspace({
  projectId,
  initialArtifactId,
  initialSection = "overview",
}: ProductWorkspaceProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<WorkspaceSectionId>(initialSection);
  const [activeArtifact, setActiveArtifact] = useState<Artifact | null>(null);

  const { data: workspace, isLoading } = useQuery(
    trpc.workspace.getProductWorkspace.queryOptions({ projectId }),
  );

  const { data: rawArtifacts } = useQuery(
    trpc.artifacts.getMany.queryOptions({ projectId }),
  );

  const { data: lifecycle } = useQuery(
    trpc.lifecycle.getStatus.queryOptions({ projectId }),
  );

  const artifactCounts = useMemo(() => {
    const counts: Partial<Record<WorkspaceSectionId, number>> = {};
    for (const a of workspace?.artifacts ?? []) {
      const sec = a.workspaceSection;
      counts[sec] = (counts[sec] ?? 0) + 1;
    }
    if (workspace?.artifacts.length) {
      counts.artifacts = workspace.artifacts.length;
    }
    return counts;
  }, [workspace?.artifacts]);

  const sectionArtifacts = useMemo(() => {
    if (!workspace?.artifacts) return [];
    if (section === "artifacts") return workspace.artifacts;
    if (["backlog", "testing", "releases", "workflows", "brief", "requirements", "ux", "data"].includes(section)) {
      return workspace.artifacts.filter((a) => a.workspaceSection === section);
    }
    return [];
  }, [workspace?.artifacts, section]);

  const approve = useMutation(
    trpc.lifecycle.approveStage.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.artifacts.getMany.queryOptions({ projectId }));
        queryClient.invalidateQueries(trpc.lifecycle.getStatus.queryOptions({ projectId }));
        queryClient.invalidateQueries(
          trpc.workspace.getProductWorkspace.queryOptions({ projectId }),
        );
        toast.success("Artifact approved");
      },
    }),
  );

  const generateDesigns = useMutation(
    trpc.lifecycle.generateDesigns.mutationOptions({
      onMutate: () => toast.message("Generating design directions…"),
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.messages.getMany.queryOptions({ projectId }));
        queryClient.invalidateQueries(trpc.lifecycle.getStatus.queryOptions({ projectId }));
        queryClient.invalidateQueries(trpc.projects.getOne.queryOptions({ id: projectId }));
        queryClient.invalidateQueries(
          trpc.workspace.getProductWorkspace.queryOptions({ projectId }),
        );
        toast.success("Design directions ready — pick one in chat");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const findRaw = useCallback(
    (id: string) => rawArtifacts?.find((a) => a.id === id) ?? null,
    [rawArtifacts],
  );

  useEffect(() => {
    if (!initialArtifactId || !rawArtifacts?.length) return;
    const found = findRaw(initialArtifactId);
    if (found) setActiveArtifact(found);
  }, [initialArtifactId, rawArtifacts, findRaw]);

  useEffect(() => {
    if (!activeArtifact?.id || !rawArtifacts?.length) return;
    const fresh = findRaw(activeArtifact.id);
    if (fresh) setActiveArtifact(fresh);
  }, [rawArtifacts, activeArtifact?.id, findRaw]);

  const handleBriefingAction = () => {
    const rec = workspace?.summary.briefing;
    if (rec?.actionType === "generate_designs") {
      generateDesigns.mutate({ projectId });
      return;
    }
    if (rec?.actionTarget) {
      setSection(rec.actionTarget as WorkspaceSectionId);
    }
  };

  const stageArtifacts = rawArtifacts?.filter((a) => a.stageKey) ?? [];
  const allStagesApproved =
    stageArtifacts.length >= LIFECYCLE_STAGES.length &&
    stageArtifacts.filter((a) => a.status === "APPROVED").length >= LIFECYCLE_STAGES.length;

  if (activeArtifact) {
    return (
      <ArtifactViewer
        artifact={activeArtifact}
        allArtifacts={rawArtifacts ?? []}
        onClose={() => setActiveArtifact(null)}
      />
    );
  }

  if (isLoading || !workspace) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin mr-2" />
        Loading product workspace…
      </div>
    );
  }

  return (
    <div className="h-full flex min-h-0">
      <WorkspaceNav
        activeSection={section}
        onSectionChange={setSection}
        artifactCounts={artifactCounts}
      />
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        <div className="flex-1 overflow-auto min-h-0">
          {section === "overview" && (
            <WorkspaceOverview
              summary={workspace.summary}
              onBriefingAction={handleBriefingAction}
              onNavigateSection={(s) => setSection(s as WorkspaceSectionId)}
            />
          )}

          {section === "timeline" && (
            <div className="p-6 max-w-2xl">
              <h2 className="text-lg font-semibold mb-6">Product Timeline</h2>
              <ProductTimeline events={workspace.timeline} />
            </div>
          )}

          {section === "lifecycle" && (
            <LifecycleView
              artifacts={workspace.artifacts}
              lifecycleState={workspace.summary.lifecycleState}
            />
          )}

          {section === "artifacts" && (
            <ArtifactsByLifecycle
              artifacts={workspace.artifacts}
              onPreview={(id) => {
                const raw = findRaw(id);
                if (raw) setActiveArtifact(raw);
              }}
              onApprove={(id) => approve.mutate({ artifactId: id })}
              isApproving={approve.isPending}
            />
          )}

          {["backlog", "testing", "releases", "workflows", "brief", "requirements", "ux", "data"].includes(section) && (
            <ArtifactsByLifecycle
              artifacts={sectionArtifacts}
              onPreview={(id) => {
                const raw = findRaw(id);
                if (raw) setActiveArtifact(raw);
              }}
              onApprove={(id) => approve.mutate({ artifactId: id })}
              isApproving={approve.isPending}
            />
          )}

          {section === "settings" && <IntegrationsPanel projectId={projectId} />}

          {section === "activity" && (
            <div className="p-6 max-w-2xl space-y-4">
              <h2 className="text-lg font-semibold">Activity</h2>
              <ProductTimeline
                events={workspace.timeline.filter((e) =>
                  ["updated", "approved", "connected", "generated"].includes(e.category),
                )}
              />
            </div>
          )}
        </div>

        {lifecycle?.lifecycleState === "BRIEF_READY" &&
          allStagesApproved &&
          section === "artifacts" && (
            <div className="border-t border-border/60 p-3 shrink-0 bg-muted/20">
              <button
                type="button"
                className="text-sm text-primary hover:underline"
                onClick={() => generateDesigns.mutate({ projectId })}
                disabled={generateDesigns.isPending}
              >
                {generateDesigns.isPending
                  ? "Generating designs…"
                  : "All artifacts approved — Generate designs"}
              </button>
            </div>
          )}
      </div>
    </div>
  );
}
