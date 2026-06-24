"use client";

import { AlertCircleIcon, Loader2Icon, WrenchIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AutofixBannerProps {
  message: string;
  isRecovering?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  showFixButton?: boolean;
  onFix?: () => void;
}

export function AutofixBanner({
  message,
  isRecovering,
  onRetry,
  onDismiss,
  showFixButton,
  onFix,
}: AutofixBannerProps) {
  return (
    <div className="mx-2 mb-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 flex items-start gap-3">
      {isRecovering ? (
        <Loader2Icon className="size-5 shrink-0 animate-spin text-amber-600" />
      ) : (
        <AlertCircleIcon className="size-5 shrink-0 text-amber-600" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm">{message}</p>
        {isRecovering && (
          <p className="text-xs text-muted-foreground mt-1">Saffron is fixing this automatically…</p>
        )}
      </div>
      <div className="flex gap-1 shrink-0">
        {showFixButton && onFix && (
          <Button size="sm" variant="outline" onClick={onFix}>
            <WrenchIcon className="size-3.5" />
            Fix with AI
          </Button>
        )}
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            Dismiss
          </Button>
        )}
      </div>
    </div>
  );
}
