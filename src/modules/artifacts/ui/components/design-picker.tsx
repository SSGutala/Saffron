"use client";

import type { DesignVariant } from "@/types/artifacts";
import { cn } from "@/lib/utils";

interface DesignPickerProps {
  variants: DesignVariant[];
  selectedId?: string;
  onSelect: (id: string, variant: DesignVariant) => void;
}

export function DesignPicker({
  variants,
  selectedId,
  onSelect,
}: DesignPickerProps) {
  const selected =
    variants.find((v) => v.id === selectedId) ?? variants[0];

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-3 gap-3 p-4 border-b shrink-0">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id, v)}
            className={cn(
              "rounded-xl border p-4 text-left transition-all hover:border-primary",
              selectedId === v.id && "ring-2 ring-primary border-primary",
            )}
          >
            <div className="flex gap-1 mb-3">
              {(v.previewColors ?? ["#333"]).map((c) => (
                <div
                  key={c}
                  className="h-8 flex-1 rounded"
                  style={{ background: c }}
                />
              ))}
            </div>
            <p className="font-semibold text-sm">{v.name}</p>
            <p className="text-xs text-muted-foreground mt-1">{v.description}</p>
          </button>
        ))}
      </div>
      <div className="flex-1 min-h-0 bg-zinc-100 flex items-center justify-center p-8">
        {selected ? (
          <div className="w-full max-w-4xl aspect-video bg-white rounded-xl shadow-2xl border overflow-hidden flex flex-col">
            <div className="h-8 bg-zinc-800 flex items-center px-3 gap-1.5">
              <div className="size-2 rounded-full bg-red-400" />
              <div className="size-2 rounded-full bg-yellow-400" />
              <div className="size-2 rounded-full bg-green-400" />
            </div>
            <div
              className="flex-1 p-8"
              style={{
                background: `linear-gradient(135deg, ${selected.previewColors?.[0] ?? "#111"}, ${selected.previewColors?.[1] ?? "#333"})`,
              }}
            >
              <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
              <p className="text-white/80 mt-2">{selected.description}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">No design variants</p>
        )}
      </div>
    </div>
  );
}
