"use client";

import { WORKSPACE_SECTIONS, type WorkspaceSectionId } from "@/types/aria";
import { cn } from "@/lib/utils";

interface WorkspaceNavProps {
  activeSection: WorkspaceSectionId;
  onSectionChange: (section: WorkspaceSectionId) => void;
  artifactCounts: Partial<Record<WorkspaceSectionId, number>>;
}

export function WorkspaceNav({
  activeSection,
  onSectionChange,
  artifactCounts,
}: WorkspaceNavProps) {
  return (
    <nav className="w-48 shrink-0 border-r border-border/60 bg-zinc-950/40 flex flex-col">
      <div className="p-3 border-b border-border/60">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
      </div>
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {WORKSPACE_SECTIONS.map((section) => {
          const count = artifactCounts[section.id];
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSectionChange(section.id)}
              className={cn(
                "w-full text-left px-2.5 py-2 rounded-md text-sm transition-colors flex items-center justify-between gap-2",
                active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              <span className="truncate">{section.label}</span>
              {count != null && count > 0 && (
                <span
                  className={cn(
                    "text-[10px] tabular-nums rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center",
                    active ? "bg-primary/20" : "bg-muted",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
