import type { BriefJson, InspirationImage, StylePreview } from "@/types/lifecycle";
import { completeChat, hasAIKey } from "@/lib/ai-provider";

export const STYLE_PRESETS = [
  {
    id: "minimal_light",
    label: "Clean & Minimal",
    vibe: "Bright, airy, restrained accent, generous whitespace",
    direction: "Light theme, white/slate-50, indigo accent, calm typography",
    previewColors: ["#f8fafc", "#4f46e5", "#ffffff"],
  },
  {
    id: "bold_dark",
    label: "Bold & Modern",
    vibe: "Dark, high-contrast, vivid accent, premium feel",
    direction: "Dark slate-950, emerald/violet accent, bold headings",
    previewColors: ["#0f172a", "#10b981", "#f8fafc"],
  },
  {
    id: "warm_editorial",
    label: "Warm & Friendly",
    vibe: "Warm neutrals, approachable, editorial tone",
    direction: "Stone/amber palette, rounded shapes, welcoming",
    previewColors: ["#fffbeb", "#ea580c", "#1c1917"],
  },
] as const;

function demoPreviewCode(preset: (typeof STYLE_PRESETS)[number], prompt: string) {
  const isDark = preset.id === "bold_dark";
  const bg = isDark ? "bg-slate-950 text-white" : preset.id === "warm_editorial" ? "bg-amber-50 text-stone-900" : "bg-slate-50 text-slate-900";
  const card = isDark ? "bg-slate-900 border-slate-800" : "bg-white border-stone-200";
  const accent = preset.id === "bold_dark" ? "bg-emerald-500" : preset.id === "warm_editorial" ? "bg-orange-500" : "bg-indigo-600";
  return `import React, { useState } from "react";
export default function App() {
  const [items] = useState([
    { id: 1, title: "Sample request", status: "Pending" },
    { id: 2, title: "Budget approval", status: "Approved" },
  ]);
  return (
    <div className="min-h-screen ${bg} p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">${preset.label}</h1>
        <p className="opacity-70 mt-2 max-w-xl">${prompt.slice(0, 100).replace(/"/g, "'")}</p>
      </header>
      <div className="grid gap-4 max-w-2xl">
        {items.map(item => (
          <div key={item.id} className="${card} border rounded-2xl p-5 flex justify-between items-center shadow-sm">
            <span className="font-medium">{item.title}</span>
            <span className="${accent} text-white text-xs px-3 py-1 rounded-full">{item.status}</span>
          </div>
        ))}
        <button className="${accent} text-white px-5 py-3 rounded-xl font-medium w-fit">Primary action</button>
      </div>
    </div>
  );
}`;
}

async function generateOnePreview(
  preset: (typeof STYLE_PRESETS)[number],
  prompt: string,
  brief?: BriefJson,
  images?: InspirationImage[],
  feedback?: string,
): Promise<StylePreview> {
  const hasKey = hasAIKey();
  let previewCode = demoPreviewCode(preset, prompt);

  if (hasKey) {
    try {
      const textPart = `Product: ${prompt}\nDesign direction: ${preset.direction}\n${
        feedback ? `User feedback: ${feedback}\n` : ""
      }App spec: ${JSON.stringify(brief?.app_spec ?? brief?.appSpec ?? {}).slice(0, 2000)}`;

      const code = await completeChat({
        system: `Generate ONE React preview file. export default function App. Import only from react. Tailwind only. Design: ${preset.direction}. Match inspiration images when provided. Output raw JS only.`,
        user: textPart,
        images,
        maxTokens: 4000,
      });
      const cleaned = code.replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "").trim();
      if (cleaned.includes("export default")) previewCode = cleaned;
    } catch {
      /* keep demo */
    }
  }

  if (!previewCode.includes("import React")) {
    previewCode = `import React, { useState } from "react";\n${previewCode}`;
  }

  return {
    id: preset.id,
    label: preset.label,
    vibe: preset.vibe,
    direction: preset.direction,
    previewCode,
    previewColors: [...preset.previewColors],
  };
}

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
      generateOnePreview(preset, prompt, brief, images, feedback),
    ),
  );
}
