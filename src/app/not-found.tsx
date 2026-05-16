import Link from "next/link";
import { Ghost, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 cyber-grid opacity-30"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[var(--gochi-purple)] opacity-[0.05] blur-[100px] rounded-full mix-blend-screen pointer-events-none"></div>
      </div>

      <div className="z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center space-y-12 py-12">
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-6 animate-float">
            <Ghost className="w-20 h-20 text-[var(--gochi-purple)]" strokeWidth={1.5} />
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl glitch-text text-[var(--gochi-purple)]" data-text="404">
              404
            </h1>
          </div>
          <p className="font-mono text-lg md:text-xl text-[var(--gochi-muted)] max-w-2xl mx-auto leading-relaxed">
            The entity you are looking for does not exist on the 0G Network.
            <br />
            <span className="text-[var(--gochi-purple)]">It may have been deleted, or never existed at all.</span>
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/"
            className="group relative inline-flex items-center justify-center px-8 py-4 font-mono font-bold text-white transition-all duration-200 bg-transparent border-2 border-[var(--gochi-purple)] rounded hover:bg-[var(--gochi-purple)]/10 neon-border overflow-hidden"
          >
            <span className="absolute inset-0 w-full h-full -mt-1 rounded opacity-30 bg-gradient-to-b from-transparent via-transparent to-[var(--gochi-purple)]"></span>
            <span className="relative flex items-center gap-2">
              <Home className="w-5 h-5 text-[var(--gochi-purple)] group-hover:animate-pulse" />
              RETURN TO BASE
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
