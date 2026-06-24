import {
  generateAppFiles,
  generateResponse,
  generateTitle,
} from "./ai";
import prisma from "./prisma";
import { FileCollection } from "@/types";

export async function runCodeAgent({
  value,
  projectId,
  chosenStyle,
  briefJson,
}: {
  value: string;
  projectId: string;
  chosenStyle?: { id: string; label: string; direction: string; previewCode?: string; opinion?: string };
  briefJson?: string;
}) {
  try {
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
      ? `\n\nDESIGN DIRECTION (user chose "${chosenStyle.label}"): ${chosenStyle.direction}. ${chosenStyle.opinion ? `User feedback: ${chosenStyle.opinion}` : ""}`
      : "";

    const briefDirective = briefJson
      ? `\n\nPRODUCT CONTEXT FROM BRIEF:\n${briefJson.slice(0, 8000)}`
      : "";

    const enrichedPrompt = `${value}${styleDirective}${briefDirective}`;

    const { files, summary } = await generateAppFiles({
      prompt: enrichedPrompt,
      existingFiles:
        Object.keys(existingFiles).length > 0 ? existingFiles : undefined,
      history: history.slice(-8),
    });

    const [title, response] = await Promise.all([
      generateTitle(summary),
      generateResponse(summary),
    ]);

    if (!files || Object.keys(files).length === 0) {
      await prisma.message.create({
        data: {
          projectId,
          content: "Something went wrong. Please try again.",
          role: "ASSISTANT",
          type: "ERROR",
        },
      });
      return;
    }

    await prisma.message.create({
      data: {
        projectId,
        content: response,
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
  } catch (error) {
    console.error("[code-agent]", error);
    await prisma.message.create({
      data: {
        projectId,
        content:
          error instanceof Error
            ? error.message
            : "Generation failed. Please try again.",
        role: "ASSISTANT",
        type: "ERROR",
      },
    });
  }
}
