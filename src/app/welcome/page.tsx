"use client";

import Link from "next/link";
import { Mail, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

// These are read server-side via NEXT_PUBLIC_ prefix so they're available in the client bundle
const hasGoogle = !!process.env.NEXT_PUBLIC_GOOGLE_ENABLED;
const hasMicrosoft = !!process.env.NEXT_PUBLIC_MICROSOFT_ENABLED;

const ERROR_MESSAGES: Record<string, string> = {
  oauth_failed: "Authentication failed. Please try again.",
  cancelled: "Authentication was cancelled.",
};

export default function WelcomePage() {
  const [oauthError, setOauthError] = useState("");

  useEffect(() => {
    const err = new URLSearchParams(window.location.search).get("error");
    if (err && ERROR_MESSAGES[err]) setOauthError(ERROR_MESSAGES[err]);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#0a0a0f] to-[#0a0a0f] text-white flex items-center justify-center p-4 sm:p-8 selection:bg-indigo-500/30 relative">
      
      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center">
        <span className="text-white font-light tracking-widest text-2xl uppercase">ARIA</span>
      </div>

      <div className="w-full max-w-[1000px] min-h-[600px] bg-[#12121a] rounded-2xl border border-white/5 flex flex-col lg:flex-row overflow-hidden shadow-2xl relative">
        
        {/* Left Section - Branding */}
        <div className="hidden lg:flex w-full lg:w-1/2 p-12 flex-col justify-between relative overflow-hidden">
          {/* Abstract background elements */}
          <div className="absolute bottom-0 left-0 w-full h-[300px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-12">
            <div className="space-y-8">
              <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-zinc-400">
                Turn ideas into<br />living products.
              </h1>

              <ul className="space-y-5 text-zinc-300">
                <li className="flex gap-3 items-start">
                  <div className="mt-0.5 w-5 h-5 shrink-0 text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-sm leading-relaxed">AI PM that understands your product</span>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-0.5 w-5 h-5 shrink-0 text-indigo-400 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
                  </div>
                  <span className="text-sm leading-relaxed">Creates the right artifacts in the tools your team already uses</span>
                </li>
                <li className="flex gap-3 items-start">
                  <div className="mt-0.5 w-5 h-5 shrink-0 text-indigo-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <span className="text-sm leading-relaxed">Keeps everything connected across the product lifecycle</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="relative z-10 flex items-center gap-2 text-xs text-zinc-500 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>We never share your data. See our <Link href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</Link></span>
          </div>
        </div>

        {/* Right Section - Auth */}
        <div className="w-full lg:w-1/2 p-8 lg:p-12 flex items-center justify-center bg-[#0a0a0f]/50 lg:border-l border-white/5 py-16 lg:py-12">
          <div className="w-full max-w-[320px] space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-medium tracking-tight">Get started with Aria</h2>
              <p className="text-sm text-zinc-400">Sign in or create your account to continue</p>
            </div>

            {oauthError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {oauthError}
              </div>
            )}

            <div className="space-y-3">
              {hasGoogle ? (
                <Link href="/api/auth/google" className="flex items-center justify-center gap-3 w-full bg-white hover:bg-zinc-100 text-black px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Continue with Google
                </Link>
              ) : (
                <div className="flex flex-col gap-1">
                  <button disabled className="flex items-center justify-center gap-3 w-full bg-white opacity-40 cursor-not-allowed text-black px-4 py-2.5 rounded-lg text-sm font-medium">
                    <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                  </button>
                  <p className="text-xs text-zinc-500 text-center">Google sign-in not configured</p>
                </div>
              )}
              
              {hasMicrosoft ? (
                <Link href="/api/auth/microsoft" className="flex items-center justify-center gap-3 w-full bg-white hover:bg-zinc-100 text-black px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
                  Continue with Microsoft
                </Link>
              ) : (
                <div className="flex flex-col gap-1">
                  <button disabled className="flex items-center justify-center gap-3 w-full bg-white opacity-40 cursor-not-allowed text-black px-4 py-2.5 rounded-lg text-sm font-medium">
                    <svg className="w-5 h-5" viewBox="0 0 21 21"><path fill="#f25022" d="M1 1h9v9H1z"/><path fill="#00a4ef" d="M1 11h9v9H1z"/><path fill="#7fba00" d="M11 1h9v9h-9z"/><path fill="#ffb900" d="M11 11h9v9h-9z"/></svg>
                    Continue with Microsoft
                  </button>
                  <p className="text-xs text-zinc-500 text-center">Microsoft sign-in not configured</p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="h-px bg-white/10 flex-1" />
              <span className="text-xs text-zinc-500 font-medium">or</span>
              <div className="h-px bg-white/10 flex-1" />
            </div>

            <div>
              <Link href="/auth/email" className="flex items-center justify-center gap-3 w-full bg-transparent border border-white/10 hover:bg-white/5 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                <Mail className="w-4 h-4" />
                Continue with Email
              </Link>
            </div>

            <div className="text-center text-sm text-zinc-400">
              Already have an account? <Link href="/auth/signin" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
