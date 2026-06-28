"use client";

import type { ArtifactContent } from "@/types/artifacts";
import { Badge } from "@/components/ui/badge";

interface NativeDraftPreviewProps {
  kind: string;
  content: ArtifactContent;
}

/** Structured read-only preview — NOT a fake editor. Aria owns the draft; connectors own editing. */
export function NativeDraftPreview({ kind, content }: NativeDraftPreviewProps) {
  return (
    <div className="h-full overflow-auto bg-muted/30">
      <div className="max-w-3xl mx-auto p-8 space-y-8">
        <header className="space-y-3 border-b border-border/60 pb-6">
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            Native Draft
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight">
            {content.meta?.title || content.label || "Untitled artifact"}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Aria generated this structured draft. Connect to an external source to edit in the
            native application — Google Docs, Lucidchart, Figma, Jira, and others.
          </p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            {content.meta?.owner && <span>Owner: {content.meta.owner}</span>}
            {content.meta?.date && <span>{content.meta.date}</span>}
            {content.meta?.version && <span>v{content.meta.version}</span>}
          </div>
        </header>

        {kind === "DIAGRAM" && content.diagramGraph && (
          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Workflow Structure
            </h2>
            <div className="grid gap-2">
              {(content.diagramGraph.nodes ?? []).map((node) => (
                <div
                  key={node.id}
                  className="rounded-lg border border-border/60 bg-card/50 px-4 py-3 text-sm"
                >
                  {node.data.label}
                  {node.data.lane && (
                    <span className="ml-2 text-xs text-muted-foreground">({node.data.lane})</span>
                  )}
                </div>
              ))}
            </div>
            {(content.diagramGraph.edges ?? []).length > 0 && (
              <div className="text-xs text-muted-foreground space-y-1 pt-2">
                {(content.diagramGraph.edges ?? []).map((e) => (
                  <p key={e.id}>
                    {e.source} → {e.target}
                    {e.label ? ` (${e.label})` : ""}
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        {kind === "SPREADSHEET" &&
          (content.spreadsheetData?.sheets ?? []).map((sheet) => (
            <section key={sheet.name} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {sheet.name}
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border/60">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      {sheet.columns.map((c) => (
                        <th key={c} className="px-3 py-2 text-left font-medium">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sheet.rows.slice(0, 12).map((row, i) => (
                      <tr key={i} className="border-b border-border/40">
                        {row.map((cell, j) => (
                          <td key={j} className="px-3 py-2 text-muted-foreground">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sheet.rows.length > 12 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    +{sheet.rows.length - 12} more rows
                  </p>
                )}
              </div>
            </section>
          ))}

        {kind === "PRESENTATION" &&
          (content.slides ?? []).map((slide, i) => (
            <section
              key={slide.id}
              className="rounded-lg border border-border/60 bg-card/40 p-5 space-y-2"
            >
              <p className="text-xs text-muted-foreground">Slide {i + 1}</p>
              <h3 className="font-medium">{slide.title}</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {slide.bullets.map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </section>
          ))}

        {kind === "DESIGN" &&
          (content.designVariants ?? []).map((v) => (
            <section
              key={v.id}
              className="rounded-lg border border-border/60 bg-card/40 p-5 space-y-2"
            >
              <h3 className="font-medium">{v.name}</h3>
              {v.description && (
                <p className="text-sm text-muted-foreground">{v.description}</p>
              )}
              {v.previewColors?.length ? (
                <div className="flex gap-2 pt-1">
                  {v.previewColors.map((c) => (
                    <span
                      key={c}
                      className="size-6 rounded-full border"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              ) : null}
            </section>
          ))}

        {(kind === "DOCUMENT" || !["DIAGRAM", "SPREADSHEET", "PRESENTATION", "DESIGN"].includes(kind)) &&
          (content.sections ?? []).map((s) => (
            <section key={s.key} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {s.title}
              </h2>
              {s.body && (
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {s.body}
                </p>
              )}
              {s.bullets?.length ? (
                <ul className="list-disc pl-5 text-sm space-y-1.5 text-foreground/90">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
              {s.table?.columns?.length ? (
                <div className="overflow-x-auto rounded-lg border border-border/60">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        {s.table.columns.map((c) => (
                          <th key={c} className="px-3 py-2 text-left font-medium">
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(s.table.rows ?? []).map((row, i) => (
                        <tr key={i} className="border-b border-border/40">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </section>
          ))}
      </div>
    </div>
  );
}
