import type {
  ArtifactContent,
  DesignVariant,
  DiagramEdge,
  DiagramNode,
  PresentationSlide,
  SpreadsheetSheet,
} from "@/types/artifacts";
import { DocTemplate } from "@/lib/document-templates";
import { hasAIKey } from "@/lib/ai-provider";
import type { InspirationImage } from "@/types/lifecycle";

function demoSections(template: DocTemplate, prompt: string) {
  return template.sections.map((s) => ({
    key: s.key,
    title: s.title,
    body: `${s.guidance}\n\nGenerated for: ${prompt.slice(0, 200)}`,
    bullets: ["Action item one", "Action item two", "Action item three"],
  }));
}

function demoDiagram(prompt: string) {
  const nodes: DiagramNode[] = [
    { id: "1", position: { x: 80, y: 80 }, data: { label: "Start", lane: "Requester" } },
    { id: "2", position: { x: 280, y: 80 }, data: { label: "Submit Request", lane: "Requester" } },
    { id: "3", position: { x: 480, y: 80 }, data: { label: "Review", lane: "Approver" } },
    { id: "4", position: { x: 680, y: 80 }, data: { label: "Approved?", lane: "Approver" } },
    { id: "5", position: { x: 880, y: 40 }, data: { label: "Complete", lane: "System" } },
  ];
  const edges: DiagramEdge[] = [
    { id: "e1", source: "1", target: "2" },
    { id: "e2", source: "2", target: "3" },
    { id: "e3", source: "3", target: "4" },
    { id: "e4", source: "4", target: "5", label: "Yes" },
  ];
  return { nodes, edges, title: `Workflow: ${prompt.slice(0, 40)}` };
}

function demoSpreadsheet(prompt: string): SpreadsheetSheet[] {
  return [
    {
      name: "Summary",
      columns: ["Month", "Revenue", "Costs", "Profit"],
      rows: [
        ["Jan", 120000, 80000, 40000],
        ["Feb", 135000, 85000, 50000],
        ["Mar", 150000, 90000, 60000],
      ],
      charts: [{ type: "bar", title: "Quarterly Performance", range: "A1:D4" }],
    },
    {
      name: "Assumptions",
      columns: ["Assumption", "Value"],
      rows: [
        ["Growth rate", "12%"],
        ["Source", prompt.slice(0, 80)],
      ],
    },
  ];
}

function demoSlides(template: DocTemplate, prompt: string): PresentationSlide[] {
  return [
    { id: "s1", title: template.label, bullets: [prompt.slice(0, 120)] },
    { id: "s2", title: "Problem", bullets: ["Market pain point", "Current gaps", "Opportunity size"] },
    { id: "s3", title: "Solution", bullets: ["Product vision", "Key differentiators", "MVP scope"] },
    { id: "s4", title: "Traction & Ask", bullets: ["Metrics", "Roadmap", "Investment ask"] },
  ];
}

function demoDesigns(prompt: string): DesignVariant[] {
  const base = encodeURIComponent(prompt.slice(0, 60));
  return [
    {
      id: "d1",
      name: "Minimal",
      description: "Clean, whitespace-forward layout",
      figmaEmbedUrl: `https://www.figma.com/embed?embed_host=chai&url=https://www.figma.com/file/demo-minimal-${base}`,
      figmaExternalUrl: `https://www.figma.com/file/demo-minimal-${base}`,
      previewColors: ["#fafafa", "#111827", "#6366f1"],
    },
    {
      id: "d2",
      name: "Bold",
      description: "High-contrast, vibrant accent colors",
      figmaEmbedUrl: `https://www.figma.com/embed?embed_host=chai&url=https://www.figma.com/file/demo-bold-${base}`,
      figmaExternalUrl: `https://www.figma.com/file/demo-bold-${base}`,
      previewColors: ["#0f172a", "#f97316", "#ffffff"],
    },
    {
      id: "d3",
      name: "Enterprise",
      description: "Professional, data-dense dashboard",
      figmaEmbedUrl: `https://www.figma.com/embed?embed_host=chai&url=https://www.figma.com/file/demo-enterprise-${base}`,
      figmaExternalUrl: `https://www.figma.com/file/demo-enterprise-${base}`,
      previewColors: ["#1e293b", "#3b82f6", "#e2e8f0"],
    },
  ];
}

function sectionsToHtml(sections: ArtifactContent["sections"]) {
  const parts = (sections ?? []).map((s) => {
    let html = `<h2>${s.title}</h2>`;
    if (s.body) html += `<p>${s.body.replace(/\n/g, "</p><p>")}</p>`;
    if (s.bullets?.length) {
      html += `<ul>${s.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`;
    }
    return html;
  });
  return parts.join("");
}

export async function generateArtifactContent({
  template,
  prompt,
  projectName,
  images,
}: {
  template: DocTemplate;
  prompt: string;
  projectName?: string;
  images?: InspirationImage[];
}): Promise<{
  content: ArtifactContent;
  title: string;
  connectorProvider?: "FIGMA" | "LUCIDCHART" | "NATIVE";
  connectorEmbedUrl?: string;
  connectorExternalUrl?: string;
}> {
  const hasKey = hasAIKey();

  const base: ArtifactContent = {
    documentType: template.documentType,
    label: template.label,
    format: template.format as ArtifactContent["format"],
    depthMode: "enterprise",
    meta: {
      title: template.label,
      owner: "Saffron User",
      date: new Date().toISOString().slice(0, 10),
      project: projectName,
      version: "1.0",
    },
  };

  if (!hasKey) {
    if (template.kind === "DIAGRAM") {
      const graph = demoDiagram(prompt);
      return {
        title: graph.title,
        content: { ...base, diagramGraph: graph },
        connectorProvider: "LUCIDCHART",
      };
    }
    if (template.kind === "SPREADSHEET") {
      return {
        title: `${template.label}`,
        content: { ...base, spreadsheetData: { sheets: demoSpreadsheet(prompt) } },
      };
    }
    if (template.kind === "PRESENTATION") {
      const slides = demoSlides(template, prompt);
      return {
        title: template.label,
        content: { ...base, slides },
      };
    }
    if (template.kind === "DESIGN") {
      const variants = demoDesigns(prompt);
      return {
        title: "UX Design Options",
        content: { ...base, designVariants: variants, selectedDesignId: variants[0].id },
        connectorProvider: "FIGMA",
        connectorEmbedUrl: variants[0].figmaEmbedUrl,
        connectorExternalUrl: variants[0].figmaExternalUrl,
      };
    }
    const sections = demoSections(template, prompt);
    return {
      title: template.label,
      content: { ...base, sections, nativeHtml: sectionsToHtml(sections) },
    };
  }

  // AI path — reuse ai.ts complete with structured JSON prompt
  const { complete } = await import("@/lib/ai-generate");
  const aiContent = await complete(template, prompt, projectName, images);
  return aiContent;
}

export async function refineArtifactContent({
  template,
  currentContent,
  instruction,
  projectName,
  images,
}: {
  template: DocTemplate;
  currentContent: ArtifactContent;
  instruction: string;
  projectName?: string;
  images?: InspirationImage[];
}): Promise<{
  content: ArtifactContent;
  title: string;
}> {
  const hasKey = hasAIKey();

  if (!hasKey) {
    const sections = currentContent.sections ?? [];
    const updated = sections.map((s) => ({
      ...s,
      body: `${s.body ?? ""}\n\n[Refinement: ${instruction}]`,
    }));
    return {
      title: currentContent.meta?.title ?? template.label,
      content: {
        ...currentContent,
        sections: updated,
        nativeHtml: sectionsToHtml(updated),
      },
    };
  }

  const { complete } = await import("@/lib/ai-generate");
  const prompt = `Refine this artifact. Current content JSON:\n${JSON.stringify(currentContent).slice(0, 6000)}\n\nUser refinement:\n${instruction}`;
  const result = await complete(template, prompt, projectName, images);
  return { content: result.content, title: result.title };
}
