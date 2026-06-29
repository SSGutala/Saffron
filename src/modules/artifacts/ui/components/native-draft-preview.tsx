"use client";

import type { ArtifactContent } from "@/types/artifacts";

interface NativeDraftPreviewProps {
  kind: string;
  content: ArtifactContent;
}

/** Structured read-only preview — NOT a fake editor. Aria owns the draft; connectors own editing. */
export function NativeDraftPreview({ kind, content }: NativeDraftPreviewProps) {
  return (
    <div className="h-full overflow-auto bg-[#f8f9fb]">
      <div className="max-w-3xl mx-auto p-8 space-y-8">
        {kind !== "DOCUMENT" && (
          <header className="space-y-3 border-b border-[#e2e8f0] pb-6">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-[#eef2ff] text-[#6366f1] border border-[#c7d2fe]">
              Native Draft
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-[#1e293b]">
              {content.meta?.title || content.label || "Untitled artifact"}
            </h1>
          </header>
        )}

        {kind === "DOCUMENT" && (
          <article className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm px-12 py-14 text-[#1e293b]">
            <header className="border-b border-[#e2e8f0] pb-6 mb-8">
              <h1 className="text-2xl font-bold">
                {content.meta?.title || content.label || "Product Requirements Document"}
              </h1>
              <p className="text-sm text-[#64748b] mt-2">
                {content.meta?.project ?? "Asset Request System"}
              </p>
            </header>
            {(content.sections ?? []).map((s, i) => (
              <section key={s.key} className="mb-8">
                <h2 className="text-lg font-semibold text-[#1e293b] mb-3">
                  {i + 1}. {s.title}
                </h2>
                {s.body && (
                  <p className="text-[15px] leading-relaxed text-[#475569] whitespace-pre-wrap">
                    {s.body}
                  </p>
                )}
                {s.bullets?.length ? (
                  <ul className="list-disc pl-5 text-[15px] space-y-1.5 text-[#475569] mt-2">
                    {s.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </article>
        )}

        {kind === "DIAGRAM" && content.diagramGraph && (
          <section className="space-y-4">
            <div className="rounded-xl border border-[#e2e8f0] bg-white p-8 min-h-[400px] relative overflow-auto">
              <div className="flex flex-col items-center gap-4 max-w-md mx-auto py-8">
                {(content.diagramGraph.nodes ?? []).map((node, i) => (
                  <div key={node.id} className="flex flex-col items-center w-full">
                    <div className="w-full max-w-xs rounded-lg border-2 border-[#6366f1]/30 bg-[#eef2ff] px-6 py-3 text-center text-sm font-medium text-[#1e293b] shadow-sm">
                      {node.data.label}
                    </div>
                    {i < (content.diagramGraph?.nodes?.length ?? 0) - 1 && (
                      <div className="flex flex-col items-center py-2 text-[#94a3b8]">
                        <div className="w-px h-6 bg-[#cbd5e1]" />
                        <span className="text-lg">↓</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
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

        {(kind === "DOCUMENT" ? false : !["DIAGRAM", "SPREADSHEET", "PRESENTATION", "DESIGN"].includes(kind)) &&
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
