import Link from "next/link";
import { Brain, Database, Shield, Zap, Link2, Ghost } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 cyber-grid opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--gochi-cyan)] opacity-[0.05] blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
      </div>

      <div className="z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center space-y-12 py-12">

        {/* Hackathon badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--gochi-amber)]/40 bg-[var(--gochi-amber)]/10 font-mono text-[11px] text-[var(--gochi-amber)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--gochi-amber)] animate-pulse inline-block"></span>
          0G APAC Hackathon 2026 — Submission
        </div>

        {/* Hero */}
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-6 animate-float">
            <Ghost className="w-20 h-20 text-[var(--gochi-cyan)]" strokeWidth={1.5} />
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl glitch-text" data-text="GOCHI">
              GOCHI
            </h1>
          </div>
          <p className="font-mono text-lg md:text-xl text-[var(--gochi-muted)] max-w-2xl mx-auto leading-relaxed">
            The first on-chain AI virtual pet that lives entirely on the 0G Network.
            <br />
            <span className="text-[var(--gochi-cyan)]">It cannot be deleted. It cannot be shut down.</span>
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/play"
            className="group relative inline-flex items-center justify-center px-8 py-4 font-mono font-bold text-white transition-all duration-200 bg-transparent border-2 border-[var(--gochi-cyan)] rounded hover:bg-[var(--gochi-cyan)]/10 neon-border overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full -mt-1 rounded opacity-30 bg-gradient-to-b from-transparent via-transparent to-[var(--gochi-cyan)]"></span>
            <span className="relative flex items-center gap-2">
              <Zap className="w-5 h-5 text-[var(--gochi-cyan)] group-hover:animate-pulse" />
              HATCH YOUR GOCHI
            </span>
          </Link>
          <a
            href="https://chainscan-galileo.0g.ai/address/0x9BDA4cBfda7a7960251A4EE07A7ec0C00239a8cf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-4 font-mono text-sm text-[var(--gochi-muted)] border border-[var(--gochi-border)] rounded hover:border-[var(--gochi-cyan)]/30 hover:text-[var(--gochi-cyan)] transition-colors"
          >
            <Link2 className="w-4 h-4" />
            View Contract
          </a>
          <a
            href="/pitch"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-4 font-mono text-sm text-[var(--gochi-purple)] border border-[var(--gochi-purple)]/30 rounded hover:border-[var(--gochi-purple)]/60 hover:bg-[var(--gochi-purple)]/10 transition-colors"
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
              <div className="font-display text-base text-[var(--gochi-cyan)]">{value}</div>
              <div className="font-mono text-[10px] text-[var(--gochi-muted)] mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full pt-4">
          <FeatureCard
            icon={<Link2 className="w-8 h-8 text-[var(--gochi-purple)]" />}
            title="INFT Identity"
            description="Minted as ERC-721 on 0G Galileo Chain. Every Gochi has a unique on-chain identity you can verify on ChainScan."
            color="purple"
          />
          <FeatureCard
            icon={<Database className="w-8 h-8 text-[var(--gochi-cyan)]" />}
            title="Real-Time State"
            description="Hunger, mood, energy — persisted via 0G Storage KV. Under 50ms round trips. No AWS. No centralized database."
            color="cyan"
          />
          <FeatureCard
            icon={<Shield className="w-8 h-8 text-[var(--gochi-green)]" />}
            title="Permanent Memory"
            description="Every action archived to 0G Storage Log with Merkle root proofs. Verifiable on StorageScan. Cannot be deleted."
            color="green"
          />
          <FeatureCard
            icon={<Brain className="w-8 h-8 text-[var(--gochi-amber)]" />}
            title="0G Compute AI"
            description="Personality and responses via 0G Compute Router. TEE-verified — a cryptographic proof that the AI ran untampered."
            color="amber"
          />
        </div>

        {/* Bottom CTA */}
        <div className="pt-4 pb-8 flex flex-col items-center gap-3">
          <p className="font-mono text-xs text-[var(--gochi-muted)]">
            When the servers go dark — Gochi stays.
          </p>
          <Link
            href="/play"
            className="font-mono text-sm text-[var(--gochi-cyan)] hover:underline underline-offset-4 flex items-center gap-1 group"
          >
            Start playing now
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
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
    cyan: "hover:border-[var(--gochi-cyan)]/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.1)]",
    purple: "hover:border-[var(--gochi-purple)]/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]",
    green: "hover:border-[var(--gochi-green)]/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.1)]",
    amber: "hover:border-[var(--gochi-amber)]/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]",
  };

  return (
    <div className={`glass-panel p-6 rounded-lg text-left space-y-4 transition-all group ${glowMap[color]}`}>
      <div className="p-3 bg-[var(--gochi-bg)]/50 rounded-lg inline-block group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-display text-sm text-[var(--gochi-text)]">{title}</h3>
      <p className="font-mono text-xs text-[var(--gochi-muted)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
