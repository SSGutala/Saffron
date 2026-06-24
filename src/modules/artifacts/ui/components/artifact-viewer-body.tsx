"use client";

import type { ArtifactContent, DesignVariant, FileUrls } from "@/types/artifacts";
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
  useConnector: boolean;
  onChange: (content: ArtifactContent) => void;
  editMode: boolean;
}

export function ArtifactViewerBody({
  kind,
  content,
  connectorProvider,
  connectorEmbedUrl,
  connectorExternalUrl,
  useConnector,
  onChange,
  editMode,
}: ArtifactViewerBodyProps) {
  if (kind === "DOCUMENT") {
    if (useConnector && connectorProvider === "GOOGLE_DOCS") {
      return (
        <ConnectorEmbed
          provider="GOOGLE_DOCS"
          embedUrl={connectorEmbedUrl ?? "https://docs.google.com/document/d/demo/preview"}
          externalUrl={connectorExternalUrl ?? "https://docs.google.com"}
        >
          <SectionDocView content={content} />
        </ConnectorEmbed>
      );
    }
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
    if (useConnector && connectorProvider === "LUCIDCHART") {
      return (
        <ConnectorEmbed
          provider="LUCIDCHART"
          embedUrl={
            connectorEmbedUrl ??
            "https://lucid.app/embeds/demo"
          }
          externalUrl={connectorExternalUrl ?? "https://lucidchart.com"}
        >
          <DiagramEditor
            graph={graph}
            onChange={(diagramGraph) => onChange({ ...content, diagramGraph })}
          />
        </ConnectorEmbed>
      );
    }
    if (editMode) {
      return (
        <DiagramEditor
          graph={graph}
          onChange={(diagramGraph) => onChange({ ...content, diagramGraph })}
        />
      );
    }
    return (
      <DiagramEditor
        graph={graph}
        onChange={(diagramGraph) => onChange({ ...content, diagramGraph })}
      />
    );
  }

  if (kind === "SPREADSHEET") {
    const sheets = content.spreadsheetData?.sheets ?? [];
    if (useConnector && connectorProvider === "GOOGLE_SHEETS") {
      return (
        <ConnectorEmbed
          provider="GOOGLE_SHEETS"
          embedUrl={
            connectorEmbedUrl ??
            "https://docs.google.com/spreadsheets/d/demo/preview"
          }
          externalUrl={connectorExternalUrl ?? "https://sheets.google.com"}
        >
          <SpreadsheetEditor
            sheets={sheets}
            onChange={(s) =>
              onChange({ ...content, spreadsheetData: { sheets: s } })
            }
          />
        </ConnectorEmbed>
      );
    }
    if (editMode) {
      return (
        <SpreadsheetEditor
          sheets={sheets}
          onChange={(s) =>
            onChange({ ...content, spreadsheetData: { sheets: s } })
          }
        />
      );
    }
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
    if (useConnector && connectorProvider === "GOOGLE_SLIDES") {
      return (
        <ConnectorEmbed
          provider="GOOGLE_SLIDES"
          embedUrl={
            connectorEmbedUrl ??
            "https://docs.google.com/presentation/d/demo/preview"
          }
          externalUrl={connectorExternalUrl ?? "https://slides.google.com"}
        >
          <SlideEditor slides={slides} onChange={(s) => onChange({ ...content, slides: s })} />
        </ConnectorEmbed>
      );
    }
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
        useConnector={useConnector}
        connectorEmbedUrl={connectorEmbedUrl}
        connectorExternalUrl={connectorExternalUrl}
        onSelect={(id: string, variant: DesignVariant) =>
          onChange({
            ...content,
            selectedDesignId: id,
            designVariants: content.designVariants,
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

export function parseFileUrls(raw?: string | null): FileUrls {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as FileUrls;
  } catch {
    return {};
  }
}
