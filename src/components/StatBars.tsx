'use client';

import { Drumstick, Smile, Zap } from 'lucide-react';

export default function StatBars({ stats }: { stats: { hunger: number; mood: number; energy: number } }) {
  const renderBar = (label: string, value: number, emoji: React.ReactNode, colorClass: string) => {
    const fillChunks = Math.round(Number(value) / 10);
    return (
      <div className="flex items-center justify-between gap-4 font-mono text-sm">
        <div className="flex items-center gap-2 w-28">
          {emoji}
          <span className="text-[var(--gochi-muted)]">{label}</span>
        </div>
        
        <div className="flex-1 h-4 bg-[var(--gochi-bg)] border border-[var(--gochi-border)] rounded-sm overflow-hidden flex">
          {/* Pixelated steps effect */}
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i} 
              className={`h-full flex-1 border-r border-[var(--gochi-panel)] last:border-0 transition-colors duration-300 ${
                i < fillChunks ? colorClass : 'bg-transparent'
              }`}
            />
          ))}
        </div>
        
        <div className="w-8 text-right text-[var(--gochi-text)]">{Math.round(Number(value))}</div>
      </div>
    );
  };

  return (
    <div className="space-y-4 p-5 bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-xl shadow-lg">
      {renderBar('Hunger', stats.hunger, <Drumstick className="w-4 h-4 text-[#fca5a5]" />, stats.hunger < 30 ? 'bg-gochi-red' : 'bg-gochi-green')}
      {renderBar('Mood', stats.mood, <Smile className="w-4 h-4 text-[#67e8f9]" />, 'bg-gradient-to-r from-gochi-cyan to-gochi-purple')}
      {renderBar('Energy', stats.energy, <Zap className="w-4 h-4 text-[#d8b4fe]" />, stats.energy < 20 ? 'bg-gochi-amber animate-pulse' : 'bg-gochi-pixel')}
    </div>
  );
}
