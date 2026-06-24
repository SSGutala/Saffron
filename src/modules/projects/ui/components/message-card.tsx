import { format } from "date-fns";
import { ChevronRightIcon, Code2Icon } from "lucide-react";
import Image from "next/image";

import { Card } from "@/components/ui/card";
import { LifecycleStagesCard } from "@/modules/lifecycle/ui/lifecycle-stages-card";
import { StyleCarousel } from "@/modules/lifecycle/ui/style-carousel";
import { Fragment, MessageRole, MessageType } from "@/generated/prisma";
import type { BriefJson, StylePreview } from "@/types/lifecycle";
import { cn } from "@/lib/utils";

interface UserMessageProps {
  content: string;
  metadata?: string | null;
}

const UserMessage = ({ content, metadata }: UserMessageProps) => {
  let images: { dataUrl: string; name: string }[] = [];
  if (metadata) {
    try {
      const parsed = JSON.parse(metadata) as { images?: { dataUrl: string; name: string }[] };
      images = parsed.images ?? [];
    } catch {
      images = [];
    }
  }

  return (
    <div className="flex justify-end pb-4 pr-2 pl-10">
      <Card className="rounded-lg bg-muted p-3 shadow-none border-none max-w-4/5 break-words space-y-2">
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-end">
            {images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.dataUrl.slice(0, 32)}
                src={img.dataUrl}
                alt={img.name}
                className="size-16 rounded-lg object-cover border"
              />
            ))}
          </div>
        )}
        {content}
      </Card>
    </div>
  );
};

interface FragmentCardProps {
  fragment: Fragment;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
}

const FragmentCard = ({
  fragment,
  isActiveFragment,
  onFragmentClick,
}: FragmentCardProps) => {
  return (
    <button
      type="button"
      className={cn(
        "flex items-start text-start gap-2 border rounded-lg bg-muted w-fit p-3 hover:bg-secondary transition-colors",
        isActiveFragment &&
          "bg-primary text-primary-foreground border-primary hover:bg-primary",
      )}
      onClick={() => onFragmentClick(fragment)}
    >
      <Code2Icon className="size-4 mt-0.5" />
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium line-clamp-1">{fragment.title}</span>
        <span className="text-sm">Preview</span>
      </div>
      <ChevronRightIcon className="size-4 mt-0.5" />
    </button>
  );
};

interface AssistantMessageProps {
  content: string;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
  cardType?: string | null;
  metadata?: string | null;
  projectId: string;
  onOpenArtifact?: (artifactId: string) => void;
}

const AssistantMessage = ({
  content,
  createdAt,
  fragment,
  isActiveFragment,
  onFragmentClick,
  type,
  cardType,
  metadata,
  projectId,
  onOpenArtifact,
}: AssistantMessageProps) => {
  let lifecycleMeta: { brief?: BriefJson; artifactIds?: Record<string, string>; appTitle?: string } = {};
  let styles: StylePreview[] = [];

  if (metadata) {
    try {
      const parsed = JSON.parse(metadata);
      if (cardType === "lifecycle_brief") lifecycleMeta = parsed;
      if (cardType === "style_choices") styles = parsed.styles ?? [];
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className={cn(
        "flex flex-col group px-2 pb-4",
        type === "ERROR" && "text-red-700 dark:text-red-500",
      )}
    >
      <div className="flex items-center gap-2 pl-2 mb-2">
        <Image src="/logo.svg" alt="Saffron" height={18} width={18} className="shrink-0" />
        <span className="text-sm font-medium">Saffron</span>
        <span className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          {format(createdAt, "HH:mm 'on' MMM dd, yyyy")}
        </span>
      </div>

      <div className="pl-8.5 flex flex-col gap-y-4">
        <span>{content}</span>

        {cardType === "lifecycle_brief" && lifecycleMeta.brief && (
          <LifecycleStagesCard
            projectId={projectId}
            brief={lifecycleMeta.brief}
            artifactIds={lifecycleMeta.artifactIds ?? {}}
            appTitle={lifecycleMeta.appTitle}
            onOpenArtifact={onOpenArtifact}
          />
        )}

        {cardType === "style_choices" && styles.length > 0 && (
          <StyleCarousel projectId={projectId} styles={styles} />
        )}

        {fragment && type === "RESULT" && (
          <FragmentCard
            fragment={fragment}
            isActiveFragment={isActiveFragment}
            onFragmentClick={onFragmentClick}
          />
        )}
      </div>
    </div>
  );
};

export interface MessageCardProps {
  content: string;
  role: MessageRole;
  fragment: Fragment | null;
  createdAt: Date;
  isActiveFragment: boolean;
  onFragmentClick: (fragment: Fragment) => void;
  type: MessageType;
  cardType?: string | null;
  metadata?: string | null;
  projectId: string;
  onOpenArtifact?: (artifactId: string) => void;
}

const MessageCard = (props: MessageCardProps) => {
  if (props.role === "ASSISTANT") {
    return <AssistantMessage {...props} />;
  }
  return <UserMessage content={props.content} metadata={props.metadata} />;
};

export { MessageCard };
