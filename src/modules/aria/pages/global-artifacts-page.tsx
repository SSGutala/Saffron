"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AriaShell, AriaTopBar } from "@/components/aria/aria-shell";
import { ArtifactsTable } from "@/modules/aria/components/artifacts-table";
import {
  GLOBAL_FILTER_LABELS,
  type GlobalArtifactFilter,
} from "@/lib/aria/global-filters";
import { useTRPC } from "@/trpc/client";

export function GlobalArtifactsPage({ filter }: { filter: GlobalArtifactFilter }) {
  return (
    <Suspense
      fallback={
        <AriaShell topBar={<AriaTopBar />}>
          <div className="flex justify-center py-20">
            <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
          </div>
        </AriaShell>
      }
    >
      <GlobalArtifactsContent filter={filter} />
    </Suspense>
  );
}

function GlobalArtifactsContent({ filter }: { filter: GlobalArtifactFilter }) {
  const trpc = useTRPC();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const title = GLOBAL_FILTER_LABELS[filter];

  const { data: artifacts, isLoading } = useQuery(
    trpc.workspace.getGlobalArtifacts.queryOptions({ filter }),
  );

  const items = useMemo(() => {
    const all = (artifacts ?? []).map((a) => ({ ...a, productId: a.productId }));
    if (!urlQuery.trim()) return all;
    const q = urlQuery.toLowerCase();
    return all.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.artifactType.toLowerCase().includes(q) ||
        (a.productName?.toLowerCase().includes(q) ?? false),
    );
  }, [artifacts, urlQuery]);

  return (
    <AriaShell topBar={<AriaTopBar searchPlaceholder={`Search ${title.toLowerCase()}…`} />}>
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-[#1e293b] mb-1">{title}</h1>
        <p className="text-sm text-[#64748b] mb-6">
          Across all products · {items.length} item{items.length !== 1 ? "s" : ""}
          {urlQuery ? ` matching “${urlQuery}”` : ""}
        </p>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
          </div>
        ) : items.length === 0 ? (
          <div className="aria-card p-12 text-center">
            <p className="text-[#64748b] mb-4">
              {urlQuery
                ? `No ${title.toLowerCase()} match your search.`
                : `No ${title.toLowerCase()} yet.`}
            </p>
            <Link href="/" className="text-[#6366f1] text-sm hover:underline">
              Create a product to get started
            </Link>
          </div>
        ) : (
          <ArtifactsTable artifacts={items} showProductColumn isLoading={false} />
        )}
      </div>
    </AriaShell>
  );
}