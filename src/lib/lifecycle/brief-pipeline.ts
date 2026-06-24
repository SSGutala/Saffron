import type { BriefJson, InspirationImage } from "@/types/lifecycle";
import { LIFECYCLE_STAGES } from "@/types/lifecycle";
import { completeChat, hasAIKey } from "@/lib/ai-provider";
import {
  briefToDiagramGraph,
  stageDataToProse,
} from "@/lib/artifacts/prose-formatter";

export { briefToDiagramGraph } from "@/lib/artifacts/prose-formatter";

export const BRIEF_STAGE_KEYS = LIFECYCLE_STAGES.map((s) => s.key);

const BRIEF_TEMPLATE = `Return ONLY valid JSON for an enterprise product brief. Keys: intakeSummary, productBrief, workflowMap, dataModel, automationModel, uxRecommendation, appSpec.
Each section must be domain-specific and detailed (not generic placeholders).`;

function demoBrief(prompt: string): BriefJson {
  return {
    intakeSummary: {
      understood: `Building a solution for: ${prompt.slice(0, 120)}`,
      businessProblem:
        "Teams lose hours on manual handoffs, spreadsheet tracking, and email approvals. Errors compound when status is unclear.",
      primaryUsers: ["Requester", "Approver", "Operations admin"],
      secondaryUsers: ["Finance reviewer", "Compliance auditor"],
      currentProcess:
        "Requests start in email or chat, get copied into spreadsheets, and approvals happen out of band with no audit trail.",
      mainOutcome: "Cut processing time by 40% and provide full traceability.",
    },
    productBrief: {
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
    workflowMap: {
      trigger: "User submits a new request",
      steps: [
        { step: "Draft", actor: "Requester", action: "Fill form", output: "Draft record", sla: "1 day" },
        { step: "Review", actor: "Manager", action: "Approve or reject", output: "Decision", sla: "2 days" },
        { step: "Fulfill", actor: "Ops", action: "Complete work", output: "Done", sla: "5 days" },
      ],
      decisionPoints: ["Amount > $5k → Director approval"],
      exceptionPaths: ["Rejected → return to requester with notes"],
    },
    dataModel: {
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
    automationModel: {
      triggers: [{ event: "Submitted", condition: "Valid form", action: "Notify approver" }],
      notifications: [{ event: "Approved", recipient: "Requester", channel: "Email", template: "Your request was approved" }],
      escalations: [{ condition: "SLA breach", action: "Escalate to director", recipient: "Director" }],
      documentGeneration: [],
      integrations: [],
    },
    uxRecommendation: {
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
    appSpec: {
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
  };
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
    return JSON.parse(text.slice(start, end + 1)) as BriefJson;
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

export function stageContentToArtifactContent(
  stageKey: string,
  data: unknown,
  prompt = "",
): string {
  const prose = stageDataToProse(stageKey, data, prompt);
  return JSON.stringify({
    documentType: stageKey,
    label: prose.meta?.title ?? stageKey.replace(/_/g, " "),
    format:
      stageKey === "workflow_map"
        ? "diagram"
        : stageKey === "data_model"
          ? "spreadsheet"
          : stageKey === "ux_recommendation"
            ? "mockup"
            : "formal_doc",
    meta: prose.meta,
    sections: prose.sections,
    nativeHtml: prose.nativeHtml,
    diagramGraph: prose.diagramGraph,
    spreadsheetData: prose.spreadsheetData,
    designVariants: prose.designVariants,
    selectedDesignId: prose.selectedDesignId,
  });
}
