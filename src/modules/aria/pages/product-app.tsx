"use client";

import { useQuery } from "@tanstack/react-query";
import { CodeIcon, EyeIcon } from "lucide-react";
import { Suspense, useMemo, useState } from "react";

import { AriaShell, AriaTopBar } from "@/components/aria/aria-shell";
import { ProductSidebar } from "@/modules/aria/components/product-sidebar";
import {
  AppSandpackCodeEditor,
  AppSandpackPreview,
  AppSandpackProvider,
} from "@/modules/projects/ui/components/app-sandpack-shell";
import { useTRPC } from "@/trpc/client";
import type { FileCollection } from "@/types";
import { cn } from "@/lib/utils";

function parseFiles(raw: string | null | undefined): FileCollection {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as FileCollection;
  } catch {
    return {};
  }
}

export function ProductAppPage({ projectId }: { projectId: string }) {
  const trpc = useTRPC();
  const [tab, setTab] = useState<"preview" | "code">("preview");

  const { data: messages } = useQuery(
    trpc.messages.getMany.queryOptions({ projectId }),
  );

  const fragment = messages?.find((m) => m.fragment)?.fragment;
  const appFiles = useMemo(() => parseFiles(fragment?.files), [fragment?.files]);

  return (
    <AriaShell topBar={<AriaTopBar />} showAskBar={false}>
      <div className="flex h-[calc(100vh-65px)]">
        <ProductSidebar projectId={projectId} />
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#e2e8f0] bg-white">
            {(["preview", "code"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex items-center gap-2 h-8 px-3 rounded-lg text-sm font-medium transition-colors",
                  tab === t
                    ? "bg-[#6366f1] text-white"
                    : "text-[#64748b] hover:bg-[#f8f9fb]",
                )}
              >
                {t === "preview" ? <EyeIcon className="size-4" /> : <CodeIcon className="size-4" />}
                {t === "preview" ? "Demo" : "Code"}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-0">
            {Object.keys(appFiles).length > 0 ? (
              <AppSandpackProvider files={appFiles}>
                <Suspense fallback={<p className="p-4">Loading…</p>}>
                  {tab === "preview" ? <AppSandpackPreview /> : <AppSandpackCodeEditor />}
                </Suspense>
              </AppSandpackProvider>
            ) : (
              <div className="flex items-center justify-center h-full text-[#64748b] text-sm">
                App not built yet. Use AI PM to generate the application.
              </div>
            )}
          </div>
        </div>
      </div>
    </AriaShell>
  );
}
