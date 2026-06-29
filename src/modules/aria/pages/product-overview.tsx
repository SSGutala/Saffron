"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { AriaBreadcrumbs, AriaShell, AriaTopBar } from "@/components/aria/aria-shell";
import { LifecycleStepper } from "@/components/aria/aria-ui";
import { ProductSidebar } from "@/modules/aria/components/product-sidebar";
import { useTRPC } from "@/trpc/client";

function lifecycleActiveIndex(state: string) {
  const map: Record<string, number> = {
    INTAKE: 0,
    BRIEF_READY: 1,
    DESIGNS_READY: 2,
    BUILDING: 3,
    APP_READY: 5,
  };
  return map[state] ?? 0;
}

export function ProductOverviewPage({ projectId }: { projectId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: workspace, isLoading } = useQuery(
    trpc.workspace.getProductWorkspace.queryOptions({ projectId }),
  );

  const generateDesigns = useMutation(
    trpc.lifecycle.generateDesigns.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.workspace.getProductWorkspace.queryOptions({ projectId }),
        );
        toast.success("Design directions ready — open AI PM to pick one");
        router.push(`/ai-pm/${projectId}`);
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const summary = workspace?.summary;
  const pct =
    summary && summary.artifactTotal > 0
      ? Math.round((summary.artifactApproved / summary.artifactTotal) * 100)
      : 0;

  const handleRecAction = (actionType?: string, target?: string) => {
    if (actionType === "generate_designs") {
      generateDesigns.mutate({ projectId });
      return;
    }
    if (target) {
      if (target === "artifacts") router.push(`/products/${projectId}/artifacts`);
      else if (target === "backlog") router.push(`/products/${projectId}/section/backlog`);
      else if (target === "automations") router.push(`/products/${projectId}/section/automation`);
      else if (target === "releases") router.push(`/products/${projectId}/section/release`);
      else router.push(`/products/${projectId}/section/${target}`);
    }
  };

  return (
    <AriaShell
      projectId={projectId}
      askPlaceholder="Ask Aria about this product…"
      topBar={<AriaTopBar searchPlaceholder="Search in this product…" />}
    >
      <div className="flex h-[calc(100vh-130px)]">
        <ProductSidebar projectId={projectId} />
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
            </div>
          ) : (
            <div className="max-w-5xl space-y-6">
              <AriaBreadcrumbs
                items={[
                  { label: "Products", href: "/products" },
                  { label: summary?.displayName ?? "Product" },
                ]}
              />

              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-semibold text-[#1e293b]">{summary?.displayName}</h1>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#eef2ff] text-[#6366f1] font-medium">
                      {summary?.phaseLabel}
                    </span>
                    <span className="text-sm text-[#64748b]">{pct}% complete</span>
                  </div>
                </div>
              </div>

              <div className="aria-card p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-4">
                  Lifecycle Progress
                </p>
                <LifecycleStepper
                  activeIndex={lifecycleActiveIndex(summary?.lifecycleState ?? "INTAKE")}
                  completePercent={pct}
                />
              </div>

              {summary?.pulse.upcomingMilestone && (
                <div className="aria-card p-4">
                  <p className="text-xs text-[#64748b]">Next Milestone</p>
                  <p className="text-sm font-medium text-[#1e293b] mt-1">
                    {summary.pulse.upcomingMilestone}
                  </p>
                </div>
              )}

              <div className="aria-card p-5">
                <h2 className="text-sm font-semibold text-[#1e293b] mb-3 flex items-center gap-2">
                  <span className="text-[#6366f1]">✦</span> AI PM Recommendations
                </h2>
                <div className="space-y-2">
                  {(summary?.recommendations ?? []).slice(0, 4).map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#f8f9fb] border border-[#e2e8f0]"
                    >
                      <div>
                        <p className="text-sm font-medium text-[#1e293b]">{rec.title}</p>
                        <p className="text-xs text-[#64748b] mt-0.5">{rec.body}</p>
                      </div>
                      {rec.actionLabel && (
                        <button
                          type="button"
                          onClick={() => handleRecAction(rec.actionType, rec.actionTarget)}
                          className="shrink-0 h-8 px-3 rounded-lg bg-[#6366f1] text-white text-xs font-medium hover:bg-[#5558e8]"
                        >
                          {rec.actionLabel}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="aria-card p-5">
                  <h2 className="text-sm font-semibold text-[#1e293b] mb-3">Quick Links</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Add artifact", href: `/products/${projectId}/artifacts` },
                      { label: "Generate with Aria", href: `/ai-pm/${projectId}` },
                      { label: "View backlog", href: `/products/${projectId}/section/backlog` },
                      { label: "Open built app", href: `/products/${projectId}/app` },
                    ].map((link) => (
                      <a
                        key={link.label}
                        href={link.href}
                        className="text-sm text-[#6366f1] hover:underline px-3 py-2 rounded-lg bg-[#eef2ff]/50 border border-[#e2e8f0]"
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="aria-card p-5">
                  <h2 className="text-sm font-semibold text-[#1e293b] mb-3">Recently Updated</h2>
                  <ul className="space-y-3">
                    {(summary?.recentlyUpdated ?? []).slice(0, 4).map((a) => (
                      <li key={a.id}>
                        <a
                          href={`/products/${projectId}/artifacts/${a.id}`}
                          className="flex items-center gap-3 text-sm hover:text-[#6366f1]"
                        >
                          <span className="size-8 rounded-lg bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-xs">
                            📝
                          </span>
                          <div>
                            <p className="text-[#1e293b] font-medium">{a.title}</p>
                            <p className="text-xs text-[#94a3b8]">{a.sourceAppLabel}</p>
                          </div>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AriaShell>
  );
}
