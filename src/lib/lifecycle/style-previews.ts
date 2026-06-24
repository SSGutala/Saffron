import type { BriefJson, InspirationImage, StylePreview } from "@/types/lifecycle";
import { completeChat, hasAIKey } from "@/lib/ai-provider";
import { buildStylePreview, STYLE_PRESETS } from "./mockup-images";

export { STYLE_PRESETS } from "./mockup-images";

async function refineMockupDescription(
  preset: (typeof STYLE_PRESETS)[number],
  prompt: string,
  brief?: BriefJson,
  feedback?: string,
): Promise<string | undefined> {
  if (!hasAIKey()) return undefined;
  try {
    return await completeChat({
      system:
        "Describe a static UI mockup in one sentence for a design tool. No code. Focus on layout, colors, mood.",
      user: `App: ${prompt}\nDirection: ${preset.direction}\n${feedback ? `Feedback: ${feedback}` : ""}\nSpec: ${JSON.stringify(brief?.appSpec ?? {}).slice(0, 1500)}`,
      maxTokens: 200,
    });
  } catch {
    return undefined;
  }
}

async function generateOneMockup(
  preset: (typeof STYLE_PRESETS)[number],
  prompt: string,
  brief?: BriefJson,
  _images?: InspirationImage[],
  feedback?: string,
): Promise<StylePreview> {
  const aiVibe = await refineMockupDescription(preset, prompt, brief, feedback);
  const base = buildStylePreview(preset, prompt);

  return {
    ...base,
    vibe: aiVibe?.trim() || base.vibe,
  };
}

/** Generate 3 static design mockup images (not functional previews). */
export async function generateStylePreviews({
  prompt,
  brief,
  images,
  feedback,
}: {
  prompt: string;
  brief?: BriefJson;
  images?: InspirationImage[];
  feedback?: string;
}): Promise<StylePreview[]> {
  return Promise.all(
    STYLE_PRESETS.map((preset) =>
      generateOneMockup(preset, prompt, brief, images, feedback),
    ),
  );
}
