import type { ArtifactContent } from "@/types/artifacts";
import type { ConnectorAdapter, ConnectorFileMeta, ConnectorProviderId } from "./types";

function stubAdapter(
  id: ConnectorProviderId,
  label: string,
  demoPath: string,
): ConnectorAdapter {
  return {
    id,
    label,
    oauthAuthorizeUrl: (state, redirectUri) => {
      const base = process.env[`${id}_OAUTH_BASE`] ?? "";
      if (!base) return "";
      return `${base}?state=${encodeURIComponent(state)}&redirect_uri=${encodeURIComponent(redirectUri)}`;
    },
    async createFromArtifact({ title }) {
      const slug = title.toLowerCase().replace(/\s+/g, "-").slice(0, 32);
      return {
        externalId: `demo-${slug}-${Date.now()}`,
        embedUrl: `${demoPath}/embed/${slug}`,
        openUrl: `${demoPath}/${slug}`,
        accountLabel: "Connected account",
      };
    },
    async openExisting({ externalId }) {
      return {
        externalId,
        embedUrl: `${demoPath}/embed/${externalId}`,
        openUrl: `${demoPath}/${externalId}`,
      };
    },
  };
}

const STUB_PATHS: Record<string, [string, string]> = {
  FIGMA: ["Figma", "https://www.figma.com/file"],
  GOOGLE_DOCS: ["Google Docs", "https://docs.google.com/document/d"],
  GOOGLE_SHEETS: ["Google Sheets", "https://docs.google.com/spreadsheets/d"],
  GOOGLE_SLIDES: ["Google Slides", "https://docs.google.com/presentation/d"],
  LUCIDCHART: ["Lucidchart", "https://lucid.app/documents"],
  MIRO: ["Miro", "https://miro.com/app/board"],
  MICROSOFT_WORD: ["Microsoft Word", "https://word.office.com"],
  MICROSOFT_EXCEL: ["Microsoft Excel", "https://excel.office.com"],
  MICROSOFT_POWERPOINT: ["PowerPoint", "https://powerpoint.office.com"],
  JIRA: ["Jira", "https://your-domain.atlassian.net/browse"],
  CONFLUENCE: ["Confluence", "https://your-domain.atlassian.net/wiki"],
  ATLASSIAN: ["Atlassian", "https://your-domain.atlassian.net"],
  ASANA: ["Asana", "https://app.asana.com/0"],
  MONDAY: ["Monday.com", "https://monday.com/boards"],
  CLICKUP: ["ClickUp", "https://app.clickup.com"],
  NOTION: ["Notion", "https://www.notion.so"],
  AIRTABLE: ["Airtable", "https://airtable.com"],
  TRELLO: ["Trello", "https://trello.com/b"],
  LINEAR: ["Linear", "https://linear.app/team/issue"],
};

const ADAPTERS = Object.fromEntries(
  Object.entries(STUB_PATHS).map(([id, [label, path]]) => [
    id,
    stubAdapter(id as ConnectorProviderId, label, path),
  ]),
) as Record<ConnectorProviderId, ConnectorAdapter>;

export function getConnectorAdapter(id: ConnectorProviderId): ConnectorAdapter {
  return ADAPTERS[id];
}

export async function connectArtifactToProvider(params: {
  provider: ConnectorProviderId;
  accessToken: string;
  title: string;
  content: ArtifactContent;
  artifactKind: string;
  existingExternalId?: string | null;
}): Promise<ConnectorFileMeta> {
  const adapter = getConnectorAdapter(params.provider);
  if (params.existingExternalId) {
    return adapter.openExisting({
      accessToken: params.accessToken,
      externalId: params.existingExternalId,
    });
  }
  return adapter.createFromArtifact({
    accessToken: params.accessToken,
    title: params.title,
    content: params.content,
    artifactKind: params.artifactKind,
  });
}
