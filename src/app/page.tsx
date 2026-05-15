import Link from "next/link";
import { Brain, Database, Shield, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden">
      {/* Background animations */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 cyber-grid opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--gochi-cyan)] opacity-[0.05] blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
      </div>

      <div className="z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center space-y-12 py-12">
        {/* Hero Section */}
        <div className="space-y-6 animate-float">
          <h1 
            className="font-display text-5xl md:text-7xl lg:text-8xl glitch-text" 
            data-text="GOCHI"
          >
            GOCHI
          </h1>
          <p className="font-mono text-lg md:text-xl text-[var(--gochi-muted)] max-w-2xl mx-auto neon-text">
            The first fully autonomous, on-chain virtual pet powered by 0G Network's Storage and Compute AI.
          </p>
        </div>

        {/* CTA */}
        <div className="pt-4">
          <Link 
            href="/play" 
            className="group relative inline-flex items-center justify-center px-8 py-4 font-mono font-bold text-white transition-all duration-200 bg-transparent border-2 border-[var(--gochi-cyan)] rounded hover:bg-[var(--gochi-cyan)]/10 neon-border overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full -mt-1 rounded opacity-30 bg-gradient-to-b from-transparent via-transparent to-[var(--gochi-cyan)]"></span>
            <span className="relative flex items-center gap-2">
              <Zap className="w-5 h-5 text-[var(--gochi-cyan)] group-hover:animate-pulse" />
              ENTER 0G NETWORK
            </span>
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-16">
          <FeatureCard 
            icon={<Database className="w-8 h-8 text-[var(--gochi-cyan)]" />}
            title="On-Chain Memory"
            description="Every state change and interaction is immutably stored via 0G Storage KV and Storage Log."
          />
          <FeatureCard 
            icon={<Brain className="w-8 h-8 text-[var(--gochi-purple)]" />}
            title="0G Compute AI"
            description="Your Gochi thinks and responds using decentralized inferencing via the 0G Compute Router."
          />
          <FeatureCard 
            icon={<Shield className="w-8 h-8 text-[var(--gochi-green)]" />}
            title="Autonomous"
            description="100% decentralized. No central servers. Your pet lives forever on the blockchain."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass-panel p-8 rounded-lg text-left space-y-4 hover:border-[var(--gochi-cyan)]/50 transition-colors group">
      <div className="p-3 bg-[var(--gochi-bg)]/50 rounded-lg inline-block neon-border group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-display text-lg text-[var(--gochi-text)]">{title}</h3>
      <p className="font-mono text-sm text-[var(--gochi-muted)] leading-relaxed">
        {description}
      </p>
    </div>
  );
}
