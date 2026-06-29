"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRightIcon,
  Loader2Icon,
  PlusIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { AriaShell, AriaTopBar } from "@/components/aria/aria-shell";
import { HealthDonut } from "@/components/aria/aria-ui";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";
import { NewProductDialog } from "./new-product-dialog";

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

export function AriaHomeDashboard() {
  const { user } = useAuth();
  const trpc = useTRPC();
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    ...trpc.workspace.getDashboard.queryOptions(),
    enabled: !!user,
  });

  const products = data?.products ?? [];
  const stats = data?.stats;

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.displayName.toLowerCase().includes(q));
  }, [products, search]);

  const recommendations = useMemo(
    () =>
      products
        .flatMap((p) =>
          p.recommendations.map((r) => ({
            ...r,
            productId: p.id,
            productName: p.displayName,
          })),
        )
        .slice(0, 4),
    [products],
  );

  const firstName = user?.name?.split(" ")[0] ?? "there";
  const hasProducts = products.length > 0;

  return (
    <AriaShell
      topBar={
        <AriaTopBar
          showNewProduct
          onNewProduct={() => setNewProductOpen(true)}
          searchValue={search}
          onSearchChange={setSearch}
        />
      }
    >
      <div className="p-6 space-y-8 max-w-[1400px]">
        <div>
          <h1 className="text-2xl font-semibold text-[#1e293b]">
            Welcome back, {firstName} 👋
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            Here&apos;s what&apos;s happening with your products
          </p>
        </div>

        {hasProducts && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              {
                label: "Active Products",
                value: String(stats?.productCount ?? products.length),
                sub: `${stats?.connectedToolsCount ?? 0} tools connected`,
                subColor: "text-[#64748b]",
              },
              {
                label: "Artifacts",
                value: String(stats?.artifactCount ?? 0),
                sub: "Across all products",
                subColor: "text-[#64748b]",
              },
              {
                label: "Approvals",
                value: String(stats?.approvedCount ?? 0),
                sub: `${stats?.approvalsWaiting ?? 0} awaiting review`,
                subColor: "text-[#64748b]",
              },
              {
                label: "Risks",
                value: String(stats?.riskCount ?? 0),
                sub:
                  (stats?.riskCount ?? 0) > 0
                    ? "Products need attention"
                    : "No high-risk products",
                subColor:
                  (stats?.riskCount ?? 0) > 0 ? "text-[#ef4444]" : "text-[#64748b]",
              },
            ].map((stat) => (
              <div key={stat.label} className="aria-card p-4">
                <p className="text-xs text-[#64748b]">{stat.label}</p>
                <p className="text-2xl font-semibold text-[#1e293b] mt-1">{stat.value}</p>
                <p className={cn("text-[11px] mt-1", stat.subColor)}>{stat.sub}</p>
              </div>
            ))}
            <div className="aria-card p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#64748b]">Overall Health</p>
                <p className="text-[11px] text-[#64748b] mt-3">Delivery readiness</p>
              </div>
              <HealthDonut value={stats?.healthPercent ?? 0} />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20 text-[#64748b]">
            <Loader2Icon className="size-6 animate-spin" />
          </div>
        ) : !hasProducts ? (
          <div className="aria-card p-12 text-center">
            <p className="text-[#64748b] mb-4">
              No products yet. Create your first product workspace.
            </p>
            <button
              type="button"
              onClick={() => setNewProductOpen(true)}
              className="aria-btn-primary inline-flex items-center gap-2 h-10 px-5 text-sm"
            >
              <PlusIcon className="size-4" />
              New Product
            </button>
          </div>
        ) : (
          <>
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-[#1e293b]">Active Products</h2>
                <Link href="/products" className="text-sm text-[#6366f1] hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredProducts.slice(0, 6).map((product) => {
                  const pct =
                    product.artifactTotal > 0
                      ? Math.round(
                          (product.artifactApproved / product.artifactTotal) * 100,
                        )
                      : 0;
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="aria-card p-5 hover:border-[#6366f1]/40 transition-colors block group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-[#1e293b] group-hover:text-[#6366f1] transition-colors">
                          {product.displayName}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#eef2ff] text-[#6366f1] font-medium shrink-0">
                          {product.phaseLabel}
                        </span>
                      </div>
                      <div className="mt-3 h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden">
                        <div
                          className="h-full bg-[#6366f1] rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#64748b] mt-2">{pct}% complete</p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-[#64748b]">
                        <span>{product.artifactTotal} artifacts</span>
                        <span>{product.pulse.approvalsWaiting} awaiting approval</span>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-[#94a3b8]">
                          {product.connectedToolsCount} connected tool
                          {product.connectedToolsCount !== 1 ? "s" : ""}
                        </span>
                        <ChevronRightIcon className="size-4 text-[#94a3b8] group-hover:text-[#6366f1]" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <div className="grid lg:grid-cols-2 gap-6">
              <section className="aria-card p-5">
                <h2 className="text-base font-semibold text-[#1e293b] mb-4 flex items-center gap-2">
                  <span className="text-[#6366f1]">✦</span> AI PM Recommendations
                </h2>
                {recommendations.length === 0 ? (
                  <p className="text-sm text-[#64748b]">
                    Recommendations appear as you add artifacts and progress through the lifecycle.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {recommendations.map((rec) => (
                      <li
                        key={rec.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-[#f8f9fb] border border-[#e2e8f0] text-sm text-[#1e293b]"
                      >
                        <ChevronRightIcon className="size-4 text-[#6366f1] shrink-0 mt-0.5" />
                        <div>
                          <p>{rec.title}</p>
                          <Link
                            href={`/products/${rec.productId}`}
                            className="text-xs text-[#6366f1] hover:underline mt-1 inline-block"
                          >
                            {rec.productName}
                          </Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="aria-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-[#1e293b]">Recent Activity</h2>
                  <Link href="/activity" className="text-xs text-[#6366f1] hover:underline">
                    View all
                  </Link>
                </div>
                {!data?.recentActivity?.length ? (
                  <p className="text-sm text-[#64748b]">
                    Activity will appear as you create products and approve artifacts.
                  </p>
                ) : (
                  <ul className="space-y-4">
                    {data.recentActivity.slice(0, 5).map((evt) => (
                      <li key={evt.id} className="flex gap-3 text-sm">
                        <div className="size-2 rounded-full bg-[#6366f1] mt-1.5 shrink-0" />
                        <div>
                          <p className="text-[#1e293b]">{evt.title}</p>
                          <p className="text-xs text-[#94a3b8] mt-0.5">
                            {evt.productName} · {formatRelativeTime(evt.createdAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      <NewProductDialog open={newProductOpen} onOpenChange={setNewProductOpen} />
    </AriaShell>
  );
}
