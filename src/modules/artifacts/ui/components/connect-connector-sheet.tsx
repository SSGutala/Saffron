"use client";

import { Loader2Icon, PlugIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CONNECTOR_META } from "@/types/artifacts";

interface ConnectConnectorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: keyof typeof CONNECTOR_META;
  artifactTitle: string;
  isPending: boolean;
  onConnect: (embedUrl: string, externalUrl?: string) => void;
}

export function ConnectConnectorSheet({
  open,
  onOpenChange,
  provider,
  artifactTitle,
  isPending,
  onConnect,
}: ConnectConnectorSheetProps) {
  const [embedUrl, setEmbedUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const meta = CONNECTOR_META[provider];

  const handleConnect = () => {
    if (!embedUrl.trim()) return;
    onConnect(embedUrl.trim(), externalUrl.trim() || undefined);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <PlugIcon className="size-4" />
            Connect to {meta.label}
          </SheetTitle>
          <SheetDescription>
            Saffron will export &ldquo;{artifactTitle}&rdquo; and hand it off to {meta.label}.
            Paste the embed or share URL from your connected file — native editing will be
            replaced by the embedded {meta.label} view.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-3 py-4 px-1">
          <div className="space-y-1.5">
            <Label htmlFor="embed-url">Embed URL</Label>
            <Input
              id="embed-url"
              placeholder="https://..."
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="external-url">Open in app URL (optional)</Label>
            <Input
              id="external-url"
              placeholder="https://..."
              value={externalUrl}
              onChange={(e) => setExternalUrl(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleConnect} disabled={isPending || !embedUrl.trim()}>
            {isPending ? <Loader2Icon className="animate-spin size-4" /> : "Connect"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
