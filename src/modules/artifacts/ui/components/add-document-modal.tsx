"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";

import { PromptWithImages } from "@/components/prompt-with-images";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import type { Artifact } from "@/generated/prisma";
import type { InspirationImage } from "@/types/lifecycle";
import { useTRPC } from "@/trpc/client";

interface AddDocumentModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (artifact: Artifact) => void;
}

export function AddDocumentModal({
  projectId,
  open,
  onOpenChange,
  onCreated,
}: AddDocumentModalProps) {
  const trpc = useTRPC();
  const [type, setType] = useState("prd");
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<InspirationImage[]>([]);
  const [customName, setCustomName] = useState("");
  const [customMode, setCustomMode] = useState(false);

  const { data: types } = useQuery(trpc.artifacts.listTypes.queryOptions());

  const generate = useMutation(
    trpc.artifacts.generate.mutationOptions({
      onSuccess: (artifact) => {
        setPrompt("");
        setImages([]);
        onCreated(artifact);
      },
    }),
  );

  const submit = () => {
    generate.mutate({
      projectId,
      documentType: customMode ? "custom" : type,
      prompt,
      customName: customMode ? customName : undefined,
      customDescription: customMode ? prompt : undefined,
      images: images.length ? images : undefined,
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Request a new file</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={!customMode ? "default" : "outline"}
              onClick={() => setCustomMode(false)}
            >
              Template
            </Button>
            <Button
              size="sm"
              variant={customMode ? "default" : "outline"}
              onClick={() => setCustomMode(true)}
            >
              Custom type
            </Button>
          </div>

          {customMode ? (
            <Input
              placeholder="Document name (e.g. Vendor Agreement)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-auto">
              {types?.map((t) => (
                <button
                  key={t.documentType}
                  type="button"
                  onClick={() => setType(t.documentType)}
                  className={`text-left text-xs p-2 rounded border ${
                    type === t.documentType
                      ? "border-primary bg-primary/5"
                      : "hover:border-muted-foreground/30"
                  }`}
                >
                  <span className="font-medium">{t.label}</span>
                  <p className="text-muted-foreground mt-0.5 line-clamp-2">{t.purpose}</p>
                </button>
              ))}
            </div>
          )}

          <PromptWithImages
            value={prompt}
            onChange={setPrompt}
            images={images}
            onImagesChange={setImages}
            placeholder="Describe what you need — paste reference images for style or content inspiration…"
            minRows={4}
            maxRows={10}
            disabled={generate.isPending}
          />

          <Button
            className="w-full"
            disabled={!prompt.trim() || generate.isPending}
            onClick={submit}
          >
            {generate.isPending ? (
              <Loader2Icon className="animate-spin size-4" />
            ) : (
              "Generate"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
