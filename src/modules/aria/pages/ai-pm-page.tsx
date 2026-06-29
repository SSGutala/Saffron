"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { AriaShell, AriaTopBar } from "@/components/aria/aria-shell";
import { MessagesContainer } from "@/modules/projects/ui/components/messages-container";
import { ProjectHeader } from "@/modules/projects/ui/components/project-header";
import { Fragment } from "@/generated/prisma";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

export function AiPmPage({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);

  const handleAppReady = useCallback(() => {
    router.push(`/products/${projectId}/app`);
  }, [projectId, router]);

  return (
    <AriaShell
      projectId={projectId}
      topBar={<AriaTopBar searchPlaceholder="Ask Aria to build, update, or plan…" />}
      askPlaceholder="Ask Aria to update the PRD, generate stories, or build the app…"
    >
      <div className="flex flex-col h-[calc(100vh-130px)] max-w-3xl mx-auto w-full">
        <ErrorBoundary fallback={<p className="p-4 text-[#64748b]">Error loading AI PM</p>}>
          <Suspense fallback={<p className="p-4">Loading…</p>}>
            <ProjectHeader projectId={projectId} />
          </Suspense>
        </ErrorBoundary>
        <div className="flex-1 min-h-0 overflow-hidden">
          <ErrorBoundary fallback={<p className="p-4">Error</p>}>
            <Suspense fallback={<p className="p-4">Loading messages…</p>}>
              <MessagesContainer
                projectId={projectId}
                activeFragment={activeFragment}
                setActiveFragment={setActiveFragment}
                onAppReady={handleAppReady}
                onOpenArtifact={(id) => {
                  router.push(`/products/${projectId}/artifacts/${id}`);
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </div>
      </div>
    </AriaShell>
  );
}
