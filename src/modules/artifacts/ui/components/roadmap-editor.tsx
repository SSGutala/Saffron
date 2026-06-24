"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import type { RoadmapData, RoadmapItem, RoadmapLane } from "@/types/artifacts";

const DEFAULT_LANES: RoadmapLane[] = [
  { id: "product", label: "Product", color: "#c96342" },
  { id: "design", label: "Design", color: "#8b5cf6" },
  { id: "engineering", label: "Engineering", color: "#0ea5e9" },
  { id: "marketing", label: "Marketing", color: "#22c55e" },
];

const DEFAULT_QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

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

  const addItem = () => {
    const item: RoadmapItem = {
      id: `rm-${Date.now()}`,
      title: "New initiative",
      laneId: lanes[0]?.id ?? "product",
      startQuarter: 0,
      spanQuarters: 1,
      type: "bar",
      color: lanes[0]?.color,
    };
    update({ ...data, lanes, quarters, items: [...items, item] });
    setSelectedId(item.id);
  };

  const cellWidth = 120;
  const laneHeight = 72;

  return (
    <div className="h-full flex flex-col overflow-auto bg-background p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-semibold">{data.title ?? "Product Roadmap"}</h2>
          <p className="text-xs text-muted-foreground">Gantt-style timeline · swimlanes · milestones</p>
        </div>
        {editMode && (
          <Button size="sm" onClick={addItem}>
            Add initiative
          </Button>
        )}
      </div>

      <div className="border rounded-xl overflow-auto">
        <div className="flex border-b bg-muted/40 sticky top-0 z-10">
          <div className="w-36 shrink-0 p-3 text-xs font-semibold border-r">Lane</div>
          {quarters.map((q) => (
            <div
              key={q}
              className="shrink-0 p-3 text-xs font-semibold text-center border-r"
              style={{ width: cellWidth }}
            >
              {q}
            </div>
          ))}
        </div>

        {lanes.map((lane) => (
          <div key={lane.id} className="flex border-b last:border-b-0" style={{ minHeight: laneHeight }}>
            <div className="w-36 shrink-0 p-3 border-r flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: lane.color }} />
              <span className="text-sm font-medium">{lane.label}</span>
            </div>
            <div className="relative flex" style={{ width: quarters.length * cellWidth }}>
              {quarters.map((q) => (
                <div key={q} className="border-r h-full" style={{ width: cellWidth }} />
              ))}
              {items
                .filter((it) => it.laneId === lane.id)
                .map((it) => {
                  const left = it.startQuarter * cellWidth + 8;
                  const width = Math.max(it.spanQuarters * cellWidth - 16, 48);
                  const isMilestone = it.type === "milestone";
                  return (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => editMode && setSelectedId(it.id)}
                      className={`absolute top-1/2 -translate-y-1/2 text-left transition-shadow ${
                        selectedId === it.id ? "ring-2 ring-primary" : ""
                      }`}
                      style={{
                        left,
                        width: isMilestone ? 24 : width,
                        height: isMilestone ? 24 : 36,
                      }}
                    >
                      {isMilestone ? (
                        <span
                          className="block size-6 rotate-45 border-2 mx-auto"
                          style={{ borderColor: it.color ?? lane.color, background: `${it.color ?? lane.color}33` }}
                          title={it.title}
                        />
                      ) : (
                        <span
                          className="block h-9 rounded-lg px-2 text-[10px] font-medium text-white truncate leading-9 shadow-sm"
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

      {editMode && selectedId && (
        <div className="mt-4 p-3 border rounded-lg space-y-2 max-w-md">
          {items
            .filter((i) => i.id === selectedId)
            .map((it) => (
              <div key={it.id} className="space-y-2">
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
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
                <select
                  className="w-full border rounded px-2 py-1 text-sm"
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
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
