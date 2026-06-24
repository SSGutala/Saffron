export type DocTemplate = {
  documentType: string;
  label: string;
  kind: "DOCUMENT" | "DIAGRAM" | "SPREADSHEET" | "PRESENTATION" | "DESIGN" | "ROADMAP";
  format: string;
  exportFormats: string[];
  purpose: string;
  sections: { key: string; title: string; guidance: string }[];
};

export const DOCUMENT_TEMPLATES: Record<string, DocTemplate> = {
  prd: {
    documentType: "prd",
    label: "Product Requirements Document",
    kind: "DOCUMENT",
    format: "formal_doc",
    exportFormats: ["pdf", "docx", "md"],
    purpose: "Define what to build and why.",
    sections: [
      { key: "executive_summary", title: "Executive Summary", guidance: "High-level overview for leadership." },
      { key: "problem", title: "Problem Statement", guidance: "The pain being solved." },
      { key: "goals", title: "Goals & Non-Goals", guidance: "In scope and out of scope." },
      { key: "requirements", title: "Functional Requirements", guidance: "Numbered testable requirements." },
      { key: "success_metrics", title: "Success Metrics", guidance: "KPIs with targets." },
    ],
  },
  sop: {
    documentType: "sop",
    label: "Standard Operating Procedure",
    kind: "DOCUMENT",
    format: "formal_doc",
    exportFormats: ["pdf", "docx"],
    purpose: "Step-by-step operational procedure.",
    sections: [
      { key: "purpose", title: "Purpose", guidance: "Why this SOP exists." },
      { key: "scope", title: "Scope", guidance: "Who and what it covers." },
      { key: "procedure", title: "Procedure", guidance: "Numbered steps." },
      { key: "roles", title: "Roles & Responsibilities", guidance: "RACI-style ownership." },
    ],
  },
  business_case: {
    documentType: "business_case",
    label: "Business Case",
    kind: "DOCUMENT",
    format: "formal_doc",
    exportFormats: ["pdf", "docx"],
    purpose: "Justify investment with ROI.",
    sections: [
      { key: "summary", title: "Executive Summary", guidance: "Recommendation in 2 paragraphs." },
      { key: "financials", title: "Financial Analysis", guidance: "Costs, benefits, ROI." },
      { key: "risks", title: "Risks", guidance: "Key risks and mitigations." },
    ],
  },
  workflow_map: {
    documentType: "workflow_map",
    label: "Workflow Diagram",
    kind: "DIAGRAM",
    format: "diagram",
    exportFormats: ["pdf", "png", "svg"],
    purpose: "Visual process flow with swimlanes.",
    sections: [],
  },
  finance_model: {
    documentType: "finance_model",
    label: "Finance Spreadsheet",
    kind: "SPREADSHEET",
    format: "spreadsheet",
    exportFormats: ["xlsx", "csv", "pdf"],
    purpose: "Financial model with charts.",
    sections: [],
  },
  pitch_deck: {
    documentType: "pitch_deck",
    label: "Pitch Deck",
    kind: "PRESENTATION",
    format: "presentation",
    exportFormats: ["pdf", "pptx"],
    purpose: "Investor or stakeholder presentation.",
    sections: [],
  },
  ux_design: {
    documentType: "ux_design",
    label: "UX Design",
    kind: "DESIGN",
    format: "mockup",
    exportFormats: ["pdf", "png"],
    purpose: "Three design directions in Figma.",
    sections: [],
  },
  risk_assessment: {
    documentType: "risk_assessment",
    label: "Risk Assessment",
    kind: "DOCUMENT",
    format: "formal_doc",
    exportFormats: ["pdf", "docx"],
    purpose: "Enterprise risk register.",
    sections: [
      { key: "overview", title: "Overview", guidance: "Scope of assessment." },
      { key: "risk_register", title: "Risk Register", guidance: "Risks with likelihood and impact." },
      { key: "mitigations", title: "Mitigations", guidance: "Controls and owners." },
    ],
  },
  technical_spec: {
    documentType: "technical_spec",
    label: "Technical Specification",
    kind: "DOCUMENT",
    format: "formal_doc",
    exportFormats: ["pdf", "docx"],
    purpose: "Engineering implementation spec.",
    sections: [
      { key: "architecture", title: "Architecture", guidance: "System design overview." },
      { key: "api", title: "API Design", guidance: "Endpoints and contracts." },
      { key: "data", title: "Data Model", guidance: "Entities and relationships." },
    ],
  },
  product_roadmap: {
    documentType: "product_roadmap",
    label: "Product Roadmap",
    kind: "ROADMAP",
    format: "roadmap",
    exportFormats: ["pdf", "png", "md"],
    purpose: "Visual Gantt-style product roadmap with swimlanes and milestones.",
    sections: [],
  },
};

export function listDocumentTypes() {
  return Object.values(DOCUMENT_TEMPLATES);
}

export function resolveDocumentType(input: string): DocTemplate | null {
  const q = input.toLowerCase().trim();
  for (const t of Object.values(DOCUMENT_TEMPLATES)) {
    if (t.documentType === q || t.label.toLowerCase().includes(q)) return t;
  }
  return null;
}

export function buildDynamicTemplate(name: string, description: string): DocTemplate {
  return {
    documentType: "custom",
    label: name || "Custom Document",
    kind: "DOCUMENT",
    format: "formal_doc",
    exportFormats: ["pdf", "docx"],
    purpose: description || "Custom document requested by user.",
    sections: [
      { key: "overview", title: "Overview", guidance: description },
      { key: "details", title: "Details", guidance: "Main content based on user request." },
      { key: "next_steps", title: "Next Steps", guidance: "Recommended actions." },
    ],
  };
}
