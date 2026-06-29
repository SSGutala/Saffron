"use client";

import { useState } from "react";
import { AriaAskBar, AriaSidebar, AriaTopBar } from "./aria-chrome";

interface AriaShellProps {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  showAskBar?: boolean;
  askPlaceholder?: string;
  projectId?: string;
}

export function AriaShell({
  children,
  topBar,
  showAskBar = true,
  askPlaceholder,
  projectId,
}: AriaShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="aria-app flex h-screen overflow-hidden">
      <AriaSidebar collapsed={collapsed} onCollapse={() => setCollapsed((c) => !c)} />
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8f9fb]">
        {topBar}
        <main className="flex-1 overflow-y-auto">{children}</main>
        {showAskBar && (
          <AriaAskBar placeholder={askPlaceholder} projectId={projectId} />
        )}
      </div>
    </div>
  );
}

export { AriaTopBar, AriaAskBar, AriaSidebar, AriaBreadcrumbs } from "./aria-chrome";
