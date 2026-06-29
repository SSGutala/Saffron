"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useTRPC } from "@/trpc/client";

const schema = z.object({ value: z.string().min(1).max(10_000) });

export function NewProductDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { value: "" },
  });

  const create = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        queryClient.invalidateQueries(trpc.workspace.getDashboard.queryOptions());
        onOpenChange(false);
        form.reset();
        router.push(`/products/${data.id}`);
        toast.success("Product workspace created");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#1e293b]">New Product</h2>
        <p className="text-sm text-[#64748b]">
          Describe the product, feature, or workflow Aria should deliver.
        </p>
        <form
          onSubmit={form.handleSubmit((v) => create.mutate({ value: v.value }))}
          className="space-y-4"
        >
          <textarea
            {...form.register("value")}
            rows={4}
            placeholder="Build an Asset Request System…"
            className="w-full rounded-lg border border-[#e2e8f0] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="h-10 px-4 text-sm text-[#64748b] hover:bg-[#f8f9fb] rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="aria-btn-primary h-10 px-5 text-sm flex items-center gap-2"
            >
              {create.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
