"use client";

import { useEffect, useState } from "react";

import {
  ExternalLinkIcon,
  Maximize2Icon,
  MonitorIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { CONNECTOR_META } from "@/types/artifacts";

type Provider = keyof typeof CONNECTOR_META;

interface ConnectorEmbedProps {
  provider: Provider;
  embedUrl?: string | null;
  externalUrl?: string | null;
  title?: string;
  version?: number;
}

export function ConnectorEmbed({
  provider,
  embedUrl,
  externalUrl,
  title,
  version,
}: ConnectorEmbedProps) {
  const meta = CONNECTOR_META[provider];
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // Periodically refresh the iframe to catch external edits
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-2 p-2 border-b bg-muted/40 shrink-0">
        <span className="text-sm font-medium">
          {meta.icon} {meta.label}
          {title ? ` — ${title}` : ""}
        </span>
        <div className="ml-auto flex gap-1">
          {externalUrl && (
            <>
              <Button size="sm" variant="outline" asChild>
                <a href={externalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLinkIcon className="size-3.5" />
                  Web
                </a>
              </Button>
              {provider === "FIGMA" && (
                <Button size="sm" variant="outline" asChild>
                  <a href={externalUrl.replace("https://", "figma://")} rel="noopener noreferrer">
                    <MonitorIcon className="size-3.5" />
                    Desktop
                  </a>
                </Button>
              )}
            </>
          )}
          {embedUrl && (
            <Button size="sm" variant="outline" asChild>
              <a href={embedUrl} target="_blank" rel="noopener noreferrer">
                <Maximize2Icon className="size-3.5" />
                Expand
              </a>
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 bg-white relative flex flex-col">
        {embedUrl && (
          <div className="p-3 bg-blue-50/50 border-b text-[13px] text-blue-800 shrink-0">
            <strong>Note:</strong> Google may require full manual editing to happen in Google's editor. You can still use Aria to make AI-powered edits here, or open the file directly in Google.
          </div>
        )}
        {embedUrl ? (
          <iframe
            key={`${version}-${tick}`}
            src={embedUrl.includes("?") ? `${embedUrl}&t=${tick}` : `${embedUrl}?t=${tick}`}
            className="w-full flex-1 border-0"
            allowFullScreen
            title={`${meta.label} embed`}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
            Connect your {meta.label} account to edit this file here.
          </div>
        )}
      </div>
    </div>
  );
}
