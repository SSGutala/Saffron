import { format } from "date-fns";
import Image from "next/image";

import { Card } from "@/components/ui/card";
import { StyleCarousel } from "@/modules/lifecycle/ui/style-carousel";
import { Fragment, MessageRole, MessageType } from "@/generated/prisma";
import type { StylePreview } from "@/types/lifecycle";
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

interface AssistantMessageProps {
  content: string;
  createdAt: Date;
  type: MessageType;
  cardType?: string | null;
  metadata?: string | null;
  projectId: string;
  onAppReady?: () => void;
}

const AssistantMessage = ({
  content,
  createdAt,
  type,
  cardType,
  metadata,
  projectId,
  onAppReady,
}: AssistantMessageProps) => {
  let styles: StylePreview[] = [];

  if (metadata) {
    try {
      const parsed = JSON.parse(metadata);
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

        {cardType === "style_choices" && styles.length > 0 && (
          <StyleCarousel
            projectId={projectId}
            styles={styles}
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
  onAppReady?: () => void;
}

const MessageCard = (props: MessageCardProps) => {
  if (props.role === "ASSISTANT") {
    return <AssistantMessage {...props} />;
  }
  return <UserMessage content={props.content} metadata={props.metadata} />;
};

export { MessageCard };
