"use client";

import { PlusIcon, TrashIcon } from "lucide-react";
import { useState } from "react";

import type { SpreadsheetSheet } from "@/types/artifacts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SpreadsheetEditorProps {
  sheets: SpreadsheetSheet[];
  onChange: (sheets: SpreadsheetSheet[]) => void;
}

function colLetter(i: number) {
  let s = "";
  let n = i;
  do {
    s = String.fromCharCode(65 + (n % 26)) + s;
    n = Math.floor(n / 26) - 1;
  } while (n >= 0);
  return s;
}

export function SpreadsheetEditor({ sheets, onChange }: SpreadsheetEditorProps) {
  const sheet = sheets[0] ?? {
    name: "Sheet1",
    columns: ["Field", "Label", "Type", "Required"],
    rows: [
      ["title", "Title", "text", "Yes"],
      ["status", "Status", "select", "Yes"],
    ],
  };

  const [activeCell, setActiveCell] = useState("A1");

  const updateCell = (ri: number, ci: number, value: string) => {
    const rows = sheet.rows.map((r, i) =>
      i === ri ? r.map((c, j) => (j === ci ? value : c)) : r,
    );
    onChange([{ ...sheet, rows }]);
    setActiveCell(`${colLetter(ci)}${ri + 1}`);
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
        columns: [...sheet.columns, `Column ${sheet.columns.length + 1}`],
        rows: sheet.rows.map((r) => [...r, ""]),
      },
    ]);
  };

  const activeParts = activeCell.match(/^([A-Z]+)(\d+)$/);
  let activeVal = "";
  if (activeParts) {
    const ri = Number(activeParts[2]) - 1;
    let ci = 0;
    for (const ch of activeParts[1]) {
      ci = ci * 26 + (ch.charCodeAt(0) - 64);
    }
    ci -= 1;
    if (sheet.rows[ri] && sheet.rows[ri][ci] !== undefined) {
      activeVal = String(sheet.rows[ri][ci]);
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#f3f3f3] select-none">
      {/* Excel ribbon */}
      <div className="bg-[#217346] text-white px-3 py-1.5 flex items-center gap-3 text-xs shrink-0">
        <span className="font-semibold">Excel</span>
        <span className="opacity-80">{sheet.name}</span>
        <div className="ml-auto flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-white hover:bg-white/20 hover:text-white"
            onClick={addRow}
          >
            <PlusIcon className="size-3.5 mr-1" /> Row
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-white hover:bg-white/20 hover:text-white"
            onClick={addCol}
          >
            <PlusIcon className="size-3.5 mr-1" /> Column
          </Button>
        </div>
      </div>

      {/* Formula bar */}
      <div className="flex items-center gap-2 px-2 py-1 bg-white border-b text-sm shrink-0">
        <span className="w-12 text-center font-mono text-xs text-gray-500 border-r pr-2">
          {activeCell}
        </span>
        <span className="text-gray-400">fx</span>
        <input
          className="flex-1 h-7 px-2 border rounded text-sm bg-gray-50"
          readOnly
          value={activeVal}
          placeholder="Select a cell"
        />
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="border-collapse text-[13px] min-w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-10 border border-gray-300 bg-gray-100 text-gray-500 font-normal text-xs" />
              {sheet.columns.map((_, ci) => (
                <th
                  key={ci}
                  className="w-28 min-w-[112px] border border-gray-300 bg-gray-100 text-gray-600 font-medium text-xs py-1"
                >
                  {colLetter(ci)}
                </th>
              ))}
              <th className="w-8 border border-gray-300 bg-gray-100" />
            </tr>
            <tr>
              <th className="border border-gray-300 bg-gray-50" />
              {sheet.columns.map((c, ci) => (
                <th key={ci} className="border border-gray-300 bg-gray-50 p-0">
                  <input
                    value={c}
                    className="w-full h-8 px-2 font-semibold text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-[#217346] focus:ring-inset"
                    onChange={(e) => {
                      const columns = [...sheet.columns];
                      columns[ci] = e.target.value;
                      onChange([{ ...sheet, columns }]);
                    }}
                  />
                </th>
              ))}
              <th className="border border-gray-300 bg-gray-50" />
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row, ri) => (
              <tr key={ri}>
                <td className="border border-gray-300 bg-gray-100 text-center text-xs text-gray-500 font-mono">
                  {ri + 1}
                </td>
                {row.map((cell, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "border border-gray-300 p-0 h-8",
                      activeCell === `${colLetter(ci)}${ri + 1}` && "ring-2 ring-[#217346] ring-inset",
                    )}
                  >
                    <input
                      value={String(cell)}
                      className="w-full h-8 px-2 bg-white border-0 focus:outline-none"
                      onFocus={() => setActiveCell(`${colLetter(ci)}${ri + 1}`)}
                      onChange={(e) => updateCell(ri, ci, e.target.value)}
                    />
                  </td>
                ))}
                <td className="border border-gray-300 p-0 w-8">
                  <button
                    type="button"
                    className="w-full h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50"
                    onClick={() =>
                      onChange([
                        {
                          ...sheet,
                          rows: sheet.rows.filter((_, i) => i !== ri),
                        },
                      ])
                    }
                  >
                    <TrashIcon className="size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Sheet tabs */}
      <div className="flex gap-0 border-t bg-[#f3f3f3] shrink-0">
        <button
          type="button"
          className="px-4 py-1.5 text-xs font-medium bg-white border-r border-t-2 border-t-[#217346] text-[#217346]"
        >
          {sheet.name}
        </button>
      </div>
    </div>
  );
}
