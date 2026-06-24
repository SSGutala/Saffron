import type { ArtifactContent } from "@/types/artifacts";

export type ConnectorProviderId =
  | "FIGMA"
  | "GOOGLE_DOCS"
  | "GOOGLE_SHEETS"
  | "GOOGLE_SLIDES"
  | "LUCIDCHART"
  | "MIRO"
  | "MICROSOFT_WORD"
  | "MICROSOFT_EXCEL"
  | "MICROSOFT_POWERPOINT"
  | "JIRA"
  | "CONFLUENCE"
  | "ATLASSIAN"
  | "ASANA"
  | "MONDAY"
  | "CLICKUP"
  | "NOTION"
  | "AIRTABLE"
  | "TRELLO"
  | "LINEAR";

export type ConnectorCatalogEntry = {
  id: ConnectorProviderId;
  label: string;
  icon: string;
  category: "documents" | "spreadsheets" | "presentations" | "design" | "diagrams" | "pm";
  kinds: string[];
};

export const CONNECTOR_CATALOG: ConnectorCatalogEntry[] = [
  { id: "GOOGLE_DOCS", label: "Google Docs", icon: "📝", category: "documents", kinds: ["DOCUMENT", "ROADMAP"] },
  { id: "MICROSOFT_WORD", label: "Microsoft Word", icon: "📄", category: "documents", kinds: ["DOCUMENT", "ROADMAP"] },
  { id: "GOOGLE_SHEETS", label: "Google Sheets", icon: "📊", category: "spreadsheets", kinds: ["SPREADSHEET"] },
  { id: "MICROSOFT_EXCEL", label: "Microsoft Excel", icon: "📗", category: "spreadsheets", kinds: ["SPREADSHEET"] },
  { id: "GOOGLE_SLIDES", label: "Google Slides", icon: "📽️", category: "presentations", kinds: ["PRESENTATION"] },
  { id: "MICROSOFT_POWERPOINT", label: "PowerPoint", icon: "🎯", category: "presentations", kinds: ["PRESENTATION"] },
  { id: "FIGMA", label: "Figma", icon: "🎨", category: "design", kinds: ["DESIGN"] },
  { id: "LUCIDCHART", label: "Lucidchart", icon: "🔀", category: "diagrams", kinds: ["DIAGRAM", "ROADMAP"] },
  { id: "MIRO", label: "Miro", icon: "🗺️", category: "diagrams", kinds: ["DIAGRAM", "ROADMAP"] },
  { id: "JIRA", label: "Jira", icon: "🔷", category: "pm", kinds: ["ROADMAP", "DOCUMENT", "*"] },
  { id: "CONFLUENCE", label: "Confluence", icon: "📘", category: "pm", kinds: ["DOCUMENT", "ROADMAP"] },
  { id: "ATLASSIAN", label: "Atlassian", icon: "♟️", category: "pm", kinds: ["*"] },
  { id: "ASANA", label: "Asana", icon: "✓", category: "pm", kinds: ["ROADMAP", "DOCUMENT"] },
  { id: "MONDAY", label: "Monday.com", icon: "📅", category: "pm", kinds: ["ROADMAP", "SPREADSHEET"] },
  { id: "CLICKUP", label: "ClickUp", icon: "⬆️", category: "pm", kinds: ["ROADMAP", "DOCUMENT"] },
  { id: "NOTION", label: "Notion", icon: "📓", category: "pm", kinds: ["DOCUMENT", "ROADMAP"] },
  { id: "AIRTABLE", label: "Airtable", icon: "🗃️", category: "pm", kinds: ["SPREADSHEET", "ROADMAP"] },
  { id: "TRELLO", label: "Trello", icon: "📋", category: "pm", kinds: ["ROADMAP", "DIAGRAM"] },
  { id: "LINEAR", label: "Linear", icon: "◇", category: "pm", kinds: ["ROADMAP"] },
];

export type ConnectorFileMeta = {
  externalId: string;
  embedUrl: string;
  openUrl: string;
  accountLabel?: string;
};

export type ConnectorAdapter = {
  id: ConnectorProviderId;
  label: string;
  oauthAuthorizeUrl: (state: string, redirectUri: string) => string;
  createFromArtifact: (params: {
    accessToken: string;
    title: string;
    content: ArtifactContent;
    artifactKind: string;
  }) => Promise<ConnectorFileMeta>;
  openExisting: (params: {
    accessToken: string;
    externalId: string;
  }) => Promise<ConnectorFileMeta>;
};

export function suggestedProviderForKind(kind: string): ConnectorProviderId | null {
  const match = CONNECTOR_CATALOG.find((c) => c.kinds.includes(kind));
  return match?.id ?? "GOOGLE_DOCS";
}
