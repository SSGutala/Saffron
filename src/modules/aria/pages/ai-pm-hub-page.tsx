"use client";

import Link from "next/link";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";

import { AriaShell, AriaTopBar } from "@/components/aria/aria-shell";
import { useTRPC } from "@/trpc/client";

function AiPmHubContent() {
  const trpc = useTRPC();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingQuery = searchParams.get("q")?.trim() ?? "";
  const handledRef = useRef(false);

  const { data, isLoading } = useQuery(trpc.workspace.getDashboard.queryOptions());
  const products = data?.products ?? [];

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onError: (e) => toast.error(e.message),
    }),
  );

  useEffect(() => {
    if (handledRef.current || isLoading || !pendingQuery || products.length === 0) return;
    handledRef.current = true;
    const first = products[0];
    void createMessage
      .mutateAsync({ projectId: first.id, value: pendingQuery })
      .then(() => router.replace(`/ai-pm/${first.id}`));
  }, [isLoading, pendingQuery, products, createMessage, router]);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-[#6366f1] flex items-center justify-center">
          <SparklesIcon className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-[#1e293b]">AI PM</h1>
          <p className="text-sm text-[#64748b]">Select a product to work with Aria</p>
        </div>
      </div>

      {pendingQuery && createMessage.isPending && (
        <div className="aria-card p-4 text-sm text-[#64748b] flex items-center gap-2">
          <Loader2Icon className="size-4 animate-spin" />
          Sending your question to Aria…
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
        </div>
      ) : products.length === 0 ? (
        <div className="aria-card p-12 text-center text-[#64748b]">
          Create a product first, then open AI PM to build and iterate.
        </div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <Link
              key={p.id}
              href={`/ai-pm/${p.id}`}
              className="aria-card p-4 block hover:border-[#6366f1]/40 transition-colors"
            >
              <p className="font-medium text-[#1e293b]">{p.displayName}</p>
              <p className="text-xs text-[#64748b] mt-1">
                {p.briefing.recommendation.slice(0, 120)}…
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function AiPmHubPage() {
  return (
    <AriaShell topBar={<AriaTopBar searchPlaceholder="Search products for AI PM…" />}>
      <Suspense
        fallback={
          <div className="flex justify-center py-20">
            <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
          </div>
        }
      >
        <AiPmHubContent />
      </Suspense>
    </AriaShell>
  );
}
