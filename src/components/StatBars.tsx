'use client';
import { useEffect, useRef, useState } from 'react';
import { Drumstick, Smile, Zap, AlertTriangle } from 'lucide-react';

type Stats = { hunger: number; mood: number; energy: number };
type Delta = { hunger?: number; mood?: number; energy?: number };

export default function StatBars({ stats }: { stats: Stats }) {
  const prevRef = useRef<Stats>(stats);
  const [delta, setDelta] = useState<Delta>({});
  const [flashKey, setFlashKey] = useState(0);

  useEffect(() => {
    const prev = prevRef.current;
    const d: Delta = {};
    const dH = Math.round(stats.hunger) - Math.round(prev.hunger);
    const dM = Math.round(stats.mood)   - Math.round(prev.mood);
    const dE = Math.round(stats.energy) - Math.round(prev.energy);
    if (dH !== 0) d.hunger = dH;
    if (dM !== 0) d.mood   = dM;
    if (dE !== 0) d.energy = dE;

    prevRef.current = stats;
    if (Object.keys(d).length > 0) {
      let t: NodeJS.Timeout;
      const tStart = setTimeout(() => {
        setDelta(d);
        setFlashKey((k) => k + 1);
        t = setTimeout(() => setDelta({}), 1400);
      }, 0);
      return () => {
        clearTimeout(tStart);
        clearTimeout(t);
      };
    }
  }, [stats]);

  const isCritical = (v: number) => v < 20;

  const renderBar = (
    key: keyof Stats,
    label: string,
    icon: React.ReactNode,
    fillColor: string,
  ) => {
    const value = stats[key];
    const fillChunks = Math.round(value / 10);
    const critical = isCritical(value);
    const d = delta[key];

    return (
      <div className="flex items-center justify-between gap-4 font-mono text-sm">
        <div className="flex items-center gap-1.5 w-28">
          {icon}
          <span className={critical ? 'text-[var(--gochi-red)]' : 'text-[var(--gochi-muted)]'}>{label}</span>
          {critical && <AlertTriangle className="w-3 h-3 text-[var(--gochi-red)] animate-pulse" />}
        </div>

        <div className="relative flex-1">
          <div
            className={`h-4 bg-[var(--gochi-bg)] border rounded-sm overflow-hidden flex transition-colors duration-300 ${
              critical ? 'border-[var(--gochi-red)]/40' : 'border-[var(--gochi-border)]'
            }`}
          >
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className={`h-full flex-1 border-r border-[var(--gochi-panel)] last:border-0 transition-colors duration-300 ${
                  i < fillChunks
                    ? critical
                      ? 'bg-[var(--gochi-red)] animate-pulse'
                      : fillColor
                    : 'bg-transparent'
                }`}
              />
            ))}
          </div>

          {/* Delta flash */}
          {d !== undefined && (
            <span
              key={`${key}-${flashKey}`}
              className={`absolute right-0 top-0 -translate-y-full text-[11px] font-mono font-bold pointer-events-none animate-fade-up ${
                d > 0 ? 'text-[var(--gochi-green)]' : 'text-[var(--gochi-red)]'
              }`}
            >
              {d > 0 ? `+${d}` : d}
            </span>
          )}
        </div>

        <div className={`w-8 text-right tabular-nums ${critical ? 'text-[var(--gochi-red)]' : 'text-[var(--gochi-text)]'}`}>
          {Math.round(value)}
        </div>
      </div>
    );
  };

  const anyCritical = isCritical(stats.hunger) || isCritical(stats.mood) || isCritical(stats.energy);

  const hungerColor = stats.hunger < 30 ? 'bg-[var(--gochi-red)]' : 'bg-[var(--gochi-green)]';
  const moodColor   = 'bg-[var(--gochi-cyan)]';
  const energyColor = stats.energy < 30 ? 'bg-[var(--gochi-amber)]' : 'bg-[var(--gochi-purple)]';

  return (
    <div
      className={`space-y-4 p-5 bg-[var(--gochi-panel)] border rounded-xl shadow-lg transition-all duration-500 ${
        anyCritical
          ? 'border-[var(--gochi-red)]/40 shadow-[0_0_15px_rgba(239,68,68,0.08)]'
          : 'border-[var(--gochi-border)]'
      }`}
    >
      {renderBar('hunger', 'Hunger', <Drumstick className="w-4 h-4 text-[#fca5a5]" />, hungerColor)}
      {renderBar('mood',   'Mood',   <Smile     className="w-4 h-4 text-[#67e8f9]" />, moodColor)}
      {renderBar('energy', 'Energy', <Zap       className="w-4 h-4 text-[#d8b4fe]" />, energyColor)}
    </div>
  );
}
