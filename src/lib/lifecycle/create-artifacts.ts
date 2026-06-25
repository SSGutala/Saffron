import { generateExports } from "@/lib/artifacts/export";
import prisma from "@/lib/prisma";
import { ArtifactKind } from "@/generated/prisma";
import { LIFECYCLE_STAGES } from "@/types/lifecycle";
import type { BriefJson } from "@/types/lifecycle";
import {
  isLegacyArtifactContent,
  normalizeBriefJson,
  resolveAppTitle,
  stageContentToArtifactContent,
} from "./brief-pipeline";

const KIND_MAP: Record<string, ArtifactKind> = {
  DOCUMENT: "DOCUMENT",
  DIAGRAM: "DIAGRAM",
  DESIGN: "DESIGN",
  SPREADSHEET: "SPREADSHEET",
  PRESENTATION: "PRESENTATION",
};

async function upsertStageArtifact({
  projectId,
  userId,
  stage,
  appTitle,
  data,
  prompt,
  existingId,
}: {
  projectId: string;
  userId: string;
  stage: (typeof LIFECYCLE_STAGES)[number];
  appTitle: string;
  data: unknown;
  prompt: string;
  existingId?: string;
}) {
  const content = stageContentToArtifactContent(stage.key, data, appTitle);
  const parsed = JSON.parse(content);
  const title = `${appTitle} — ${stage.label}`;

  let fileUrls = "{}";
  try {
    const urls = await generateExports(parsed, title, ["pdf", "docx", "md"]);
    fileUrls = JSON.stringify(urls);
  } catch (err) {
    console.error(`[lifecycle] export failed for ${stage.key}:`, err);
  }

  const connectorProvider =
    stage.kind === "DIAGRAM"
      ? "LUCIDCHART"
      : stage.kind === "DESIGN"
        ? "FIGMA"
        : stage.kind === "SPREADSHEET"
          ? "GOOGLE_SHEETS"
          : "NATIVE";

  if (existingId) {
    const updated = await prisma.artifact.update({
      where: { id: existingId },
      data: { content, title, fileUrls, connectorProvider },
    });
    return updated.id;
  }

  const artifact = await prisma.artifact.create({
    data: {
      projectId,
      userId,
      kind: KIND_MAP[stage.kind],
      artifactType: stage.key,
      stageKey: stage.key,
      stageOrder: stage.order,
      title,
      content,
      sourcePrompt: prompt,
      connectorProvider,
      fileUrls,
    },
  });
  return artifact.id;
}

export async function createLifecycleArtifactsFromBrief({
  projectId,
  userId,
  brief: rawBrief,
  prompt,
}: {
  projectId: string;
  userId: string;
  brief: BriefJson;
  prompt: string;
}) {
  const brief = normalizeBriefJson(rawBrief);
  const appTitle = resolveAppTitle(brief);

  const artifactIds: Record<string, string> = {};

  for (const stage of LIFECYCLE_STAGES) {
    const data = brief[stage.key];
    if (!data) continue;

    const existing = await prisma.artifact.findFirst({
      where: { projectId, stageKey: stage.key },
    });

    if (existing && !isLegacyArtifactContent(existing.content)) {
      artifactIds[stage.key] = existing.id;
      continue;
    }

    artifactIds[stage.key] = await upsertStageArtifact({
      projectId,
      userId,
      stage,
      appTitle,
      data,
      prompt,
      existingId: existing?.id,
    });
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { briefJson: JSON.stringify(brief) },
  });

  return { artifactIds, appTitle, brief };
}
