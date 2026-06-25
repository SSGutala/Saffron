"use client";

import type { ArtifactContent, DesignVariant } from "@/types/artifacts";
import { isArtifactConnected } from "@/types/artifacts";
import { ConnectorEmbed } from "./connector-embed";
import { DiagramEditor } from "./diagram-editor";
import { DesignPicker } from "./design-picker";
import { SlideEditor } from "./slide-editor";
import { SpreadsheetEditor } from "./spreadsheet-editor";
import { WordEditor } from "./word-editor";
import { SectionDocView } from "./section-doc-view";

interface ArtifactViewerBodyProps {
  kind: string;
  content: ArtifactContent;
  connectorProvider: string;
  connectorEmbedUrl?: string | null;
  connectorExternalUrl?: string | null;
  editMode: boolean;
  onChange: (content: ArtifactContent) => void;
}

export function ArtifactViewerBody({
  kind,
  content,
  connectorProvider,
  connectorEmbedUrl,
  connectorExternalUrl,
  editMode,
  onChange,
}: ArtifactViewerBodyProps) {
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
      />
    );
  }

  if (kind === "DOCUMENT") {
    if (editMode) {
      return (
        <WordEditor
          html={content.nativeHtml ?? ""}
          onChange={(nativeHtml) => onChange({ ...content, nativeHtml })}
        />
      );
    }
    return <SectionDocView content={content} />;
  }

  if (kind === "DIAGRAM") {
    const graph = content.diagramGraph ?? { nodes: [], edges: [] };
    return (
      <DiagramEditor
        graph={graph}
        onChange={(diagramGraph) => onChange({ ...content, diagramGraph })}
      />
    );
  }

  if (kind === "SPREADSHEET") {
    const sheets = content.spreadsheetData?.sheets ?? [];
    return (
      <SpreadsheetEditor
        sheets={sheets}
        onChange={(s) =>
          onChange({ ...content, spreadsheetData: { sheets: s } })
        }
      />
    );
  }

  if (kind === "PRESENTATION") {
    const slides = content.slides ?? [];
    if (editMode) {
      return (
        <SlideEditor slides={slides} onChange={(s) => onChange({ ...content, slides: s })} />
      );
    }
    return (
      <SlideEditor slides={slides} onChange={(s) => onChange({ ...content, slides: s })} />
    );
  }

  if (kind === "DESIGN") {
    return (
      <DesignPicker
        variants={content.designVariants ?? []}
        selectedId={content.selectedDesignId}
        onSelect={(id) =>
          onChange({
            ...content,
            selectedDesignId: id,
          })
        }
      />
    );
  }

  return <SectionDocView content={content} />;
}

export function downloadFileUrl(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
}

export function parseFileUrls(raw?: string | null): import("@/types/artifacts").FileUrls {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as import("@/types/artifacts").FileUrls;
  } catch {
    return {};
  }
}
