"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRightIcon, Loader2Icon, PlusIcon } from "lucide-react";
import { useState } from "react";

import { AriaShell, AriaTopBar } from "@/components/aria/aria-shell";
import { useTRPC } from "@/trpc/client";
import { NewProductDialog } from "./new-product-dialog";

export function ProductsListPage() {
  const trpc = useTRPC();
  const [newOpen, setNewOpen] = useState(false);

  const { data, isLoading } = useQuery(trpc.workspace.getDashboard.queryOptions());
  const products = data?.products ?? [];

  return (
    <AriaShell topBar={<AriaTopBar showNewProduct onNewProduct={() => setNewOpen(true)} />}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1e293b]">Products</h1>
            <p className="text-sm text-[#64748b] mt-1">{products.length} active workspaces</p>
          </div>
          <button
            type="button"
            onClick={() => setNewOpen(true)}
            className="aria-btn-primary h-10 px-4 text-sm flex items-center gap-2"
          >
            <PlusIcon className="size-4" />
            New Product
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
          </div>
        ) : products.length === 0 ? (
          <div className="aria-card p-12 text-center">
            <p className="text-[#64748b] mb-4">No products yet.</p>
            <button type="button" onClick={() => setNewOpen(true)} className="aria-btn-primary h-10 px-5 text-sm">
              Create your first product
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => {
              const pct =
                p.artifactTotal > 0
                  ? Math.round((p.artifactApproved / p.artifactTotal) * 100)
                  : 0;
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="aria-card p-5 flex items-center justify-between hover:border-[#6366f1]/40 transition-colors group"
                >
                  <div>
                    <h2 className="font-semibold text-[#1e293b] group-hover:text-[#6366f1]">
                      {p.displayName}
                    </h2>
                    <p className="text-sm text-[#64748b] mt-1">
                      {p.phaseLabel} · {p.artifactApproved}/{p.artifactTotal} approved ·{" "}
                      {p.pulse.approvalsWaiting} waiting
                    </p>
                    <div className="mt-2 h-1.5 rounded-full bg-[#e2e8f0] max-w-xs overflow-hidden">
                      <div className="h-full bg-[#6366f1]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <ChevronRightIcon className="size-5 text-[#94a3b8] group-hover:text-[#6366f1]" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <NewProductDialog open={newOpen} onOpenChange={setNewOpen} />
    </AriaShell>
  );
}
