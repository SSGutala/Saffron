"use client";

import {
  SandpackCodeEditor,
  SandpackFileExplorer,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { useTheme } from "next-themes";
import { useMemo } from "react";

import type { FileCollection } from "@/types";

function toSandpackFiles(files: FileCollection) {
  const normalized: FileCollection = {};
  for (const [path, content] of Object.entries(files)) {
    const p = path.startsWith("/") ? path.slice(1) : path;
    normalized[p] = content;
  }
  return normalized;
}

export function AppSandpackProvider({
  files,
  children,
}: {
  files: FileCollection;
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const sandpackFiles = useMemo(() => toSandpackFiles(files), [files]);

  if (Object.keys(sandpackFiles).length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        No preview available
      </div>
    );
  }

  return (
    <SandpackProvider
      template="react"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      files={sandpackFiles}
      options={{
        externalResources: ["https://cdn.tailwindcss.com"],
        recompileMode: "delayed",
        recompileDelay: 400,
      }}
    >
      {children}
    </SandpackProvider>
  );
}

export function AppSandpackPreview() {
  return (
    <SandpackLayout style={{ height: "100%", border: "none" }}>
      <SandpackPreview
        showNavigator={false}
        showRefreshButton={false}
        style={{ height: "100%" }}
      />
    </SandpackLayout>
  );
}

export function AppSandpackCodeEditor() {
  return (
    <SandpackLayout style={{ height: "100%", border: "none" }}>
      <SandpackFileExplorer />
      <SandpackCodeEditor showTabs />
    </SandpackLayout>
  );
}
