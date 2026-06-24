"use client";

import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { useTheme } from "next-themes";
import { RefreshCcwIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { Fragment } from "@/generated/prisma";
import { FileCollection } from "@/types";

interface FragmentWebProps {
  data: Fragment;
}

const FragmentWeb = ({ data }: FragmentWebProps) => {
  const { resolvedTheme } = useTheme();
  const [key, setKey] = useState(0);

  const files = useMemo(() => {
    try {
      return JSON.parse(data.files) as FileCollection;
    } catch {
      return {} as FileCollection;
    }
  }, [data.files]);

  const sandpackFiles = useMemo(() => {
    const normalized: FileCollection = {};
    for (const [path, content] of Object.entries(files)) {
      const p = path.startsWith("/") ? path.slice(1) : path;
      normalized[p] = content;
    }
    return normalized;
  }, [files]);

  if (Object.keys(sandpackFiles).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No preview available
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Hint text="Refresh preview" side="bottom" align="start">
          <Button size="sm" variant="outline" onClick={() => setKey((k) => k + 1)}>
            <RefreshCcwIcon />
          </Button>
        </Hint>
        <span className="text-sm text-muted-foreground truncate flex-1">
          {data.title}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
          Live preview
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <SandpackProvider
          key={key}
          template="react"
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          files={sandpackFiles}
          options={{
            externalResources: ["https://cdn.tailwindcss.com"],
            recompileMode: "delayed",
            recompileDelay: 400,
          }}
        >
          <SandpackLayout style={{ height: "100%", border: "none" }}>
            <SandpackPreview
              showNavigator={false}
              showRefreshButton={false}
              style={{ height: "100%" }}
            />
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
};

export { FragmentWeb };
