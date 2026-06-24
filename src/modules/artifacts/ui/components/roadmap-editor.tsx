"use client";

import { DiamondIcon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { RoadmapData, RoadmapItem, RoadmapLane } from "@/types/artifacts";
import { cn } from "@/lib/utils";

const DEFAULT_LANES: RoadmapLane[] = [
  { id: "product", label: "Product", color: "#c96342" },
  { id: "design", label: "Design", color: "#8b5cf6" },
  { id: "engineering", label: "Engineering", color: "#0ea5e9" },
  { id: "marketing", label: "Marketing", color: "#22c55e" },
];

const DEFAULT_QUARTERS = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"];

interface RoadmapEditorProps {
  data: RoadmapData;
  editMode?: boolean;
  onChange?: (data: RoadmapData) => void;
}

export function RoadmapEditor({ data, editMode = false, onChange }: RoadmapEditorProps) {
  const lanes = data.lanes?.length ? data.lanes : DEFAULT_LANES;
  const quarters = data.quarters?.length ? data.quarters : DEFAULT_QUARTERS;
  const items = data.items ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const update = (next: RoadmapData) => onChange?.(next);
  const cellWidth = 140;
  const laneHeight = 88;

  const addItem = (type: "bar" | "milestone" = "bar") => {
    const item: RoadmapItem = {
      id: `rm-${Date.now()}`,
      title: type === "milestone" ? "Key milestone" : "New initiative",
      laneId: lanes[0]?.id ?? "product",
      startQuarter: 0,
      spanQuarters: type === "milestone" ? 0 : 2,
      type,
      color: lanes[0]?.color,
    };
    update({ ...data, lanes, quarters, items: [...items, item] });
    setSelectedId(item.id);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[#fafafa]">
      <div className="flex items-center justify-between p-4 border-b bg-white shrink-0">
        <div>
          <h2 className="font-semibold text-lg">{data.title ?? "Product Roadmap"}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Timeline · swimlanes · releases · milestones
          </p>
        </div>
        {editMode && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => addItem("bar")}>
              <PlusIcon className="size-3.5 mr-1" /> Initiative
            </Button>
            <Button size="sm" variant="outline" onClick={() => addItem("milestone")}>
              <DiamondIcon className="size-3.5 mr-1" /> Milestone
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm min-w-[720px]">
          {/* Timeline header */}
          <div className="flex border-b bg-slate-50">
            <div className="w-40 shrink-0 p-3 text-xs font-bold text-slate-500 border-r uppercase tracking-wide">
              Team / Lane
            </div>
            {quarters.map((q) => (
              <div
                key={q}
                className="shrink-0 p-3 text-xs font-bold text-center border-r text-slate-700"
                style={{ width: cellWidth }}
              >
                {q}
              </div>
            ))}
          </div>

          {lanes.map((lane) => (
            <div
              key={lane.id}
              className="flex border-b last:border-b-0"
              style={{ minHeight: laneHeight }}
            >
              <div className="w-40 shrink-0 p-3 border-r flex items-center gap-2 bg-slate-50/50">
                <span
                  className="size-2.5 rounded-full shrink-0"
                  style={{ background: lane.color }}
                />
                <span className="text-sm font-medium text-slate-800">{lane.label}</span>
              </div>
              <div
                className="relative flex bg-white"
                style={{ width: quarters.length * cellWidth }}
              >
                {quarters.map((q, qi) => (
                  <div
                    key={q}
                    className={cn(
                      "border-r h-full",
                      qi % 2 === 0 ? "bg-white" : "bg-slate-50/30",
                    )}
                    style={{ width: cellWidth }}
                  />
                ))}
                {items
                  .filter((it) => it.laneId === lane.id)
                  .map((it) => {
                    const left = it.startQuarter * cellWidth + 6;
                    const width = Math.max((it.spanQuarters || 1) * cellWidth - 12, 56);
                    const isMilestone = it.type === "milestone";
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => editMode && setSelectedId(it.id)}
                        className={`absolute top-1/2 -translate-y-1/2 text-left transition-all hover:brightness-110 ${
                          selectedId === it.id ? "ring-2 ring-offset-1 ring-primary z-10" : ""
                        }`}
                        style={{
                          left,
                          width: isMilestone ? 28 : width,
                          height: isMilestone ? 28 : 40,
                        }}
                      >
                        {isMilestone ? (
                          <DiamondIcon
                            className="size-7"
                            style={{ color: it.color ?? lane.color }}
                            fill={`${it.color ?? lane.color}33`}
                          />
                        ) : (
                          <span
                            className="block h-10 rounded-md px-2.5 text-[11px] font-semibold text-white truncate leading-10 shadow-sm"
                            style={{ background: it.color ?? lane.color, width }}
                            title={it.title}
                          >
                            {it.title}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {editMode && selectedId && (
        <div className="p-4 border-t bg-white shrink-0">
          {items
            .filter((i) => i.id === selectedId)
            .map((it) => (
              <div key={it.id} className="flex flex-wrap gap-3 items-end max-w-2xl">
                <label className="flex-1 min-w-[200px] text-sm">
                  <span className="text-xs text-muted-foreground">Title</span>
                  <input
                    className="w-full border rounded-md px-2 py-1.5 mt-1"
                    value={it.title}
                    onChange={(e) =>
                      update({
                        ...data,
                        items: items.map((x) =>
                          x.id === it.id ? { ...x, title: e.target.value } : x,
                        ),
                      })
                    }
                  />
                </label>
                <label className="text-sm">
                  <span className="text-xs text-muted-foreground">Lane</span>
                  <select
                    className="block border rounded-md px-2 py-1.5 mt-1"
                    value={it.laneId}
                    onChange={(e) =>
                      update({
                        ...data,
                        items: items.map((x) =>
                          x.id === it.id ? { ...x, laneId: e.target.value } : x,
                        ),
                      })
                    }
                  >
                    {lanes.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm w-20">
                  <span className="text-xs text-muted-foreground">Start Q</span>
                  <input
                    type="number"
                    min={0}
                    max={quarters.length - 1}
                    className="w-full border rounded-md px-2 py-1.5 mt-1"
                    value={it.startQuarter}
                    onChange={(e) =>
                      update({
                        ...data,
                        items: items.map((x) =>
                          x.id === it.id
                            ? { ...x, startQuarter: Number(e.target.value) }
                            : x,
                        ),
                      })
                    }
                  />
                </label>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
