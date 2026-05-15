'use client';
import { useEffect, useState } from 'react';
import { Ghost, Moon } from 'lucide-react';

export default function PetViewport({ action = 'idle' }: { action?: 'idle' | 'feed' | 'play' | 'sleep' }) {
  const [frame, setFrame] = useState(0);

  // Simple animation loop
  useEffect(() => {
    const interval = setInterval(() => setFrame((f) => (f + 1) % 4), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full aspect-square max-w-[256px] mx-auto bg-[var(--gochi-bg)] border-2 border-[var(--gochi-border)] rounded-xl overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.15)] group">
      {/* Cyberpunk grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30"></div>
      
      {/* Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.2),transparent_70%)] blur-xl transition-all duration-1000"></div>

      {/* Pet Character */}
      <div 
        className={`relative transition-transform duration-300 ${
          action === 'play' ? 'animate-bounce text-[#67e8f9]' : 
          action === 'idle' && frame % 2 === 0 ? 'scale-y-95 translate-y-1 text-[var(--gochi-cyan)]' : 
          action === 'sleep' ? 'text-[#d8b4fe] opacity-50' :
          action === 'feed' ? 'text-[#fca5a5] scale-110' : 'text-[var(--gochi-cyan)]'
        }`}
      >
        <Ghost className="w-32 h-32 drop-shadow-[0_0_15px_currentColor]" strokeWidth={1.5} />
      </div>

      {/* Action Particles */}
      {action === 'sleep' && (
        <div className="absolute top-10 right-10 animate-pulse text-[var(--gochi-purple)]">
          <Moon className="w-8 h-8" />
        </div>
      )}
    </div>
  );
}
