"use client";

import { AlertTriangleIcon, ArrowRightIcon, CheckIcon, InfoIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiBriefing } from "@/types/aria";

const ICONS = {
  success: CheckIcon,
  info: InfoIcon,
  warning: AlertTriangleIcon,
  risk: AlertTriangleIcon,
} as const;

interface AiBriefingPanelProps {
  briefing: AiBriefing;
  onAction?: () => void;
  className?: string;
}

export function AiBriefingPanel({ briefing, onAction, className }: AiBriefingPanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border/60 bg-card/30 p-6 md:p-8 space-y-5",
        className,
      )}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">
          Aria
        </p>
        <h2 className="text-xl md:text-2xl font-semibold tracking-tight leading-snug">
          {briefing.greeting}
        </h2>
      </div>

      {briefing.yesterday.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Recent
          </p>
          <ul className="space-y-2">
            {briefing.yesterday.map((item, i) => {
              const Icon = ICONS[item.type];
              return (
                <li key={i} className="flex items-start gap-2.5 text-sm">
                  <Icon
                    className={cn(
                      "size-4 shrink-0 mt-0.5",
                      item.type === "success" && "text-emerald-500",
                      item.type === "info" && "text-blue-500",
                      item.type === "warning" && "text-amber-500",
                      item.type === "risk" && "text-red-500",
                    )}
                  />
                  <span className="text-foreground/90">{item.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="rounded-xl bg-muted/40 border border-border/40 p-4 space-y-3">
        <p className="text-sm leading-relaxed text-foreground/90">{briefing.recommendation}</p>
        {briefing.actionLabel && onAction && (
          <Button size="sm" onClick={onAction}>
            {briefing.actionLabel}
            <ArrowRightIcon className="size-3.5 ml-1.5" />
          </Button>
        )}
      </div>
    </section>
  );
}
