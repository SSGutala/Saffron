"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AriaBreadcrumbs, AriaShell, AriaTopBar } from "@/components/aria/aria-shell";
import { ProductTimeline } from "@/modules/workspace/ui/components/product-timeline";
import { LifecycleView } from "@/modules/workspace/ui/components/lifecycle-view";
import { ArtifactsTable } from "@/modules/aria/components/artifacts-table";
import { ProductSidebar } from "@/modules/aria/components/product-sidebar";
import { AddDocumentModal } from "@/modules/artifacts/ui/components/add-document-modal";
import {
  filterArtifactsForProductSection,
  PRODUCT_SECTION_LABELS,
  type ProductSectionFilter,
} from "@/lib/aria/global-filters";
import { IntegrationsPanelReal } from "@/modules/aria/components/integrations-panel-real";
import { useTRPC } from "@/trpc/client";

export function ProductSectionPage({
  projectId,
  section,
}: {
  projectId: string;
  section: ProductSectionFilter | "activity" | "timeline" | "lifecycle";
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

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
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const title =
    section === "activity"
      ? "Activity"
      : section === "timeline"
        ? "Timeline"
        : section === "lifecycle"
          ? "Lifecycle"
          : PRODUCT_SECTION_LABELS[section as ProductSectionFilter];

  const artifacts =
    section === "activity" || section === "timeline" || section === "lifecycle"
      ? []
      : filterArtifactsForProductSection(
          workspace?.artifacts ?? [],
          section as ProductSectionFilter,
        );

  return (
    <AriaShell
      askPlaceholder="Ask Aria about this product…"
      projectId={projectId}
      topBar={<AriaTopBar searchPlaceholder="Search in this product…" />}
    >
      <div className="flex h-[calc(100vh-130px)]">
        <ProductSidebar projectId={projectId} />
        <div className="flex-1 overflow-y-auto p-6">
          <AriaBreadcrumbs
            items={[
              { label: "Products", href: "/products" },
              {
                label: workspace?.summary.displayName ?? "Product",
                href: `/products/${projectId}`,
              },
              { label: title },
            ]}
          />

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
            </div>
          ) : (
            <div className="mt-4 max-w-5xl">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-semibold text-[#1e293b]">{title}</h1>
                {section !== "activity" &&
                  section !== "timeline" &&
                  section !== "lifecycle" && (
                    <button
                      type="button"
                      onClick={() => setAddOpen(true)}
                      className="aria-btn-primary h-9 px-4 text-sm"
                    >
                      + Add Artifact
                    </button>
                  )}
              </div>

              {section === "activity" && (
                <ProductTimeline
                  events={
                    workspace?.timeline.filter((e) =>
                      ["updated", "approved", "connected", "generated", "waiting", "ready"].includes(
                        e.category,
                      ),
                    ) ?? []
                  }
                />
              )}

              {section === "timeline" && (
                <ProductTimeline events={workspace?.timeline ?? []} />
              )}

              {section === "lifecycle" && workspace && (
                <LifecycleView
                  artifacts={workspace.artifacts}
                  lifecycleState={workspace.summary.lifecycleState}
                />
              )}

              {section !== "activity" &&
                section !== "timeline" &&
                section !== "lifecycle" && (
                  <>
                    {artifacts.length === 0 ? (
                      <div className="aria-card p-12 text-center text-[#64748b]">
                        <p className="mb-4">No artifacts in {title} yet.</p>
                        <button
                          type="button"
                          onClick={() => setAddOpen(true)}
                          className="text-[#6366f1] text-sm hover:underline"
                        >
                          Generate with Aria
                        </button>
                        {section === "ux" &&
                          workspace?.summary.lifecycleState === "BRIEF_READY" && (
                            <button
                              type="button"
                              onClick={() => generateDesigns.mutate({ projectId })}
                              className="block mx-auto mt-3 aria-btn-primary h-9 px-4 text-sm"
                            >
                              Generate design directions
                            </button>
                          )}
                      </div>
                    ) : (
                      <ArtifactsTable
                        artifacts={artifacts.map((a) => ({ ...a, productId: projectId }))}
                        projectId={projectId}
                        showAddButton
                        onAddArtifact={() => setAddOpen(true)}
                      />
                    )}
                  </>
                )}
            </div>
          )}
        </div>
      </div>

      <AddDocumentModal
        projectId={projectId}
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={() => {
          setAddOpen(false);
          queryClient.invalidateQueries(
            trpc.workspace.getProductWorkspace.queryOptions({ projectId }),
          );
          toast.success("Artifact created");
        }}
      />
    </AriaShell>
  );
}

export function ProductIntegrationsPage({ projectId }: { projectId: string }) {
  const { data: workspace } = useQuery(
    useTRPC().workspace.getProductWorkspace.queryOptions({ projectId }),
  );

  return (
    <AriaShell
      projectId={projectId}
      askPlaceholder="Ask Aria about this product…"
      topBar={<AriaTopBar searchPlaceholder="Search in this product…" />}
    >
      <div className="flex h-[calc(100vh-130px)]">
        <ProductSidebar projectId={projectId} />
        <div className="flex-1 overflow-y-auto p-6">
          <AriaBreadcrumbs
            items={[
              { label: "Products", href: "/products" },
              { label: workspace?.summary.displayName ?? "Product", href: `/products/${projectId}` },
              { label: "Integrations" },
            ]}
          />
          <h1 className="text-xl font-semibold text-[#1e293b] mt-4 mb-6">Integrations</h1>
          <IntegrationsPanelReal projectId={projectId} />
        </div>
      </div>
    </AriaShell>
  );
}
