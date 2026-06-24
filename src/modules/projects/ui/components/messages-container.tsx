"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { Fragment } from "@/generated/prisma";
import { useTRPC } from "@/trpc/client";
import { MessageCard } from "./message-card";
import { MessageForm } from "./message-form";
import { MessageLoading } from "./message-loading";

interface MessagesContainerProps {
  projectId: string;
  activeFragment: Fragment | null;
  setActiveFragment: (activeFragment: Fragment | null) => void;
  onOpenArtifact?: (artifactId: string) => void;
  onLifecycleState?: (state: string | undefined) => void;
}

const GENERATING_STATES = new Set(["INTAKE", "BUILDING"]);

const MessagesContainer = ({
  activeFragment,
  projectId,
  setActiveFragment,
  onOpenArtifact,
  onLifecycleState,
}: MessagesContainerProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastAssistantMessageIdRef = useRef<string | null>(null);

  const trpc = useTRPC();
  const ensureBuild = useMutation(trpc.lifecycle.ensureAppBuild.mutationOptions());
  const ensureBuildCalled = useRef(false);

  const { data: lifecycle } = useQuery(
    trpc.lifecycle.getStatus.queryOptions({ projectId }),
  );
  const isGenerating =
    GENERATING_STATES.has(lifecycle?.lifecycleState ?? "") && !activeFragment;

  useEffect(() => {
    if (ensureBuildCalled.current || activeFragment) return;
    if (
      lifecycle?.lifecycleState === "BRIEF_READY" ||
      lifecycle?.lifecycleState === "INTAKE"
    ) {
      ensureBuildCalled.current = true;
      ensureBuild.mutate({ projectId });
    }
  }, [lifecycle?.lifecycleState, activeFragment, projectId, ensureBuild]);

  const { data: messages } = useQuery(
    trpc.messages.getMany.queryOptions(
      { projectId },
      { refetchInterval: isGenerating ? 1500 : 5000 },
    ),
  );

  useEffect(() => {
    onLifecycleState?.(lifecycle?.lifecycleState);
  }, [lifecycle?.lifecycleState, onLifecycleState]);

  useEffect(() => {
    const lastAssistantMessage = messages
      ? [...messages].reverse().find((message) => message.role === "ASSISTANT")
      : undefined;

    if (
      lastAssistantMessage?.fragment &&
      lastAssistantMessage.id !== lastAssistantMessageIdRef.current
    ) {
      setActiveFragment(lastAssistantMessage?.fragment);
      lastAssistantMessageIdRef.current = lastAssistantMessage.id;
    }
  }, [messages, setActiveFragment]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [messages?.length]);

  const lastMessage = messages?.[messages?.length - 1];
  const isLastMessageUser = lastMessage?.role === "USER";
  const showLoading = isLastMessageUser || isGenerating;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-auto">
        <div className="pt-2 pr-1">
          {messages?.map((message) => (
            <MessageCard
              key={message.id}
              content={message.content}
              role={message.role}
              fragment={message.fragment}
              createdAt={message.createdAt}
              isActiveFragment={activeFragment?.id === message.fragment?.id}
              onFragmentClick={() => setActiveFragment(message.fragment)}
              type={message.type}
              cardType={message.cardType}
              metadata={message.metadata}
              projectId={projectId}
              onOpenArtifact={onOpenArtifact}
            />
          ))}

          {showLoading && <MessageLoading />}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="relative p-3 pt-1">
        <div className="absolute -top-6 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-background pointer-events-none" />
        <MessageForm projectId={projectId} />
      </div>
    </div>
  );
};

export { MessagesContainer };
