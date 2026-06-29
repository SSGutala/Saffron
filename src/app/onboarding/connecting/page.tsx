"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

export default function ConnectingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setStep(1), 1000);
    const timer2 = setTimeout(() => setStep(2), 2000);
    const timer3 = setTimeout(() => setStep(3), 3000);
    const timer4 = setTimeout(() => {
      // Return to complete page mock after done
      router.push("/onboarding/complete");
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#0a0a0f] to-[#0a0a0f] text-white flex items-center justify-center p-4 sm:p-8 selection:bg-indigo-500/30 relative">
      
      {/* Top Left Logo */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center">
        <span className="text-white font-light tracking-widest text-2xl uppercase">ARIA</span>
      </div>

      <div className="w-full max-w-[500px] bg-[#12121a] rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center p-8 sm:p-12">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[200px] h-[200px] bg-indigo-500/20 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center w-full">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] mb-8">
            <svg className="w-10 h-10" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          </div>

          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-3">Connecting Google Workspace</h2>
          <p className="text-zinc-400 text-xs sm:text-sm mb-10 sm:mb-12">You'll be redirected to Google to authorize Aria.</p>

          <div className="w-full max-w-[280px] space-y-4">
            <div className={`flex items-center gap-3 text-sm transition-all duration-500 ${step >= 0 ? "text-white" : "text-zinc-600"}`}>
              {step > 0 ? <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" /> : <div className="w-5 h-5 rounded-full border-2 border-indigo-500/50 shrink-0" />}
              <span>Starting connection...</span>
            </div>
            <div className={`flex items-center gap-3 text-sm transition-all duration-500 ${step >= 1 ? "text-white" : "text-zinc-600"}`}>
              {step > 1 ? <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" /> : <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${step === 1 ? "border-indigo-500" : "border-zinc-800"}`} />}
              <span>Redirecting to Google...</span>
            </div>
            <div className={`flex items-center gap-3 text-sm transition-all duration-500 ${step >= 2 ? "text-white" : "text-zinc-600"}`}>
              {step > 2 ? <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" /> : <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${step === 2 ? "border-indigo-500" : "border-zinc-800"}`} />}
              <span>Authorizing access...</span>
            </div>
            <div className={`flex items-center gap-3 text-sm transition-all duration-500 ${step >= 3 ? "text-white" : "text-zinc-600"}`}>
              {step > 3 ? <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" /> : <div className={`w-5 h-5 rounded-full border-2 shrink-0 ${step === 3 ? "border-indigo-500" : "border-zinc-800"}`} />}
              <span>Finalizing connection...</span>
            </div>
          </div>

          <button onClick={() => router.push("/onboarding/connect-tools")} className="mt-10 sm:mt-12 w-full bg-transparent border border-white/10 hover:bg-white/5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-zinc-300">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
