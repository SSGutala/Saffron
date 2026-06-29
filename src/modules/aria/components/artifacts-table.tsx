"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AriaStatusBadge, mapApprovalStatus } from "@/components/aria/aria-ui";
import type { AriaArtifactView } from "@/types/aria";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";

const SOURCE_ICONS: Record<string, string> = {
  "Google Docs": "📝",
  Lucidchart: "📊",
  Jira: "🎫",
  Figma: "🎨",
  "Aria (Native Draft)": "✦",
};

const TABS = ["All", "Awaiting Approval", "Approved", "Draft"] as const;

export type ArtifactsTableItem = AriaArtifactView & {
  productName?: string;
  productId?: string;
};

interface ArtifactsTableProps {
  artifacts: ArtifactsTableItem[];
  projectId?: string;
  isLoading?: boolean;
  showProductColumn?: boolean;
  onAddArtifact?: () => void;
  showAddButton?: boolean;
}

export function ArtifactsTable({
  artifacts,
  projectId,
  isLoading,
  showProductColumn,
  onAddArtifact,
  showAddButton,
}: ArtifactsTableProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");

  const approve = useMutation(
    trpc.lifecycle.approveStage.mutationOptions({
      onSuccess: () => {
        if (projectId) {
          queryClient.invalidateQueries(
            trpc.workspace.getProductWorkspace.queryOptions({ projectId }),
          );
        }
        queryClient.invalidateQueries(trpc.workspace.getGlobalArtifacts.queryOptions({}));
        toast.success("Approved");
      },
    }),
  );

  const filtered = artifacts.filter((a) => {
    if (tab === "Approved" && a.approvalStatus !== "APPROVED") return false;
    if (tab === "Awaiting Approval" && a.approvalStatus === "APPROVED") return false;
    if (tab === "Draft" && a.approvalStatus === "APPROVED") return false;
    if (query) {
      const q = query.toLowerCase();
      return (
        a.title.toLowerCase().includes(q) ||
        a.artifactType.toLowerCase().includes(q) ||
        (a.productName?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const linkFor = (a: ArtifactsTableItem) => {
    const pid = projectId ?? a.productId;
    return `/products/${pid}/artifacts/${a.id}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-1 border-b border-[#e2e8f0]">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                tab === t
                  ? "border-[#6366f1] text-[#6366f1]"
                  : "border-transparent text-[#64748b] hover:text-[#1e293b]",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter artifacts…"
            className="h-9 px-3 rounded-lg border border-[#e2e8f0] bg-white text-sm w-48"
          />
          {showAddButton && onAddArtifact && (
            <button
              type="button"
              onClick={onAddArtifact}
              className="aria-btn-primary h-9 px-4 text-sm"
            >
              + Add Artifact
            </button>
          )}
        </div>
      </div>

      <div className="aria-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#e2e8f0] bg-[#f8f9fb]">
              {["Artifact", "Type", "Source", ...(showProductColumn ? ["Product"] : []), "Status", "Updated", "Approval"].map(
                (h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => (
              <tr
                key={a.id}
                className="border-b border-[#e2e8f0] hover:bg-[#f8f9fb]/80 transition-colors"
              >
                <td className="px-4 py-3">
                  <Link
                    href={linkFor(a)}
                    className="flex items-center gap-3 font-medium text-[#1e293b] hover:text-[#6366f1]"
                  >
                    <span className="size-8 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-sm">
                      {SOURCE_ICONS[a.sourceAppLabel] ?? "📄"}
                    </span>
                    {a.title}
                  </Link>
                </td>
                <td className="px-4 py-3 text-[#64748b] capitalize">
                  {a.artifactType.replace(/_/g, " ")}
                </td>
                <td className="px-4 py-3 text-[#64748b]">
                  {a.sourceAppLabel.replace(" (Native Draft)", "")}
                </td>
                {showProductColumn && (
                  <td className="px-4 py-3 text-[#64748b]">{a.productName}</td>
                )}
                <td className="px-4 py-3">
                  <AriaStatusBadge status={mapApprovalStatus(a.approvalStatus)} />
                </td>
                <td className="px-4 py-3 text-[#94a3b8] text-xs">
                  {new Date(a.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </td>
                <td className="px-4 py-3">
                  {a.approvalStatus === "APPROVED" ? (
                    <span className="text-xs text-[#10b981] font-medium">Approved</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => approve.mutate({ artifactId: a.id })}
                      disabled={approve.isPending}
                      className="text-xs text-[#6366f1] font-medium hover:underline"
                    >
                      Review
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-12 text-[#64748b] text-sm">No artifacts match this view</p>
        )}
      </div>
    </div>
  );
}
