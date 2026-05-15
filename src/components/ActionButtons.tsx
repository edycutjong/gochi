'use client';
import { useState } from 'react';
import { Drumstick, Gamepad2, Moon, Loader2 } from 'lucide-react';

export default function ActionButtons({ onAction }: { onAction: (action: 'feed' | 'play' | 'sleep') => Promise<void> }) {
  const [loading, setLoading] = useState<'feed' | 'play' | 'sleep' | null>(null);

  const handleAction = async (action: 'feed' | 'play' | 'sleep') => {
    setLoading(action);
    await onAction(action);
    setLoading(null);
  };

  const btnClass =
    'flex-1 py-4 px-2 rounded-xl font-display text-[10px] md:text-xs border border-b-[6px] active:border-b-2 transition-all active:translate-y-1 relative overflow-hidden group shadow-lg disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="flex gap-4 w-full">
      <button
        disabled={loading !== null}
        onClick={() => handleAction('feed')}
        className={`${btnClass} bg-[#3f1616] border-[#ef4444] hover:bg-[#4f1616] text-[#fca5a5]`}
      >
        <span className="relative z-10 flex flex-col items-center gap-2">
          {loading === 'feed' ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#fca5a5]" />
          ) : (
            <Drumstick className="w-8 h-8 drop-shadow-md text-[#fca5a5] group-hover:scale-110 transition-transform" />
          )}
          FEED
        </span>
      </button>

      <button
        disabled={loading !== null}
        onClick={() => handleAction('play')}
        className={`${btnClass} bg-[#083344] border-[#06b6d4] hover:bg-[#164e63] text-[#67e8f9]`}
      >
        <span className="relative z-10 flex flex-col items-center gap-2">
          {loading === 'play' ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#67e8f9]" />
          ) : (
            <Gamepad2 className="w-8 h-8 drop-shadow-md text-[#67e8f9] group-hover:scale-110 transition-transform" />
          )}
          PLAY
        </span>
      </button>

      <button
        disabled={loading !== null}
        onClick={() => handleAction('sleep')}
        className={`${btnClass} bg-[#3b0764] border-[#a855f7] hover:bg-[#581c87] text-[#d8b4fe]`}
      >
        <span className="relative z-10 flex flex-col items-center gap-2">
          {loading === 'sleep' ? (
            <Loader2 className="w-8 h-8 animate-spin text-[#d8b4fe]" />
          ) : (
            <Moon className="w-8 h-8 drop-shadow-md text-[#d8b4fe] group-hover:scale-110 transition-transform" />
          )}
          SLEEP
        </span>
      </button>
    </div>
  );
}
