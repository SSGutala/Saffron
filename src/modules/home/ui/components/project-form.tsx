"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { useAuth } from "@/components/auth-provider";
import { PromptWithImages } from "@/components/prompt-with-images";
import { Button } from "@/components/ui/button";
import { Form, FormField } from "@/components/ui/form";
import { PROJECT_TEMPLATES } from "@/constants";
import type { InspirationImage } from "@/types/lifecycle";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  value: z.string().min(1).max(10_000),
});

const ProjectForm = () => {
  const router = useRouter();
  const { user } = useAuth();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [images, setImages] = useState<InspirationImage[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { value: "" },
  });

  const createProject = useMutation(
    trpc.projects.create.mutationOptions({
      onSuccess: (data) => {
        router.push(`/projects/${data.id}`);
        queryClient.invalidateQueries(trpc.projects.getMany.queryOptions());
      },
      onError: (error) => {
        // TEMP: auth bypass for testing
        // if (error.data?.code === "UNAUTHORIZED") router.push("/sign-in");
        toast.error(error.message);
      },
    }),
  );

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // TEMP: auth bypass for testing — re-enable when login is required again
    // if (!user) {
    //   router.push("/sign-up");
    //   return;
    // }
    await createProject.mutateAsync({
      value: values.value,
      images: images.length ? images : undefined,
    });
  };

  const [isFocused, setIsFocused] = useState(false);
  const isPending = createProject.isPending;
  const isDisabled = isPending || !form.formState.isValid;

  return (
    <Form {...form}>
      <section className="space-y-6">
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            "relative border p-4 pt-1 rounded-2xl bg-sidebar dark:bg-sidebar transition-all shadow-sm",
            isFocused && "shadow-md ring-1 ring-primary/20",
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
                placeholder="Ask Saffron to create a web app that..."
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
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px]">
                <span>&#8984;</span>Enter
              </kbd>
              &nbsp;to submit
            </div>
            <Button
              type="submit"
              className={cn("size-9 rounded-full bg-primary", isDisabled && "opacity-50")}
              disabled={isDisabled}
            >
              {isPending ? <Loader2Icon className="animate-spin" /> : <ArrowUpIcon />}
            </Button>
          </div>
        </form>

        {!user && (
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/sign-up" className="text-primary hover:underline">
              Sign up free
            </Link>{" "}
            to start building
          </p>
        )}

        <div className="flex-wrap justify-center gap-2 hidden md:flex max-w-3xl mx-auto">
          {PROJECT_TEMPLATES.map((template) => (
            <Button
              key={template.title}
              type="button"
              variant="outline"
              size="sm"
              className="bg-white/90 dark:bg-sidebar rounded-full"
              onClick={() => form.setValue("value", template.prompt, { shouldValidate: true })}
            >
              {template.emoji}&nbsp;&nbsp;{template.title}
            </Button>
          ))}
        </div>
      </section>
    </Form>
  );
};

export { ProjectForm };
