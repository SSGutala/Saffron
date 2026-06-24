"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { PromptWithImages } from "@/components/prompt-with-images";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import type { InspirationImage } from "@/types/lifecycle";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Usage } from "./usage";

interface MessageFormProps {
  projectId: string;
}

const formSchema = z.object({
  value: z.string().min(1).max(10_000),
});

const MessageForm = ({ projectId }: MessageFormProps) => {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<InspirationImage[]>([]);

  const { data: usage } = useQuery(trpc.usage.status.queryOptions());

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "" },
  });

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onSuccess: (data) => {
        form.reset();
        setImages([]);
        queryClient.invalidateQueries(
          trpc.messages.getMany.queryOptions({ projectId: data.projectId }),
        );
        queryClient.invalidateQueries(trpc.usage.status.queryOptions());
      },
      onError: (error) => {
        if (error.data?.code === "TOO_MANY_REQUESTS") router.push("/pricing");
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await createMessage.mutateAsync({
      value: values.value,
      projectId,
      images: images.length ? images : undefined,
    });
  };

  const [isFocused, setIsFocused] = useState(false);
  const isPending = createMessage.isPending;
  const isDisabled = isPending || !form.formState.isValid;

  return (
    <Form {...form}>
      {usage && (
        <Usage points={usage.remainingPoints} msBeforeNext={usage.msBeforeNext} />
      )}
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn(
          "relative border p-4 pt-1 rounded-xl bg-sidebar transition-all",
          isFocused && "shadow-xs",
          usage && "rounded-t-none",
        )}
      >
        <FormField
          control={form.control}
          name="value"
          render={({ field }) => (
            <PromptWithImages
              value={field.value}
              onChange={field.onChange}
              images={images}
              onImagesChange={setImages}
              placeholder="Refine your app, request edits, or paste inspiration images…"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)(e);
                }
              }}
            />
          )}
        />

        <div className="flex gap-x-2 items-end justify-between pt-2">
          <div className="text-[10px] text-muted-foreground font-mono">
            <kbd className="inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
              <span>&#8984;</span>Enter
            </kbd>
          </div>
          <Button
            type="submit"
            className={cn("size-8 rounded-full", isDisabled && "opacity-50")}
            disabled={isDisabled}
          >
            {isPending ? <Loader2Icon className="animate-spin" /> : <ArrowUpIcon />}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export { MessageForm };
