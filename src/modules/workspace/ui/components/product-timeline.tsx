"use client";

import { cn } from "@/lib/utils";
import type { TimelineEvent } from "@/types/aria";

const ACTOR_LABELS = { aria: "Aria", human: "You", connector: "Connector" } as const;

const CATEGORY_STYLES: Record<TimelineEvent["category"], string> = {
  created: "border-l-blue-500/60",
  generated: "border-l-violet-500/60",
  approved: "border-l-emerald-500/60",
  updated: "border-l-amber-500/60",
  connected: "border-l-cyan-500/60",
  waiting: "border-l-orange-500/60",
  ready: "border-l-emerald-400/60",
};

interface ProductTimelineProps {
  events: TimelineEvent[];
}

export function ProductTimeline({ events }: ProductTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-12 text-center">
        The product timeline will tell the story of delivery as artifacts are created, approved, and synced.
      </p>
    );
  }

  return (
    <div className="relative pl-6 space-y-0">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-border/60" />
      {events.map((event) => (
        <div
          key={event.id}
          className={cn(
            "relative pb-6 pl-4 border-l-[3px] ml-[-1px]",
            CATEGORY_STYLES[event.category],
          )}
        >
          <div className="absolute left-[-7px] top-1.5 size-2.5 rounded-full bg-background border-2 border-primary/40" />
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-sm font-medium">{event.title}</p>
            <time className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
              {new Date(event.timestamp).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </time>
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground capitalize">
              {ACTOR_LABELS[event.actor]}
            </span>
            <span className="text-[10px] text-muted-foreground">·</span>
            <span className="text-[10px] text-muted-foreground capitalize">{event.category}</span>
          </div>
          {event.detail && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{event.detail}</p>
          )}
        </div>
      ))}
    </div>
  );
}
