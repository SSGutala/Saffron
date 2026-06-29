"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";

import { AriaShell, AriaTopBar } from "@/components/aria/aria-shell";
import { useTRPC } from "@/trpc/client";

export function ActivityPage() {
  const trpc = useTRPC();
  const { data: events, isLoading } = useQuery(
    trpc.workspace.getGlobalActivity.queryOptions({ limit: 50 }),
  );

  return (
    <AriaShell topBar={<AriaTopBar searchPlaceholder="Search activity…" />}>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-[#1e293b]">Activity</h1>
        <p className="text-sm text-[#64748b]">Delivery events across all products</p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
          </div>
        ) : !events?.length ? (
          <div className="aria-card p-12 text-center text-[#64748b]">
            Activity will appear as you create products, approve artifacts, and connect tools.
          </div>
        ) : (
          <ul className="space-y-0 divide-y divide-[#e2e8f0] aria-card">
            {events.map((e) => (
              <li key={e.id} className="px-5 py-4 flex gap-4">
                <div className="size-2 rounded-full bg-[#6366f1] mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1e293b]">{e.title}</p>
                  <Link
                    href={`/products/${e.projectId}`}
                    className="text-xs text-[#6366f1] hover:underline"
                  >
                    {e.productName}
                  </Link>
                </div>
                <time className="text-xs text-[#94a3b8] shrink-0 tabular-nums">
                  {new Date(e.createdAt).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AriaShell>
  );
}
