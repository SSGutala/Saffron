"use client";

import {
  CheckIcon,
  ExternalLinkIcon,
  EyeIcon,
  GitBranchIcon,
  SparklesIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AriaArtifactView } from "@/types/aria";

const SYNC_LABELS: Record<string, string> = {
  native_draft: "Native Draft",
  embedded: "Embedded",
  synced: "Synced",
  external: "External",
  mock: "Mock sync",
  pending_update: "Pending update",
  native: "Native Draft",
};

const SEVERITY_BORDER: Record<string, string> = {
  native: "border-l-emerald-500/60",
  external: "border-l-blue-500/60",
  embedded: "border-l-violet-500/60",
  mock: "border-l-amber-500/60",
};

interface ArtifactCardProps {
  artifact: AriaArtifactView;
  onPreview: () => void;
  onOpen?: () => void;
  onUpdateWithAria?: () => void;
  onApprove?: () => void;
  isApproving?: boolean;
}

export function ArtifactCard({
  artifact,
  onPreview,
  onOpen,
  onUpdateWithAria,
  onApprove,
  isApproving,
}: ArtifactCardProps) {
  const isApproved = artifact.approvalStatus === "APPROVED";
  const typeLabel = artifact.artifactType.replace(/_/g, " ");
  const syncLabel = SYNC_LABELS[artifact.syncStatus] ?? artifact.syncStatus;
  const borderAccent =
    SEVERITY_BORDER[artifact.syncStatus] ?? "border-l-zinc-600/60";

  return (
    <div
      className={cn(
        "group rounded-lg border bg-card/80 border-border/80 hover:border-primary/30 transition-all border-l-[3px]",
        borderAccent,
      )}
    >
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide font-normal">
                {typeLabel}
              </Badge>
              <Badge
                variant={isApproved ? "default" : "secondary"}
                className="text-[10px] uppercase tracking-wide font-normal"
              >
                {isApproved ? "Approved" : "Draft"}
              </Badge>
              {artifact.hasDownstreamImpact && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-500/90">
                  <GitBranchIcon className="size-3" />
                  Impact
                </span>
              )}
            </div>
            <h3 className="font-medium text-sm truncate">{artifact.title}</h3>
            {artifact.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {artifact.description}
              </p>
            )}
          </div>
          {isApproved && (
            <CheckIcon className="size-4 text-emerald-500 shrink-0 mt-0.5" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span>v{artifact.version}</span>
          <span>·</span>
          <span>{artifact.sourceAppLabel}</span>
          <span>·</span>
          <span>{syncLabel}</span>
          <span>·</span>
          <span>
            Updated {new Date(artifact.updatedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={onPreview}>
            <EyeIcon className="size-3 mr-1" />
            Preview
          </Button>
          {(artifact.externalUrl || artifact.embedUrl) && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={onOpen}
            >
              <ExternalLinkIcon className="size-3 mr-1" />
              Open
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={onUpdateWithAria}
          >
            <SparklesIcon className="size-3 mr-1" />
            Update with Aria
          </Button>
          {!isApproved && onApprove && (
            <Button
              size="sm"
              className="h-7 text-xs ml-auto"
              onClick={onApprove}
              disabled={isApproving}
            >
              Approve
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
