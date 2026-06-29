"use client";

import { IntegrationsPanelReal } from "@/modules/aria/components/integrations-panel-real";
import { AriaShell, AriaTopBar } from "@/components/aria/aria-shell";

export function IntegrationsPage() {
  return (
    <AriaShell topBar={<AriaTopBar searchPlaceholder="Search integrations…" />}>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1e293b]">Integrations</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Connect your tools to publish and sync artifacts across products
          </p>
        </div>
        <IntegrationsPanelReal />
      </div>
    </AriaShell>
  );
}
