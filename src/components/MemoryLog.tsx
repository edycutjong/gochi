'use client';
import { useRef } from 'react';
import { Brain, Database } from 'lucide-react';

type Memory = {
  id: string;
  type: string;
  title: string;
  time: string;
  merkleRoot: string;
  txHash: string;
};

export default function MemoryLog({ memories }: { memories: Memory[] }) {
  const initialMemoriesRef = useRef<Set<string> | null>(null);

  // Capture the first non-empty batch of memories as the 'initial' load
  if (initialMemoriesRef.current === null && memories.length > 0) {
    initialMemoriesRef.current = new Set(memories.map(m => m.id));
  }

  const isNew = (id: string) => {
    // If we haven't locked in an initial load yet, don't animate anything
    if (!initialMemoriesRef.current) return false;
    return !initialMemoriesRef.current.has(id);
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'FEED':  return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PLAY':  return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'SLEEP': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-xl overflow-hidden shadow-lg min-h-0">
      <div className="p-4 border-b border-[var(--gochi-border)] flex items-center justify-between bg-[var(--gochi-bg)] shrink-0">
        <h3 className="font-display text-sm flex items-center gap-2">
          <Brain className="w-4 h-4 text-[var(--gochi-purple)]" /> Core Memories
        </h3>
        {memories.length > 0 && (
          <span className="font-mono text-[10px] text-[var(--gochi-muted)] bg-[var(--gochi-panel)] border border-[var(--gochi-border)] px-2 py-0.5 rounded-full">
            {memories.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {memories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center gap-4 text-[var(--gochi-muted)] px-4">
            <Database className="w-10 h-10 opacity-30" />
            <div className="space-y-1">
              <p className="font-mono text-xs">No memories yet.</p>
              <p className="font-mono text-[10px] opacity-60">
                Feed, play, or put your Gochi to sleep — each action is permanently archived on 0G Storage Log.
              </p>
            </div>
          </div>
        ) : (
          memories.map((mem, i) => (
            <div
              key={mem.id}
              className={`relative p-3 rounded-lg border bg-[var(--gochi-bg)] transition-all ${isNew(mem.id) ? 'animate-slide-in-left' : ''} ${
                i === 0
                  ? 'border-[var(--gochi-cyan)]/60 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  : 'border-[var(--gochi-border)] opacity-75'
              }`}
            >
              {i !== memories.length - 1 && (
                <div className="absolute left-5 top-full h-3 w-px bg-[var(--gochi-border)]" />
              )}

              <div className="flex justify-between items-center mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-bold tracking-wider ${getTypeStyle(mem.type)}`}>
                  {mem.type}
                </span>
                <span className="text-[10px] text-[var(--gochi-muted)] font-mono">{mem.time}</span>
              </div>

              <p className="text-xs font-medium mb-2 text-[var(--gochi-text)]">{mem.title}</p>

              <div className="bg-[#0f172a] rounded p-2 text-[10px] font-mono space-y-1">
                <div className="flex justify-between text-[var(--gochi-muted)]">
                  <span>Merkle:</span>
                  <span className="text-[var(--gochi-cyan)]">
                    {mem.merkleRoot ? `0x${mem.merkleRoot.replace(/^0x/i, '').slice(0, 4)}…${mem.merkleRoot.slice(-4)}` : 'pending…'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[var(--gochi-border)]">
                  <a
                    href="https://storagescan.0g.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--gochi-purple)] hover:underline"
                  >
                    StorageScan ↗
                  </a>
                  {i === 0 && (
                    <span className="text-[var(--gochi-green)] animate-pulse">● live</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
