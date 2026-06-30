"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  ActivityIcon,
  ArchiveIcon,
  BellIcon,
  BotIcon,
  BoxIcon,
  ChevronLeftIcon,
  FileTextIcon,
  FlaskConicalIcon,
  GitBranchIcon,
  HomeIcon,
  LayersIcon,
  LayoutGridIcon,
  PackageIcon,
  PaletteIcon,
  PlugIcon,
  RocketIcon,
  SearchIcon,
  SettingsIcon,
  SparklesIcon,
  WorkflowIcon,
  ZapIcon,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";
import { GLOBAL_NAV } from "@/modules/aria/constants";
import { useTRPC } from "@/trpc/client";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  home: HomeIcon,
  products: PackageIcon,
  sparkles: SparklesIcon,
  backlog: LayersIcon,
  artifacts: FileTextIcon,
  workflows: WorkflowIcon,
  automations: ZapIcon,
  designs: PaletteIcon,
  tests: FlaskConicalIcon,
  releases: RocketIcon,
  integrations: PlugIcon,
  activity: ActivityIcon,
  settings: SettingsIcon,
};

interface AriaSidebarProps {
  collapsed?: boolean;
  onCollapse?: () => void;
}

export function AriaSidebar({ collapsed, onCollapse }: AriaSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-[#12141d] text-[#94a3b8] shrink-0 transition-all",
        collapsed ? "w-[68px]" : "w-[220px]",
      )}
    >
      <div className={cn("p-5 border-b border-white/5", collapsed && "px-3")}>
        <Link href="/" className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-[#6366f1] flex items-center justify-center shrink-0">
            <BotIcon className="size-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-semibold text-[15px] leading-tight">Aria</p>
              <p className="text-[10px] text-[#64748b] leading-tight mt-0.5">
                AI Product Delivery OS
              </p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {GLOBAL_NAV.map((item) => {
          const Icon = ICONS[item.icon] ?? BoxIcon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "aria-sidebar-link",
                active && "active",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("size-[18px] shrink-0 aria-nav-icon", active && "text-[#6366f1]")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/5 space-y-2">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="size-8 rounded-full bg-[#6366f1]/30 flex items-center justify-center text-xs text-white font-medium shrink-0">
              {(user.name ?? user.email)[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-white truncate">{user.name ?? "User"}</p>
              <p className="text-[11px] text-[#64748b] truncate">Product Manager</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={onCollapse}
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 text-xs text-[#64748b] hover:text-[#94a3b8] rounded-lg hover:bg-[#1e2130] transition-colors",
            collapsed && "justify-center",
          )}
        >
          <ChevronLeftIcon className={cn("size-4", collapsed && "rotate-180")} />
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}

export function AriaTopBar({
  searchPlaceholder = "Search products, artifacts, or ask Aria…",
  showNewProduct,
  onNewProduct,
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: {
  searchPlaceholder?: string;
  showNewProduct?: boolean;
  onNewProduct?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchSubmit?: (value: string) => void;
}) {
  const router = useRouter();
  const [localSearch, setLocalSearch] = useState("");
  const search = searchValue ?? localSearch;
  const setSearch = onSearchChange ?? setLocalSearch;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter") return;
    const q = search.trim();
    if (onSearchSubmit) {
      onSearchSubmit(q);
      return;
    }
    if (q) router.push(`/artifacts?q=${encodeURIComponent(q)}`);
  };

  return (
    <header className="flex items-center gap-4 px-6 py-4 bg-white border-b border-[#e2e8f0] shrink-0">
      <div className="flex-1 max-w-xl relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[#94a3b8]" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder={searchPlaceholder}
          className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#e2e8f0] bg-[#f8f9fb] text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1]"
        />
      </div>
      {showNewProduct && (
        <button
          type="button"
          onClick={onNewProduct}
          className="aria-btn-primary h-10 px-4 text-sm flex items-center gap-2 shrink-0"
        >
          + New Product
        </button>
      )}
      <button
        type="button"
        onClick={() => router.push("/activity")}
        className="size-10 rounded-lg border border-[#e2e8f0] flex items-center justify-center text-[#64748b] hover:bg-[#f8f9fb] shrink-0"
        title="Recent activity"
      >
        <BellIcon className="size-[18px]" />
      </button>
    </header>
  );
}

export function AriaAskBar({
  placeholder = "Ask Aria anything about your product…",
  projectId,
  onSubmit,
}: {
  placeholder?: string;
  projectId?: string;
  onSubmit?: (value: string) => void;
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const [value, setValue] = useState("");

  const createMessage = useMutation(
    trpc.messages.create.mutationOptions({
      onError: (e) => toast.error(e.message),
    }),
  );

  const submit = async () => {
    const text = value.trim();
    if (!text) return;
    
    if (onSubmit) {
      onSubmit(text);
      setValue("");
      return;
    }

    if (projectId) {
      await createMessage.mutateAsync({ projectId, value: text });
      setValue("");
      router.push(`/ai-pm/${projectId}`);
      return;
    }

    router.push(`/ai-pm?q=${encodeURIComponent(text)}`);
  };

  return (
    <div className="shrink-0 px-6 py-4 bg-white border-t border-[#e2e8f0]">
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        <div className="size-8 rounded-full bg-[#6366f1] flex items-center justify-center shrink-0">
          <SparklesIcon className="size-4 text-white" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void submit();
            }
          }}
          disabled={createMessage.isPending}
          placeholder={placeholder}
          className="flex-1 h-11 px-4 rounded-full border border-[#e2e8f0] bg-[#f8f9fb] text-sm focus:outline-none focus:ring-2 focus:ring-[#6366f1]/20 focus:border-[#6366f1] disabled:opacity-60"
        />
      </div>
    </div>
  );
}

export function AriaBreadcrumbs({
  items,
}: {
  items: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav className="flex items-center gap-2 text-sm text-[#64748b] mb-1">
      {items.map((item, i) => (
        <span key={item.label} className="flex items-center gap-2">
          {i > 0 && <span>/</span>}
          {item.href ? (
            <Link href={item.href} className="hover:text-[#6366f1]">
              {item.label}
            </Link>
          ) : (
            <span className="text-[#1e293b] font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
