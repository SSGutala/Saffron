import { generateExports } from "@/lib/artifacts/export";
import type { ArtifactKind, ConnectorProvider } from "@/generated/prisma";
import type { ArtifactContent } from "@/types/artifacts";

export function connectorProviderForKind(kind: ArtifactKind): ConnectorProvider {
  switch (kind) {
    case "DIAGRAM":
      return "LUCIDCHART";
    case "SPREADSHEET":
      return "GOOGLE_SHEETS";
    case "PRESENTATION":
      return "GOOGLE_SLIDES";
    case "DESIGN":
      return "FIGMA";
    default:
      return "GOOGLE_DOCS";
  }
}

export function exportFormatsForKind(kind: ArtifactKind): string[] {
  switch (kind) {
    case "SPREADSHEET":
      return ["pdf", "xlsx", "md"];
    case "PRESENTATION":
      return ["pdf", "md"];
    case "DIAGRAM":
      return ["pdf", "md"];
    default:
      return ["pdf", "docx", "md"];
  }
}

export function handedOffContent(title: string): string {
  return JSON.stringify({
    handedOff: true,
    title,
    handedOffAt: new Date().toISOString(),
  });
}

export async function prepareConnectorHandoff({
  kind,
  content,
  title,
}: {
  kind: ArtifactKind;
  content: ArtifactContent;
  title: string;
}) {
  const fileUrls = await generateExports(
    content,
    title,
    exportFormatsForKind(kind),
  );

  return {
    provider: connectorProviderForKind(kind),
    fileUrls,
  };
}
