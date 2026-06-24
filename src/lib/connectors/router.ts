/**
 * Artifact editing routing:
 * - Not connected → Saffron native editor
 * - Connected with externalId → embedded connected app (live file)
 * - Connected without externalId → OAuth + create on first connect
 */
export type EditRoute =
  | { mode: "native"; reason: "not_connected" }
  | { mode: "embed"; reason: "connected_live_file"; embedUrl: string; openUrl: string }
  | { mode: "connect_required"; reason: "needs_oauth"; provider: string };

export function resolveEditRoute(params: {
  useConnector: boolean;
  connectorProvider: string;
  connectorEmbedUrl?: string | null;
  connectorExternalUrl?: string | null;
  connectorExternalId?: string | null;
}): EditRoute {
  if (!params.useConnector || params.connectorProvider === "NATIVE") {
    return { mode: "native", reason: "not_connected" };
  }

  if (params.connectorEmbedUrl && params.connectorExternalUrl) {
    return {
      mode: "embed",
      reason: "connected_live_file",
      embedUrl: params.connectorEmbedUrl,
      openUrl: params.connectorExternalUrl,
    };
  }

  return {
    mode: "connect_required",
    reason: "needs_oauth",
    provider: params.connectorProvider,
  };
}
