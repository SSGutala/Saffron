import type { ArtifactContent } from "@/types/artifacts";
import type { ConnectorAdapter, ConnectorFileMeta, ConnectorProviderId } from "./types";

/** Stub adapters — OAuth env vars enable real flows later. */
function stubAdapter(id: ConnectorProviderId, label: string, demoPath: string): ConnectorAdapter {
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

const ADAPTERS: Record<ConnectorProviderId, ConnectorAdapter> = {
  FIGMA: stubAdapter("FIGMA", "Figma", "https://www.figma.com/file"),
  GOOGLE_DOCS: stubAdapter("GOOGLE_DOCS", "Google Docs", "https://docs.google.com/document/d"),
  GOOGLE_SHEETS: stubAdapter("GOOGLE_SHEETS", "Google Sheets", "https://docs.google.com/spreadsheets/d"),
  GOOGLE_SLIDES: stubAdapter("GOOGLE_SLIDES", "Google Slides", "https://docs.google.com/presentation/d"),
  LUCIDCHART: stubAdapter("LUCIDCHART", "Lucidchart", "https://lucid.app/documents"),
  MIRO: stubAdapter("MIRO", "Miro", "https://miro.com/app/board"),
  MICROSOFT_WORD: stubAdapter("MICROSOFT_WORD", "Microsoft Word", "https://word.office.com"),
  MICROSOFT_EXCEL: stubAdapter("MICROSOFT_EXCEL", "Microsoft Excel", "https://excel.office.com"),
  MICROSOFT_POWERPOINT: stubAdapter("MICROSOFT_POWERPOINT", "PowerPoint", "https://powerpoint.office.com"),
};

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
