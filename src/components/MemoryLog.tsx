'use client';

import { Brain } from 'lucide-react';

type Memory = {
  id: string;
  type: string;
  title: string;
  time: string;
  merkleRoot: string;
  txHash: string;
};

export default function MemoryLog({ memories }: { memories: Memory[] }) {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FEED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'PLAY': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'SLEEP': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-xl overflow-hidden shadow-lg">
      <div className="p-4 border-b border-[var(--gochi-border)] flex items-center justify-between bg-[var(--gochi-bg)]">
        <h3 className="font-display text-sm flex items-center gap-2">
          <Brain className="w-4 h-4 text-[var(--gochi-purple)]" /> Core Memories
        </h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {memories.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-sm text-[var(--gochi-muted)] italic font-mono px-4">
            No memories yet...<br/>interact with your Gochi!
          </div>
        ) : (
          memories.map((mem, i) => (
            <div key={mem.id} className={`relative p-4 rounded-lg border bg-[var(--gochi-bg)] transition-all ${
              i === 0 ? 'border-[var(--gochi-cyan)] shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'border-[var(--gochi-border)] opacity-80'
            }`}>
              {/* Timeline connecting line */}
              {i !== memories.length - 1 && (
                <div className="absolute left-6 top-full h-4 w-px bg-[var(--gochi-border)]"></div>
              )}
              
              <div className="flex justify-between items-start mb-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getTypeColor(mem.type)} font-mono font-bold tracking-wider`}>
                  {mem.type}
                </span>
                <span className="text-[10px] text-[var(--gochi-muted)] font-mono">{mem.time}</span>
              </div>
              
              <p className="text-sm font-medium mb-3">{mem.title}</p>
              
              <div className="bg-[#0f172a] rounded p-2 text-[10px] font-mono space-y-1">
                <div className="flex justify-between text-[var(--gochi-muted)]">
                  <span>Root:</span>
                  <span className="text-[var(--gochi-cyan)]">{mem.merkleRoot ? `${mem.merkleRoot.substring(0, 10)}...` : 'Pending...'}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[var(--gochi-border)]">
                  <a 
                    href={`https://storagescan.0g.ai`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[var(--gochi-purple)] hover:underline flex items-center gap-1"
                  >
                    [StorageScan ↗]
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
