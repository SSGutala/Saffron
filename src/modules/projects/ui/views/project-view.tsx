"use client";

import { CodeIcon, EyeIcon, LayoutGridIcon } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserControl } from "@/components/user-control";
import { Fragment } from "@/generated/prisma";
import { ProductWorkspace } from "@/modules/workspace/ui/components/product-workspace";
import { useTRPC } from "@/trpc/client";
import type { FileCollection } from "@/types";
import {
  AppSandpackCodeEditor,
  AppSandpackPreview,
  AppSandpackProvider,
} from "../components/app-sandpack-shell";
import { MessagesContainer } from "../components/messages-container";
import { ProjectHeader } from "../components/project-header";
import { ErrorBoundary } from "react-error-boundary";

interface ProjectViewProps {
  projectId: string;
}

function parseFragmentFiles(raw: string | null | undefined): FileCollection {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as FileCollection;
  } catch {
    return {};
  }
}

const ProjectView = ({ projectId }: ProjectViewProps) => {
  const trpc = useTRPC();
  const { data: project } = useQuery(
    trpc.projects.getOne.queryOptions({ id: projectId }, {
      refetchInterval: (query) => {
        const state = query.state.data?.lifecycleState;
        return state === "BUILDING" || state === "INTAKE" ? 3000 : false;
      },
    }),
  );

  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code" | "workspace">("workspace");
  const [focusArtifactId, setFocusArtifactId] = useState<string | null>(null);

  const appFiles = useMemo(
    () => parseFragmentFiles(activeFragment?.files),
    [activeFragment?.files],
  );

  const showAppTabs =
    Object.keys(appFiles).length > 0 &&
    project?.lifecycleState === "APP_READY";

  useEffect(() => {
    if (showAppTabs) {
      setTabState((current) =>
        current === "workspace" ? "preview" : current,
      );
    } else {
      setTabState("workspace");
    }
  }, [showAppTabs]);

  const handleAppReady = useCallback(() => {
    setTabState("preview");
  }, []);

  return (
    <div className="h-screen">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel
          defaultSize={35}
          minSize={20}
          className="flex flex-col min-h-0"
        >
          <ErrorBoundary fallback={<p>Error...</p>}>
            <Suspense fallback={<p>Loading project...</p>}>
              <ProjectHeader projectId={projectId} />
            </Suspense>
          </ErrorBoundary>
          <ErrorBoundary fallback={<p>Error...</p>}>
            <Suspense fallback={<p>Loading messages...</p>}>
              <MessagesContainer
                projectId={projectId}
                activeFragment={activeFragment}
                setActiveFragment={setActiveFragment}
                onAppReady={handleAppReady}
                onOpenArtifact={(id) => {
                  setFocusArtifactId(id);
                  setTabState("workspace");
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </ResizablePanel>
        <ResizableHandle className="hover:bg-primary transition-colors" />
        <ResizablePanel defaultSize={65} minSize={50}>
          {showAppTabs ? (
            <AppSandpackProvider files={appFiles}>
              <Tabs
                className="h-full gap-y-0"
                value={tabState}
                onValueChange={(newValue) =>
                  setTabState(newValue as "preview" | "code" | "workspace")
                }
              >
                <div className="w-full flex items-center p-2 border-b gap-x-2">
                  <TabsList className="h-8 p-0 border rounded-md">
                    <TabsTrigger value="workspace" className="rounded-md">
                      <LayoutGridIcon />
                      <span>Workspace</span>
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="rounded-md">
                      <EyeIcon />
                      <span>Demo</span>
                    </TabsTrigger>
                    <TabsTrigger value="code" className="rounded-md">
                      <CodeIcon />
                      <span>Code</span>
                    </TabsTrigger>
                  </TabsList>
                  <div className="ml-auto flex items-center gap-x-2">
                    <UserControl />
                  </div>
                </div>
                <TabsContent value="workspace" className="min-h-0 h-[calc(100vh-3rem)]">
                  <ProductWorkspace
                    projectId={projectId}
                    initialArtifactId={focusArtifactId}
                  />
                </TabsContent>
                <TabsContent value="preview" className="min-h-0 h-[calc(100vh-3rem)]">
                  <AppSandpackPreview />
                </TabsContent>
                <TabsContent value="code" className="min-h-0 h-[calc(100vh-3rem)]">
                  <AppSandpackCodeEditor />
                </TabsContent>
              </Tabs>
            </AppSandpackProvider>
          ) : (
            <Tabs
              className="h-full gap-y-0"
              value="workspace"
            >
              <div className="w-full flex items-center p-2 border-b gap-x-2">
                <TabsList className="h-8 p-0 border rounded-md">
                  <TabsTrigger value="workspace" className="rounded-md">
                    <LayoutGridIcon />
                    <span>Workspace</span>
                  </TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-x-2">
                  <UserControl />
                </div>
              </div>
              <TabsContent value="workspace" className="min-h-0 h-[calc(100vh-3rem)]">
                <ProductWorkspace
                  projectId={projectId}
                  initialArtifactId={focusArtifactId}
                />
              </TabsContent>
            </Tabs>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export { ProjectView };
