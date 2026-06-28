import type { BriefJson, InspirationImage } from "@/types/lifecycle";
import { LIFECYCLE_STAGES } from "@/types/lifecycle";
import type { ArtifactContent, SectionDoc } from "@/types/artifacts";
import { completeChat, hasAIKey } from "@/lib/ai-provider";

export const BRIEF_STAGE_KEYS = LIFECYCLE_STAGES.map((s) => s.key);

const BRIEF_KEY_ALIASES: Record<string, string> = {
  intakeSummary: "intake_summary",
  productBrief: "product_brief",
  workflowMap: "workflow_map",
  dataModel: "data_model",
  automationModel: "automation_model",
  uxRecommendation: "ux_recommendation",
  appSpec: "app_spec",
};

/** Normalize camelCase AI/demo brief keys to snake_case stage keys. */
export function normalizeBriefJson(brief: BriefJson): BriefJson {
  const out: BriefJson = { ...brief };
  for (const [camel, snake] of Object.entries(BRIEF_KEY_ALIASES)) {
    if (camel in out && out[snake] === undefined) {
      out[snake] = out[camel];
    }
  }
  return out;
}

const BRIEF_TEMPLATE = `Return ONLY valid JSON for an enterprise product brief. Use these exact snake_case keys: intake_summary, product_brief, workflow_map, data_model, automation_model, ux_recommendation, app_spec.
Each section must be domain-specific and detailed (not generic placeholders).`;

function demoBrief(prompt: string): BriefJson {
  return normalizeBriefJson({
    intake_summary: {
      understood: `Building a solution for: ${prompt.slice(0, 120)}`,
      businessProblem:
        "Teams lose hours on manual handoffs, spreadsheet tracking, and email approvals. Errors compound when status is unclear.",
      primaryUsers: ["Requester", "Approver", "Operations admin"],
      secondaryUsers: ["Finance reviewer", "Compliance auditor"],
      currentProcess:
        "Requests start in email or chat, get copied into spreadsheets, and approvals happen out of band with no audit trail.",
      mainOutcome: "Cut processing time by 40% and provide full traceability.",
    },
    product_brief: {
      objective: `Deliver a working internal tool for: ${prompt.slice(0, 80)}`,
      background: "Manual process no longer scales with team growth.",
      scope: {
        inScope: ["Request intake", "Approval queue", "Status tracking", "Audit log"],
        outOfScope: ["ERP replacement", "External customer portal"],
      },
      userRoles: [
        { role: "Requester", access: "Submit and track requests", estimated: "50+" },
        { role: "Approver", access: "Review queue and decide", estimated: "10" },
      ],
      coreWorkflows: ["Submit request", "Manager approval", "Fulfillment", "Close loop"],
      businessRules: ["Amounts over $5k need director approval"],
      successCriteria: ["90% requests resolved within SLA"],
      assumptions: ["Users have company SSO"],
      dependencies: ["Email notifications"],
      risks: [{ risk: "Low adoption", impact: "Process reverts to email", mitigation: "Pilot with one team", owner: "PM" }],
      openQuestions: ["Which ERP fields must sync?"],
    },
    workflow_map: {
      trigger: "User submits a new request",
      steps: [
        { step: "Draft", actor: "Requester", action: "Fill form", output: "Draft record", sla: "1 day" },
        { step: "Review", actor: "Manager", action: "Approve or reject", output: "Decision", sla: "2 days" },
        { step: "Fulfill", actor: "Ops", action: "Complete work", output: "Done", sla: "5 days" },
      ],
      decisionPoints: ["Amount > $5k → Director approval"],
      exceptionPaths: ["Rejected → return to requester with notes"],
    },
    data_model: {
      primaryEntity: "request",
      fields: [
        { name: "title", label: "Title", type: "text", required: true },
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "department", label: "Department", type: "select", required: true, options: ["Eng", "Sales", "HR"] },
        { name: "justification", label: "Justification", type: "textarea", required: true },
      ],
      statusFlow: ["Draft", "Submitted", "Approved", "Rejected", "Completed"],
      relationships: ["Request belongs to Requester"],
      auditFields: ["created_at", "updated_at", "approved_by"],
    },
    automation_model: {
      triggers: [{ event: "Submitted", condition: "Valid form", action: "Notify approver" }],
      notifications: [{ event: "Approved", recipient: "Requester", channel: "Email", template: "Your request was approved" }],
      escalations: [{ condition: "SLA breach", action: "Escalate to director", recipient: "Director" }],
      documentGeneration: [],
      integrations: [],
    },
    ux_recommendation: {
      layoutType: "queue_detail",
      navigationModel: "Sidebar nav",
      primaryScreens: [
        { screen: "My Requests", purpose: "Track submissions", keyActions: ["New request", "Filter"] },
        { screen: "Approval Queue", purpose: "Review pending items", keyActions: ["Approve", "Reject"] },
      ],
      visualTheme: {
        mood: "operational",
        primaryColor: "#c96342",
        colorName: "Saffron",
        rationale: "Warm, confident, enterprise-friendly",
      },
      rationale: "Queue + detail fits approval workflows",
    },
    app_spec: {
      appTitle: "Request Hub",
      appType: "Approval tracker",
      tagline: "Submit, approve, and track in one place",
      purpose: prompt.slice(0, 200),
      workflowType: "approval_workflow",
      layoutType: "queue_detail",
      colorTheme: { name: "Saffron", primary: "#c96342", light: "#fff7ed", text: "#1f2937" },
      features: ["Submit requests", "Approval queue", "Status filters", "Audit history"],
      fields: [
        { name: "title", label: "Title", type: "text", required: true },
        { name: "amount", label: "Amount", type: "number", required: true },
      ],
      statusFlow: ["Draft", "Submitted", "Approved", "Rejected", "Completed"],
      primaryActionLabel: "Submit request",
      integrations: {},
      roles: ["requester", "approver", "admin"],
    },
  });
}

async function callBriefAI(
  prompt: string,
  images?: InspirationImage[],
): Promise<BriefJson> {
  if (!hasAIKey()) return demoBrief(prompt);

  try {
    const text = await completeChat({
      system: "You are an enterprise product strategist. Output only JSON.",
      user: `${BRIEF_TEMPLATE}\n\nUser request:\n${prompt}`,
      images,
      maxTokens: 8000,
    });

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("No JSON in response");
    return normalizeBriefJson(JSON.parse(text.slice(start, end + 1)) as BriefJson);
  } catch (err) {
    console.error("[brief-pipeline] AI brief failed, using demo fallback:", err);
    return demoBrief(prompt);
  }
}

export async function generateEnterpriseBrief(
  prompt: string,
  images?: InspirationImage[],
): Promise<BriefJson> {
  return callBriefAI(prompt, images);
}

export function briefToDiagramGraph(workflowMap: Record<string, unknown>) {
  const steps = (workflowMap?.steps as Record<string, unknown>[]) ?? [];
  const nodes = steps.map((s, i) => ({
    id: String(i + 1),
    position: { x: 80 + i * 200, y: 80 },
    data: {
      label: asString(s.step ?? s.step_name ?? s.name ?? `Step ${i + 1}`),
      lane: asString(s.actor ?? s.lane ?? "Process"),
    },
  }));
  const edges = nodes.slice(0, -1).map((n, i) => ({
    id: `e${i}`,
    source: n.id,
    target: nodes[i + 1].id,
  }));
  return { nodes, edges };
}

function sectionsToHtml(sections: SectionDoc[]) {
  return sections
    .map((s) => {
      let html = `<h2>${s.title}</h2>`;
      if (s.body) html += `<p>${s.body.replace(/\n/g, "</p><p>")}</p>`;
      if (s.bullets?.length) {
        html += `<ul>${s.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`;
      }
      if (s.table?.columns?.length) {
        html += "<table><thead><tr>";
        html += s.table.columns.map((c) => `<th>${c}</th>`).join("");
        html += "</tr></thead><tbody>";
        for (const row of s.table.rows ?? []) {
          html += `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
        }
        html += "</tbody></table>";
      }
      return html;
    })
    .join("");
}

function docMeta(label: string, appTitle: string): ArtifactContent["meta"] {
  return {
    title: label,
    owner: "Aria",
    date: new Date().toISOString().slice(0, 10),
    project: appTitle,
    version: "1.0",
  };
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asStringList(value: unknown) {
  return Array.isArray(value) ? value.map(String) : [];
}

function formatLabel(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCell(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(String).join(", ");
  return JSON.stringify(value);
}

/** Turn any brief object into readable sections — never raw JSON dumps. */
function recordToSections(record: Record<string, unknown>): SectionDoc[] {
  const sections: SectionDoc[] = [];

  for (const [key, value] of Object.entries(record)) {
    const title = formatLabel(key);

    if (typeof value === "string" && value.trim()) {
      sections.push({ key, title, body: value });
      continue;
    }

    if (Array.isArray(value) && value.length) {
      if (value.every((v) => typeof v === "string")) {
        sections.push({ key, title, bullets: value.map(String) });
        continue;
      }
      if (value.every((v) => v && typeof v === "object" && !Array.isArray(v))) {
        const rows = value as Record<string, unknown>[];
        const columns = Object.keys(rows[0]).map(formatLabel);
        sections.push({
          key,
          title,
          table: {
            columns,
            rows: rows.map((row) =>
              Object.keys(rows[0]).map((col) => formatCell(row[col])),
            ),
          },
        });
        continue;
      }
    }

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = value as Record<string, unknown>;
      const inScope = asStringList(nested.inScope);
      const outScope = asStringList(nested.outOfScope);
      if (inScope.length || outScope.length) {
        if (inScope.length) sections.push({ key: `${key}_in`, title: `${title} — in scope`, bullets: inScope });
        if (outScope.length) sections.push({ key: `${key}_out`, title: `${title} — out of scope`, bullets: outScope });
        continue;
      }
      sections.push({ key, title, body: Object.entries(nested).map(([k, v]) => `${formatLabel(k)}: ${formatCell(v)}`).join("\n") });
    }
  }

  return sections;
}

function withSections(
  builder: (data: Record<string, unknown>) => SectionDoc[],
  data: Record<string, unknown>,
): SectionDoc[] {
  const sections = builder(data);
  return sections.length > 0 ? sections : recordToSections(data);
}

export function resolveAppTitle(brief: BriefJson): string {
  const intake = brief.intake_summary as Record<string, unknown> | undefined;
  const projectName = intake ? asString(intake.project_name) : "";
  if (projectName) return projectName;

  const product = brief.product_brief as Record<string, unknown> | undefined;
  const productName = product ? asString(product.product_name) : "";
  if (productName) return productName;

  const appSpec = (brief.app_spec ?? brief.appSpec) as Record<string, unknown> | undefined;
  const appTitle = appSpec ? asString(appSpec.appTitle) : "";
  if (appTitle) return appTitle;
  const appTitleSnake = appSpec ? asString(appSpec.app_title) : "";
  if (appTitleSnake) return appTitleSnake;

  return "Product";
}

export function isLegacyArtifactContent(content: string): boolean {
  try {
    const parsed = JSON.parse(content) as ArtifactContent;
    if (!parsed.meta?.title) return true;
    if (parsed.nativeHtml?.includes("<pre>")) return true;
    const body = parsed.sections?.[0]?.body;
    if (typeof body === "string" && body.trimStart().startsWith("{")) return true;
    return false;
  } catch {
    return true;
  }
}

function buildIntakeSections(data: Record<string, unknown>): SectionDoc[] {
  const sections: SectionDoc[] = [];

  if (data.project_name) {
    sections.push({ key: "project", title: "Project name", body: asString(data.project_name) });
  }
  if (data.project_description) {
    sections.push({ key: "description", title: "Project description", body: asString(data.project_description) });
  }
  const goals = asStringList(data.goals);
  if (goals.length) {
    sections.push({ key: "goals", title: "Goals", bullets: goals });
  }
  const stakeholders = asStringList(data.stakeholders);
  if (stakeholders.length) {
    sections.push({ key: "stakeholders", title: "Stakeholders", bullets: stakeholders });
  }
  if (data.understood) {
    sections.push({ key: "understood", title: "What we understood", body: asString(data.understood) });
  }
  if (data.businessProblem) {
    sections.push({ key: "problem", title: "Business problem", body: asString(data.businessProblem) });
  }
  const primaryUsers = asStringList(data.primaryUsers);
  if (primaryUsers.length) {
    sections.push({ key: "primary_users", title: "Primary users", bullets: primaryUsers });
  }
  const secondaryUsers = asStringList(data.secondaryUsers);
  if (secondaryUsers.length) {
    sections.push({ key: "secondary_users", title: "Secondary users", bullets: secondaryUsers });
  }
  if (data.currentProcess) {
    sections.push({ key: "current", title: "Current process", body: asString(data.currentProcess) });
  }
  if (data.mainOutcome) {
    sections.push({ key: "outcome", title: "Desired outcome", body: asString(data.mainOutcome) });
  }
  return sections;
}

function buildProductBriefSections(data: Record<string, unknown>): SectionDoc[] {
  const sections: SectionDoc[] = [];

  if (data.product_name) {
    sections.push({ key: "product", title: "Product name", body: asString(data.product_name) });
  }
  if (data.product_description) {
    sections.push({ key: "description", title: "Product description", body: asString(data.product_description) });
  }
  const keyFeatures = asStringList(data.key_features ?? data.keyFeatures);
  if (keyFeatures.length) {
    sections.push({ key: "features", title: "Key features", bullets: keyFeatures });
  }
  const audience = asStringList(data.target_audience ?? data.targetAudience);
  if (audience.length) {
    sections.push({ key: "audience", title: "Target audience", bullets: audience });
  }

  if (data.objective) sections.push({ key: "objective", title: "Objective", body: asString(data.objective) });
  if (data.background) sections.push({ key: "background", title: "Background", body: asString(data.background) });

  const scope = data.scope as { inScope?: string[]; outOfScope?: string[] } | undefined;
  if (scope?.inScope?.length) {
    sections.push({ key: "in_scope", title: "In scope", bullets: scope.inScope.map(String) });
  }
  if (scope?.outOfScope?.length) {
    sections.push({ key: "out_scope", title: "Out of scope", bullets: scope.outOfScope.map(String) });
  }

  const roles = data.userRoles as { role: string; access: string; estimated?: string }[] | undefined;
  if (roles?.length) {
    sections.push({
      key: "roles",
      title: "User roles",
      table: {
        columns: ["Role", "Access", "Estimated users"],
        rows: roles.map((r) => [r.role, r.access, r.estimated ?? "—"]),
      },
    });
  }

  const workflows = asStringList(data.coreWorkflows);
  if (workflows.length) {
    sections.push({ key: "workflows", title: "Core workflows", bullets: workflows });
  }

  const rules = asStringList(data.businessRules);
  if (rules.length) {
    sections.push({ key: "rules", title: "Business rules", bullets: rules });
  }

  const success = asStringList(data.successCriteria);
  if (success.length) {
    sections.push({ key: "success", title: "Success criteria", bullets: success });
  }

  const assumptions = asStringList(data.assumptions);
  if (assumptions.length) {
    sections.push({ key: "assumptions", title: "Assumptions", bullets: assumptions });
  }

  const risks = data.risks as { risk: string; impact: string; mitigation: string; owner?: string }[] | undefined;
  if (risks?.length) {
    sections.push({
      key: "risks",
      title: "Risks",
      table: {
        columns: ["Risk", "Impact", "Mitigation", "Owner"],
        rows: risks.map((r) => [r.risk, r.impact, r.mitigation, r.owner ?? "—"]),
      },
    });
  }

  const questions = asStringList(data.openQuestions);
  if (questions.length) {
    sections.push({ key: "questions", title: "Open questions", bullets: questions });
  }

  return sections;
}

function buildWorkflowSections(data: Record<string, unknown>): SectionDoc[] {
  const sections: SectionDoc[] = [];
  if (data.trigger) {
    sections.push({ key: "trigger", title: "Trigger", body: asString(data.trigger) });
  }

  const steps = data.steps as Record<string, unknown>[] | undefined;
  if (steps?.length) {
    const hasRichSteps = steps.some((s) => s.step_description || s.inputs || s.outputs);
    if (hasRichSteps) {
      sections.push({
        key: "steps",
        title: "Process steps",
        table: {
          columns: ["Step", "Description", "Inputs", "Outputs"],
          rows: steps.map((s) => [
            asString(s.step ?? s.step_name ?? s.name),
            asString(s.step_description ?? s.action ?? "—"),
            asStringList(s.inputs).join(", ") || "—",
            asStringList(s.outputs).join(", ") || "—",
          ]),
        },
      });
    } else {
      sections.push({
        key: "steps",
        title: "Process steps",
        table: {
          columns: ["Step", "Actor", "Action", "Output", "SLA"],
          rows: steps.map((s) => [
            asString(s.step ?? s.step_name ?? s.name),
            asString(s.actor ?? "—"),
            asString(s.action ?? "—"),
            asString(s.output ?? "—"),
            asString(s.sla ?? "—"),
          ]),
        },
      });
    }
  }

  const decisions = asStringList(data.decisionPoints);
  if (decisions.length) {
    sections.push({ key: "decisions", title: "Decision points", bullets: decisions });
  }

  const exceptions = asStringList(data.exceptionPaths);
  if (exceptions.length) {
    sections.push({ key: "exceptions", title: "Exception paths", bullets: exceptions });
  }

  return sections;
}

function buildAutomationSections(data: Record<string, unknown>): SectionDoc[] {
  const sections: SectionDoc[] = [];

  const triggers = data.triggers as Record<string, unknown>[] | undefined;
  if (triggers?.length) {
    sections.push({
      key: "triggers",
      title: "Triggers",
      table: {
        columns: ["Trigger", "Description", "Action"],
        rows: triggers.map((t) => [
          asString(t.event ?? t.trigger_name ?? t.name),
          asString(t.condition ?? t.description ?? "—"),
          asString(t.action),
        ]),
      },
    });
  }

  const notifications = data.notifications as { event: string; recipient: string; channel: string; template?: string }[] | undefined;
  if (notifications?.length) {
    sections.push({
      key: "notifications",
      title: "Notifications",
      table: {
        columns: ["Event", "Recipient", "Channel", "Template"],
        rows: notifications.map((n) => [n.event, n.recipient, n.channel, n.template ?? "—"]),
      },
    });
  }

  const escalations = data.escalations as { condition: string; action: string; recipient?: string }[] | undefined;
  if (escalations?.length) {
    sections.push({
      key: "escalations",
      title: "Escalations",
      table: {
        columns: ["Condition", "Action", "Recipient"],
        rows: escalations.map((e) => [e.condition, e.action, e.recipient ?? "—"]),
      },
    });
  }

  return sections;
}

function buildUxSections(data: Record<string, unknown>): SectionDoc[] {
  const sections: SectionDoc[] = [];
  const components = data.ui_components as { component_name: string; description: string; options?: string[] }[] | undefined;
  if (components?.length) {
    for (const component of components) {
      sections.push({
        key: component.component_name,
        title: component.component_name,
        body: component.description,
        bullets: component.options?.length ? component.options : undefined,
      });
    }
  }

  if (data.layoutType) {
    sections.push({ key: "layout", title: "Layout type", body: asString(data.layoutType) });
  }
  if (data.navigationModel) {
    sections.push({ key: "nav", title: "Navigation", body: asString(data.navigationModel) });
  }

  const screens = data.primaryScreens as { screen: string; purpose: string; keyActions?: string[] }[] | undefined;
  if (screens?.length) {
    sections.push({
      key: "screens",
      title: "Primary screens",
      table: {
        columns: ["Screen", "Purpose", "Key actions"],
        rows: screens.map((s) => [
          s.screen,
          s.purpose,
          (s.keyActions ?? []).join(", ") || "—",
        ]),
      },
    });
  }

  const theme = data.visualTheme as { mood?: string; primaryColor?: string; colorName?: string; rationale?: string } | undefined;
  if (theme) {
    sections.push({
      key: "theme",
      title: "Visual theme",
      body: [
        theme.mood && `Mood: ${theme.mood}`,
        theme.colorName && `Palette: ${theme.colorName}`,
        theme.primaryColor && `Primary: ${theme.primaryColor}`,
        theme.rationale,
      ]
        .filter(Boolean)
        .join("\n"),
    });
  }

  if (data.rationale) {
    sections.push({ key: "rationale", title: "Rationale", body: asString(data.rationale) });
  }

  return sections;
}

function buildAppSpecSections(data: Record<string, unknown>): SectionDoc[] {
  const sections: SectionDoc[] = [];

  const techReqs = data.technical_requirements as { requirement_name: string; description: string }[] | undefined;
  if (techReqs?.length) {
    sections.push({
      key: "technical",
      title: "Technical requirements",
      table: {
        columns: ["Requirement", "Description"],
        rows: techReqs.map((r) => [r.requirement_name, r.description]),
      },
    });
  }

  const infraReqs = data.infrastructure_requirements as { requirement_name: string; description: string }[] | undefined;
  if (infraReqs?.length) {
    sections.push({
      key: "infrastructure",
      title: "Infrastructure requirements",
      table: {
        columns: ["Requirement", "Description"],
        rows: infraReqs.map((r) => [r.requirement_name, r.description]),
      },
    });
  }

  if (data.tagline) sections.push({ key: "tagline", title: "Tagline", body: asString(data.tagline) });
  if (data.purpose) sections.push({ key: "purpose", title: "Purpose", body: asString(data.purpose) });
  if (data.appType) sections.push({ key: "type", title: "App type", body: asString(data.appType) });

  const features = asStringList(data.features);
  if (features.length) {
    sections.push({ key: "features", title: "Features", bullets: features });
  }

  const fields = data.fields as { name: string; label: string; type?: string; required?: boolean }[] | undefined;
  if (fields?.length) {
    sections.push({
      key: "fields",
      title: "Form fields",
      table: {
        columns: ["Name", "Label", "Type", "Required"],
        rows: fields.map((f) => [f.name, f.label, f.type ?? "text", String(f.required ?? false)]),
      },
    });
  }

  const statusFlow = asStringList(data.statusFlow);
  if (statusFlow.length) {
    sections.push({ key: "status", title: "Status flow", bullets: statusFlow });
  }

  if (data.primaryActionLabel) {
    sections.push({ key: "cta", title: "Primary action", body: asString(data.primaryActionLabel) });
  }

  const roles = asStringList(data.roles);
  if (roles.length) {
    sections.push({ key: "roles", title: "Roles", bullets: roles });
  }

  return sections;
}

function buildDocumentArtifact(
  stageKey: string,
  label: string,
  sections: SectionDoc[],
  appTitle: string,
): ArtifactContent {
  return {
    documentType: stageKey,
    label,
    format: "formal_doc",
    depthMode: "enterprise",
    meta: docMeta(`${appTitle} — ${label}`, appTitle),
    sections,
    nativeHtml: sectionsToHtml(sections),
  };
}

export function stageContentToArtifactContent(
  stageKey: string,
  data: unknown,
  appTitle = "Product",
): string {
  const record = (data ?? {}) as Record<string, unknown>;

  if (stageKey === "workflow_map") {
    const sections = withSections(buildWorkflowSections, record);
    const graph = briefToDiagramGraph(record);
    return JSON.stringify({
      ...buildDocumentArtifact(stageKey, "Workflow Map", sections, appTitle),
      diagramGraph: graph,
    });
  }

  if (stageKey === "data_model") {
    const dm = record;
    const fields = (dm.fields ?? []) as { name: string; label: string; type?: string; required?: boolean; options?: string[] }[];
    const entities = dm.entities as { entity_name: string; attributes: string[] }[] | undefined;
    const sections = withSections((data) => {
      const out: SectionDoc[] = [];
      if (data.primaryEntity) {
        out.push({ key: "entity", title: "Primary entity", body: asString(data.primaryEntity) });
      }
      const statusFlow = asStringList(data.statusFlow);
      if (statusFlow.length) {
        out.push({ key: "status", title: "Status flow", bullets: statusFlow });
      }
      const rels = data.relationships as { relationship_name?: string; description?: string }[] | undefined;
      if (rels?.length && typeof rels[0] === "object") {
        out.push({
          key: "relationships",
          title: "Relationships",
          table: {
            columns: ["Relationship", "Description"],
            rows: rels.map((r) =>
              typeof r === "string"
                ? [r, "—"]
                : [
                    asString(r.relationship_name),
                    asString(r.description ?? "—"),
                  ],
            ),
          },
        });
      } else {
        const relList = asStringList(data.relationships);
        if (relList.length) {
          out.push({ key: "relationships", title: "Relationships", bullets: relList });
        }
      }
      return out;
    }, dm);

    const sheets = entities?.length
      ? entities.map((e) => ({
          name: e.entity_name.slice(0, 31),
          columns: ["Attribute"],
          rows: e.attributes.map((a) => [a]),
        }))
      : [
          {
            name: asString(dm.primaryEntity) || "entities",
            columns: ["Field", "Label", "Type", "Required", "Options"],
            rows: fields.map((f) => [
              f.name,
              f.label,
              f.type ?? "text",
              String(f.required ?? false),
              (f.options ?? []).join(", ") || "—",
            ]),
          },
        ];

    return JSON.stringify({
      ...buildDocumentArtifact(stageKey, "Data Model", sections, appTitle),
      spreadsheetData: { sheets },
    });
  }

  if (stageKey === "ux_recommendation") {
    const ux = record;
    const sections = withSections(buildUxSections, ux);
    const theme = ux.visualTheme as { primaryColor?: string } | undefined;
    return JSON.stringify({
      ...buildDocumentArtifact(stageKey, "UX Recommendation", sections, appTitle),
      designVariants: [
        {
          id: "recommended",
          name: "Recommended",
          description:
            asString(ux.rationale) ||
            asString((ux.ui_components as { description?: string }[] | undefined)?.[0]?.description) ||
            "Recommended UX direction",
          previewColors: [
            theme?.primaryColor ?? "#c96342",
            "#1f2937",
            "#f8fafc",
          ],
        },
      ],
      selectedDesignId: "recommended",
    });
  }

  if (stageKey === "intake_summary") {
    return JSON.stringify(
      buildDocumentArtifact(stageKey, "Intake Summary", withSections(buildIntakeSections, record), appTitle),
    );
  }

  if (stageKey === "product_brief") {
    return JSON.stringify(
      buildDocumentArtifact(stageKey, "Product Brief", withSections(buildProductBriefSections, record), appTitle),
    );
  }

  if (stageKey === "automation_model") {
    return JSON.stringify(
      buildDocumentArtifact(stageKey, "Automation Model", withSections(buildAutomationSections, record), appTitle),
    );
  }

  if (stageKey === "app_spec") {
    return JSON.stringify(
      buildDocumentArtifact(stageKey, "App Spec", withSections(buildAppSpecSections, record), appTitle),
    );
  }

  const label = formatLabel(stageKey);
  return JSON.stringify(
    buildDocumentArtifact(stageKey, label, recordToSections(record), appTitle),
  );
}
