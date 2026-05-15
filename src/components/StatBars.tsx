'use client';

export default function StatBars({ stats }: { stats: { hunger: number; mood: number; energy: number } }) {
  const renderBar = (label: string, value: number, emoji: string, colorClass: string) => (
    <div className="flex items-center justify-between gap-4 font-mono text-sm">
      <div className="flex items-center gap-2 w-24">
        <span>{emoji}</span>
        <span className="text-[var(--gochi-muted)]">{label}</span>
      </div>
      
      <div className="flex-1 h-4 bg-[var(--gochi-bg)] border border-[var(--gochi-border)] rounded-sm overflow-hidden flex">
        {/* Pixelated steps effect */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div 
            key={i} 
            className={`h-full flex-1 border-r border-[var(--gochi-panel)] last:border-0 transition-colors duration-300 ${
              i < value / 10 ? colorClass : 'bg-transparent'
            }`}
          />
        ))}
      </div>
      
      <div className="w-8 text-right text-[var(--gochi-text)]">{Math.round(value)}</div>
    </div>
  );

  return (
    <div className="space-y-4 p-5 bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-xl shadow-lg">
      {renderBar('Hunger', stats.hunger, '🍖', stats.hunger < 30 ? 'bg-[var(--gochi-red)]' : 'bg-[var(--gochi-green)]')}
      {renderBar('Mood', stats.mood, '😊', 'bg-gradient-to-r from-[var(--gochi-cyan)] to-[var(--gochi-purple)]')}
      {renderBar('Energy', stats.energy, '⚡', stats.energy < 20 ? 'bg-[var(--gochi-amber)] animate-pulse' : 'bg-[var(--gochi-pixel)]')}
    </div>
  );
}
