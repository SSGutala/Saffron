"use client";

import type { ArtifactContent, DesignVariant, FileUrls } from "@/types/artifacts";
import { resolveEditRoute } from "@/lib/connectors/router";
import { ConnectorEmbed } from "./connector-embed";
import { DiagramEditor } from "./diagram-editor";
import { DesignPicker } from "./design-picker";
import { RoadmapEditor } from "./roadmap-editor";
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
  connectorExternalId?: string | null;
  useConnector: boolean;
  onChange: (content: ArtifactContent) => void;
  editMode: boolean;
  onConnectRequest?: () => void;
}

export function ArtifactViewerBody({
  kind,
  content,
  connectorProvider,
  connectorEmbedUrl,
  connectorExternalUrl,
  connectorExternalId,
  useConnector,
  onChange,
  editMode,
  onConnectRequest,
}: ArtifactViewerBodyProps) {
  const route = resolveEditRoute({
    useConnector,
    connectorProvider,
    connectorEmbedUrl,
    connectorExternalUrl,
    connectorExternalId,
  });

  if (route.mode === "connect_required" && useConnector) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-4">
        <p className="text-sm text-muted-foreground max-w-md">
          Connect your {route.provider.replace(/_/g, " ")} account to edit this file in the real app — embedded inside Saffron.
        </p>
        {onConnectRequest && (
          <button
            type="button"
            className="text-sm text-primary underline"
            onClick={onConnectRequest}
          >
            Connect &amp; create file
          </button>
        )}
        <div className="w-full max-w-2xl opacity-60 pointer-events-none">
          {renderNative(kind, content, onChange, false)}
        </div>
      </div>
    );
  }

  if (route.mode === "embed") {
    return (
      <ConnectorEmbed
        provider={connectorProvider as keyof typeof import("@/types/artifacts").CONNECTOR_META}
        embedUrl={route.embedUrl}
        externalUrl={route.openUrl}
      />
    );
  }

  return renderNative(kind, content, onChange, editMode);
}

function renderNative(
  kind: string,
  content: ArtifactContent,
  onChange: (content: ArtifactContent) => void,
  editMode: boolean,
) {
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

  if (kind === "ROADMAP") {
    return (
      <RoadmapEditor
        data={content.roadmapData ?? { title: content.label }}
        editMode={editMode}
        onChange={(roadmapData) => onChange({ ...content, roadmapData })}
      />
    );
  }

  if (kind === "DIAGRAM") {
    const graph = content.diagramGraph ?? { nodes: [], edges: [] };
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
        useConnector={false}
        connectorEmbedUrl={null}
        connectorExternalUrl={null}
        onSelect={(id: string) =>
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

export function parseFileUrls(raw?: string | null): FileUrls {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as FileUrls;
  } catch {
    return {};
  }
}
