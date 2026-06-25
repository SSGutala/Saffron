import prisma from "@/lib/prisma";
import {
  generateEnterpriseBrief,
  normalizeBriefJson,
} from "./brief-pipeline";
import { createLifecycleArtifactsFromBrief } from "./create-artifacts";
import { generateStylePreviews } from "./style-previews";
import type { BriefJson, InspirationImage } from "@/types/lifecycle";

export { createLifecycleArtifactsFromBrief };

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
    const brief = normalizeBriefJson(await generateEnterpriseBrief(prompt, images));
    const appSpec = (brief.app_spec ?? brief.appSpec) as { appTitle?: string } | undefined;
    const appTitle = appSpec?.appTitle ?? "Product";

    await prisma.project.update({
      where: { id: projectId },
      data: {
        briefJson: JSON.stringify(brief),
        lifecycleState: "BRIEF_READY",
        sourcePrompt: prompt,
        inspirationImages: images?.length ? JSON.stringify(images) : undefined,
      },
    });

    const { artifactIds } = await createLifecycleArtifactsFromBrief({
      projectId,
      userId,
      brief,
      prompt,
    });

    if (Object.keys(artifactIds).length === 0) {
      throw new Error("Brief had no lifecycle sections — could not create files");
    }

    await prisma.message.create({
      data: {
        projectId,
        role: "ASSISTANT",
        type: "RESULT",
        content:
          "Your product files are ready in the Files tab. Review and approve each document there — when they're all approved, ask me to generate design directions.",
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

  await prisma.message.create({
    data: {
      projectId,
      role: "ASSISTANT",
      type: "RESULT",
      content: "Generating design directions — I'll show them here when they're ready.",
    },
  });

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
      content: "Pick a design direction below — I'll build your full app once you choose one.",
      cardType: "style_choices",
      metadata: JSON.stringify({ styles }),
    },
  });

  return styles;
}
