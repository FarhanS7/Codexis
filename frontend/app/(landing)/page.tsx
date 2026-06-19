'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

// ─── SVG Icons (inline to avoid dependency) ──────────────────────────
function GitHubIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function ArrowRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  );
}

function CodeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function BoltIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
    </svg>
  );
}

function SparklesIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}

function ChatBubbleIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  );
}

function ChartIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

// ─── Intersection Observer hook for scroll animations ────────────────
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.15 }
    );

    const children = el.querySelectorAll('.reveal-on-scroll');
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, []);

  return ref;
}

// ─── Animated counter for stats ──────────────────────────────────────
function AnimatedStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="reveal-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out">
      <div className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-2 tabular-nums">{value}</div>
      <div className="text-sm text-neutral-500">{label}</div>
    </div>
  );
}

// ─── Code Preview Mockup ─────────────────────────────────────────────
function CodePreviewMockup() {
  return (
    <div className="w-full relative group">
      {/* Gradient glow behind the card */}
      <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 rounded-2xl blur-sm opacity-20 group-hover:opacity-40 transition-all duration-1000" />

      <div className="relative w-full rounded-2xl bg-[#0A0A0A] border border-white/10 overflow-hidden shadow-2xl flex flex-col">
        {/* Browser chrome */}
        <div className="h-10 border-b border-white/5 flex items-center px-4 gap-2 bg-neutral-900/50 shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <div className="mx-auto text-xs font-mono text-neutral-600 bg-black/30 px-3 py-1 rounded-md border border-white/5">
            codexis.dev/review/acme/api/42
          </div>
        </div>

        {/* Mockup body */}
        <div className="flex min-h-[280px] md:min-h-[340px]">
          {/* File tree sidebar */}
          <div className="w-44 border-r border-white/5 p-3 hidden md:flex flex-col gap-1.5 bg-neutral-900/30 shrink-0">
            <div className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider mb-2 px-2">Changed Files</div>
            {['src/auth.ts', 'src/middleware.ts', 'package.json', 'README.md'].map((file, i) => (
              <div key={file} className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-xs ${i === 0 ? 'bg-white/5 text-white border border-white/5' : 'text-neutral-500 hover:bg-white/[0.03]'} transition-colors`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-amber-400' : 'bg-neutral-600'}`} />
                <span className="truncate">{file}</span>
              </div>
            ))}
          </div>

          {/* Diff area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-neutral-900/20 shrink-0">
              <span className="text-xs text-neutral-400 font-mono">src/auth.ts</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-emerald-400 font-mono">+14</span>
                <span className="text-[10px] text-red-400 font-mono">-3</span>
              </div>
            </div>
            <div className="flex-1 p-4 font-mono text-[11px] leading-relaxed space-y-0.5 overflow-hidden">
              <div className="flex gap-3"><span className="text-neutral-700 select-none w-6 text-right shrink-0">10</span><span className="text-neutral-500">{'  const session = await getSession(req);'}</span></div>
              <div className="flex gap-3 bg-red-500/5 -mx-4 px-4 border-l-2 border-red-500/40"><span className="text-neutral-700 select-none w-6 text-right shrink-0">11</span><span className="text-red-400/80">{'- if (session.token) {'}</span></div>
              <div className="flex gap-3 bg-emerald-500/5 -mx-4 px-4 border-l-2 border-emerald-500/40"><span className="text-neutral-700 select-none w-6 text-right shrink-0">11</span><span className="text-emerald-400/80">{'+ if (session?.token) {'}</span></div>
              <div className="flex gap-3"><span className="text-neutral-700 select-none w-6 text-right shrink-0">12</span><span className="text-neutral-500">{'    return decrypt(session.token);'}</span></div>
              <div className="flex gap-3"><span className="text-neutral-700 select-none w-6 text-right shrink-0">13</span><span className="text-neutral-500">{'  }'}</span></div>
              {/* AI comment widget */}
              <div className="my-2 ml-9 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 max-w-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <SparklesIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[10px] font-semibold text-amber-400">Codexis AI</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20 ml-auto">bug</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Optional chaining (<code className="text-amber-300/80 bg-amber-500/10 px-1 rounded">?.</code>) prevents a null reference crash when session is undefined. Good catch — but also consider adding a null check for the <code className="text-amber-300/80 bg-amber-500/10 px-1 rounded">token</code> field.
                </p>
              </div>
              <div className="flex gap-3"><span className="text-neutral-700 select-none w-6 text-right shrink-0">14</span><span className="text-neutral-500">{'  return null;'}</span></div>
              <div className="flex gap-3"><span className="text-neutral-700 select-none w-6 text-right shrink-0">15</span><span className="text-neutral-500">{'}'}</span></div>
            </div>
          </div>

          {/* Suggestions sidebar */}
          <div className="w-56 border-l border-white/5 p-3 hidden lg:flex flex-col gap-3 bg-neutral-900/20 shrink-0">
            <div className="text-[10px] font-medium text-neutral-600 uppercase tracking-wider mb-1">AI Suggestions</div>
            {[
              { severity: 'bug', color: 'red', text: 'Null pointer on session access' },
              { severity: 'security', color: 'blue', text: 'Token exposure in logs' },
              { severity: 'style', color: 'yellow', text: 'Unused import statement' },
            ].map((s, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 hover:border-white/10 transition-colors cursor-default">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full bg-${s.color}-400`} />
                  <span className={`text-[10px] text-${s.color}-400 font-medium`}>{s.severity}</span>
                </div>
                <p className="text-[10px] text-neutral-500 leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Main Landing Page ───────────────────────────────────────────────
export default function LandingPage() {
  const featuresRef = useScrollReveal();
  const statsRef = useScrollReveal();

  const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

  return (
    <div className="bg-[#050505] text-neutral-400 min-h-screen flex flex-col overflow-x-hidden relative selection:bg-violet-500/30 selection:text-white">

      {/* ═══ Ambient Background Glows ═══ */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-96 bg-violet-900/15 blur-[140px] rounded-full pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-900/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="fixed top-1/2 left-0 w-72 h-72 bg-cyan-900/8 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* ═══ Navigation ═══ */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5" style={{ background: 'rgba(5,5,5,0.7)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-white font-semibold tracking-tight text-lg flex items-center gap-2.5 z-10">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <CodeIcon className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Codexis</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#stats" className="hover:text-white transition-colors">Why Codexis</a>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-xs font-medium hover:text-white transition-colors hidden sm:block">Log in</Link>
            <a
              href={`${API_URL}/auth/github`}
              className="text-xs font-medium bg-white text-black px-4 py-1.5 rounded-full hover:bg-neutral-200 transition-colors shadow-lg shadow-white/5"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* ═══ Hero Section ═══ */}
      <main className="relative z-10 pt-32 pb-20 px-6 max-w-6xl mx-auto flex flex-col items-center text-center">

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-medium text-violet-300 mb-8 hover:border-violet-500/30 transition-colors cursor-default">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
          </span>
          AI-Powered Code Reviews
        </div>

        {/* Hero Title */}
        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-medium tracking-tighter text-white mb-6 max-w-4xl mx-auto leading-[1.05]">
          Review code at the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/30">
            speed of AI.
          </span>
        </h1>

        <p className="text-lg md:text-xl text-neutral-500 max-w-xl mx-auto mb-10 leading-relaxed font-light">
          Codexis streams intelligent code suggestions directly into your GitHub PRs. Catch bugs, fix patterns, and ship faster.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <a
            href={`${API_URL}/auth/github`}
            className="h-11 px-7 rounded-full bg-white text-black text-sm font-medium hover:bg-neutral-200 transition-all flex items-center gap-2.5 group shadow-lg shadow-white/10"
          >
            <GitHubIcon className="w-4 h-4" />
            Start Reviewing
            <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </a>
          <a
            href="#features"
            className="h-11 px-7 rounded-full border border-white/10 text-white text-sm font-medium hover:bg-white/5 transition-all flex items-center gap-2"
          >
            See How It Works
          </a>
        </div>

        {/* Code Preview Mockup */}
        <CodePreviewMockup />
      </main>

      {/* ═══ Features Section (Bento Grid) ═══ */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24" ref={featuresRef}>
        <div className="mb-14">
          <h2 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-4 reveal-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out">
            Engineered for developers
          </h2>
          <p className="text-neutral-500 max-w-md reveal-on-scroll opacity-0 translate-y-4 transition-all duration-700 ease-out delay-100">
            Every feature is designed to reduce review time and catch issues before they ship to production.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">

          {/* Large Feature — AI Streaming */}
          <div className="md:col-span-4 rounded-2xl bg-neutral-900/30 border border-white/10 p-8 relative overflow-hidden group hover:border-white/20 transition-all duration-300 reveal-on-scroll opacity-0 translate-y-4">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-25 transition-opacity duration-500">
              <SparklesIcon className="w-32 h-32 text-violet-400 rotate-12" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-end min-h-[160px]">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                <SparklesIcon className="w-5 h-5 text-violet-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Real-Time AI Streaming</h3>
              <p className="text-sm text-neutral-500 max-w-sm">Suggestions stream token-by-token via SSE as the LLM generates them. Watch feedback appear live — no waiting for a batch response.</p>
            </div>
          </div>

          {/* Tall Feature — Security */}
          <div className="md:col-span-2 row-span-2 rounded-2xl bg-neutral-900/30 border border-white/10 p-8 relative overflow-hidden group hover:border-white/20 transition-all duration-300 reveal-on-scroll opacity-0 translate-y-4">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent z-10" />
            {/* Abstract data lines */}
            <div className="absolute inset-0 p-6 flex flex-col gap-2.5 opacity-20">
              {[3, 1, 2, 4, 1, 3, 2].map((w, i) => (
                <div key={i} className="flex gap-2">
                  <div className={`h-1 rounded-full ${i % 3 === 0 ? 'bg-emerald-500/50' : 'bg-white/10'}`} style={{ width: `${w * 25}%` }} />
                  <div className="h-1 rounded-full bg-white/5 flex-1" />
                </div>
              ))}
            </div>
            <div className="relative z-20 h-full flex flex-col justify-end">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <ShieldIcon className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Encrypted & Private</h3>
              <p className="text-sm text-neutral-500">GitHub tokens encrypted at rest with AES-256-GCM. Code is never stored — only the diff is analyzed in memory and discarded.</p>
            </div>
          </div>

          {/* Medium Feature — Speed */}
          <div className="md:col-span-2 rounded-2xl bg-neutral-900/30 border border-white/10 p-8 group hover:border-white/20 transition-all duration-300 reveal-on-scroll opacity-0 translate-y-4">
            <div className="flex justify-between items-start mb-10">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <BoltIcon className="w-5 h-5 text-amber-400" />
              </div>
              {/* Speed slider UI */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-500">Speed</span>
                <div className="w-24 h-1.5 bg-neutral-800 rounded-full relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full w-4/5 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" />
                </div>
              </div>
            </div>
            <h3 className="text-lg font-medium text-white mb-1">Lightning Fast</h3>
            <p className="text-sm text-neutral-500">Reviews a 500-line diff in under 8 seconds. Streamed output means first feedback appears in &lt;2s.</p>
          </div>

          {/* Medium Feature — GitHub Native */}
          <div className="md:col-span-2 rounded-2xl bg-neutral-900/30 border border-white/10 p-8 group hover:border-white/20 transition-all duration-300 reveal-on-scroll opacity-0 translate-y-4">
            <div className="flex flex-col h-full justify-between">
              <div className="flex flex-col gap-2 w-full mb-6">
                {['GitHub OAuth SSO', 'Monaco Diff Editor', 'Post Comments to PR'].map((label, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-white/5 bg-white/[0.02]">
                    <span className="text-xs text-neutral-400">{label}</span>
                    <div className="w-4 h-4 rounded border border-violet-500/50 bg-violet-500/15 flex items-center justify-center">
                      <CheckIcon className="w-2.5 h-2.5 text-violet-400" />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-1">GitHub Native</h3>
                <p className="text-sm text-neutral-500">Connects to your repos seamlessly. No configuration needed.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-medium text-white tracking-tight mb-4">Three steps to better reviews</h2>
          <p className="text-neutral-500 max-w-md mx-auto">From login to AI-powered feedback in under a minute.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '01', icon: GitHubIcon, title: 'Connect GitHub', desc: 'One-click OAuth login. Codexis reads your repos and open pull requests instantly.' },
            { step: '02', icon: CodeIcon, title: 'Select a PR', desc: 'Browse your repos, pick an open PR, and see the full diff rendered in a Monaco editor.' },
            { step: '03', icon: SparklesIcon, title: 'Generate Review', desc: 'Hit "Generate Review" and watch AI suggestions stream in real-time, pinned to exact lines.' },
          ].map((item) => (
            <div key={item.step} className="relative group">
              <div className="rounded-2xl border border-white/5 bg-neutral-900/20 p-8 hover:border-white/10 transition-all duration-300 h-full">
                <div className="text-6xl font-bold text-white/[0.03] absolute top-4 right-6 tracking-tighter select-none">{item.step}</div>
                <div className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ Stats / Social Proof ═══ */}
      <section id="stats" className="border-y border-white/5 bg-white/[0.01]" ref={statsRef}>
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <AnimatedStat value="< 8s" label="Average review time" />
            <AnimatedStat value="3 types" label="Bug · Security · Style" />
            <AnimatedStat value="SSE" label="Real-time streaming" />
            <AnimatedStat value="AES-256" label="Token encryption" />
          </div>
        </div>
      </section>

      {/* ═══ Final CTA ═══ */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-3xl mx-auto relative">
          <div className="absolute inset-0 bg-violet-500/15 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-medium text-white tracking-tighter mb-6">
              Ready to review code{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">smarter?</span>
            </h2>
            <p className="text-neutral-400 text-lg mb-10">
              Connect your GitHub account and start getting AI-powered code review feedback in seconds.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a
                href={`${API_URL}/auth/github`}
                className="h-12 px-8 rounded-full bg-white text-black font-medium hover:bg-neutral-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] flex items-center justify-center gap-2.5"
              >
                <GitHubIcon className="w-5 h-5" />
                Start Reviewing for Free
              </a>
              <Link
                href="/login"
                className="h-12 px-8 rounded-full border border-white/10 text-white font-medium hover:bg-white/5 transition-all flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="border-t border-white/5 bg-black/50 pt-16 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2 lg:col-span-2">
              <Link href="/" className="text-white font-semibold tracking-tight text-xl mb-4 flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <CodeIcon className="w-3.5 h-3.5 text-white" />
                </div>
                Codexis
              </Link>
              <p className="text-sm text-neutral-500 max-w-xs mt-3 leading-relaxed">
                AI-powered code review for GitHub pull requests. Catch bugs, enforce patterns, and ship with confidence.
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-neutral-500">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#stats" className="hover:text-white transition-colors">Why Codexis</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm text-neutral-500">
                <li><a href="https://github.com/FarhanS7/Codexis" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub Repo</a></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium text-sm mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-neutral-500">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-neutral-600">© {new Date().getFullYear()} Codexis. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="https://github.com/FarhanS7/Codexis" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white transition-colors">
                <GitHubIcon className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══ Scroll reveal CSS ═══ */}
      <style jsx global>{`
        .revealed.reveal-on-scroll {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        .reveal-on-scroll {
          transition-delay: calc(var(--reveal-delay, 0) * 100ms);
        }
      `}</style>
    </div>
  );
}
