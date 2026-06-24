"use client";

import Image from "next/image";
import { Loader2Icon } from "lucide-react";

import type { LifecycleState } from "@/generated/prisma";

interface GenerationPanelProps {
  lifecycleState: LifecycleState | undefined;
  hasFragment: boolean;
}

const STATUS_COPY: Record<
  LifecycleState,
  { title: string; detail: string }
> = {
  INTAKE: {
    title: "Mapping your product lifecycle…",
    detail: "Generating intake, workflow, data model, and app spec while your demo builds.",
  },
  BRIEF_READY: {
    title: "Lifecycle ready — building your app…",
    detail: "Your 7 enterprise artifacts are in the Files tab. The live demo is still generating.",
  },
  DESIGNS_READY: {
    title: "Pick a design or wait for the build…",
    detail: "Design previews are ready in chat. Your app demo will appear here when the build finishes.",
  },
  BUILDING: {
    title: "Building your app…",
    detail: "Writing React components, wiring state, and preparing your live Sandpack preview.",
  },
  APP_READY: {
    title: "Almost there…",
    detail: "Finalizing your preview.",
  },
};

export function GenerationPanel({
  lifecycleState,
  hasFragment,
}: GenerationPanelProps) {
  if (hasFragment) return null;

  const status =
    (lifecycleState && STATUS_COPY[lifecycleState]) ?? STATUS_COPY.BUILDING;

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[320px] px-8 text-center gap-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Image src="/logo.svg" alt="Saffron" height={24} width={24} />
        <span className="text-sm font-medium">Saffron</span>
      </div>
      <Loader2Icon className="size-10 animate-spin text-primary" />
      <div className="space-y-2 max-w-md">
        <h2 className="text-lg font-semibold">{status.title}</h2>
        <p className="text-sm text-muted-foreground">{status.detail}</p>
      </div>
      <div className="w-full max-w-sm h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full w-1/3 rounded-full bg-primary animate-[pulse_1.5s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}
