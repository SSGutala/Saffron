"use client";

import type { ArtifactContent } from "@/types/artifacts";

export function SectionDocView({ content }: { content: ArtifactContent }) {
  return (
    <div className="h-full overflow-auto bg-zinc-200 p-8">
      <article className="max-w-[816px] mx-auto bg-white shadow-lg min-h-[11in] px-12 py-14 text-gray-900">
        <header className="border-b pb-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {content.meta?.title || content.label}
          </h1>
          <div className="flex gap-4 mt-3 text-xs text-gray-500 uppercase tracking-wide">
            {content.meta?.owner && <span>Owner: {content.meta.owner}</span>}
            {content.meta?.date && <span>{content.meta.date}</span>}
            {content.meta?.version && <span>v{content.meta.version}</span>}
          </div>
        </header>
        {content.nativeHtml && !content.nativeHtml.includes("<pre>") ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content.nativeHtml }}
          />
        ) : (
          (content.sections ?? []).map((s) => (
            <section key={s.key} className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
                {s.title}
              </h2>
              {s.body && (
                <p className="text-[15px] leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {s.body}
                </p>
              )}
              {s.bullets?.length ? (
                <ul className="mt-3 space-y-2 list-disc pl-5 text-[15px] text-gray-700">
                  {s.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              ) : null}
              {s.table?.columns?.length ? (
                <table className="mt-4 w-full text-sm border-collapse">
                  <thead>
                    <tr>
                      {s.table.columns.map((c) => (
                        <th key={c} className="border bg-gray-50 p-2 text-left font-semibold">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(s.table.rows ?? []).map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j} className="border p-2">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </section>
          ))
        )}
      </article>
    </div>
  );
}
