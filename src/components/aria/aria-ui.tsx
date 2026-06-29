"use client";

import { cn } from "@/lib/utils";

type Status = "approved" | "pending" | "draft" | "risk";

const STYLES: Record<Status, string> = {
  approved: "bg-[#ecfdf5] text-[#10b981] border-[#a7f3d0]",
  pending: "bg-[#fffbeb] text-[#f59e0b] border-[#fde68a]",
  draft: "bg-[#f1f5f9] text-[#64748b] border-[#e2e8f0]",
  risk: "bg-[#fef2f2] text-[#ef4444] border-[#fecaca]",
};

const LABELS: Record<Status, string> = {
  approved: "Approved",
  pending: "Pending Approval",
  draft: "Draft",
  risk: "At Risk",
};

export function AriaStatusBadge({
  status,
  className,
}: {
  status: Status;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border",
        STYLES[status],
        className,
      )}
    >
      {LABELS[status]}
    </span>
  );
}

export function mapApprovalStatus(status: string): Status {
  if (status === "APPROVED") return "approved";
  return "pending";
}

export function HealthDonut({ value, size = 56 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#6366f1"
          strokeWidth={6}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-semibold text-[#1e293b]">{value}%</span>
    </div>
  );
}

export function LifecycleStepper({
  activeIndex = 0,
  completePercent,
}: {
  activeIndex?: number;
  completePercent?: number;
}) {
  const steps = [
    "Discovery & Brief",
    "Requirements",
    "Design",
    "Build",
    "Test",
    "Deploy",
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1">
        {steps.map((step, i) => (
          <div key={step} className="flex-1 flex flex-col items-center gap-2 min-w-0">
            <div
              className={cn(
                "size-2.5 rounded-full shrink-0",
                i < activeIndex
                  ? "bg-[#6366f1]"
                  : i === activeIndex
                    ? "bg-[#6366f1] ring-4 ring-[#6366f1]/20"
                    : "bg-[#e2e8f0]",
              )}
            />
            <span
              className={cn(
                "text-[10px] text-center leading-tight truncate w-full px-0.5",
                i <= activeIndex ? "text-[#6366f1] font-medium" : "text-[#94a3b8]",
              )}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
      {completePercent != null && (
        <div className="h-1.5 rounded-full bg-[#e2e8f0] overflow-hidden">
          <div
            className="h-full bg-[#6366f1] rounded-full transition-all"
            style={{ width: `${completePercent}%` }}
          />
        </div>
      )}
    </div>
  );
}

export function ToolIcons() {
  const tools = ["📝", "🎫", "🎨", "📊", "⚡"];
  return (
    <div className="flex items-center gap-1">
      {tools.map((t) => (
        <span
          key={t}
          className="size-6 rounded-md bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-xs"
        >
          {t}
        </span>
      ))}
    </div>
  );
}
