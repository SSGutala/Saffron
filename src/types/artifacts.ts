export type SectionDoc = {
  key: string;
  title: string;
  body?: string;
  bullets?: string[];
  table?: { columns: string[]; rows: string[][] };
};

export type ArtifactContent = {
  documentType?: string;
  label?: string;
  format?: "formal_doc" | "spreadsheet" | "diagram" | "presentation" | "mockup";
  depthMode?: string;
  meta?: {
    title?: string;
    owner?: string;
    date?: string;
    project?: string;
    version?: string;
  };
  sections?: SectionDoc[];
  nativeHtml?: string;
  diagramGraph?: {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
  };
  spreadsheetData?: {
    sheets: SpreadsheetSheet[];
  };
  slides?: PresentationSlide[];
  designVariants?: DesignVariant[];
  selectedDesignId?: string;
  roadmapData?: RoadmapData;
};

export type DiagramNode = {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: { label: string; lane?: string };
};

export type DiagramEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
};

export type SpreadsheetSheet = {
  name: string;
  columns: string[];
  rows: (string | number)[][];
  charts?: { type: string; title: string; range: string }[];
};

export type PresentationSlide = {
  id: string;
  title: string;
  bullets: string[];
  notes?: string;
};

export type DesignVariant = {
  id: string;
  name: string;
  description?: string;
  figmaEmbedUrl?: string;
  figmaExternalUrl?: string;
  previewColors?: string[];
  previewImageUrl?: string;
};

export type RoadmapLane = {
  id: string;
  label: string;
  color: string;
};

export type RoadmapItem = {
  id: string;
  title: string;
  laneId: string;
  startQuarter: number;
  spanQuarters: number;
  type: "bar" | "milestone";
  color?: string;
};

export type RoadmapData = {
  title?: string;
  quarters?: string[];
  lanes?: RoadmapLane[];
  items?: RoadmapItem[];
};

export type FileUrls = Partial<
  Record<"pdf" | "docx" | "xlsx" | "csv" | "pptx" | "md" | "png" | "svg", string>
>;

export const CONNECTOR_META = {
  NATIVE: { label: "Chai Editor", icon: "✏️" },
  FIGMA: { label: "Figma", icon: "🎨", expandLabel: "Open in Figma" },
  GOOGLE_DOCS: { label: "Google Docs", icon: "📝", expandLabel: "Open in Google Docs" },
  GOOGLE_SHEETS: { label: "Google Sheets", icon: "📊", expandLabel: "Open in Google Sheets" },
  GOOGLE_SLIDES: { label: "Google Slides", icon: "📽️", expandLabel: "Open in Google Slides" },
  LUCIDCHART: { label: "Lucidchart", icon: "🔀", expandLabel: "Open in Lucidchart" },
  MIRO: { label: "Miro", icon: "🗺️", expandLabel: "Open in Miro" },
} as const;
