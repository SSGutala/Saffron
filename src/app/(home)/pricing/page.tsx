import Image from "next/image";
import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "5 credits per month",
      "Live Sandpack preview",
      "React + Tailwind generation",
      "Project persistence",
    ],
    cta: "Current plan",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$25",
    period: "/month",
    features: [
      "100 credits per month",
      "Priority generation",
      "Unlimited projects",
      "Export source code",
      "Email support",
    ],
    cta: "Upgrade to Pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$50",
    period: "/month",
    features: [
      "Unlimited credits",
      "SSO & team workspaces",
      "Private projects",
      "Custom templates",
      "Dedicated support",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full">
      <section className="space-y-12 pt-[16vh] 2xl:pt-40 pb-20">
        <div className="flex flex-col items-center text-center space-y-4">
          <Image src="/logo.svg" alt="Saffron" height={48} width={48} />
          <h1 className="text-3xl md:text-5xl font-bold">Simple, transparent pricing</h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            Start free. Upgrade when you need more credits to build bigger apps.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`p-6 flex flex-col gap-6 ${
                plan.highlighted
                  ? "border-primary ring-2 ring-primary/20 shadow-lg scale-[1.02]"
                  : ""
              }`}
            >
              <div>
                <h2 className="text-lg font-semibold">{plan.name}</h2>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckIcon className="size-4 text-primary shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlighted ? "default" : "outline"}
                className={plan.highlighted ? "rounded-full" : ""}
                disabled={plan.name === "Free"}
                asChild={plan.name !== "Free"}
              >
                {plan.name === "Free" ? (
                  <span>{plan.cta}</span>
                ) : (
                  <Link href="/sign-up">{plan.cta}</Link>
                )}
              </Button>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
