"use client";

import { toast } from "sonner";
import { LIFECYCLE_ARTIFACT_GROUPS, type AriaArtifactView } from "@/types/aria";
import { ArtifactCard } from "./artifact-card";

interface ArtifactsByLifecycleProps {
  artifacts: AriaArtifactView[];
  onPreview: (id: string) => void;
  onApprove?: (id: string) => void;
  isApproving?: boolean;
}

export function ArtifactsByLifecycle({
  artifacts,
  onPreview,
  onApprove,
  isApproving,
}: ArtifactsByLifecycleProps) {
  const grouped = LIFECYCLE_ARTIFACT_GROUPS.map((group) => ({
    ...group,
    items: artifacts.filter((a) => a.lifecycleGroup === group.id),
  })).filter((g) => g.items.length > 0);

  if (artifacts.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-16 text-center">
        Artifacts will appear here as Aria builds your product model.
      </p>
    );
  }

  return (
    <div className="p-4 space-y-10">
      {grouped.length === 0 ? (
        <Uncategorized artifacts={artifacts} onPreview={onPreview} onApprove={onApprove} isApproving={isApproving} />
      ) : (
        grouped.map((group) => (
          <section key={group.id}>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
              {group.label}
            </h3>
            <div className="space-y-3">
              {group.items.map((artifact) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  onPreview={() => onPreview(artifact.id)}
                  onOpen={() => {
                    const url = artifact.externalUrl ?? artifact.embedUrl;
                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                    else onPreview(artifact.id);
                  }}
                  onUpdateWithAria={() =>
                    toast.message("Update with Aria", {
                      description: `Proposed changes for "${artifact.title}" will sync through the connector when ready.`,
                    })
                  }
                  onApprove={
                    artifact.approvalStatus !== "APPROVED" && onApprove
                      ? () => onApprove(artifact.id)
                      : undefined
                  }
                  isApproving={isApproving}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function Uncategorized({
  artifacts,
  onPreview,
  onApprove,
  isApproving,
}: ArtifactsByLifecycleProps) {
  return (
    <div className="space-y-3">
      {artifacts.map((artifact) => (
        <ArtifactCard
          key={artifact.id}
          artifact={artifact}
          onPreview={() => onPreview(artifact.id)}
          onOpen={() => onPreview(artifact.id)}
          onUpdateWithAria={() =>
            toast.message("Update with Aria", {
              description: `Proposed changes for "${artifact.title}" will sync through the connector when ready.`,
            })
          }
          onApprove={
            artifact.approvalStatus !== "APPROVED" && onApprove
              ? () => onApprove?.(artifact.id)
              : undefined
          }
          isApproving={isApproving}
        />
      ))}
    </div>
  );
}
