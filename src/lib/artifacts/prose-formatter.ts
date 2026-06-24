import type { ArtifactContent, SectionDoc } from "@/types/artifacts";
import { generateMockupImage } from "@/lib/lifecycle/mockup-images";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function titleCase(s: string) {
  return s
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function isJsonString(s: string): boolean {
  const t = s.trim();
  return (t.startsWith("{") && t.endsWith("}")) || (t.startsWith("[") && t.endsWith("]"));
}

function asRecord(v: unknown): Record<string, unknown> {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  if (typeof v === "string" && isJsonString(v)) {
    try {
      return JSON.parse(v) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function para(text: string) {
  return `<p style="margin:0 0 14px;line-height:1.65;color:#1f2937;font-size:15px">${esc(text)}</p>`;
}

function h2(text: string) {
  return `<h2 style="margin:28px 0 12px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6b7280">${esc(text)}</h2>`;
}

function ul(items: string[]) {
  if (!items.length) return "";
  return `<ul style="margin:0 0 16px;padding-left:22px;line-height:1.65;color:#374151;font-size:15px">${items.map((i) => `<li style="margin-bottom:6px">${esc(i)}</li>`).join("")}</ul>`;
}

function sectionsToHtml(sections: SectionDoc[], docTitle: string) {
  const parts = [
    `<h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#111827">${esc(docTitle)}</h1>`,
    `<p style="margin:0 0 24px;font-size:12px;color:#9ca3af;border-bottom:1px solid #e5e7eb;padding-bottom:20px">Enterprise document · Saffron</p>`,
  ];
  for (const s of sections) {
    parts.push(h2(s.title));
    if (s.body) parts.push(para(s.body));
    if (s.bullets?.length) parts.push(ul(s.bullets));
    if (s.table?.columns?.length) {
      parts.push(
        `<table style="width:100%;border-collapse:collapse;margin:12px 0 20px;font-size:14px"><thead><tr>${s.table.columns.map((c) => `<th style="border:1px solid #e5e7eb;background:#f9fafb;padding:10px;text-align:left;font-weight:600">${esc(c)}</th>`).join("")}</tr></thead><tbody>${(s.table.rows ?? []).map((row) => `<tr>${row.map((cell) => `<td style="border:1px solid #e5e7eb;padding:10px">${esc(String(cell))}</td>`).join("")}</tr>`).join("")}</tbody></table>`,
      );
    }
  }
  return parts.join("");
}

export function formatIntakeSummary(data: Record<string, unknown>): {
  sections: SectionDoc[];
  nativeHtml: string;
} {
  const sections: SectionDoc[] = [
    {
      key: "understood",
      title: "What We Understood",
      body: String(data.understood ?? data.summary ?? ""),
    },
    {
      key: "problem",
      title: "Business Problem",
      body: String(data.businessProblem ?? data.problem ?? ""),
    },
    {
      key: "users",
      title: "Users",
      bullets: [
        ...(Array.isArray(data.primaryUsers)
          ? (data.primaryUsers as string[]).map((u) => `Primary: ${u}`)
          : []),
        ...(Array.isArray(data.secondaryUsers)
          ? (data.secondaryUsers as string[]).map((u) => `Secondary: ${u}`)
          : []),
      ],
    },
    {
      key: "process",
      title: "Current Process",
      body: String(data.currentProcess ?? data.asIsProcess ?? ""),
    },
    {
      key: "outcome",
      title: "Desired Outcome",
      body: String(data.mainOutcome ?? data.desiredOutcome ?? data.goal ?? ""),
    },
  ].filter((s) => s.body || s.bullets?.length);

  return {
    sections,
    nativeHtml: sectionsToHtml(sections, "Intake Summary"),
  };
}

export function formatProductBrief(data: Record<string, unknown>): {
  sections: SectionDoc[];
  nativeHtml: string;
} {
  const scope = asRecord(data.scope);
  const sections: SectionDoc[] = [
    { key: "objective", title: "Objective", body: String(data.objective ?? "") },
    { key: "background", title: "Background", body: String(data.background ?? "") },
    {
      key: "scope_in",
      title: "In Scope",
      bullets: Array.isArray(scope.inScope) ? (scope.inScope as string[]) : [],
    },
    {
      key: "scope_out",
      title: "Out of Scope",
      bullets: Array.isArray(scope.outOfScope) ? (scope.outOfScope as string[]) : [],
    },
    {
      key: "workflows",
      title: "Core Workflows",
      bullets: Array.isArray(data.coreWorkflows) ? (data.coreWorkflows as string[]) : [],
    },
    {
      key: "rules",
      title: "Business Rules",
      bullets: Array.isArray(data.businessRules) ? (data.businessRules as string[]) : [],
    },
    {
      key: "success",
      title: "Success Criteria",
      bullets: Array.isArray(data.successCriteria) ? (data.successCriteria as string[]) : [],
    },
  ].filter((s) => s.body || s.bullets?.length);

  return { sections, nativeHtml: sectionsToHtml(sections, "Product Brief") };
}

export function formatAutomationModel(data: Record<string, unknown>): {
  sections: SectionDoc[];
  nativeHtml: string;
} {
  const triggers = (data.triggers as { event?: string; action?: string }[]) ?? [];
  const sections: SectionDoc[] = [
    {
      key: "triggers",
      title: "Automation Triggers",
      bullets: triggers.map((t) => `${t.event ?? "Event"} → ${t.action ?? "Action"}`),
    },
    {
      key: "notifications",
      title: "Notifications",
      bullets: ((data.notifications as { event?: string; recipient?: string }[]) ?? []).map(
        (n) => `${n.event}: notify ${n.recipient}`,
      ),
    },
    {
      key: "escalations",
      title: "Escalations",
      bullets: ((data.escalations as { condition?: string; action?: string }[]) ?? []).map(
        (e) => `${e.condition} → ${e.action}`,
      ),
    },
  ].filter((s) => s.bullets?.length);

  return { sections, nativeHtml: sectionsToHtml(sections, "Automation Model") };
}

export function formatAppSpec(data: Record<string, unknown>): {
  sections: SectionDoc[];
  nativeHtml: string;
} {
  const theme = asRecord(data.colorTheme);
  const sections: SectionDoc[] = [
    { key: "purpose", title: "Purpose", body: String(data.purpose ?? data.tagline ?? "") },
    {
      key: "features",
      title: "Features",
      bullets: Array.isArray(data.features) ? (data.features as string[]) : [],
    },
    {
      key: "status",
      title: "Status Flow",
      bullets: Array.isArray(data.statusFlow) ? (data.statusFlow as string[]) : [],
    },
    {
      key: "theme",
      title: "Visual Theme",
      body: theme.name
        ? `${theme.name} palette — primary ${theme.primary ?? ""}`
        : String(data.appType ?? ""),
    },
  ].filter((s) => s.body || s.bullets?.length);

  const title = String(data.appTitle ?? "App Specification");
  return { sections, nativeHtml: sectionsToHtml(sections, title) };
}

export function formatUxRecommendation(
  data: Record<string, unknown>,
  prompt = "Product",
): {
  sections: SectionDoc[];
  nativeHtml: string;
  previewImageUrl: string;
  previewColors: string[];
} {
  const theme = asRecord(data.visualTheme);
  const primary = String(theme.primaryColor ?? "#c96342");
  const screens = (data.primaryScreens as { screen?: string; purpose?: string; keyActions?: string[] }[]) ?? [];

  const sections: SectionDoc[] = [
    { key: "rationale", title: "Design Rationale", body: String(data.rationale ?? "") },
    {
      key: "navigation",
      title: "Navigation",
      body: String(data.navigationModel ?? data.layoutType ?? ""),
    },
    {
      key: "screens",
      title: "Primary Screens",
      bullets: screens.map(
        (s) =>
          `${s.screen}: ${s.purpose}${s.keyActions?.length ? ` (${s.keyActions.join(", ")})` : ""}`,
      ),
    },
    {
      key: "theme",
      title: "Visual Theme",
      body: `${theme.colorName ?? "Brand"} — ${theme.mood ?? "professional"} mood. ${theme.rationale ?? ""}`,
    },
  ].filter((s) => s.body || s.bullets?.length);

  const previewColors = [primary, "#1f2937", "#f8fafc"];
  const previewImageUrl = generateMockupImage(
    {
      id: "ux_rec",
      label: String(theme.colorName ?? "Recommended"),
      vibe: String(data.rationale ?? "Enterprise UI"),
      direction: String(theme.rationale ?? "Clean operational UI"),
      previewColors,
    },
    prompt,
    screens[0]?.screen ?? "Dashboard",
  );

  return {
    sections,
    nativeHtml: sectionsToHtml(sections, "UX Recommendation"),
    previewImageUrl,
    previewColors,
  };
}

/** Build workflow diagram nodes — handles multiple AI response shapes. */
export function briefToDiagramGraph(workflowMap: Record<string, unknown>) {
  type Step = { step?: string; actor?: string; action?: string; label?: string };
  let steps: Step[] = [];

  if (Array.isArray(workflowMap.steps)) {
    steps = workflowMap.steps as Step[];
  } else if (Array.isArray(workflowMap.phases)) {
    steps = (workflowMap.phases as Step[]).map((p) => ({
      step: p.step ?? p.label,
      actor: p.actor,
    }));
  }

  if (!steps.length && workflowMap.trigger) {
    steps = [
      { step: "Start", actor: "System", action: String(workflowMap.trigger) },
      { step: "Process", actor: "User", action: "Complete workflow" },
      { step: "Complete", actor: "System", action: "Close loop" },
    ];
  }

  if (!steps.length) {
    steps = [
      { step: "Submit", actor: "Requester" },
      { step: "Review", actor: "Approver" },
      { step: "Fulfill", actor: "Operations" },
      { step: "Close", actor: "System" },
    ];
  }

  const actors = [...new Set(steps.map((s) => s.actor ?? "General"))];
  const laneY = (actor: string) => 40 + actors.indexOf(actor ?? "General") * 140;

  const nodes = steps.map((s, i) => ({
    id: String(i + 1),
    type: "default",
    position: { x: 60 + i * 220, y: laneY(s.actor ?? "General") },
    data: {
      label: s.step ?? s.label ?? `Step ${i + 1}`,
      lane: s.actor ?? "General",
      subtitle: s.action ?? "",
    },
  }));

  const edges = nodes.slice(0, -1).map((n, i) => ({
    id: `e${i}`,
    source: n.id,
    target: nodes[i + 1].id,
    animated: true,
    label: i === 1 && Array.isArray(workflowMap.decisionPoints)
      ? String((workflowMap.decisionPoints as string[])[0] ?? "")
      : undefined,
  }));

  return { nodes, edges };
}

export function formatWorkflowProse(data: Record<string, unknown>): SectionDoc[] {
  const steps = (data.steps as { step?: string; actor?: string; action?: string; sla?: string }[]) ?? [];
  return [
    { key: "trigger", title: "Trigger", body: String(data.trigger ?? "Process initiated by user action.") },
    {
      key: "steps",
      title: "Process Steps",
      table: {
        columns: ["Step", "Owner", "Action", "SLA"],
        rows: steps.map((s) => [
          s.step ?? "",
          s.actor ?? "",
          s.action ?? "",
          s.sla ?? "—",
        ]),
      },
    },
    {
      key: "decisions",
      title: "Decision Points",
      bullets: Array.isArray(data.decisionPoints) ? (data.decisionPoints as string[]) : [],
    },
    {
      key: "exceptions",
      title: "Exception Paths",
      bullets: Array.isArray(data.exceptionPaths) ? (data.exceptionPaths as string[]) : [],
    },
  ].filter((s) => s.body || s.bullets?.length || s.table);
}

/** Convert raw brief stage data → enterprise document content (no JSON in body). */
export function stageDataToProse(
  stageKey: string,
  data: unknown,
  prompt = "",
): Pick<ArtifactContent, "sections" | "nativeHtml" | "meta"> & {
  diagramGraph?: ArtifactContent["diagramGraph"];
  spreadsheetData?: ArtifactContent["spreadsheetData"];
  designVariants?: ArtifactContent["designVariants"];
  selectedDesignId?: string;
} {
  const d = asRecord(data);
  const label = titleCase(stageKey);

  switch (stageKey) {
    case "intake_summary": {
      const f = formatIntakeSummary(d);
      return { ...f, meta: { title: "Intake Summary" } };
    }
    case "product_brief": {
      const f = formatProductBrief(d);
      return { ...f, meta: { title: "Product Brief" } };
    }
    case "workflow_map": {
      const sections = formatWorkflowProse(d);
      return {
        sections,
        nativeHtml: sectionsToHtml(sections, "Workflow Map"),
        diagramGraph: briefToDiagramGraph(d),
        meta: { title: "Workflow Map" },
      };
    }
    case "data_model": {
      const dm = d;
      const fields = (dm.fields ?? []) as {
        name: string;
        label: string;
        type?: string;
        required?: boolean;
      }[];
      const sections: SectionDoc[] = [
        {
          key: "entity",
          title: "Primary Entity",
          body: String(dm.primaryEntity ?? "Record"),
        },
        {
          key: "status",
          title: "Status Flow",
          bullets: Array.isArray(dm.statusFlow) ? (dm.statusFlow as string[]) : [],
        },
      ];
      return {
        sections,
        nativeHtml: sectionsToHtml(sections, "Data Model"),
        spreadsheetData: {
          sheets: [
            {
              name: String(dm.primaryEntity ?? "Fields"),
              columns: ["Field", "Label", "Type", "Required"],
              rows: fields.length
                ? fields.map((f) => [
                    f.name,
                    f.label,
                    f.type ?? "text",
                    f.required ? "Yes" : "No",
                  ])
                : [["title", "Title", "text", "Yes"]],
            },
          ],
        },
        meta: { title: "Data Model" },
      };
    }
    case "automation_model": {
      const f = formatAutomationModel(d);
      return { ...f, meta: { title: "Automation Model" } };
    }
    case "ux_recommendation": {
      const f = formatUxRecommendation(d, prompt);
      return {
        sections: f.sections,
        nativeHtml: f.nativeHtml,
        meta: { title: "UX Recommendation" },
        designVariants: [
          {
            id: "recommended",
            name: "Recommended Design",
            description: String(d.rationale ?? "Primary UI direction for your product."),
            previewColors: f.previewColors,
            previewImageUrl: f.previewImageUrl,
          },
        ],
        selectedDesignId: "recommended",
      };
    }
    case "app_spec": {
      const f = formatAppSpec(d);
      return { ...f, meta: { title: String(d.appTitle ?? "App Specification") } };
    }
    default: {
      const sections: SectionDoc[] = [
        {
          key: stageKey,
          title: label,
          body: typeof data === "string" ? data : "See structured sections below.",
        },
      ];
      return { sections, nativeHtml: sectionsToHtml(sections, label), meta: { title: label } };
    }
  }
}

/** Fix legacy artifacts that stored JSON in body/nativeHtml. */
export function normalizeArtifactContent(content: ArtifactContent): ArtifactContent {
  if (content.nativeHtml?.includes("<pre>") && content.nativeHtml.includes("{")) {
    const stageKey = content.documentType ?? "document";
    try {
      const match = content.nativeHtml.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
      if (match) {
        const parsed = JSON.parse(match[1]) as Record<string, unknown>;
        const prose = stageDataToProse(stageKey, parsed);
        return { ...content, ...prose, format: content.format ?? "formal_doc" };
      }
    } catch {
      /* keep */
    }
  }

  const first = content.sections?.[0];
  if (first?.body && isJsonString(first.body)) {
    try {
      const parsed = JSON.parse(first.body) as Record<string, unknown>;
      const stageKey = content.documentType ?? first.key;
      const prose = stageDataToProse(stageKey, parsed);
      return {
        ...content,
        ...prose,
        diagramGraph: content.diagramGraph?.nodes?.length
          ? content.diagramGraph
          : prose.diagramGraph ?? content.diagramGraph,
        spreadsheetData: content.spreadsheetData ?? prose.spreadsheetData,
        designVariants: content.designVariants?.length
          ? content.designVariants
          : prose.designVariants,
      };
    } catch {
      /* keep */
    }
  }

  if (
    content.documentType === "workflow_map" &&
    (!content.diagramGraph?.nodes?.length)
  ) {
    const prose = stageDataToProse("workflow_map", {});
    return { ...content, diagramGraph: prose.diagramGraph };
  }

  return content;
}
