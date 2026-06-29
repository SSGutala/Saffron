"use client";

import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { AriaBreadcrumbs, AriaShell, AriaTopBar } from "@/components/aria/aria-shell";
import { ArtifactsTable } from "@/modules/aria/components/artifacts-table";
import { ProductSidebar } from "@/modules/aria/components/product-sidebar";
import { AddDocumentModal } from "@/modules/artifacts/ui/components/add-document-modal";
import { useTRPC } from "@/trpc/client";

export function ArtifactsListPage({ projectId }: { projectId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);

  const { data: workspace, isLoading } = useQuery(
    trpc.workspace.getProductWorkspace.queryOptions({ projectId }),
  );

  return (
    <AriaShell
      projectId={projectId}
      askPlaceholder="Ask Aria about this product…"
      topBar={<AriaTopBar searchPlaceholder="Search artifacts…" />}
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
              { label: "Artifacts" },
            ]}
          />
          <h1 className="text-xl font-semibold text-[#1e293b] mt-4 mb-6">Artifacts</h1>

          <ArtifactsTable
            artifacts={(workspace?.artifacts ?? []).map((a) => ({ ...a, productId: projectId }))}
            projectId={projectId}
            isLoading={isLoading}
            showAddButton
            onAddArtifact={() => setAddOpen(true)}
          />
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
