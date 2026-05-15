'use client';
import { Ghost, Moon, Drumstick, Star } from 'lucide-react';

type Stats = { hunger: number; mood: number; energy: number };

export default function PetViewport({
  action = 'idle',
  stats,
  tokenId,
}: {
  action?: 'idle' | 'feed' | 'play' | 'sleep';
  stats?: Stats;
  tokenId?: number;
}) {
  const avgStat = stats ? (stats.hunger + stats.mood + stats.energy) / 3 : 70;
  const isCritical = stats ? Math.min(stats.hunger, stats.mood, stats.energy) < 20 : false;

  const petColor =
    action === 'sleep' ? '#d8b4fe'
    : action === 'feed' ? '#fca5a5'
    : isCritical ? '#ef4444'
    : avgStat < 50 ? '#f59e0b'
    : '#06b6d4';

  const petMotion =
    action === 'play'  ? 'animate-bounce'
    : action === 'sleep' ? 'opacity-60'
    : action === 'feed'  ? 'scale-110'
    : 'animate-breathe';

  return (
    <div
      className={`relative w-full aspect-square max-w-[288px] mx-auto bg-[var(--gochi-bg)] border-2 rounded-xl overflow-hidden flex items-center justify-center group transition-all duration-500 ${
        isCritical
          ? 'border-[var(--gochi-red)] shadow-[0_0_20px_rgba(239,68,68,0.35)]'
          : 'border-[var(--gochi-border)] shadow-[0_0_20px_rgba(6,182,212,0.15)]'
      }`}
    >
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30" />

      {/* Mood glow */}
      <div
        className="absolute inset-0 blur-xl transition-all duration-1000"
        style={{ background: `radial-gradient(circle at center, ${petColor}28, transparent 70%)` }}
      />

      {/* Token ID badge */}
      {tokenId !== undefined && (
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded font-mono text-[9px] bg-[var(--gochi-panel)] border border-[var(--gochi-border)] text-[var(--gochi-muted)] z-10">
          #{tokenId}
        </div>
      )}

      {/* Pet character */}
      <div
        className={`relative transition-all duration-300 ${petMotion}`}
        style={{ color: petColor, filter: `drop-shadow(0 0 15px ${petColor})` }}
      >
        <Ghost className="w-32 h-32" strokeWidth={1.5} />
      </div>

      {/* Action particles */}
      {action === 'feed' && (
        <div className="absolute top-5 right-7 animate-bounce">
          <Drumstick className="w-8 h-8 text-[#fca5a5] opacity-80" />
        </div>
      )}
      {action === 'play' && (
        <>
          <div className="absolute top-4 right-6 animate-spin-slow">
            <Star className="w-6 h-6 text-[var(--gochi-amber)]" fill="currentColor" />
          </div>
          <div className="absolute top-12 left-5 animate-spin-slow" style={{ animationDelay: '0.7s' }}>
            <Star className="w-4 h-4 text-[var(--gochi-cyan)]" fill="currentColor" />
          </div>
        </>
      )}
      {action === 'sleep' && (
        <>
          <div className="absolute top-5 right-7 animate-pulse">
            <Moon className="w-8 h-8 text-[var(--gochi-purple)]" />
          </div>
          <div className="absolute top-14 right-4 font-display text-[10px] text-[var(--gochi-purple)] opacity-60 animate-float">
            zzz
          </div>
        </>
      )}

      {/* Critical warning */}
      {isCritical && (
        <div className="absolute bottom-2 left-0 right-0 flex justify-center z-10">
          <span className="font-mono text-[9px] text-[var(--gochi-red)] animate-pulse px-2 py-0.5 bg-[var(--gochi-red)]/10 rounded border border-[var(--gochi-red)]/20">
            NEEDS ATTENTION
          </span>
        </div>
      )}
    </div>
  );
}
