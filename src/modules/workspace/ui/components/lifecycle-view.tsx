"use client";

import { CheckIcon, CircleIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { LIFECYCLE_STAGES } from "@/types/lifecycle";
import type { AriaArtifactView } from "@/types/aria";

interface LifecycleViewProps {
  artifacts: AriaArtifactView[];
  lifecycleState: string;
}

export function LifecycleView({ artifacts, lifecycleState }: LifecycleViewProps) {
  const stages = LIFECYCLE_STAGES.map((stage) => {
    const artifact = artifacts.find((a) => a.stageKey === stage.key);
    return { ...stage, artifact };
  });

  const approvedCount = stages.filter((s) => s.artifact?.approvalStatus === "APPROVED").length;

  return (
    <div className="space-y-8 p-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold mb-1">Product Lifecycle</h2>
        <p className="text-sm text-muted-foreground">
          Current state:{" "}
          <span className="text-foreground capitalize">
            {lifecycleState.replace(/_/g, " ").toLowerCase()}
          </span>
        </p>
      </div>

      <div className="space-y-3">
        {stages.map((stage, i) => {
          const approved = stage.artifact?.approvalStatus === "APPROVED";
          const exists = !!stage.artifact;
          return (
            <div
              key={stage.key}
              className={cn(
                "flex items-start gap-4 rounded-lg border p-4 transition-colors",
                approved
                  ? "border-emerald-500/20 bg-emerald-500/5"
                  : exists
                    ? "border-amber-500/20 bg-amber-500/5"
                    : "border-border/50 bg-muted/10",
              )}
            >
              <div className="mt-0.5">
                {approved ? (
                  <CheckIcon className="size-5 text-emerald-500" />
                ) : (
                  <CircleIcon className="size-5 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-medium text-sm">{stage.label}</h3>
                  {exists && (
                    <span
                      className={cn(
                        "text-[10px] uppercase tracking-wide",
                        approved ? "text-emerald-500" : "text-amber-500",
                      )}
                    >
                      {approved ? "Approved" : "Draft"}
                    </span>
                  )}
                </div>
                {stage.artifact ? (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {stage.artifact.title} · {stage.artifact.sourceAppLabel}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Not yet generated</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {approvedCount} of {LIFECYCLE_STAGES.length} lifecycle artifacts approved
      </p>
    </div>
  );
}
