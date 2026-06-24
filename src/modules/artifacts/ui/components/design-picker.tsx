"use client";

import type { DesignVariant } from "@/types/artifacts";
import { ConnectorEmbed } from "./connector-embed";
import { cn } from "@/lib/utils";

interface DesignPickerProps {
  variants: DesignVariant[];
  selectedId?: string;
  useConnector: boolean;
  connectorEmbedUrl?: string | null;
  connectorExternalUrl?: string | null;
  onSelect: (id: string, variant: DesignVariant) => void;
}

export function DesignPicker({
  variants,
  selectedId,
  useConnector,
  connectorEmbedUrl,
  connectorExternalUrl,
  onSelect,
}: DesignPickerProps) {
  const selected =
    variants.find((v) => v.id === selectedId) ?? variants[0];

  if (useConnector && selected?.figmaEmbedUrl) {
    return (
      <ConnectorEmbed
        provider="FIGMA"
        embedUrl={connectorEmbedUrl ?? selected.figmaEmbedUrl}
        externalUrl={connectorExternalUrl ?? selected.figmaExternalUrl}
        title={selected.name}
      />
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-100">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 border-b bg-white shrink-0">
        {variants.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id, v)}
            className={cn(
              "rounded-xl border p-3 text-left transition-all hover:border-primary hover:shadow-sm",
              selectedId === v.id && "ring-2 ring-primary border-primary",
            )}
          >
            {v.previewImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={v.previewImageUrl}
                alt={v.name}
                className="w-full aspect-[800/520] object-cover rounded-lg mb-2 border"
              />
            ) : (
              <div className="flex gap-1 mb-3">
                {(v.previewColors ?? ["#333"]).map((c) => (
                  <div key={c} className="h-8 flex-1 rounded" style={{ background: c }} />
                ))}
              </div>
            )}
            <p className="font-semibold text-sm">{v.name}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</p>
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-6 overflow-auto">
        <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">
          App preview — recommended vision
        </p>
        {selected?.previewImageUrl ? (
          <div className="flex-1 flex items-start justify-center">
            <div className="w-full max-w-5xl rounded-xl border bg-white shadow-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.previewImageUrl}
                alt={`${selected.name} app mockup`}
                className="w-full h-auto"
              />
            </div>
          </div>
        ) : selected ? (
          <div className="w-full max-w-4xl mx-auto aspect-video bg-white rounded-xl shadow-2xl border overflow-hidden flex flex-col">
            <div className="h-9 bg-zinc-800 flex items-center px-3 gap-1.5">
              <div className="size-2.5 rounded-full bg-red-400" />
              <div className="size-2.5 rounded-full bg-yellow-400" />
              <div className="size-2.5 rounded-full bg-green-400" />
            </div>
            <div
              className="flex-1 p-8"
              style={{
                background: `linear-gradient(135deg, ${selected.previewColors?.[0] ?? "#111"}, ${selected.previewColors?.[1] ?? "#333"})`,
              }}
            >
              <h2 className="text-2xl font-bold text-white">{selected.name}</h2>
              <p className="text-white/80 mt-2 max-w-lg">{selected.description}</p>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">No design preview available</p>
        )}
        {selected?.description && (
          <p className="text-sm text-gray-600 mt-4 max-w-3xl mx-auto text-center">
            {selected.description}
          </p>
        )}
      </div>
    </div>
  );
}
