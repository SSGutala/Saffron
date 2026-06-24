"use client";

import { XIcon } from "lucide-react";
import { useCallback, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

import type { InspirationImage } from "@/types/lifecycle";
import { cn } from "@/lib/utils";

interface PromptWithImagesProps {
  value: string;
  onChange: (value: string) => void;
  images: InspirationImage[];
  onImagesChange: (images: InspirationImage[]) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
  className?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  showHint?: boolean;
}

function readFilesAsImages(files: FileList | File[]): Promise<InspirationImage[]> {
  const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
  return Promise.all(
    list.map(
      (file) =>
        new Promise<InspirationImage>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            resolve({
              id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: file.name || "pasted-image.png",
              dataUrl: String(reader.result),
              mimeType: file.type,
            });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }),
    ),
  );
}

export function PromptWithImages({
  value,
  onChange,
  images,
  onImagesChange,
  placeholder,
  minRows = 2,
  maxRows = 8,
  disabled,
  className,
  onFocus,
  onBlur,
  onKeyDown,
  showHint = false,
}: PromptWithImagesProps) {
  const [dragOver, setDragOver] = useState(false);

  const addImages = useCallback(
    async (files: FileList | File[]) => {
      if (!files.length) return;
      const next = await readFilesAsImages(files);
      onImagesChange([...images, ...next].slice(0, 6));
    },
    [images, onImagesChange],
  );

  const onPaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imageFiles: File[] = [];
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) imageFiles.push(file);
        }
      }
      if (imageFiles.length) {
        e.preventDefault();
        await addImages(imageFiles);
      }
    },
    [addImages],
  );

  const removeImage = (id: string) => {
    onImagesChange(images.filter((img) => img.id !== id));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 px-1">
          {images.map((img) => (
            <div
              key={img.id}
              className="relative group rounded-lg overflow-hidden border bg-muted/30 size-16"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataUrl}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className={cn(
          "relative",
          dragOver && "ring-2 ring-primary/40 rounded-lg",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={async (e) => {
          e.preventDefault();
          setDragOver(false);
          await addImages(e.dataTransfer.files);
        }}
      >
        <TextareaAutosize
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          minRows={minRows}
          maxRows={maxRows}
          disabled={disabled}
          onFocus={onFocus}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className="pt-4 resize-none border-none w-full outline-none bg-transparent text-base"
        />
      </div>
      {showHint && (
        <p className="text-[10px] text-muted-foreground px-1">
          Paste or drag images for design inspiration
        </p>
      )}
    </div>
  );
}
