"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, LinkIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

import { ARIA_CONNECTORS } from "@/lib/aria/connectors";
import { INTEGRATION_CATEGORIES } from "@/modules/aria/constants";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";

const CATEGORY_MAP: Record<string, string[]> = {
  All: ARIA_CONNECTORS.map((c) => c.id),
  Documents: ["google_docs", "microsoft_word", "confluence", "notion"],
  Delivery: ["jira", "linear", "azure_devops"],
  Design: ["figma"],
  Automation: ["power_automate", "zapier"],
  Data: ["google_sheets", "excel", "airtable"],
  Dev: ["github", "gitlab"],
};

type ProjectConnector = {
  id: string;
  name: string;
  icon: string;
  status: string;
  usedByProduct?: boolean;
  artifactCount?: number;
  productCount?: number;
};

export function IntegrationsPanelReal({ projectId }: { projectId?: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("All");

  const projectConnectors = useQuery({
    ...trpc.workspace.getConnectors.queryOptions({ projectId: projectId! }),
    enabled: !!projectId,
  });

  const globalConnectors = useQuery({
    ...trpc.workspace.getGlobalIntegrations.queryOptions(),
    enabled: !projectId,
  });

  const { data: connectors, isLoading } = projectId ? projectConnectors : globalConnectors;

  const connect = useMutation(
    trpc.workspace.connectConnector.mutationOptions({
      onSuccess: () => {
        if (projectId) {
          queryClient.invalidateQueries(
            trpc.workspace.getConnectors.queryOptions({ projectId }),
          );
        }
        queryClient.invalidateQueries(trpc.workspace.getGlobalIntegrations.queryOptions());
        toast.success("Connector connected");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
      </div>
    );
  }

  const ids = CATEGORY_MAP[category] ?? CATEGORY_MAP.All;
  const filtered = ((connectors ?? []) as ProjectConnector[]).filter((c) =>
    ids.includes(c.id),
  );

  return (
    <div className="space-y-6">
      <div className="flex gap-1 border-b border-[#e2e8f0] flex-wrap">
        {INTEGRATION_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              category === cat
                ? "border-[#6366f1] text-[#6366f1]"
                : "border-transparent text-[#64748b]",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((connector) => {
          const connected =
            connector.status === "connected" || connector.status === "mock";
          const count = connector.artifactCount ?? (connector.usedByProduct ? 1 : 0);
          return (
            <div key={connector.id} className="aria-card p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-3xl">{connector.icon}</span>
                <div>
                  <h3 className="font-semibold text-[#1e293b]">{connector.name}</h3>
                  {connected && (
                    <span className="inline-flex items-center gap-1 text-xs text-[#10b981] mt-1">
                      <CheckIcon className="size-3" />
                      Connected
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-[#64748b]">
                {count} artifact{count !== 1 ? "s" : ""} synced
              </p>
              {projectId ? (
                <button
                  type="button"
                  disabled={connect.isPending}
                  onClick={() => {
                    const REAL_PROVIDER_MAP: Record<string, string> = {
                      google_docs: "google",
                      google_sheets: "google",
                      google_slides: "google",
                      microsoft_word: "microsoft",
                      excel: "microsoft",
                    };
                    const realProvider = REAL_PROVIDER_MAP[connector.id];
                    
                    if (realProvider === "google") {
                      window.location.href = "/api/connectors/google";
                      return;
                    }

                    connect.mutate({ projectId, connectorId: connector.id });
                  }}
                  className={cn(
                    "text-sm font-medium",
                    connected
                      ? "text-[#64748b] hover:underline"
                      : "text-[#6366f1] hover:underline",
                  )}
                >
                  {connected ? (
                    <span className="inline-flex items-center gap-1">
                      <LinkIcon className="size-3" /> Re-sync
                    </span>
                  ) : (
                    "Connect"
                  )}
                </button>
              ) : (
                <p className="text-xs text-[#94a3b8]">
                  {connector.productCount && connector.productCount > 0
                    ? `Used in ${connector.productCount} product${connector.productCount > 1 ? "s" : ""}`
                    : "Connect from a product workspace"}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
