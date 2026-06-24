"use client";

import Link from "next/link";
import { CodeIcon, CrownIcon, EyeIcon, FileTextIcon } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { Suspense, useState } from "react";

import { FileExplorer } from "@/components/file-explorer";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserControl } from "@/components/user-control";
import { Fragment } from "@/generated/prisma";
import type { LifecycleState } from "@/generated/prisma";
import { FileCollection } from "@/types";
import { FragmentWeb } from "../components/fragment-web";
import { GenerationPanel } from "../components/generation-panel";
import { MessagesContainer } from "../components/messages-container";
import { ProjectHeader } from "../components/project-header";
import { ArtifactPanel } from "@/modules/artifacts/ui/components/artifact-panel";
import { ErrorBoundary } from "react-error-boundary";

interface ProjectViewProps {
  projectId: string;
}

const ProjectView = ({ projectId }: ProjectViewProps) => {
  const { user } = useAuth();
  const hasProAccess = user?.plan === "PRO";

  const [activeFragment, setActiveFragment] = useState<Fragment | null>(null);
  const [tabState, setTabState] = useState<"preview" | "code" | "files">("preview");
  const [focusArtifactId, setFocusArtifactId] = useState<string | null>(null);
  const [lifecycleState, setLifecycleState] = useState<LifecycleState | undefined>();

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
                onLifecycleState={(state) =>
                  setLifecycleState(state as LifecycleState | undefined)
                }
                onOpenArtifact={(id) => {
                  setFocusArtifactId(id);
                  setTabState("files");
                }}
              />
            </Suspense>
          </ErrorBoundary>
        </ResizablePanel>
        <ResizableHandle className="hover:bg-primary transition-colors" />
        <ResizablePanel defaultSize={65} minSize={50}>
          <Tabs
            className="h-full gap-y-0"
            defaultValue="preview"
            value={tabState}
            onValueChange={(newValue) =>
              setTabState(newValue as "preview" | "code" | "files")
            }
          >
            <div className="w-full flex items-center p-2 border-b gap-x-2">
              <TabsList className="h-8 p-0 border rounded-md">
                <TabsTrigger value="preview" className="rounded-md">
                  <EyeIcon />
                  <span>Demo</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="rounded-md">
                  <FileTextIcon />
                  <span>Files</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="rounded-md">
                  <CodeIcon />
                  <span>Code</span>
                </TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-x-2">
                {!hasProAccess && (
                  <Button asChild size="sm" variant="tertiary">
                    <Link href="/pricing">
                      <CrownIcon />
                      Upgrade
                    </Link>
                  </Button>
                )}
                <UserControl />
              </div>
            </div>
            <TabsContent value="preview" className="min-h-0 h-[calc(100vh-3rem)]">
              {activeFragment ? (
                <FragmentWeb data={activeFragment} projectId={projectId} />
              ) : (
                <GenerationPanel
                  lifecycleState={lifecycleState}
                  hasFragment={!!activeFragment}
                />
              )}
            </TabsContent>
            <TabsContent value="files" className="min-h-0 h-[calc(100vh-3rem)]">
              <ArtifactPanel
                projectId={projectId}
                initialArtifactId={focusArtifactId}
              />
            </TabsContent>
            <TabsContent value="code" className="min-h-0 h-[calc(100vh-3rem)]">
              {activeFragment?.files ? (
                <FileExplorer
                  files={
                    typeof activeFragment.files === "string"
                      ? (JSON.parse(activeFragment.files) as FileCollection)
                      : (activeFragment.files as FileCollection)
                  }
                />
              ) : (
                <GenerationPanel
                  lifecycleState={lifecycleState}
                  hasFragment={!!activeFragment}
                />
              )}
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export { ProjectView };
