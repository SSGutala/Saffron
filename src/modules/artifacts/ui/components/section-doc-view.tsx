"use client";

import { useMemo } from "react";

import { normalizeArtifactContent } from "@/lib/artifacts/prose-formatter";
import type { ArtifactContent } from "@/types/artifacts";

export function SectionDocView({ content }: { content: ArtifactContent }) {
  const normalized = useMemo(() => normalizeArtifactContent(content), [content]);

  return (
    <div className="h-full overflow-auto bg-[#e8eaed] p-8">
      <article
        className="max-w-[816px] mx-auto bg-white min-h-[11in] px-16 py-14 text-gray-900 break-words"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.12)" }}
      >
        {normalized.nativeHtml ? (
          <div
            className="[&_h1]:text-[28px] [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-2 [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-wide [&_h2]:text-gray-500 [&_h2]:mt-7 [&_h2]:mb-3 [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:text-gray-700 [&_p]:mb-3.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-[15px] [&_li]:text-gray-700 [&_table]:w-full [&_td]:break-words [&_th]:break-words max-w-none overflow-hidden"
            dangerouslySetInnerHTML={{ __html: normalized.nativeHtml }}
          />
        ) : (
          <>
            <header className="border-b border-gray-200 pb-6 mb-8">
              <h1 className="text-[28px] font-bold text-gray-900 leading-tight">
                {normalized.meta?.title || normalized.label}
              </h1>
              <div className="flex gap-4 mt-3 text-xs text-gray-500 uppercase tracking-wide">
                {normalized.meta?.owner && <span>Owner: {normalized.meta.owner}</span>}
                {normalized.meta?.date && <span>{normalized.meta.date}</span>}
                {normalized.meta?.version && <span>v{normalized.meta.version}</span>}
              </div>
            </header>
            {(normalized.sections ?? []).map((s) => (
              <section key={s.key} className="mb-8">
                <h2 className="text-[13px] font-bold uppercase tracking-wider text-gray-500 mb-3">
                  {s.title}
                </h2>
                {s.body && (
                  <p className="text-[15px] leading-relaxed text-gray-700 whitespace-pre-wrap break-words">
                    {s.body}
                  </p>
                )}
                {s.bullets?.length ? (
                  <ul className="mt-3 space-y-2 list-disc pl-5 text-[15px] text-gray-700">
                    {s.bullets.map((b) => (
                      <li key={b} className="break-words">
                        {b}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {s.table?.columns?.length ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr>
                          {s.table.columns.map((c) => (
                            <th
                              key={c}
                              className="border border-gray-200 bg-gray-50 p-2.5 text-left font-semibold text-gray-700"
                            >
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(s.table.rows ?? []).map((row, i) => (
                          <tr key={i}>
                            {row.map((cell, j) => (
                              <td
                                key={j}
                                className="border border-gray-200 p-2.5 text-gray-700 break-words"
                              >
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
          </>
        )}
      </article>
    </div>
  );
}
