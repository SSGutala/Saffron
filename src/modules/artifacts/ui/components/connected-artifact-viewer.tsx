"use client";

import type { ArtifactContent } from "@/types/artifacts";
import { isArtifactConnected } from "@/types/artifacts";
import { ConnectorEmbed } from "./connector-embed";
import { NativeDraftPreview } from "./native-draft-preview";

interface ConnectedArtifactViewerProps {
  kind: string;
  content: ArtifactContent;
  connectorProvider: string;
  connectorEmbedUrl?: string | null;
  connectorExternalUrl?: string | null;
  version?: number;
}

/**
 * Connected Artifact Viewer — Aria previews and orchestrates.
 * External applications own editing. No fake Word/Excel/Figma/Lucidchart editors.
 */
export function ConnectedArtifactViewer({
  kind,
  content,
  connectorProvider,
  connectorEmbedUrl,
  connectorExternalUrl,
  version,
}: ConnectedArtifactViewerProps) {
  const connected = isArtifactConnected({
    connectorProvider,
    connectorEmbedUrl,
  });

  if (connected && connectorEmbedUrl) {
    return (
      <ConnectorEmbed
        provider={connectorProvider as keyof typeof import("@/types/artifacts").CONNECTOR_META}
        embedUrl={connectorEmbedUrl}
        externalUrl={connectorExternalUrl}
        title={content.meta?.title}
        version={version}
      />
    );
  }

  return <NativeDraftPreview kind={kind} content={content} />;
}

export function parseFileUrls(raw?: string | null): import("@/types/artifacts").FileUrls {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as import("@/types/artifacts").FileUrls;
  } catch {
    return {};
  }
}

export function downloadFileUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}
