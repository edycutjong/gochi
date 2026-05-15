'use client';
import { useState } from 'react';
import { Egg, Ghost, Sparkles } from 'lucide-react';

export default function MintFlow({ onMint }: { onMint: () => Promise<void> }) {
  const [isMinting, setIsMinting] = useState(false);
  const [stage, setStage] = useState<'idle' | 'minting' | 'hatching'>('idle');

  const handleMint = async () => {
    setIsMinting(true);
    setStage('minting');
    
    // Simulate transaction delay
    await new Promise(r => setTimeout(r, 2000));
    setStage('hatching');
    
    // Simulate hatching animation
    await new Promise(r => setTimeout(r, 2000));
    
    await onMint();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto h-[600px]">
      <div className="mb-12 relative w-48 h-48 mx-auto flex items-center justify-center">
        {/* Glow */}
        <div className="absolute inset-0 bg-radial from-[var(--gochi-cyan)]/30 to-transparent blur-2xl animate-pulse"></div>
        
        {/* Egg or hatching effect */}
        <div className="relative z-10 flex items-center justify-center">
          {stage === 'idle' ? (
            <Egg className="w-32 h-32 text-[var(--gochi-text)]" strokeWidth={1.5} />
          ) : stage === 'minting' ? (
            <div className="relative">
              <Egg className="w-32 h-32 text-[var(--gochi-cyan)] animate-pulse" strokeWidth={1.5} />
              <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-[var(--gochi-amber)] animate-spin-slow" />
            </div>
          ) : (
            <Ghost className="w-32 h-32 text-[var(--gochi-cyan)] animate-bounce" strokeWidth={1.5} />
          )}
        </div>
      </div>

      <div className="bg-[var(--gochi-panel)] border-2 border-[var(--gochi-border)] rounded-xl p-8 w-full shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden">
        {/* Scanline overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_50%,transparent_50%)] bg-[size:100%_4px] pointer-events-none"></div>

        <h2 className="font-display text-lg mb-4 text-[var(--gochi-cyan)]">A new life awaits</h2>
        
        <p className="text-[var(--gochi-muted)] text-sm mb-8 font-mono leading-relaxed">
          Your Gochi will be born as an INFT on the <strong className="text-[var(--gochi-text)]">0G Mainnet</strong>. 
          Its memories will be permanently archived on 0G Storage.
        </p>

        <button
          onClick={handleMint}
          disabled={isMinting}
          className="w-full py-4 bg-gradient-to-r from-[var(--gochi-cyan)] to-[var(--gochi-purple)] text-white font-display text-xs rounded-lg hover:opacity-90 transition-opacity active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-3 relative z-10"
        >
          {stage === 'idle' ? 'MINT YOUR GOCHI' : stage === 'minting' ? 'CONFIRMING TX...' : 'HATCHING...'}
        </button>
        
        <div className="mt-4 text-xs font-mono text-[var(--gochi-muted)]">
          Est. Cost: ~0.01 0G (gas)
        </div>
      </div>
    </div>
  );
}
