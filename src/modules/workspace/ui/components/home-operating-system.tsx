"use client";

import Link from "next/link";
import { ArrowRightIcon, Loader2Icon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { AiBriefingPanel } from "./ai-briefing-panel";
import { ProductTimeline } from "./product-timeline";

/** Home operating system — product-first, Aria at the center */
export function HomeOperatingSystem() {
  const { user } = useAuth();
  const router = useRouter();
  const trpc = useTRPC();

  const { data, isLoading } = useQuery({
    ...trpc.workspace.getDashboard.queryOptions(),
    enabled: !!user,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin mr-2" />
        Loading…
      </div>
    );
  }

  const continueProduct = data?.continueProduct;

  return (
    <div className="max-w-4xl mx-auto w-full space-y-12 pb-16">
      {data?.briefing && (
        <AiBriefingPanel
          briefing={data.briefing}
          onAction={() => {
            if (continueProduct) {
              router.push(`/projects/${continueProduct.id}`);
            }
          }}
        />
      )}

      {continueProduct && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Continue where you left off
          </h2>
          <Link
            href={`/projects/${continueProduct.id}`}
            className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/30 hover:border-primary/40 hover:bg-card/50 p-5 transition-all"
          >
            <div>
              <p className="font-medium group-hover:text-primary transition-colors">
                {continueProduct.displayName}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {continueProduct.pulse.lifecycleLabel} ·{" "}
                {continueProduct.pulse.approvalsWaiting > 0
                  ? `${continueProduct.pulse.approvalsWaiting} approvals waiting`
                  : continueProduct.pulse.upcomingMilestone ?? "In progress"}
              </p>
            </div>
            <ArrowRightIcon className="size-5 text-muted-foreground group-hover:text-primary shrink-0" />
          </Link>
        </section>
      )}

      {data?.products && data.products.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent products
          </h2>
          <div className="space-y-2">
            {data.products.slice(0, 5).map((product) => (
              <Link
                key={product.id}
                href={`/projects/${product.id}`}
                className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-3 hover:border-primary/30 hover:bg-muted/20 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{product.displayName}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {product.pulse.lifecycleLabel} · {product.pulse.momentum} momentum
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0 ml-4">
                  {product.artifactApproved}/{product.artifactTotal} approved
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {data?.recentActivity && data.recentActivity.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Recent activity
          </h2>
          <ProductTimeline
            events={data.recentActivity.map((a) => ({
              id: a.id,
              timestamp: a.createdAt,
              actor: "aria" as const,
              category: "updated" as const,
              title: a.title,
              detail: a.productName,
            }))}
          />
        </section>
      )}

      {data?.connectedTools && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            Connected tools
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.connectedTools.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/20 px-3 py-1 text-xs text-muted-foreground"
              >
                {c.icon} {c.name}
              </span>
            ))}
          </div>
        </section>
      )}

      {(!data?.products || data.products.length === 0) && (
        <div className="text-center py-8">
          <Button asChild variant="outline">
            <Link href="#top">Create your first product</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
