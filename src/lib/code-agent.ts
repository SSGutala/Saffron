import {
  generateAppFiles,
  generateResponse,
  generateTitle,
} from "./ai";
import { withAutofix, friendlyMessage } from "./autofix";
import prisma from "./prisma";
import { FileCollection } from "@/types";

type ChosenStyleInput = {
  id: string;
  label: string;
  direction: string;
  vibe?: string;
  previewImageUrl?: string;
  previewCode?: string;
  opinion?: string;
  selectedIds?: string[];
};

export async function runCodeAgent({
  value,
  projectId,
  chosenStyle,
  briefJson,
  isRepair,
  errorText,
}: {
  value: string;
  projectId: string;
  chosenStyle?: ChosenStyleInput;
  briefJson?: string;
  isRepair?: boolean;
  errorText?: string;
}) {
  const result = await withAutofix(
    { kind: isRepair ? "app_runtime" : "app_build", operation: "runCodeAgent", projectId },
    async () => {
      await prisma.project.update({
        where: { id: projectId },
        data: { lifecycleState: "BUILDING", updatedAt: new Date() },
      });

      const messages = await prisma.message.findMany({
        where: { projectId },
        orderBy: { createdAt: "asc" },
        include: { fragment: true },
      });

      const history = messages.map((m) => ({
        role: m.role === "USER" ? "user" : "assistant",
        content: m.content,
      }));

      const latestFragment = [...messages]
        .reverse()
        .find((m) => m.fragment)?.fragment;

      let existingFiles: FileCollection = {};
      if (latestFragment?.files) {
        try {
          existingFiles = JSON.parse(latestFragment.files) as FileCollection;
        } catch {
          existingFiles = {};
        }
      }

      const styleDirective = chosenStyle
        ? `\n\nDESIGN DIRECTION (user selected: "${chosenStyle.label}"): ${chosenStyle.direction}. ${
            chosenStyle.previewImageUrl
              ? `Match the static mockup visual style (colors, layout density, mood).`
              : ""
          } ${chosenStyle.opinion ? `User feedback: ${chosenStyle.opinion}` : ""}`
        : "";

      const briefDirective = briefJson
        ? `\n\nPRODUCT CONTEXT FROM BRIEF:\n${briefJson.slice(0, 8000)}`
        : "";

      const repairDirective = isRepair && errorText
        ? `\n\nFIX THESE ERRORS IN THE EXISTING CODE:\n${errorText.slice(0, 4000)}`
        : "";

      const enrichedPrompt = `${value}${styleDirective}${briefDirective}${repairDirective}`;

      const { files, summary } = await generateAppFiles({
        prompt: enrichedPrompt,
        existingFiles:
          Object.keys(existingFiles).length > 0 ? existingFiles : undefined,
        history: history.slice(-8),
      });

      if (!files || Object.keys(files).length === 0) {
        throw new Error("No files generated");
      }

      const [title, response] = await Promise.all([
        generateTitle(summary),
        generateResponse(summary),
      ]);

      await prisma.message.create({
        data: {
          projectId,
          content: isRepair
            ? "Fixed the preview errors — here's the updated app."
            : response,
          role: "ASSISTANT",
          type: "RESULT",
          fragment: {
            create: {
              sandboxUrl: "sandpack",
              title,
              files: JSON.stringify(files),
            },
          },
        },
      });

      await prisma.project.update({
        where: { id: projectId },
        data: { updatedAt: new Date(), lifecycleState: "APP_READY" },
      });

      return { title, files };
    },
  );

  if (!result.ok) {
    console.error("[code-agent] failed after retries:", result.lastError);
    await prisma.message.create({
      data: {
        projectId,
        content: `${friendlyMessage("app_build", false)} Tap "Fix with AI" to retry.`,
        role: "ASSISTANT",
        type: "ERROR",
        cardType: "autofix_offer",
        metadata: JSON.stringify({
          error: result.lastError instanceof Error ? result.lastError.message : String(result.lastError),
        }),
      },
    });
  }
}

export async function runCodeRepair({
  projectId,
  errorText,
  userNote,
}: {
  projectId: string;
  errorText: string;
  userNote?: string;
}) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return;

  let chosenStyle: ChosenStyleInput | undefined;
  if (project.chosenStyleJson) {
    try {
      chosenStyle = JSON.parse(project.chosenStyleJson) as ChosenStyleInput;
    } catch {
      chosenStyle = undefined;
    }
  }

  await prisma.message.create({
    data: {
      projectId,
      role: "ASSISTANT",
      type: "RESULT",
      content: "Detected a preview error — attempting to fix automatically…",
      cardType: "building",
    },
  });

  return runCodeAgent({
    value: userNote ?? project.sourcePrompt ?? "Fix the app",
    projectId,
    chosenStyle,
    briefJson: project.briefJson ?? undefined,
    isRepair: true,
    errorText,
  });
}
