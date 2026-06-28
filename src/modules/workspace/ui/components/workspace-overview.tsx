"use client";

import type { ProductWorkspaceSummary } from "@/types/aria";
import { AiBriefingPanel } from "./ai-briefing-panel";
import { ProductPulsePanel } from "./product-pulse-panel";

interface WorkspaceOverviewProps {
  summary: ProductWorkspaceSummary;
  onBriefingAction?: () => void;
  onNavigateSection?: (section: string) => void;
}

export function WorkspaceOverview({
  summary,
  onBriefingAction,
  onNavigateSection,
}: WorkspaceOverviewProps) {
  return (
    <div className="p-6 md:p-8 space-y-10 overflow-auto h-full max-w-3xl">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{summary.displayName}</h1>
        {summary.sourcePrompt && (
          <p className="text-sm text-muted-foreground line-clamp-2">{summary.sourcePrompt}</p>
        )}
      </div>

      <AiBriefingPanel briefing={summary.briefing} onAction={onBriefingAction} />

      <ProductPulsePanel pulse={summary.pulse} />

      {summary.recentlyUpdated.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Recently changed</h3>
          <div className="space-y-2">
            {summary.recentlyUpdated.slice(0, 5).map((a) => (
              <button
                key={a.id}
                type="button"
                className="w-full text-left rounded-lg border border-border/50 px-4 py-3 hover:border-primary/30 hover:bg-muted/20 transition-colors"
                onClick={() => onNavigateSection?.("artifacts")}
              >
                <p className="text-sm font-medium truncate">{a.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {a.sourceAppLabel} · v{a.version} ·{" "}
                  {a.approvalStatus === "APPROVED" ? "Approved" : "Draft"}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
