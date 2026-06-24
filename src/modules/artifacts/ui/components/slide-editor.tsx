"use client";

import { PlusIcon } from "lucide-react";

import type { PresentationSlide } from "@/types/artifacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SlideEditorProps {
  slides: PresentationSlide[];
  onChange: (slides: PresentationSlide[]) => void;
}

export function SlideEditor({ slides, onChange }: SlideEditorProps) {
  const active = slides[0];

  const updateSlide = (id: string, patch: Partial<PresentationSlide>) => {
    onChange(slides.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const addSlide = () => {
    onChange([
      ...slides,
      {
        id: `s-${Date.now()}`,
        title: "New Slide",
        bullets: ["Point one"],
      },
    ]);
  };

  if (!active) return null;

  return (
    <div className="h-full flex bg-[#d24726]">
      <div className="w-48 bg-[#b7472a] text-white p-2 space-y-1 overflow-auto shrink-0">
        <div className="text-xs font-semibold px-2 py-1">Slides</div>
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`w-full text-left text-xs p-2 rounded ${i === 0 ? "bg-white/20" : "hover:bg-white/10"}`}
            onClick={() =>
              onChange([s, ...slides.filter((x) => x.id !== s.id)])
            }
          >
            {i + 1}. {s.title}
          </button>
        ))}
        <Button size="sm" variant="ghost" className="w-full text-white" onClick={addSlide}>
          <PlusIcon className="size-3" /> Add slide
        </Button>
      </div>
      <div className="flex-1 p-8 flex items-center justify-center bg-zinc-300">
        <div className="bg-white shadow-2xl w-full max-w-3xl aspect-video p-10 flex flex-col">
          <Input
            value={active.title}
            onChange={(e) => updateSlide(active.id, { title: e.target.value })}
            className="text-2xl font-bold border-0 shadow-none mb-4"
          />
          <div className="space-y-2 flex-1">
            {active.bullets.map((b, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-lg">•</span>
                <Input
                  value={b}
                  onChange={(e) => {
                    const bullets = [...active.bullets];
                    bullets[i] = e.target.value;
                    updateSlide(active.id, { bullets });
                  }}
                  className="border-0 shadow-none text-lg"
                />
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                updateSlide(active.id, {
                  bullets: [...active.bullets, "New point"],
                })
              }
            >
              Add bullet
            </Button>
          </div>
          <Textarea
            placeholder="Speaker notes..."
            value={active.notes ?? ""}
            onChange={(e) => updateSlide(active.id, { notes: e.target.value })}
            className="mt-4 text-xs text-muted-foreground"
            rows={2}
          />
        </div>
      </div>
    </div>
  );
}
