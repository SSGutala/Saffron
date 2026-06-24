import type { ArtifactContent, FileUrls, SectionDoc } from "@/types/artifacts";

export function contentToMarkdown(content: ArtifactContent, title: string) {
  const lines = [`# ${content.meta?.title || title}\n`];
  for (const s of content.sections ?? []) {
    lines.push(`## ${s.title}\n`);
    if (s.body) lines.push(s.body + "\n");
    if (s.bullets?.length) {
      s.bullets.forEach((b) => lines.push(`- ${b}`));
      lines.push("");
    }
    if (s.table?.columns?.length) {
      lines.push("| " + s.table.columns.join(" | ") + " |");
      lines.push("| " + s.table.columns.map(() => "---").join(" | ") + " |");
      for (const row of s.table.rows ?? []) {
        lines.push("| " + row.join(" | ") + " |");
      }
      lines.push("");
    }
  }
  return lines.join("\n");
}

export async function exportDocx(content: ArtifactContent, title: string) {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import("docx");

  const children = [
    new Paragraph({
      text: content.meta?.title || title,
      heading: HeadingLevel.TITLE,
    }),
  ];

  for (const s of content.sections ?? []) {
    children.push(
      new Paragraph({ text: s.title, heading: HeadingLevel.HEADING_1 }),
    );
    if (s.body) {
      children.push(new Paragraph({ children: [new TextRun(s.body)] }));
    }
    for (const b of s.bullets ?? []) {
      children.push(new Paragraph({ text: `• ${b}` }));
    }
  }

  if (!content.sections?.length && content.nativeHtml) {
    children.push(
      new Paragraph({
        children: [new TextRun(content.nativeHtml.replace(/<[^>]+>/g, " "))],
      }),
    );
  }

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

export async function exportXlsx(content: ArtifactContent) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  const sheets = content.spreadsheetData?.sheets ?? [
    {
      name: "Sheet1",
      columns: ["A", "B"],
      rows: [["No data", ""]],
    },
  ];
  for (const sheet of sheets) {
    const data = [sheet.columns, ...sheet.rows.map((r) => r.map(String))];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

export async function exportPdf(content: ArtifactContent, title: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  let y = 20;
  const line = (text: string, size = 11, bold = false) => {
    doc.setFontSize(size);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    const lines = doc.splitTextToSize(text, 170);
    for (const l of lines) {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(l, 20, y);
      y += size * 0.45 + 4;
    }
  };

  line(content.meta?.title || title, 18, true);
  y += 4;

  for (const s of content.sections ?? []) {
    line(s.title, 14, true);
    if (s.body) line(s.body);
    for (const b of s.bullets ?? []) line(`• ${b}`);
    y += 4;
  }

  if (content.slides?.length) {
    for (const slide of content.slides) {
      doc.addPage();
      y = 20;
      line(slide.title, 16, true);
      for (const b of slide.bullets) line(`• ${b}`);
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}

export async function generateExports(
  content: ArtifactContent,
  title: string,
  formats: string[],
): Promise<FileUrls> {
  const urls: FileUrls = {};
  const toDataUrl = (buf: Buffer, mime: string) =>
    `data:${mime};base64,${buf.toString("base64")}`;

  if (formats.includes("md")) {
    urls.md = `data:text/markdown;base64,${Buffer.from(contentToMarkdown(content, title)).toString("base64")}`;
  }
  if (formats.includes("docx")) {
    urls.docx = toDataUrl(
      await exportDocx(content, title),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  }
  if (formats.includes("xlsx")) {
    urls.xlsx = toDataUrl(
      await exportXlsx(content),
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
  }
  if (formats.includes("pdf")) {
    urls.pdf = toDataUrl(await exportPdf(content, title), "application/pdf");
  }
  return urls;
}
