import type { StylePreview } from "@/types/lifecycle";

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

type Preset = (typeof STYLE_PRESETS)[number];

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Generates a static SVG UI mockup as a data URL — not functional, visual only. */
export function generateMockupImage(
  preset: Preset,
  prompt: string,
  screenTitle = "Dashboard",
): string {
  const isDark = preset.id === "bold_dark";
  const isWarm = preset.id === "warm_editorial";
  const bg = preset.previewColors[0] ?? "#f8fafc";
  const accent = preset.previewColors[1] ?? "#4f46e5";
  const card = isDark ? "#1e293b" : isWarm ? "#fffbeb" : "#ffffff";
  const text = isDark ? "#f8fafc" : "#1e2937";
  const muted = isDark ? "#94a3b8" : "#64748b";
  const border = isDark ? "#334155" : isWarm ? "#fde68a" : "#e2e8f0";
  const sidebar = isDark ? "#0f172a" : isWarm ? "#fef3c7" : "#f1f5f9";

  const title = esc(prompt.slice(0, 42) || screenTitle);
  const label = esc(preset.label);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520" viewBox="0 0 800 520">
  <defs>
    <linearGradient id="hdr" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="520" fill="${bg}"/>
  <rect x="0" y="0" width="160" height="520" fill="${sidebar}"/>
  <rect x="0" y="0" width="160" height="56" fill="${accent}" opacity="0.9"/>
  <text x="20" y="36" fill="white" font-family="system-ui,sans-serif" font-size="14" font-weight="700">Saffron</text>
  <rect x="16" y="72" width="128" height="28" rx="8" fill="${accent}" opacity="0.2"/>
  <text x="28" y="90" fill="${text}" font-family="system-ui,sans-serif" font-size="11">Overview</text>
  <rect x="16" y="108" width="128" height="28" rx="8" fill="${card}" stroke="${border}"/>
  <text x="28" y="126" fill="${muted}" font-family="system-ui,sans-serif" font-size="11">Requests</text>
  <rect x="16" y="144" width="128" height="28" rx="8" fill="${card}" stroke="${border}"/>
  <text x="28" y="162" fill="${muted}" font-family="system-ui,sans-serif" font-size="11">Approvals</text>
  <rect x="176" y="0" width="624" height="56" fill="${card}" stroke="${border}"/>
  <text x="196" y="34" fill="${text}" font-family="system-ui,sans-serif" font-size="16" font-weight="600">${title}</text>
  <rect x="196" y="72" width="584" height="64" rx="12" fill="url(#hdr)" stroke="${border}"/>
  <text x="216" y="100" fill="${text}" font-family="system-ui,sans-serif" font-size="13" font-weight="600">${label}</text>
  <text x="216" y="120" fill="${muted}" font-family="system-ui,sans-serif" font-size="11">${esc(preset.vibe.slice(0, 60))}</text>
  <rect x="196" y="152" width="280" height="120" rx="12" fill="${card}" stroke="${border}"/>
  <rect x="212" y="168" width="80" height="10" rx="4" fill="${muted}" opacity="0.4"/>
  <rect x="212" y="188" width="160" height="8" rx="4" fill="${muted}" opacity="0.25"/>
  <rect x="212" y="204" width="120" height="8" rx="4" fill="${muted}" opacity="0.25"/>
  <rect x="212" y="240" width="72" height="24" rx="8" fill="${accent}"/>
  <text x="228" y="256" fill="white" font-family="system-ui,sans-serif" font-size="10" font-weight="600">Action</text>
  <rect x="492" y="152" width="288" height="120" rx="12" fill="${card}" stroke="${border}"/>
  <rect x="508" y="168" width="100" height="10" rx="4" fill="${muted}" opacity="0.4"/>
  <rect x="508" y="188" width="200" height="8" rx="4" fill="${muted}" opacity="0.25"/>
  <rect x="508" y="240" width="56" height="20" rx="10" fill="${accent}" opacity="0.3"/>
  <rect x="196" y="288" width="584" height="200" rx="12" fill="${card}" stroke="${border}"/>
  <rect x="212" y="304" width="120" height="10" rx="4" fill="${muted}" opacity="0.4"/>
  ${[0, 1, 2].map((i) => `
  <rect x="212" y="${340 + i * 44}" width="552" height="36" rx="8" fill="${isDark ? "#0f172a" : "#f8fafc"}" stroke="${border}"/>
  <circle cx="228" cy="${358 + i * 44}" r="6" fill="${accent}" opacity="0.7"/>
  <rect x="244" y="${352 + i * 44}" width="180" height="8" rx="4" fill="${muted}" opacity="0.35"/>
  <rect x="680" y="${352 + i * 44}" width="68" height="20" rx="10" fill="${accent}" opacity="${0.5 + i * 0.15}"/>
  `).join("")}
  <text x="400" y="510" text-anchor="middle" fill="${muted}" font-family="system-ui,sans-serif" font-size="10">Static mockup — ${label}</text>
</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function buildStylePreview(
  preset: Preset,
  prompt: string,
): Pick<StylePreview, "id" | "label" | "vibe" | "direction" | "previewColors" | "previewImageUrl"> {
  return {
    id: preset.id,
    label: preset.label,
    vibe: preset.vibe,
    direction: preset.direction,
    previewColors: [...preset.previewColors],
    previewImageUrl: generateMockupImage(preset, prompt),
  };
}
