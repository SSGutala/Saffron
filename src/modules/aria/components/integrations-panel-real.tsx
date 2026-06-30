"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ExternalLinkIcon, Loader2Icon, RefreshCwIcon, XCircleIcon } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { ARIA_CONNECTORS } from "@/lib/aria/connectors";
import { INTEGRATION_CATEGORIES } from "@/modules/aria/constants";
import { useTRPC } from "@/trpc/client";
import { cn } from "@/lib/utils";

// ─── Google Logo SVG ─────────────────────────────────────────────────────────
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ─── Connector Status Types ───────────────────────────────────────────────────
type ConnectorStatus =
  | "connected"
  | "not_connected"
  | "needs_reconnect"
  | "limited_access"
  | "error"
  | "not_configured";

// ─── Google Workspace Card ────────────────────────────────────────────────────
function GoogleWorkspaceCard({
  connection,
  onConnect,
  onDisconnect,
  isDisconnecting,
  returnTo,
}: {
  connection: { accountId: string | null; scopes: string | null; expiresAt: Date | null } | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isDisconnecting: boolean;
  returnTo: string;
}) {
  const hasClientId = !!process.env.NEXT_PUBLIC_GOOGLE_ENABLED;
  let status: ConnectorStatus = "not_connected";

  if (!hasClientId) {
    status = "not_configured";
  } else if (connection) {
    const now = new Date();
    if (connection.expiresAt && connection.expiresAt < now) {
      status = "needs_reconnect";
    } else {
      status = "connected";
    }
  }

  const statusConfig: Record<ConnectorStatus, { label: string; color: string; dot: string }> = {
    connected: { label: "Connected", color: "text-[#10b981]", dot: "bg-[#10b981]" },
    not_connected: { label: "Not connected", color: "text-[#64748b]", dot: "bg-[#cbd5e1]" },
    needs_reconnect: { label: "Needs reconnect", color: "text-[#f59e0b]", dot: "bg-[#f59e0b]" },
    limited_access: { label: "Limited access", color: "text-[#f59e0b]", dot: "bg-[#f59e0b]" },
    error: { label: "Error", color: "text-[#ef4444]", dot: "bg-[#ef4444]" },
    not_configured: { label: "Not configured", color: "text-[#94a3b8]", dot: "bg-[#e2e8f0]" },
  };

  const cfg = statusConfig[status];

  const capabilities = [
    { label: "Drive", icon: "📁" },
    { label: "Docs", icon: "📝" },
    { label: "Sheets", icon: "📊" },
    { label: "Slides", icon: "🖼️" },
  ];

  return (
    <div className="aria-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center shadow-sm">
            <GoogleLogo size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-[#1e293b] text-base">Google Workspace</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn("inline-block size-2 rounded-full", cfg.dot)} />
              <span className={cn("text-xs font-medium", cfg.color)}>{cfg.label}</span>
            </div>
          </div>
        </div>

        {status === "connected" && (
          <button
            type="button"
            onClick={onDisconnect}
            disabled={isDisconnecting}
            className="text-xs text-[#94a3b8] hover:text-[#ef4444] flex items-center gap-1 transition-colors"
          >
            <XCircleIcon className="size-3.5" />
            Disconnect
          </button>
        )}
      </div>

      {status === "connected" && connection?.accountId && (
        <div className="bg-[#f8f9fb] rounded-lg px-3 py-2 text-sm">
          <span className="text-[#64748b]">Account: </span>
          <span className="text-[#1e293b] font-medium">{connection.accountId}</span>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider">Capabilities</p>
        <div className="flex gap-2 flex-wrap">
          {capabilities.map((cap) => (
            <span
              key={cap.label}
              className={cn(
                "inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium",
                status === "connected"
                  ? "bg-[#ede9fe] text-[#6366f1]"
                  : "bg-[#f1f5f9] text-[#94a3b8]",
              )}
            >
              <span>{cap.icon}</span>
              {cap.label}
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm text-[#64748b]">
        Connect Google Workspace to publish artifacts to Google Docs, Sheets, and Slides. Aria becomes the intelligence layer above your Google files.
      </p>

      {status !== "connected" && status !== "not_configured" && (
        <button
          type="button"
          onClick={onConnect}
          className="aria-btn-primary w-full h-9 text-sm flex items-center justify-center gap-2"
        >
          <GoogleLogo size={16} />
          {status === "needs_reconnect" ? "Reconnect Google Workspace" : "Connect Google Workspace"}
        </button>
      )}

      {status === "not_configured" && (
        <p className="text-xs text-[#94a3b8] bg-[#f8f9fb] rounded-lg px-3 py-2">
          Configure <code className="font-mono">GOOGLE_CLIENT_ID</code> and{" "}
          <code className="font-mono">GOOGLE_CLIENT_SECRET</code> to enable this integration.
        </p>
      )}

      {status === "connected" && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onConnect}
            className="flex-1 h-8 text-sm text-[#6366f1] border border-[#6366f1]/30 rounded-lg hover:bg-[#6366f1]/5 transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCwIcon className="size-3.5" />
            Re-authorize
          </button>
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className="h-8 px-3 text-sm text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f8f9fb] transition-colors flex items-center gap-1.5"
          >
            <ExternalLinkIcon className="size-3.5" />
            Manage
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Other Connector Card ─────────────────────────────────────────────────────
type ProjectConnector = {
  id: string;
  name: string;
  icon: string;
  status: string;
  usedByProduct?: boolean;
  artifactCount?: number;
  productCount?: number;
};

function OtherConnectorCard({
  connector,
  projectId,
  onConnect,
  isPending,
}: {
  connector: ProjectConnector;
  projectId?: string;
  onConnect: () => void;
  isPending: boolean;
}) {
  const connected = connector.status === "connected" || connector.status === "mock";
  const count = connector.artifactCount ?? (connector.usedByProduct ? 1 : 0);

  return (
    <div className="aria-card p-5 space-y-3 opacity-75">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{connector.icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-[#1e293b]">{connector.name}</h3>
          {connected && (
            <span className="inline-flex items-center gap-1 text-xs text-[#10b981] mt-1">
              <CheckIcon className="size-3" />
              Connected
            </span>
          )}
        </div>
        <span className="text-xs text-[#94a3b8] bg-[#f8f9fb] px-2 py-0.5 rounded-full">
          Planned
        </span>
      </div>
      <p className="text-sm text-[#64748b]">
        {count} artifact{count !== 1 ? "s" : ""} synced
      </p>
      {projectId ? (
        <button
          type="button"
          disabled={isPending || !connected}
          onClick={onConnect}
          className="text-sm font-medium text-[#94a3b8] cursor-not-allowed"
        >
          Coming soon
        </button>
      ) : (
        <p className="text-xs text-[#94a3b8]">
          {connector.productCount && connector.productCount > 0
            ? `Used in ${connector.productCount} product${connector.productCount > 1 ? "s" : ""}`
            : "Connect from a product workspace"}
        </p>
      )}
    </div>
  );
}

// ─── Category Map (excluding Google since it's unified) ───────────────────────
const GOOGLE_IDS = ["google_docs", "google_sheets", "google_slides", "google_drive"];

const CATEGORY_MAP: Record<string, string[]> = {
  All: ARIA_CONNECTORS.filter((c) => !GOOGLE_IDS.includes(c.id)).map((c) => c.id),
  Documents: ["microsoft_word", "confluence", "notion"],
  Delivery: ["jira", "linear", "azure_devops"],
  Design: ["figma"],
  Automation: ["power_automate", "zapier"],
  Data: ["excel", "airtable"],
  Dev: ["github", "gitlab"],
};

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function IntegrationsPanelReal({ projectId }: { projectId?: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("All");
  const searchParams = useSearchParams();

  // Show success/error toasts from OAuth redirect params
  useEffect(() => {
    const connected = searchParams.get("connected");
    const error = searchParams.get("error");
    if (connected === "google") {
      toast.success("Google Workspace connected successfully");
    } else if (error === "cancelled") {
      toast.info("Google Workspace connection cancelled");
    } else if (error === "oauth_failed") {
      toast.error("Google Workspace connection failed. Please try again.");
    }
  }, [searchParams]);

  const projectConnectors = useQuery({
    ...trpc.workspace.getConnectors.queryOptions({ projectId: projectId! }),
    enabled: !!projectId,
  });

  const globalConnectors = useQuery({
    ...trpc.workspace.getGlobalIntegrations.queryOptions(),
    enabled: !projectId,
  });

  const { data: userConnections = [], isLoading: connectionsLoading } = useQuery(
    trpc.workspace.getUserConnections.queryOptions()
  );

  const { data: connectors, isLoading: connectorsLoading } = projectId
    ? projectConnectors
    : globalConnectors;

  const isLoading = connectorsLoading || connectionsLoading;

  const disconnect = useMutation(
    trpc.workspace.disconnectProvider.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.workspace.getUserConnections.queryOptions());
        queryClient.invalidateQueries(trpc.workspace.getGlobalIntegrations.queryOptions());
        toast.success("Google Workspace disconnected");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  const mockConnect = useMutation(
    trpc.workspace.connectConnector.mutationOptions({
      onSuccess: () => {
        if (projectId) {
          queryClient.invalidateQueries(trpc.workspace.getConnectors.queryOptions({ projectId }));
        }
        queryClient.invalidateQueries(trpc.workspace.getGlobalIntegrations.queryOptions());
        toast.success("Connector connected");
      },
      onError: (e) => toast.error(e.message),
    }),
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2Icon className="size-6 animate-spin text-[#64748b]" />
      </div>
    );
  }

  const googleConnection = userConnections.find((c) => c.providerId === "google") ?? null;
  const returnTo = projectId ? `/products/${projectId}` : "/integrations";

  const ids = CATEGORY_MAP[category] ?? CATEGORY_MAP.All;
  const otherConnectors = ((connectors ?? []) as ProjectConnector[]).filter(
    (c) => ids.includes(c.id) && !GOOGLE_IDS.includes(c.id),
  );

  return (
    <div className="space-y-8">
      {/* ── Google Workspace — hero card ── */}
      <div>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">
          Primary Integration
        </h2>
        <div className="max-w-md">
          <GoogleWorkspaceCard
            connection={googleConnection ? { ...googleConnection, expiresAt: null } : null}
            returnTo={returnTo}
            onConnect={() => {
              window.location.href = `/api/connectors/google?return_to=${encodeURIComponent(returnTo)}`;
            }}
            onDisconnect={() => disconnect.mutate({ providerId: "google" })}
            isDisconnecting={disconnect.isPending}
          />
        </div>
      </div>

      {/* ── Other Connectors ── */}
      <div>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">
          Planned Integrations
        </h2>

        <div className="flex gap-1 border-b border-[#e2e8f0] flex-wrap mb-6">
          {INTEGRATION_CATEGORIES.filter((c) => c !== "All" || true).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                category === cat
                  ? "border-[#6366f1] text-[#6366f1]"
                  : "border-transparent text-[#64748b]",
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {otherConnectors.map((connector) => (
            <OtherConnectorCard
              key={connector.id}
              connector={connector}
              projectId={projectId}
              onConnect={() => {
                if (projectId) mockConnect.mutate({ projectId, connectorId: connector.id });
              }}
              isPending={mockConnect.isPending}
            />
          ))}
        </div>

        {otherConnectors.length === 0 && (
          <p className="text-center py-12 text-sm text-[#64748b]">
            No integrations in this category yet.
          </p>
        )}
      </div>
    </div>
  );
}
