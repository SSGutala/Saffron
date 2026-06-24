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
  | "MICROSOFT_POWERPOINT";

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
  /** Create a new file in the user's connected account from a Saffron artifact. */
  createFromArtifact: (params: {
    accessToken: string;
    title: string;
    content: ArtifactContent;
    artifactKind: string;
  }) => Promise<ConnectorFileMeta>;
  /** Open an existing connected file (no duplicate). */
  openExisting: (params: {
    accessToken: string;
    externalId: string;
  }) => Promise<ConnectorFileMeta>;
};

export function suggestedProviderForKind(kind: string): ConnectorProviderId | null {
  switch (kind) {
    case "DOCUMENT":
      return "GOOGLE_DOCS";
    case "SPREADSHEET":
      return "GOOGLE_SHEETS";
    case "PRESENTATION":
      return "GOOGLE_SLIDES";
    case "DIAGRAM":
      return "LUCIDCHART";
    case "DESIGN":
      return "FIGMA";
    case "ROADMAP":
      return "LUCIDCHART";
    default:
      return null;
  }
}
