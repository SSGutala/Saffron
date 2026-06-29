"use client";

import Link from "next/link";
import { Check, Link as LinkIcon, MessageSquare, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function CompletePage() {
  const [completing, setCompleting] = useState(false);

  const handleGoToAria = async (e: React.MouseEvent) => {
    e.preventDefault();
    setCompleting(true);
    await fetch("/api/auth/complete-onboarding", { method: "POST" });
    window.location.href = "/";
  };
  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#0a0a0f] to-[#0a0a0f] text-white flex items-center justify-center p-4 sm:p-8 selection:bg-indigo-500/30 relative">
      
      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center">
        <span className="text-white font-light tracking-widest text-2xl uppercase">ARIA</span>
      </div>

      <div className="w-full max-w-[800px] bg-[#12121a] rounded-2xl border border-white/5 flex flex-col lg:flex-row shadow-2xl relative overflow-hidden">
        
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

        {/* Left Section - Success Message */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex flex-col items-center text-center justify-center relative z-10 lg:border-r border-white/5 border-b lg:border-b-0 py-16">
          
          <div className="relative mb-10 w-32 h-32 flex items-center justify-center">
            {/* Mock confetti dots */}
            <div className="absolute top-0 left-4 w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <div className="absolute top-6 right-2 w-2 h-2 rounded-full bg-blue-400" />
            <div className="absolute bottom-4 left-0 w-2 h-2 rounded-full bg-purple-400" />
            <div className="absolute bottom-8 right-6 w-1.5 h-1.5 rounded-full bg-amber-400" />
            <div className="absolute top-12 left-10 w-1 h-1 rounded-full bg-rose-400" />
            
            <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.4)]">
              <Check className="w-10 h-10 text-white" strokeWidth={3} />
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight mb-4">You're all set!</h1>
          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed mb-10 lg:mb-12">
            Aria is ready to help you deliver amazing products.
          </p>

          <button disabled={completing} onClick={handleGoToAria} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            {completing ? "Loading..." : "Go to Aria"}
          </button>
        </div>

        {/* Right Section - Summary */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 bg-[#0a0a0f]/50 relative z-10 flex flex-col justify-center">
          
          <div className="mb-10">
            <h3 className="text-sm font-semibold mb-4 text-white">Connected tools</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a24] border border-white/5">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  <span className="text-sm font-medium text-zinc-200">Google Workspace</span>
                </div>
                <span className="text-xs font-medium text-emerald-400">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-[#1a1a24] border border-white/5">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
                  <span className="text-sm font-medium text-zinc-200">Microsoft 365</span>
                </div>
                <span className="text-xs font-medium text-emerald-400">Connected</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-4 text-white">What's next?</h3>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-sm text-zinc-400">
                <LinkIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>Create your first product</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-400">
                <MessageSquare className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>Ask Aria to generate artifacts</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-zinc-400">
                <ArrowUpRight className="w-4 h-4 text-zinc-500 shrink-0" />
                <span>Publish to your connected tools</span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
