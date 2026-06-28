import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { ProjectForm } from "@/modules/home/ui/components/project-form";
import { HomeOperatingSystem } from "@/modules/workspace/ui/components/home-operating-system";
import { PROJECT_TEMPLATES } from "@/constants";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full">
      {/* Hero */}
      <section className="space-y-8 py-[12vh] 2xl:py-32 text-center">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logo.svg"
            alt="Aria"
            width={56}
            height={56}
            className="hidden md:block"
          />
          <p className="text-sm font-medium text-primary tracking-wide uppercase">
            AI Product Delivery OS
          </p>
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
          What are we building today?
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Aria is your AI Product Manager — turn ideas into living products with connected artifacts across your delivery stack.
        </p>

        <div className="max-w-3xl mx-auto w-full pt-2">
          <ProjectForm />
        </div>
      </section>

      <HomeOperatingSystem />

      {/* How it works */}
      <section className="py-20 border-t border-border/50">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          How Aria delivers
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Start with an idea",
              desc: "Describe a product, feature, workflow, or internal tool. Aria creates a managed product workspace.",
            },
            {
              step: "02",
              title: "Living artifacts",
              desc: "PRDs, workflow maps, data models, and backlogs — connected artifacts that stay in sync across your tools.",
            },
            {
              step: "03",
              title: "Deliver with confidence",
              desc: "AI PM recommendations guide approvals, designs, automations, and releases through the full lifecycle.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-2xl border bg-card/50 p-6 space-y-3 hover:border-primary/30 transition-colors"
            >
              <span className="text-xs font-mono text-primary">{item.step}</span>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section className="py-20 border-t border-border/50">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Product starters</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            View all <ArrowRightIcon className="ml-1 size-4" />
          </Button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PROJECT_TEMPLATES.slice(0, 8).map((template) => (
            <div
              key={template.title}
              className="group rounded-xl border bg-card overflow-hidden hover:border-primary/40 transition-all cursor-default"
            >
              <div className="aspect-video bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
                {template.emoji}
              </div>
              <div className="p-4">
                <p className="text-sm font-medium line-clamp-2">{template.title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border/50 text-center space-y-6">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to deliver?</h2>
        <p className="text-muted-foreground text-lg">
          Idea to product workspace in minutes — managed by your AI Product Manager.
        </p>
        <Button
          asChild
          size="lg"
          className="rounded-full px-8 bg-primary hover:bg-primary/90"
        >
          <Link href="#top">Start a product</Link>
        </Button>
      </section>
    </div>
  );
}
