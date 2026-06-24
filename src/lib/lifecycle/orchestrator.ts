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
  ROADMAP: "ROADMAP",
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
          current?.lifecycleState === "APP_READY" ||
          current?.lifecycleState === "DESIGNS_READY"
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
          connectorProvider: "NATIVE",
          fileUrls: JSON.stringify(fileUrls),
        },
      });
      artifactIds[stage.key] = artifact.id;
    }

    // Product roadmap as first-class artifact
    const roadmapContent = JSON.stringify({
      documentType: "product_roadmap",
      label: "Product Roadmap",
      format: "roadmap",
      roadmapData: {
        title: `${appTitle} Roadmap`,
        quarters: ["Q1", "Q2", "Q3", "Q4"],
        lanes: [
          { id: "product", label: "Product", color: "#c96342" },
          { id: "design", label: "Design", color: "#8b5cf6" },
          { id: "engineering", label: "Engineering", color: "#0ea5e9" },
        ],
        items: [
          {
            id: "rm-1",
            title: "MVP launch",
            laneId: "product",
            startQuarter: 0,
            spanQuarters: 1,
            type: "milestone",
            color: "#c96342",
          },
          {
            id: "rm-2",
            title: "Core workflow",
            laneId: "engineering",
            startQuarter: 0,
            spanQuarters: 2,
            type: "bar",
            color: "#0ea5e9",
          },
        ],
      },
      sections: [
        {
          key: "roadmap",
          title: "Roadmap summary",
          body: `Visual roadmap for ${appTitle}`,
        },
      ],
    });

    const roadmapArtifact = await prisma.artifact.create({
      data: {
        projectId,
        userId,
        kind: "ROADMAP",
        artifactType: "product_roadmap",
        stageOrder: 8,
        title: `${appTitle} — Product Roadmap`,
        content: roadmapContent,
        sourcePrompt: prompt,
        connectorProvider: "NATIVE",
        fileUrls: JSON.stringify(
          await generateExports(JSON.parse(roadmapContent), `${appTitle} Roadmap`, ["pdf", "md"]),
        ),
      },
    });
    artifactIds.product_roadmap = roadmapArtifact.id;

    await prisma.message.create({
      data: {
        projectId,
        role: "ASSISTANT",
        type: "RESULT",
        content:
          "I've mapped your idea into a full product lifecycle — 7 editable stages plus a visual roadmap. Generating 3 design mockups next…",
        cardType: "lifecycle_brief",
        metadata: JSON.stringify({ brief, artifactIds, appTitle }),
      },
    });

    // Step 2: auto-generate design mockups after docs
    void runDesignGeneration({ projectId, userId });

    return { brief, artifactIds };
  } catch (err) {
    console.error("[lifecycle] runLifecycleBrief failed:", err);
    await prisma.message.create({
      data: {
        projectId,
        role: "ASSISTANT",
        type: "ERROR",
        content:
          "Something went wrong generating your product lifecycle. Saffron will retry — or send another message to continue.",
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

  await prisma.message.create({
    data: {
      projectId,
      role: "ASSISTANT",
      type: "RESULT",
      content: "Creating 3 static design mockups for you to choose from…",
      cardType: "generating_designs",
    },
  });

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
      content:
        "Pick one or more design directions, tell me what you like, then I'll build your app.",
      cardType: "style_choices",
      metadata: JSON.stringify({ styles }),
    },
  });

  return styles;
}
