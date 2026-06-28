"use client";

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  InfoIcon,
  SparklesIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AriaRecommendation } from "@/types/aria";

const ICONS = {
  info: InfoIcon,
  warning: AlertTriangleIcon,
  success: CheckCircle2Icon,
  risk: AlertTriangleIcon,
} as const;

const STYLES = {
  info: "border-blue-500/20 bg-blue-500/5",
  warning: "border-amber-500/20 bg-amber-500/5",
  success: "border-emerald-500/20 bg-emerald-500/5",
  risk: "border-red-500/20 bg-red-500/5",
} as const;

interface RecommendationsPanelProps {
  recommendations: AriaRecommendation[];
  onAction?: (rec: AriaRecommendation) => void;
  compact?: boolean;
}

export function RecommendationsPanel({
  recommendations,
  onAction,
  compact,
}: RecommendationsPanelProps) {
  if (recommendations.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/60 p-6 text-center">
        <SparklesIcon className="size-5 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Aria will surface PM recommendations as your product workspace evolves.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", compact && "space-y-1.5")}>
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">AI PM Recommendations</h3>
      </div>
      {recommendations.map((rec) => {
        const Icon = ICONS[rec.severity];
        return (
          <div
            key={rec.id}
            className={cn(
              "rounded-lg border p-3 flex gap-3",
              STYLES[rec.severity],
            )}
          >
            <Icon className="size-4 shrink-0 mt-0.5 opacity-80" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{rec.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                {rec.body}
              </p>
              {rec.actionLabel && onAction && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs mt-2 px-2 -ml-2"
                  onClick={() => onAction(rec)}
                >
                  {rec.actionLabel}
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
