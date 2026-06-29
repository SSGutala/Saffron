"use client";

import { useAuth } from "@/components/auth-provider";
import { AriaShell, AriaTopBar } from "@/components/aria/aria-shell";

export function SettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <AriaShell topBar={<AriaTopBar />} showAskBar={false}>
      <div className="p-6 max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-semibold text-[#1e293b]">Settings</h1>

        <section className="aria-card p-5 space-y-4">
          <h2 className="text-sm font-semibold text-[#1e293b]">Profile</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#64748b]">Name</dt>
              <dd className="text-[#1e293b] font-medium">{user?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748b]">Email</dt>
              <dd className="text-[#1e293b] font-medium">{user?.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#64748b]">Plan</dt>
              <dd className="text-[#1e293b] font-medium capitalize">{user?.plan?.toLowerCase() ?? "free"}</dd>
            </div>
          </dl>
        </section>

        <section className="aria-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#1e293b]">Account</h2>
          <button
            type="button"
            onClick={() => signOut()}
            className="h-10 px-4 rounded-lg border border-[#e2e8f0] text-sm text-[#64748b] hover:bg-[#f8f9fb]"
          >
            Sign out
          </button>
        </section>
      </div>
    </AriaShell>
  );
}
