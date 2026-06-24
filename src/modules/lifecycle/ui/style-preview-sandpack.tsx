"use client";

import {
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
} from "@codesandbox/sandpack-react";
import { useMemo } from "react";

import type { StylePreview } from "@/types/lifecycle";

export function StylePreviewSandpack({ style }: { style: StylePreview }) {
  const files = useMemo(() => {
    let code = style.previewCode;
    if (!code.includes("import React")) {
      code = `import React, { useState } from "react";\n${code}`;
    }
    return {
      "/public/index.html": `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div></body></html>`,
      "/index.js": `import React from "react";import { createRoot } from "react-dom/client";import App from "./App";createRoot(document.getElementById("root")).render(<App />);`,
      "/App.js": code.replace(/^import React[^;]+;\s*/m, ""),
    };
  }, [style.previewCode]);

  return (
    <SandpackProvider template="react" files={files} options={{ externalResources: ["https://cdn.tailwindcss.com"] }}>
      <SandpackLayout style={{ height: 320, border: "none" }}>
        <SandpackPreview showNavigator={false} showRefreshButton={false} style={{ height: 320 }} />
      </SandpackLayout>
    </SandpackProvider>
  );
}
