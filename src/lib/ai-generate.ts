import {
  buildDynamicTemplate,
  DocTemplate,
  DOCUMENT_TEMPLATES,
} from "@/lib/document-templates";
import { completeChat } from "@/lib/ai-provider";
import type { ArtifactContent } from "@/types/artifacts";
import type { InspirationImage } from "@/types/lifecycle";

function parseJson(text: string) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1].trim() : text.trim();
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  return JSON.parse(raw.slice(start, end + 1));
}

export async function complete(
  template: DocTemplate,
  prompt: string,
  projectName?: string,
  images?: InspirationImage[],
): Promise<{
  content: ArtifactContent;
  title: string;
  connectorProvider?: "FIGMA" | "NATIVE";
  connectorEmbedUrl?: string;
  connectorExternalUrl?: string;
}> {
  const system = `You generate enterprise artifacts as JSON for Saffron.
Template: ${template.label} (${template.kind})
Return ONLY valid JSON matching the kind:
- DOCUMENT: { title, sections: [{ key, title, body, bullets?, table? }] }
- DIAGRAM: { title, diagramGraph: { nodes: [{id, position:{x,y}, data:{label,lane}}], edges: [{id,source,target,label?}] } }
- SPREADSHEET: { title, spreadsheetData: { sheets: [{ name, columns, rows, charts? }] } }
- PRESENTATION: { title, slides: [{ id, title, bullets, notes? }] }
- DESIGN: { title, designVariants: [{ id, name, description, previewColors }] }`;

  const user = `Project: ${projectName ?? "Untitled"}\nRequest: ${prompt}`;
  const raw = await completeChat({ system, user, images, maxTokens: 8000 });
  const parsed = parseJson(raw);

  const content: ArtifactContent = {
    documentType: template.documentType,
    label: template.label,
    format: template.format as ArtifactContent["format"],
    meta: {
      title: parsed.title || template.label,
      date: new Date().toISOString().slice(0, 10),
      project: projectName,
    },
    sections: parsed.sections,
    diagramGraph: parsed.diagramGraph,
    spreadsheetData: parsed.spreadsheetData,
    slides: parsed.slides,
    designVariants: parsed.designVariants,
  };

  if (template.kind === "DOCUMENT" && parsed.sections) {
    content.nativeHtml = parsed.sections
      .map(
        (s: { title: string; body?: string; bullets?: string[] }) =>
          `<h2>${s.title}</h2><p>${s.body ?? ""}</p>${
            s.bullets?.length
              ? `<ul>${s.bullets.map((b: string) => `<li>${b}</li>`).join("")}</ul>`
              : ""
          }`,
      )
      .join("");
  }

  if (template.kind === "DESIGN" && parsed.designVariants?.length) {
    const v = parsed.designVariants[0];
    content.selectedDesignId = v.id;
    return {
      title: parsed.title || "UX Design Options",
      content,
      connectorProvider: "FIGMA",
      connectorEmbedUrl: v.figmaEmbedUrl,
      connectorExternalUrl: v.figmaExternalUrl,
    };
  }

  return { title: parsed.title || template.label, content };
}

export function resolveTemplate(
  type: string,
  customName?: string,
  customDescription?: string,
): DocTemplate {
  if (type === "custom") {
    return buildDynamicTemplate(
      customName ?? "Custom Document",
      customDescription ?? "",
    );
  }
  return (
    DOCUMENT_TEMPLATES[type] ??
    buildDynamicTemplate(customName ?? type, customDescription ?? type)
  );
}
