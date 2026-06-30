"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, Play, Sparkles, Box, Workflow, Share2, Server, Command, Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";

/** 
 * Scroll Fade In component for cinematic reveals 
 */
function FadeIn({ 
  children, 
  delay = 0, 
  direction = "up",
  className 
}: { 
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(el);
      }
    }, { threshold: 0.15, rootMargin: "50px" });
    
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  let transform = "none";
  if (!isVisible && direction !== "none") {
    if (direction === "up") transform = "translateY(40px)";
    if (direction === "down") transform = "translateY(-40px)";
    if (direction === "left") transform = "translateX(40px)";
    if (direction === "right") transform = "translateX(-40px)";
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform,
        transition: `all 1.2s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
      }}
    >
      {children}
    </div>
  );
}

export default function CinematicLandingPage() {
  return (
    <div className="min-h-screen bg-[#050508] text-white selection:bg-indigo-500/30 overflow-x-hidden font-sans">
      
      {/* 
        ------------------------------------------------
        NAVBAR 
        ------------------------------------------------
      */}
      <nav className="fixed top-0 left-0 w-full z-50 px-6 py-6 flex items-center justify-between mix-blend-difference">
        <Link href="/" className="flex items-center gap-2 group">
          <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300 transition-colors" />
          <span className="text-white font-light tracking-[0.2em] text-lg uppercase">ARIA</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/auth/signin" className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">
            Sign in
          </Link>
        </div>
      </nav>

      {/* 
        ------------------------------------------------
        SCENE 1: HERO
        ------------------------------------------------
      */}
      <section className="relative min-h-[100vh] flex flex-col items-center justify-center pt-20 overflow-hidden">
        {/* Cinematic Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-[40%] left-[60%] -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[60vw] max-w-[600px] max-h-[600px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-5xl mx-auto mt-[-5vh]">
          <FadeIn delay={100}>
            <h1 className="text-5xl sm:text-7xl lg:text-[100px] font-medium tracking-tight leading-[1.05] text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/60 pb-4">
              Turn ideas into<br />living products.
            </h1>
          </FadeIn>
          
          <FadeIn delay={300}>
            <p className="mt-6 text-lg sm:text-xl text-zinc-400 font-light max-w-2xl mx-auto leading-relaxed">
              The intelligent operating system for modern product delivery.
            </p>
          </FadeIn>

          <FadeIn delay={500} className="mt-12 flex flex-col sm:flex-row items-center gap-6">
            <Link 
              href="/auth/signup" 
              className="group relative inline-flex items-center justify-center px-8 py-4 bg-white text-black rounded-full font-medium text-[15px] transition-transform hover:scale-105 active:scale-95 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <button className="group inline-flex items-center gap-3 px-8 py-4 text-[15px] font-medium text-zinc-300 hover:text-white transition-colors">
              <div className="w-10 h-10 rounded-full border border-zinc-700 flex items-center justify-center group-hover:border-zinc-500 transition-colors bg-zinc-900/50">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
              Watch Demo
            </button>
          </FadeIn>
        </div>

        {/* Hero Product Visualization */}
        <FadeIn delay={800} direction="up" className="relative w-full max-w-6xl mx-auto mt-24 px-6 perspective-[2000px]">
          <div className="relative w-full aspect-[16/9] rounded-2xl sm:rounded-[2rem] border border-white/10 bg-[#0a0a0f]/80 backdrop-blur-xl shadow-2xl overflow-hidden transform rotate-x-[5deg] scale-100 group">
            {/* Mock Dashboard UI elements for cinematic feel */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5" />
            <div className="absolute top-0 left-0 w-full h-16 border-b border-white/5 flex items-center px-8 gap-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
                <div className="w-3 h-3 rounded-full bg-white/10" />
              </div>
              <div className="w-64 h-6 rounded-md bg-white/5 ml-4" />
            </div>
            <div className="absolute top-24 left-8 bottom-8 w-64 border-r border-white/5 hidden sm:flex flex-col gap-4">
              <div className="w-32 h-4 rounded bg-white/10" />
              <div className="w-40 h-4 rounded bg-white/5" />
              <div className="w-36 h-4 rounded bg-white/5" />
              <div className="w-24 h-4 rounded bg-white/5 mt-8" />
              <div className="w-48 h-4 rounded bg-white/5" />
            </div>
            <div className="absolute top-24 left-8 sm:left-80 right-8 bottom-8 flex flex-col gap-6">
              <div className="w-48 h-8 rounded bg-white/10" />
              <div className="flex gap-4">
                <div className="flex-1 h-32 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20" />
                <div className="flex-1 h-32 rounded-xl bg-white/5 border border-white/5" />
                <div className="flex-1 h-32 rounded-xl bg-white/5 border border-white/5 hidden md:block" />
              </div>
              <div className="flex-1 rounded-xl bg-white/5 border border-white/5 relative overflow-hidden">
                <div className="absolute top-8 left-8 right-8 h-px bg-white/10" />
                <div className="absolute top-20 left-8 right-8 h-px bg-white/5" />
                <div className="absolute top-32 left-8 right-8 h-px bg-white/5" />
              </div>
            </div>
            {/* Glow sweep effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] animate-[shimmer_8s_infinite] pointer-events-none" />
          </div>
        </FadeIn>
      </section>

      {/* 
        ------------------------------------------------
        SCENE 2: WHAT IS ARIA
        ------------------------------------------------
      */}
      <section className="relative min-h-screen flex items-center py-32 px-6">
        <div className="max-w-6xl mx-auto w-full grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-8">
            <FadeIn>
              <h2 className="text-4xl sm:text-6xl font-medium tracking-tight text-white leading-[1.1]">
                An AI operating<br />system for product<br />delivery.
              </h2>
            </FadeIn>
            <FadeIn delay={200}>
              <p className="text-xl text-zinc-400 font-light leading-relaxed max-w-md">
                Aria connects planning, design, engineering, testing, and release into one intelligent system that drives your products forward.
              </p>
            </FadeIn>
          </div>
          <div className="relative h-[500px] w-full flex items-center justify-center">
            {/* Abstract visual replacing the 6 cards */}
            <FadeIn delay={400} className="relative w-full aspect-square max-w-[500px]">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
              <div className="absolute inset-8 rounded-full border border-white/10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="absolute inset-4 rounded-full border border-white/5" />
                <Sparkles className="w-16 h-16 text-indigo-400 opacity-80" />
              </div>
              <div className="absolute top-1/4 left-0 w-16 h-16 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl -translate-x-1/2">
                <Box className="w-6 h-6 text-zinc-400" />
              </div>
              <div className="absolute bottom-1/4 right-0 w-16 h-16 bg-zinc-900 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl translate-x-1/2">
                <Workflow className="w-6 h-6 text-zinc-400" />
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 
        ------------------------------------------------
        SCENE 3: THE JOURNEY (How it works)
        ------------------------------------------------
      */}
      <section className="relative min-h-screen py-32 px-6 flex flex-col items-center justify-center bg-[#08080c]">
        <div className="max-w-4xl mx-auto text-center mb-32">
          <FadeIn>
            <h2 className="text-5xl sm:text-7xl font-medium tracking-tight text-white">
              From idea to impact.<br />In seconds.
            </h2>
          </FadeIn>
        </div>

        <div className="w-full max-w-5xl mx-auto relative">
          {/* Glowing connecting line */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent -translate-y-1/2 hidden md:block" />
          
          <div className="grid md:grid-cols-3 gap-20 md:gap-12 relative z-10">
            {/* Step 1 */}
            <FadeIn delay={100} className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-3xl bg-zinc-900/80 border border-white/10 flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-2xl font-light text-white">1</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-4">Describe your idea</h3>
              <p className="text-zinc-500 font-light leading-relaxed">Tell Aria what you want to build using plain English.</p>
            </FadeIn>

            {/* Step 2 */}
            <FadeIn delay={300} className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(99,102,241,0.2)] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent" />
                <span className="text-2xl font-light text-indigo-400">2</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-4">Aria generates everything</h3>
              <p className="text-zinc-500 font-light leading-relaxed">Requirements, PRDs, flows, data models, and more.</p>
            </FadeIn>

            {/* Step 3 */}
            <FadeIn delay={500} className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-3xl bg-zinc-900/80 border border-white/10 flex items-center justify-center mb-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-2xl font-light text-white">3</span>
              </div>
              <h3 className="text-xl font-medium text-white mb-4">Publish & collaborate</h3>
              <p className="text-zinc-500 font-light leading-relaxed">Push directly to your favorite tools. Assign tasks. Move faster.</p>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* 
        ------------------------------------------------
        SCENE 4: ECOSYSTEM (Integrations)
        ------------------------------------------------
      */}
      <section className="relative min-h-screen py-32 px-6 flex flex-col items-center justify-center">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        
        <FadeIn className="text-center mb-24 relative z-10">
          <h2 className="text-4xl sm:text-6xl font-medium tracking-tight text-white mb-6">
            Works where your<br />team already works.
          </h2>
          <p className="text-xl text-zinc-400 font-light max-w-2xl mx-auto">
            Aria integrates natively so you can keep doing what you do best—without switching tools.
          </p>
        </FadeIn>

        <div className="w-full max-w-6xl mx-auto relative z-10 flex flex-wrap justify-center gap-x-16 gap-y-12">
          {/* Curated list of beautifully grouped logos */}
          {[
            "Google Workspace", "Microsoft 365", "Atlassian", "GitHub", 
            "Figma", "Slack", "Notion", "Linear", "Azure DevOps"
          ].map((logo, i) => (
            <FadeIn key={logo} delay={i * 100} direction="up" className="group flex flex-col items-center gap-4 cursor-default">
              <div className="w-20 h-20 rounded-2xl bg-zinc-900/50 border border-white/5 flex items-center justify-center group-hover:bg-zinc-800/80 group-hover:border-white/20 transition-all duration-500 shadow-xl">
                {/* Generic abstract icon representation for logos */}
                <Share2 className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors duration-500" />
              </div>
              <span className="text-sm text-zinc-500 group-hover:text-zinc-300 transition-colors font-medium tracking-wide">
                {logo}
              </span>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* 
        ------------------------------------------------
        SCENE 5: WHY ARIA (Bold Statements)
        ------------------------------------------------
      */}
      <section className="relative py-32 px-6 bg-[#08080c]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-32">
            <FadeIn className="flex flex-col justify-center gap-16">
              <div>
                <h3 className="text-4xl sm:text-5xl font-medium text-white mb-6 tracking-tight">One source of truth.</h3>
                <div className="w-12 h-1 bg-indigo-500/50 rounded-full" />
              </div>
              <div>
                <h3 className="text-4xl sm:text-5xl font-medium text-white mb-6 tracking-tight">One AI.</h3>
                <div className="w-12 h-1 bg-purple-500/50 rounded-full" />
              </div>
              <div>
                <h3 className="text-4xl sm:text-5xl font-medium text-zinc-600 mb-6 tracking-tight">Every workflow.</h3>
              </div>
              <div>
                <h3 className="text-4xl sm:text-5xl font-medium text-zinc-700 mb-6 tracking-tight">Connected.</h3>
              </div>
            </FadeIn>
            
            <div className="relative h-[600px] hidden md:flex items-center justify-center">
              <FadeIn delay={200} className="relative w-full h-full flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 via-transparent to-purple-500/10 rounded-[3rem] border border-white/5" />
                <div className="absolute inset-12 bg-zinc-900/50 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-8 backdrop-blur-md">
                  <Command className="w-16 h-16 text-white/20" />
                  <Server className="w-16 h-16 text-white/20" />
                  <Fingerprint className="w-16 h-16 text-white/20" />
                </div>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ------------------------------------------------
        SCENE 6: VISION & FINAL CTA
        ------------------------------------------------
      */}
      <section className="relative min-h-[80vh] flex flex-col items-center justify-center py-32 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-indigo-900/10 pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-[300px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-12">
          <FadeIn>
            <p className="text-xl sm:text-2xl text-zinc-400 font-light leading-relaxed">
              From Product and Engineering to IT, Legal, HR, and beyond—Aria is designed to power every team with intelligent automation, connected workflows, and the context they need to move faster.
            </p>
          </FadeIn>

          <FadeIn delay={200}>
            <h2 className="text-5xl sm:text-7xl font-medium tracking-tight text-white pb-8">
              Ready to build with Aria?
            </h2>
          </FadeIn>

          <FadeIn delay={400}>
            <Link 
              href="/auth/signup" 
              className="inline-flex items-center justify-center px-10 py-5 bg-white text-black rounded-full font-medium text-lg transition-transform hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)]"
            >
              Get Started
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* 
        ------------------------------------------------
        FOOTER
        ------------------------------------------------
      */}
      <footer className="relative z-10 border-t border-white/10 px-6 py-12 flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#030305]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-zinc-500 text-sm font-medium">Aria Product Delivery OS</span>
        </div>
        <div className="flex gap-8 text-sm text-zinc-600 font-medium">
          <Link href="#" className="hover:text-zinc-300 transition-colors">Documentation</Link>
          <Link href="#" className="hover:text-zinc-300 transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-zinc-300 transition-colors">Terms</Link>
        </div>
      </footer>

    </div>
  );
}
