"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";
import { useState } from "react";

import { PromptWithImages } from "@/components/prompt-with-images";
import { Button } from "@/components/ui/button";
import type { InspirationImage, StylePreview } from "@/types/lifecycle";
import { useTRPC } from "@/trpc/client";
import { StylePreviewSandpack } from "./style-preview-sandpack";

interface StyleCarouselProps {
  projectId: string;
  styles: StylePreview[];
}

export function StyleCarousel({ projectId, styles }: StyleCarouselProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [opinion, setOpinion] = useState("");
  const [images, setImages] = useState<InspirationImage[]>([]);

  const build = useMutation(
    trpc.lifecycle.buildApp.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.projects.getOne.queryOptions({ id: projectId }));
      },
    }),
  );

  const regen = useMutation(trpc.lifecycle.generateDesigns.mutationOptions());

  const active = styles[index];
  if (!active) return null;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4 my-2">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Choose your design direction</h3>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button size="sm" variant="outline" disabled={index >= styles.length - 1} onClick={() => setIndex((i) => i + 1)}>
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {styles.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setIndex(i)}
            className={`flex-1 text-xs p-2 rounded-lg border transition-colors ${
              i === index ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <StylePreviewSandpack style={active} />

      <p className="text-xs text-muted-foreground">{active.vibe}</p>

      <PromptWithImages
        value={opinion}
        onChange={setOpinion}
        images={images}
        onImagesChange={setImages}
        placeholder="Optional: describe tweaks or paste inspiration images (colors, layout, mood…)"
        minRows={2}
        maxRows={5}
        disabled={build.isPending || regen.isPending}
      />

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="outline"
          disabled={regen.isPending}
          onClick={() =>
            regen.mutate({
              projectId,
              feedback: opinion,
              images: images.length ? images : undefined,
            })
          }
        >
          {regen.isPending ? <Loader2Icon className="animate-spin size-4" /> : "Regenerate designs"}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={build.isPending}
          onClick={() =>
            build.mutate({
              projectId,
              styleId: active.id,
              opinion: opinion || undefined,
              images: images.length ? images : undefined,
            })
          }
        >
          {build.isPending ? (
            <Loader2Icon className="animate-spin size-4" />
          ) : (
            `Build with ${active.label}`
          )}
        </Button>
      </div>
    </div>
  );
}
