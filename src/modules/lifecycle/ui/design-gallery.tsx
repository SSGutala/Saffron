"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2Icon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { PromptWithImages } from "@/components/prompt-with-images";
import { Button } from "@/components/ui/button";
import type { InspirationImage, StylePreview } from "@/types/lifecycle";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

interface DesignGalleryProps {
  projectId: string;
  styles: StylePreview[];
  onBuilt?: () => void;
}

export function DesignGallery({ projectId, styles, onBuilt }: DesignGalleryProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [images, setImages] = useState<InspirationImage[]>([]);

  const build = useMutation(
    trpc.lifecycle.buildApp.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.messages.getMany.queryOptions({ projectId }));
        onBuilt?.();
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const regen = useMutation(
    trpc.lifecycle.generateDesigns.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.messages.getMany.queryOptions({ projectId }));
        setSelectedIds([]);
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const canBuild = selectedIds.length > 0 && !build.isPending;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4 my-2 max-w-full">
      <div>
        <h3 className="font-semibold text-sm">Choose your design direction</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Static mockups only — select one or more, add feedback, then build your app.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {styles.map((style) => {
          const selected = selectedIds.includes(style.id);
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => toggle(style.id)}
              className={cn(
                "relative rounded-xl border overflow-hidden text-left transition-all hover:shadow-md",
                selected && "ring-2 ring-primary border-primary",
              )}
            >
              {selected && (
                <span className="absolute top-2 right-2 z-10 bg-primary text-primary-foreground rounded-full p-1">
                  <CheckIcon className="size-3.5" />
                </span>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={style.previewImageUrl}
                alt={`${style.label} mockup`}
                className="w-full aspect-[800/520] object-cover bg-muted"
              />
              <div className="p-3 space-y-1">
                <p className="font-medium text-sm">{style.label}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-2">{style.vibe}</p>
                <div className="flex gap-1 pt-1">
                  {style.previewColors.map((c) => (
                    <span
                      key={c}
                      className="size-3 rounded-full border"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <PromptWithImages
        value={feedback}
        onChange={setFeedback}
        images={images}
        onImagesChange={setImages}
        placeholder="What do you like? Dislike? Want combined? Any design direction notes…"
        minRows={3}
        maxRows={6}
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
              feedback,
              images: images.length ? images : undefined,
            })
          }
        >
          {regen.isPending ? <Loader2Icon className="animate-spin size-4" /> : "Regenerate mockups"}
        </Button>
        <Button
          size="sm"
          className="flex-1"
          disabled={!canBuild}
          onClick={() =>
            build.mutate({
              projectId,
              styleIds: selectedIds,
              opinion: feedback || undefined,
              images: images.length ? images : undefined,
            })
          }
        >
          {build.isPending ? (
            <Loader2Icon className="animate-spin size-4" />
          ) : (
            <>
              <Image src="/logo.svg" alt="" width={14} height={14} className="mr-1" />
              Build app with {selectedIds.length} selected design
              {selectedIds.length !== 1 ? "s" : ""}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
