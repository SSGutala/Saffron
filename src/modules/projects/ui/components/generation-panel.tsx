"use client";

import Image from "next/image";
import { Loader2Icon } from "lucide-react";

import type { LifecycleState } from "@/generated/prisma";

interface GenerationPanelProps {
  lifecycleState: LifecycleState | undefined;
  hasFragment: boolean;
}

const STATUS_COPY: Record<LifecycleState, { title: string; detail: string }> = {
  INTAKE: {
    title: "Step 1 — Generating your docs…",
    detail: "Creating intake, product brief, workflow, data model, automation, UX spec, and roadmap.",
  },
  BRIEF_READY: {
    title: "Step 2 — Creating design mockups…",
    detail: "Your artifacts are in the Files tab. Saffron is generating 3 static UI mockups next.",
  },
  DESIGNS_READY: {
    title: "Step 3 — Pick your design",
    detail: "Select one or more mockups in chat, add feedback, then click Build app. Your live demo appears here after that.",
  },
  BUILDING: {
    title: "Step 4 — Building your app…",
    detail: "Writing React components from your selected design direction and product brief.",
  },
  APP_READY: {
    title: "Almost there…",
    detail: "Finalizing your live preview.",
  },
};

export function GenerationPanel({
  lifecycleState,
  hasFragment,
}: GenerationPanelProps) {
  if (hasFragment) return null;

  const status =
    (lifecycleState && STATUS_COPY[lifecycleState]) ?? STATUS_COPY.INTAKE;

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
