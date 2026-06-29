"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRODUCT_NAV } from "@/modules/aria/constants";

export function ProductSidebar({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/products/${projectId}`;

  const hrefFor = (id: string) => {
    if (id === "overview") return base;
    if (id === "artifacts") return `${base}/artifacts`;
    if (id === "integrations") return `${base}/integrations`;
    return `${base}/section/${id}`;
  };

  const isActive = (id: string) => {
    if (id === "overview") return pathname === base;
    if (id === "artifacts") return pathname.includes("/artifacts");
    if (id === "integrations") return pathname.includes("/integrations");
    return pathname.includes(`/section/${id}`);
  };

  return (
    <aside className="w-[200px] shrink-0 border-r border-[#e2e8f0] bg-white py-4 px-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8] px-3 mb-3">
        Workspace
      </p>
      <nav className="space-y-0.5">
        {PRODUCT_NAV.map((item) => (
          <Link
            key={item.id}
            href={hrefFor(item.id)}
            className={cn(
              "block px-3 py-2 rounded-lg text-sm transition-colors",
              isActive(item.id)
                ? "bg-[#eef2ff] text-[#6366f1] font-medium"
                : "text-[#64748b] hover:bg-[#f8f9fb] hover:text-[#1e293b]",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
