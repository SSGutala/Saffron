"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, LinkIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import type { ConnectorCategory } from "@/types/aria";

const CATEGORY_LABELS: Record<ConnectorCategory, string> = {
  documents: "Documents",
  spreadsheets: "Spreadsheets & Data",
  delivery: "Delivery",
  design: "Design",
  automation: "Automation",
  storage: "Storage",
  engineering: "Engineering",
};

interface IntegrationsPanelProps {
  projectId: string;
}

export function IntegrationsPanel({ projectId }: IntegrationsPanelProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: connectors, isLoading } = useQuery(
    trpc.workspace.getConnectors.queryOptions({ projectId }),
  );

  const connect = useMutation(
    trpc.workspace.mockConnect.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.workspace.getConnectors.queryOptions({ projectId }),
        );
        queryClient.invalidateQueries(
          trpc.workspace.getProductWorkspace.queryOptions({ projectId }),
        );
        toast.success("Connector linked (mock)");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin mr-2" />
        Loading connectors…
      </div>
    );
  }

  const byCategory = Object.groupBy(connectors ?? [], (c) => c.category);

  return (
    <div className="space-y-8 p-4">
      <div>
        <h2 className="text-lg font-semibold">Connected Tools</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Link external systems where your product artifacts live. Connectors are mock-ready for MVP.
        </p>
      </div>

      {(Object.keys(CATEGORY_LABELS) as ConnectorCategory[]).map((cat) => {
        const items = byCategory[cat];
        if (!items?.length) return null;
        return (
          <section key={cat}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              {CATEGORY_LABELS[cat]}
            </h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map((connector) => {
                const connected =
                  connector.status === "connected" || connector.status === "mock";
                return (
                  <div
                    key={connector.id}
                    className={cn(
                      "rounded-lg border p-4 space-y-3 transition-colors",
                      connected
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/80 bg-card/50",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{connector.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{connector.name}</p>
                          {connector.usedByProduct && (
                            <Badge variant="outline" className="text-[10px]">
                              Used by product
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {connector.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {connector.artifactTypes.slice(0, 4).map((t) => (
                        <Badge
                          key={t}
                          variant="secondary"
                          className="text-[10px] font-normal"
                        >
                          {t.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-muted-foreground capitalize">
                        {connected ? (
                          <span className="inline-flex items-center gap-1 text-emerald-500">
                            <CheckIcon className="size-3" />
                            {connector.status === "mock" ? "Mock connected" : "Connected"}
                          </span>
                        ) : (
                          "Not connected"
                        )}
                      </span>
                      <Button
                        size="sm"
                        variant={connected ? "outline" : "default"}
                        className="h-7 text-xs"
                        disabled={connect.isPending}
                        onClick={() =>
                          connect.mutate({
                            projectId,
                            connectorId: connector.id,
                          })
                        }
                      >
                        {connect.isPending ? (
                          <Loader2Icon className="size-3 animate-spin" />
                        ) : connected ? (
                          <>
                            <LinkIcon className="size-3 mr-1" />
                            Re-sync
                          </>
                        ) : (
                          "Connect"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
