"use client";

import { useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import Image from "next/image";

const integrations = [
  {
    id: "google",
    name: "Google Workspace",
    description: "Drive, Docs, Sheets, Slides, Gmail",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
    )
  },
  {
    id: "microsoft",
    name: "Microsoft 365",
    description: "Word, Excel, OneDrive, SharePoint, Outlook",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
    )
  },
  {
    id: "atlassian",
    name: "Atlassian",
    description: "Jira, Confluence",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="#0052CC"><path d="M11.51 3.19C11.51 3.19 5.09 10.15 2.25 13.25C-0.75 16.51 -0.75 21.78 2.25 25.04C5.25 28.3 10.12 28.3 13.12 25.04C15.96 21.94 22.38 14.98 22.38 14.98C22.38 14.98 16.92 14.98 11.51 14.98C6.1 14.98 11.51 3.19 11.51 3.19ZM20.19 0C17.35 0 14.98 2.37 14.98 5.21V11.83C14.98 11.83 20.39 11.83 25.8 11.83C25.8 11.83 20.39 22.62 20.39 22.62C20.39 22.62 25.8 22.62 28.64 19.53C31.64 16.27 31.64 11 28.64 7.74C25.64 4.48 20.19 0 20.19 0Z" transform="translate(0 -3)"/></svg>
    )
  },
  {
    id: "github",
    name: "GitHub",
    description: "Repos, Issues, PRs",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
    )
  },
  {
    id: "figma",
    name: "Figma",
    description: "Design files",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24"><path fill="#0ACF83" d="M8 12.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path fill="#A259FF" d="M12 4.5A4 4 0 1 0 8 8.5h4v-4z"/><path fill="#F24E1E" d="M4 4.5A4 4 0 1 0 8 8.5H4v-4z"/><path fill="#FF7262" d="M8 8.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/><path fill="#1ABCFE" d="M12 4.5a4 4 0 1 0 8 0 4 4 0 0 0-8 0z" transform="rotate(-180 16 4.5)"/></svg>
    )
  },
  {
    id: "slack",
    name: "Slack",
    description: "Channels, Messages",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24"><path fill="#E01E5A" d="M9.4 6.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm1.1-5v6c0 1.4-1.1 2.5-2.5 2.5h-4a2.5 2.5 0 1 1 0-5h4V1.5c0-1.4 1.1-2.5 2.5-2.5zm4.1 8h-6c-1.4 0-2.5-1.1-2.5-2.5v-4C6.1 1.6 7.2.5 8.6.5h6c1.4 0 2.5 1.1 2.5 2.5v4c0 1.4-1.1 2.5-2.5 2.5z"/><path fill="#36C5F0" d="M14.6 17.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zm-1.1 5v-6c0-1.4 1.1-2.5 2.5-2.5h4a2.5 2.5 0 1 1 0 5h-4v3.5c0 1.4-1.1 2.5-2.5 2.5zm-4.1-8h6c1.4 0 2.5 1.1 2.5 2.5v4c0 1.4-1.1 2.5-2.5 2.5h-6C6.1 23.5 5 22.4 5 21v-4c0-1.4 1.1-2.5 2.5-2.5z"/><path fill="#2EB67D" d="M6.5 14.6a2.5 2.5 0 1 0-5 0 2.5 2.5 0 0 0 5 0zm-5-1.1h6c1.4 0 2.5-1.1 2.5-2.5v-4a2.5 2.5 0 1 1 5 0v4c0 1.4-1.1 2.5-2.5 2.5zm8-4.1v6c0 1.4-1.1 2.5-2.5 2.5h-4C1.6 17.9.5 16.8.5 15.4v-6C.5 8 1.6 6.9 3 6.9h4c1.4 0 2.5 1.1 2.5 2.5z"/><path fill="#ECB22E" d="M17.5 9.4a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm1.1-5h-6c-1.4 0-2.5 1.1-2.5 2.5v4a2.5 2.5 0 1 1-5 0v-4c0-1.4 1.1-2.5 2.5-2.5zm-4.1 8v6c0 1.4-1.1 2.5-2.5 2.5h-4c-1.4 0-2.5-1.1-2.5-2.5v-6c0-1.4 1.1-2.5 2.5-2.5h4c1.4 0 2.5 1.1 2.5 2.5z"/></svg>
    )
  }
];

export default function ConnectToolsPage() {
  const [connectedState, setConnectedState] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState("");
  const [completing, setCompleting] = useState(false);

  const handleConnect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (id === "google") {
      setMessage("Google Workspace connection is not configured yet. You can continue without connecting.");
    } else if (id === "microsoft") {
      setMessage("Microsoft 365 connection is not configured yet. You can continue without connecting.");
    } else {
      setConnectedState(prev => ({ ...prev, [id]: !prev[id] }));
    }
  };

  const handleComplete = async (e: React.MouseEvent, redirectUrl: string) => {
    e.preventDefault();
    setCompleting(true);
    await fetch("/api/auth/complete-onboarding", { method: "POST" });
    window.location.href = redirectUrl;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#0a0a0f] to-[#0a0a0f] text-white flex items-center justify-center p-4 sm:p-8 selection:bg-indigo-500/30 relative">
      
      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center">
        <span className="text-white font-light tracking-widest text-2xl uppercase">ARIA</span>
      </div>

      <div className="w-full max-w-[800px] bg-[#12121a] rounded-2xl border border-white/5 flex flex-col shadow-2xl relative">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[500px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="p-6 sm:p-12 relative z-10 flex flex-col h-full">
          <div className="text-center space-y-4 mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Connect the tools you already use</h1>
            <p className="text-zinc-400 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
              This helps Aria publish artifacts, keep data in sync, and provide smarter recommendations.
            </p>
          </div>

          {message && (
            <div className="mb-8 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm text-center">
              {message}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10 sm:mb-12">
            {integrations.map((tool) => {
              const isConnected = connectedState[tool.id];
              return (
                <div key={tool.id} className="bg-[#1a1a24] border border-white/5 rounded-xl p-5 flex flex-col hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3 mb-4">
                    {tool.icon}
                    <span className="font-medium text-sm">{tool.name}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mb-6 flex-1">{tool.description}</p>
                  
                  <button 
                    onClick={(e) => handleConnect(e, tool.id)}
                    className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${isConnected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-transparent border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10"}`}
                  >
                    {isConnected ? "Connected" : "Connect"}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-auto flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs text-zinc-500 text-center sm:text-left">
              <Info className="w-4 h-4 shrink-0" />
              <span>You can connect or disconnect tools anytime.</span>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto">
              <button disabled={completing} onClick={(e) => handleComplete(e, "/")} className="text-sm text-zinc-400 hover:text-white transition-colors flex-1 sm:flex-none text-center disabled:opacity-50">
                Continue without connecting
              </button>
              <button disabled={completing} onClick={(e) => handleComplete(e, "/onboarding/complete")} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex-1 sm:flex-none text-center disabled:opacity-50">
                {completing ? "Saving..." : "Continue"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
