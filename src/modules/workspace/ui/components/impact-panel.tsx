"use client";

import type { ImpactAnalysis } from "@/types/aria";

interface ImpactPanelProps {
  impact: ImpactAnalysis;
}

export function ImpactPanel({ impact }: ImpactPanelProps) {
  return (
    <div className="p-4 space-y-3 bg-amber-500/5 border-t border-amber-500/20">
      <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
        Impact Engine
      </p>
      <p className="text-xs text-muted-foreground">{impact.recommendation}</p>
      <ul className="space-y-2">
        {impact.affected.map((item) => (
          <li
            key={`${item.artifactType}-${item.title}`}
            className="flex items-start justify-between gap-3 text-xs rounded-md border border-border/40 bg-card/40 px-3 py-2"
          >
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-muted-foreground mt-0.5">{item.reason}</p>
            </div>
            {item.status && (
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                {item.status}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
