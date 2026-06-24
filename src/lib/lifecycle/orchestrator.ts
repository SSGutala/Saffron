import { generateExports } from "@/lib/artifacts/export";
import prisma from "@/lib/prisma";
import { getBriefStageData } from "./brief-keys";
import {
  generateEnterpriseBrief,
  stageContentToArtifactContent,
} from "./brief-pipeline";
import { generateStylePreviews } from "./style-previews";
import { LIFECYCLE_STAGES } from "@/types/lifecycle";
import type { BriefJson, InspirationImage } from "@/types/lifecycle";
import { ArtifactKind } from "@/generated/prisma";

const KIND_MAP: Record<string, ArtifactKind> = {
  DOCUMENT: "DOCUMENT",
  DIAGRAM: "DIAGRAM",
  DESIGN: "DESIGN",
  SPREADSHEET: "SPREADSHEET",
  PRESENTATION: "PRESENTATION",
};

export async function runLifecycleBrief({
  projectId,
  userId,
  prompt,
  images,
}: {
  projectId: string;
  userId: string;
  prompt: string;
  images?: InspirationImage[];
}) {
  try {
    const brief = await generateEnterpriseBrief(prompt, images);
    const appTitle =
      (brief.appSpec as { appTitle?: string })?.appTitle ?? "Product";

    const current = await prisma.project.findUnique({ where: { id: projectId } });
    await prisma.project.update({
      where: { id: projectId },
      data: {
        briefJson: JSON.stringify(brief),
        lifecycleState:
          current?.lifecycleState === "BUILDING" ||
          current?.lifecycleState === "APP_READY"
            ? current.lifecycleState
            : "BRIEF_READY",
        sourcePrompt: prompt,
        inspirationImages: images?.length ? JSON.stringify(images) : undefined,
      },
    });

    const artifactIds: Record<string, string> = {};

    for (const stage of LIFECYCLE_STAGES) {
      const data = getBriefStageData(brief, stage.key);
      if (!data) continue;

      const content = stageContentToArtifactContent(stage.key, data);
      const parsed = JSON.parse(content);
      const fileUrls = await generateExports(
        parsed,
        `${appTitle} — ${stage.label}`,
        ["pdf", "docx", "md"],
      );

      const artifact = await prisma.artifact.create({
        data: {
          projectId,
          userId,
          kind: KIND_MAP[stage.kind],
          artifactType: stage.key,
          stageKey: stage.key,
          stageOrder: stage.order,
          title: `${appTitle} — ${stage.label}`,
          content,
          sourcePrompt: prompt,
          connectorProvider:
            stage.kind === "DIAGRAM"
              ? "LUCIDCHART"
              : stage.kind === "DESIGN"
                ? "FIGMA"
                : stage.kind === "SPREADSHEET"
                  ? "GOOGLE_SHEETS"
                  : "NATIVE",
          fileUrls: JSON.stringify(fileUrls),
        },
      });
      artifactIds[stage.key] = artifact.id;
    }

    await prisma.message.create({
      data: {
        projectId,
        role: "ASSISTANT",
        type: "RESULT",
        content:
          "I've mapped your idea into a full product lifecycle — 7 editable stages you can refine before we design and build the app.",
        cardType: "lifecycle_brief",
        metadata: JSON.stringify({ brief, artifactIds, appTitle }),
      },
    });

    return { brief, artifactIds };
  } catch (err) {
    console.error("[lifecycle] runLifecycleBrief failed:", err);
    await prisma.message.create({
      data: {
        projectId,
        role: "ASSISTANT",
        type: "ERROR",
        content:
          "Something went wrong generating your product lifecycle. Please try again or send another message.",
      },
    });
    throw err;
  }
}

export async function runDesignGeneration({
  projectId,
  userId,
  feedback,
  images: newImages,
}: {
  projectId: string;
  userId: string;
  feedback?: string;
  images?: InspirationImage[];
}) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project?.sourcePrompt) throw new Error("Project not found");

  let images: InspirationImage[] = [];
  if (project.inspirationImages) {
    try {
      images = JSON.parse(project.inspirationImages) as InspirationImage[];
    } catch {
      images = [];
    }
  }
  if (newImages?.length) {
    images = [...images, ...newImages].slice(0, 6);
    await prisma.project.update({
      where: { id: projectId },
      data: { inspirationImages: JSON.stringify(images) },
    });
  }

  let brief: BriefJson | undefined;
  if (project.briefJson) {
    try {
      brief = JSON.parse(project.briefJson) as BriefJson;
    } catch {
      brief = undefined;
    }
  }

  const styles = await generateStylePreviews({
    prompt: project.sourcePrompt,
    brief,
    images,
    feedback,
  });

  await prisma.project.update({
    where: { id: projectId },
    data: {
      stylePreviewsJson: JSON.stringify(styles),
      lifecycleState: "DESIGNS_READY",
    },
  });

  await prisma.message.create({
    data: {
      projectId,
      role: "ASSISTANT",
      type: "RESULT",
      content: "Pick a visual direction — I'll use it when building your full app.",
      cardType: "style_choices",
      metadata: JSON.stringify({ styles }),
    },
  });

  return styles;
}
