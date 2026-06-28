"use client";

import type { ProductPulse } from "@/types/aria";
import { cn } from "@/lib/utils";

interface ProductPulsePanelProps {
  pulse: ProductPulse;
  compact?: boolean;
}

export function ProductPulsePanel({ pulse, compact }: ProductPulsePanelProps) {
  return (
    <section className={cn("space-y-4", compact && "space-y-3")}>
      <h3 className="text-sm font-semibold">Product Pulse</h3>
      <div className={cn("grid gap-3", compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 md:grid-cols-3")}>
        <PulseItem label="Lifecycle" value={pulse.lifecycleLabel} />
        <PulseItem
          label="Momentum"
          value={pulse.momentum}
          capitalize
          highlight={pulse.momentum === "high" ? "positive" : pulse.momentum === "low" ? "muted" : undefined}
        />
        <PulseItem
          label="Risk"
          value={pulse.riskLevel}
          capitalize
          highlight={pulse.riskLevel === "high" ? "risk" : undefined}
        />
        <PulseItem label="Blockers" value={String(pulse.blockers)} highlight={pulse.blockers > 0 ? "risk" : undefined} />
        <PulseItem
          label="Approvals waiting"
          value={String(pulse.approvalsWaiting)}
          highlight={pulse.approvalsWaiting > 0 ? "warning" : undefined}
        />
        <PulseItem label="Recently changed" value={String(pulse.recentlyChangedCount)} />
      </div>
      {pulse.upcomingMilestone && (
        <p className="text-xs text-muted-foreground">
          Next milestone: <span className="text-foreground">{pulse.upcomingMilestone}</span>
        </p>
      )}
    </section>
  );
}

function PulseItem({
  label,
  value,
  capitalize,
  highlight,
}: {
  label: string;
  value: string;
  capitalize?: boolean;
  highlight?: "positive" | "warning" | "risk" | "muted";
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
      <p
        className={cn(
          "text-sm font-medium",
          capitalize && "capitalize",
          highlight === "positive" && "text-emerald-500",
          highlight === "warning" && "text-amber-500",
          highlight === "risk" && "text-red-500",
          highlight === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
