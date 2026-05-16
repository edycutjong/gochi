import Link from "next/link";
import { Brain, Database, Shield, Zap, Link2, Ghost } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 cyber-grid opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gochi-cyan opacity-[0.05] blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
      </div>

      <div className="z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center space-y-12 py-12">

        {/* Hackathon badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gochi-amber/40 bg-gochi-amber/10 font-mono text-[11px] text-gochi-amber">
          <span className="w-1.5 h-1.5 rounded-full bg-gochi-amber animate-pulse inline-block"></span>
          0G APAC Hackathon 2026 — Submission
        </div>

        {/* Hero */}
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-6 animate-float">
            <Ghost className="w-20 h-20 text-gochi-cyan" strokeWidth={1.5} />
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl glitch-text" data-text="GOCHI">
              GOCHI
            </h1>
          </div>
          <p className="font-mono text-lg md:text-xl text-gochi-muted max-w-2xl mx-auto leading-relaxed">
            The first on-chain AI virtual pet that lives entirely on the 0G Network.
            <br />
            <span className="text-gochi-cyan">It cannot be deleted. It cannot be shut down.</span>
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/play"
            className="group relative inline-flex items-center justify-center px-8 py-4 font-mono font-bold text-white transition-all duration-200 bg-transparent border-2 border-gochi-cyan rounded hover:bg-gochi-cyan/10 neon-border overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full -mt-1 rounded opacity-30 bg-gradient-to-b from-transparent via-transparent to-gochi-cyan"></span>
            <span className="relative flex items-center gap-2">
              <Zap className="w-5 h-5 text-gochi-cyan group-hover:animate-pulse" />
              HATCH YOUR GOCHI
            </span>
          </Link>
          <a
            href={`https://chainscan-galileo.0g.ai/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-4 font-mono text-sm text-gochi-muted border border-gochi-border rounded hover:border-gochi-cyan/30 hover:text-gochi-cyan transition-colors"
          >
            <Link2 className="w-4 h-4" />
            View Contract
          </a>
          <a
            href="/pitch"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-4 font-mono text-sm text-gochi-purple border border-gochi-purple/30 rounded hover:border-gochi-purple/60 hover:bg-gochi-purple/10 transition-colors"
          >
            ▶ Pitch Deck
          </a>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl">
          {[
            { value: "< 50ms", label: "KV read latency" },
            { value: "ERC-721", label: "INFT on 0G Chain" },
            { value: "Merkle", label: "verified memories" },
            { value: "TEE", label: "AI verification" },
          ].map(({ value, label }) => (
            <div key={label} className="glass-panel p-4 rounded-lg text-center">
              <div className="font-display text-base text-gochi-cyan">{value}</div>
              <div className="font-mono text-[10px] text-gochi-muted mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-4">
          <FeatureCard
            icon={<Link2 className="w-8 h-8 text-gochi-purple" />}
            title="INFT Identity"
            description="Minted as ERC-721 on 0G Galileo Chain. Every Gochi has a unique on-chain identity you can verify on ChainScan."
            color="purple"
          />
          <FeatureCard
            icon={<Database className="w-8 h-8 text-gochi-cyan" />}
            title="Real-Time State"
            description="Hunger, mood, energy — persisted via 0G Storage KV. Under 50ms round trips. No AWS. No centralized database."
            color="cyan"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-gochi-green" />}
            title="Permanent Memory"
            description="Every action archived to 0G Storage Log with Merkle root proofs. Verifiable on StorageScan. Cannot be deleted."
            color="green"
          />
          <FeatureCard
            icon={<Brain className="w-8 h-8 text-gochi-amber" />}
            title="0G Compute AI"
            description="Personality and responses via 0G Compute Router. TEE-verified — a cryptographic proof that the AI ran untampered."
            color="amber"
          />
        </div>

        {/* Bottom CTA */}
        <div className="pt-4 flex flex-col items-center gap-3">
          <p className="font-mono text-xs text-gochi-muted">
            When the servers go dark — Gochi stays.
          </p>
          <Link
            href="/play"
            className="font-mono text-sm text-gochi-cyan hover:underline underline-offset-4 flex items-center gap-1 group"
          >
            Start playing now
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
        </div>

        {/* Sponsor / Built-on strip */}
        <div className="w-full border-t border-gochi-border pt-8 pb-10 flex flex-col items-center gap-6">
          <p className="font-mono text-[10px] text-gochi-muted tracking-widest uppercase">Powered by</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {/* 0G Network */}
            <a
              href="https://0g.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded border border-gochi-border bg-gochi-panel hover:border-gochi-cyan/40 transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-gochi-cyan group-hover:shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-shadow"></span>
              <span className="font-mono text-xs text-gochi-text group-hover:text-gochi-cyan transition-colors">0G Network</span>
            </a>
            {/* HackQuest */}
            <a
              href="https://www.hackquest.io/hackathons/0G-APAC-Hackathon"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded border border-gochi-border bg-gochi-panel hover:border-gochi-purple/40 transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-gochi-purple group-hover:shadow-[0_0_8px_rgba(168,85,247,0.8)] transition-shadow"></span>
              <span className="font-mono text-xs text-gochi-text group-hover:text-gochi-purple transition-colors">HackQuest APAC 2026</span>
            </a>
            {/* Vercel */}
            <a
              href="https://vercel.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded border border-gochi-border bg-gochi-panel hover:border-white/20 transition-colors group"
            >
              <span className="font-mono text-xs text-gochi-muted group-hover:text-white transition-colors">▲ Vercel</span>
            </a>
            {/* Supabase */}
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded border border-gochi-border bg-gochi-panel hover:border-gochi-green/40 transition-colors group"
            >
              <span className="w-2 h-2 rounded-full bg-gochi-green group-hover:shadow-[0_0_8px_rgba(34,197,94,0.8)] transition-shadow"></span>
              <span className="font-mono text-xs text-gochi-text group-hover:text-gochi-green transition-colors">Supabase</span>
            </a>
          </div>
          <p className="font-mono text-[9px] text-gochi-muted/50">
            0G APAC Hackathon 2026 · Submission by Edy Cu · MIT License
          </p>
        </div>

      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "cyan" | "purple" | "green" | "amber";
}) {
  const glowMap = {
    cyan: "hover:border-gochi-cyan/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]",
    purple: "hover:border-gochi-purple/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]",
    green: "hover:border-gochi-green/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]",
    amber: "hover:border-gochi-amber/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]",
  };

  return (
    <div className={`glass-panel p-6 rounded-lg text-left space-y-4 transition-all group ${glowMap[color]}`}>
      <div className="p-3 bg-gochi-bg/50 rounded-lg inline-block group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-display text-sm text-gochi-text">{title}</h3>
      <p className="font-mono text-xs text-gochi-muted leading-relaxed">
        {description}
      </p>
    </div>
  );
}
