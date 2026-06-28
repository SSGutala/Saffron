"use client";

import { ArrowUpIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PLACEHOLDERS = [
  "Ask Aria to update the PRD based on the new approval workflow…",
  "Generate Jira stories from this App Spec…",
  "Create test cases for the current requirements…",
  "Find what needs to change if we add manager approval…",
  "Create a Power Automate plan for this workflow…",
];

interface AskAriaInputProps {
  projectId?: string;
  className?: string;
  onSubmit?: (prompt: string) => void;
}

export function AskAriaInput({ projectId, className, onSubmit }: AskAriaInputProps) {
  const [value, setValue] = useState("");
  const placeholder =
    PLACEHOLDERS[Math.floor(Date.now() / 8000) % PLACEHOLDERS.length];

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (onSubmit) {
      onSubmit(trimmed);
    } else {
      toast.message("Aria command queued", {
        description: projectId
          ? "This will be wired to the PM agent in a future release."
          : "Open a product workspace to run delivery commands.",
      });
    }
    setValue("");
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-3 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Ask Aria
        </span>
        <span className="text-[10px] text-muted-foreground">
          AI PM command center
        </span>
      </div>
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="min-h-[72px] resize-none pr-12 bg-background/50 border-border/60 text-sm"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2 size-8 rounded-lg"
          disabled={!value.trim()}
          onClick={handleSubmit}
        >
          <ArrowUpIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
