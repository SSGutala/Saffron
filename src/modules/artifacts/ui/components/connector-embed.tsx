"use client";

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
  children?: React.ReactNode;
}

export function ConnectorEmbed({
  provider,
  embedUrl,
  externalUrl,
  title,
  children,
}: ConnectorEmbedProps) {
  const meta = CONNECTOR_META[provider];

  if (provider === "NATIVE" || !embedUrl) {
    return <>{children}</>;
  }

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
              <Button size="sm" variant="outline" asChild>
                <a href={externalUrl.replace("https://", "figma://")} rel="noopener noreferrer">
                  <MonitorIcon className="size-3.5" />
                  Desktop
                </a>
              </Button>
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
      <div className="flex-1 min-h-0 bg-white">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allowFullScreen
            title={`${meta.label} embed`}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm p-8 text-center">
            Connect your {meta.label} account to edit here. Use native Chai editor meanwhile.
          </div>
        )}
      </div>
    </div>
  );
}
