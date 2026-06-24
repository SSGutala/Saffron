"use client";

import { PlusIcon, TrashIcon } from "lucide-react";

import type { SpreadsheetSheet } from "@/types/artifacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SpreadsheetEditorProps {
  sheets: SpreadsheetSheet[];
  onChange: (sheets: SpreadsheetSheet[]) => void;
}

export function SpreadsheetEditor({ sheets, onChange }: SpreadsheetEditorProps) {
  const sheet = sheets[0] ?? {
    name: "Sheet1",
    columns: ["A", "B", "C"],
    rows: [["", "", ""]],
  };

  const updateCell = (ri: number, ci: number, value: string) => {
    const rows = sheet.rows.map((r, i) =>
      i === ri ? r.map((c, j) => (j === ci ? value : c)) : r,
    );
    onChange([{ ...sheet, rows }]);
  };

  const addRow = () => {
    onChange([
      {
        ...sheet,
        rows: [...sheet.rows, sheet.columns.map(() => "")],
      },
    ]);
  };

  const addCol = () => {
    onChange([
      {
        ...sheet,
        columns: [...sheet.columns, `Col ${sheet.columns.length + 1}`],
        rows: sheet.rows.map((r) => [...r, ""]),
      },
    ]);
  };

  return (
    <div className="h-full flex flex-col bg-[#107c41] p-1">
      <div className="bg-[#217346] text-white text-xs px-3 py-1 flex gap-4">
        <span>Excel-style editor</span>
        <Button size="sm" variant="ghost" className="h-6 text-white" onClick={addRow}>
          <PlusIcon className="size-3" /> Row
        </Button>
        <Button size="sm" variant="ghost" className="h-6 text-white" onClick={addCol}>
          <PlusIcon className="size-3" /> Column
        </Button>
      </div>
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-zinc-100">
              <th className="border w-8" />
              {sheet.columns.map((c, ci) => (
                <th key={ci} className="border p-1 font-medium min-w-[100px]">
                  <Input
                    value={c}
                    className="h-7 border-0 bg-transparent font-semibold"
                    onChange={(e) => {
                      const columns = [...sheet.columns];
                      columns[ci] = e.target.value;
                      onChange([{ ...sheet, columns }]);
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row, ri) => (
              <tr key={ri}>
                <td className="border bg-zinc-50 text-center text-xs text-muted-foreground">
                  {ri + 1}
                </td>
                {row.map((cell, ci) => (
                  <td key={ci} className="border p-0">
                    <Input
                      value={String(cell)}
                      className="h-8 rounded-none border-0 focus-visible:ring-1"
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                    />
                  </td>
                ))}
                <td className="border w-8 p-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() =>
                      onChange([
                        {
                          ...sheet,
                          rows: sheet.rows.filter((_, i) => i !== ri),
                        },
                      ])
                    }
                  >
                    <TrashIcon className="size-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
