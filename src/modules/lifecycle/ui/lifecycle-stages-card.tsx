"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ChevronDownIcon, FileTextIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { LIFECYCLE_STAGES } from "@/types/lifecycle";
import { useTRPC } from "@/trpc/client";
import type { BriefJson } from "@/types/lifecycle";

interface LifecycleStagesCardProps {
  projectId: string;
  brief: BriefJson;
  artifactIds: Record<string, string>;
  appTitle?: string;
  onOpenArtifact?: (artifactId: string) => void;
}

export function LifecycleStagesCard({
  projectId,
  brief,
  artifactIds,
  appTitle,
  onOpenArtifact,
}: LifecycleStagesCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [openStage, setOpenStage] = useState<string | null>("intake_summary");

  const { data: artifacts } = useQuery(
    trpc.artifacts.getMany.queryOptions({ projectId }),
  );

  const generateDesigns = useMutation(
    trpc.lifecycle.generateDesigns.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.messages.getMany.queryOptions({ projectId }));
      },
    }),
  );

  const approve = useMutation(trpc.lifecycle.approveStage.mutationOptions({
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.artifacts.getMany.queryOptions({ projectId }));
    },
  }));

  const approvedCount =
    artifacts?.filter((a) => a.stageKey && a.status === "APPROVED").length ?? 0;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3 my-2 max-w-full">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{appTitle ?? "Product lifecycle"}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            7 stages · {approvedCount}/{LIFECYCLE_STAGES.length} approved · edit in Files tab
          </p>
        </div>
        <Button
          size="sm"
          disabled={generateDesigns.isPending}
          onClick={() => generateDesigns.mutate({ projectId })}
        >
          {generateDesigns.isPending ? "Generating…" : "Generate 3 designs"}
        </Button>
      </div>

      <div className="space-y-1">
        {LIFECYCLE_STAGES.map((stage) => {
          const artifactId = artifactIds[stage.key];
          const artifact = artifacts?.find((a) => a.id === artifactId);
          const isOpen = openStage === stage.key;
          const data = brief[stage.key];

          return (
            <div key={stage.key} className="border rounded-lg overflow-hidden">
              <button
                type="button"
                className="w-full flex items-center gap-2 p-3 text-left hover:bg-muted/50 text-sm"
                onClick={() => setOpenStage(isOpen ? null : stage.key)}
              >
                <ChevronDownIcon
                  className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
                <span className="font-medium flex-1">{stage.label}</span>
                {artifact?.status === "APPROVED" && (
                  <CheckIcon className="size-4 text-primary" />
                )}
              </button>
              {isOpen && (
                <div className="px-3 pb-3 space-y-2 border-t bg-muted/20">
                  <pre className="text-[10px] whitespace-pre-wrap max-h-32 overflow-auto text-muted-foreground">
                    {JSON.stringify(data, null, 2).slice(0, 1200)}
                  </pre>
                  <div className="flex gap-2">
                    {artifactId && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenArtifact?.(artifactId)}
                        >
                          <FileTextIcon className="size-3.5" />
                          Open editor
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={artifact?.status === "APPROVED"}
                          onClick={() => approve.mutate({ artifactId })}
                        >
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
