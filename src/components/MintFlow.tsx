'use client';
import { useState, useEffect, useRef } from 'react';
import { Egg, Ghost, Sparkles, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { decodeEventLog } from 'viem';

const GOCHI_ABI = [
  {
    name: 'mint',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
  },
  {
    name: 'GochiMinted',
    type: 'event',
    inputs: [
      { name: 'tokenId', type: 'uint256', indexed: true },
      { name: 'owner', type: 'address', indexed: true },
      { name: 'seed', type: 'bytes32', indexed: false },
    ],
  },
] as const;

const CHAIN_SCAN = 'https://chainscan-galileo.0g.ai';

export default function MintFlow({ onMint }: { onMint: (tokenId?: number) => Promise<void> }) {
  const [stage, setStage] = useState<'idle' | 'minting' | 'hatching'>('idle');
  const [mintTxHash, setMintTxHash] = useState<`0x${string}` | undefined>();
  const [mintedTokenId, setMintedTokenId] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loadInput, setLoadInput] = useState('');
  
  const [savedTokenIds, setSavedTokenIds] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gochi_saved_token_ids');
        if (saved) return JSON.parse(saved);
        const oldSaved = localStorage.getItem('gochi_last_token_id');
        if (oldSaved) return [Number(oldSaved)];
      } catch (e) {}
    }
    return [];
  });
  
  const options = [{ type: 'new' as const }, ...[...savedTokenIds].reverse().map(id => ({ type: 'resume' as const, id }))];
  const [selectedIndex, setSelectedIndex] = useState(options.length > 1 ? 1 : 0);
  const sliderRef = useRef<HTMLDivElement>(null);

  const scrollTo = (index: number) => {
    if (!sliderRef.current) return;
    const scrollLeft = sliderRef.current.clientWidth * index;
    sliderRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    setSelectedIndex(index);
  };

  const handleScroll = () => {
    if (!sliderRef.current) return;
    const index = Math.round(sliderRef.current.scrollLeft / sliderRef.current.clientWidth);
    if (index !== selectedIndex) {
      setSelectedIndex(index);
    }
  };

  useEffect(() => {
    if (stage === 'idle' && sliderRef.current && options.length > 1) {
      setTimeout(() => scrollTo(1), 50);
    }
  }, [stage, options.length]);

  useEffect(() => {
    if (stage !== 'idle') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        scrollTo(Math.max(0, selectedIndex - 1));
      } else if (e.key === 'ArrowRight') {
        scrollTo(Math.min(options.length - 1, selectedIndex + 1));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, selectedIndex, options.length]);
  const [eggColor, setEggColor] = useState('');
  const [eggMotion, setEggMotion] = useState(false);

  const handleEggClick = () => {
    const colors = ['#fca5a5', '#86efac', '#93c5fd', '#fcd34d', '#d8b4fe', '#06b6d4', '#f472b6'];
    setEggColor(colors[Math.floor(Math.random() * colors.length)]);
    setEggMotion(true);
    setTimeout(() => setEggMotion(false), 500);
  };

  const { writeContractAsync } = useWriteContract();
  const { data: receipt, isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: mintTxHash });

  useEffect(() => {
    if (!txConfirmed || !receipt) return;

    let parsedTokenId: number | undefined;
    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({ abi: GOCHI_ABI, data: log.data, topics: log.topics });
        if (decoded.eventName === 'GochiMinted') {
          parsedTokenId = Number(decoded.args.tokenId);
          break;
        }
      } catch {
        // not the right log
      }
    }

    setTimeout(() => {
      setMintedTokenId(parsedTokenId);
      if (parsedTokenId !== undefined) {
        setSavedTokenIds(prev => {
          const next = prev.filter(x => x !== parsedTokenId);
          next.push(parsedTokenId!);
          localStorage.setItem('gochi_saved_token_ids', JSON.stringify(next));
          localStorage.setItem('gochi_last_token_id', parsedTokenId!.toString());
          return next;
        });
      }
      setStage('hatching');
    }, 0);

    const hatchDelay = setTimeout(async () => {
      await onMint(parsedTokenId);
    }, 3000);

    return () => clearTimeout(hatchDelay);
  }, [txConfirmed, receipt, onMint]);

  const handleMint = async () => {
    setError(null);
    setStage('minting');

    try {
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;
      if (contractAddress) {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: GOCHI_ABI,
          functionName: 'mint',
        });
        setMintTxHash(hash);
      } else {
        await new Promise((r) => setTimeout(r, 2000));
        setMintedTokenId(undefined);
        setStage('hatching');
        await new Promise((r) => setTimeout(r, 3000));
        await onMint(undefined);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
      setStage('idle');
    }
  };

  const displayAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto h-[600px]">
      {/* Character visual */}
      <div className="mb-10 relative w-48 h-48 mx-auto flex items-center justify-center">
        <div className="absolute inset-0 bg-radial from-[var(--gochi-cyan)]/30 to-transparent blur-2xl animate-pulse" />
        <div className="relative z-10 flex items-center justify-center">
          {stage === 'idle' && (
            <Egg 
              onClick={handleEggClick}
              className={`w-32 h-32 cursor-pointer transition-all duration-300 ${eggMotion ? 'scale-125 -rotate-12 drop-shadow-2xl' : 'animate-breathe scale-100'}`} 
              style={{ color: eggColor || 'var(--gochi-text)', filter: eggColor ? `drop-shadow(0 0 25px ${eggColor})` : 'none' }}
              strokeWidth={1.5} 
            />
          )}
          {stage === 'minting' && (
            <div className="relative">
              <Egg className="w-32 h-32 text-[var(--gochi-cyan)] animate-pulse" strokeWidth={1.5} />
              <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-[var(--gochi-amber)] animate-spin-slow" />
            </div>
          )}
          {stage === 'hatching' && (
            <div className="relative w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-[var(--gochi-cyan)]/40 animate-ping" />
              <div className="absolute -inset-6 rounded-full border border-[var(--gochi-amber)]/20 animate-ping" style={{ animationDelay: '0.4s' }} />
              <Ghost
                className="w-32 h-32 text-[var(--gochi-cyan)] animate-bounce"
                strokeWidth={1.5}
                style={{ filter: 'drop-shadow(0 0 20px #06b6d4)' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Card panel */}
      <div className="bg-[var(--gochi-panel)] border-2 border-[var(--gochi-border)] rounded-xl p-8 w-full shadow-[0_0_30px_rgba(6,182,212,0.1)] relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_50%,transparent_50%)] bg-[size:100%_4px] pointer-events-none" />

        {/* ── IDLE state ── */}
        {stage === 'idle' && (
          <div className="flex flex-col -mx-8 -my-8 h-full">
            <div 
              ref={sliderRef}
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide flex-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={handleScroll}
            >
              {options.map((opt, i) => (
                <div key={i} className="w-full flex-shrink-0 snap-center p-8 flex flex-col justify-center">
                  {opt.type === 'new' ? (
                    <>
                      <h2 className="font-display text-lg mb-4 text-[var(--gochi-cyan)] text-center">A new life awaits</h2>
                      <p className="text-[var(--gochi-muted)] text-sm mb-6 font-mono leading-relaxed text-center">
                        Your Gochi will be born as an INFT on the{' '}
                        <strong className="text-[var(--gochi-text)]">0G Galileo Testnet</strong>.
                        Its memories will be permanently archived on 0G Storage.
                      </p>
                      {error && <p className="text-red-400 text-xs font-mono mb-4 break-all text-center">{error}</p>}
                      <button
                        onClick={handleMint}
                        className="w-full py-4 bg-gradient-to-r from-[var(--gochi-cyan)] to-[var(--gochi-purple)] text-white font-display text-xs rounded-lg hover:opacity-90 transition-opacity active:scale-[0.98] flex items-center justify-center gap-3 relative z-10"
                      >
                        MINT YOUR GOCHI
                      </button>
                      <div className="mt-4 text-xs font-mono text-[var(--gochi-muted)] text-center">
                        {displayAddress ? `Contract: 0x${displayAddress.replace(/^0x/i, '').slice(0, 4)}...${displayAddress.slice(-4)}` : 'Est. Cost: ~0.01 A0GI (gas)'}
                      </div>

                      <div className="mt-6 pt-6 border-t border-[var(--gochi-border)] flex flex-col gap-3">
                        <div className="text-xs text-[var(--gochi-muted)] font-mono text-left">Have an existing Gochi? Enter its Token ID:</div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="Token ID"
                            value={loadInput}
                            onChange={(e) => setLoadInput(e.target.value)}
                            className="flex-1 bg-[var(--gochi-background)] border border-[var(--gochi-border)] rounded-lg px-3 py-2 text-[var(--gochi-text)] text-sm font-mono focus:outline-none focus:border-[var(--gochi-cyan)]"
                          />
                          <button
                            onClick={() => {
                              const id = parseInt(loadInput);
                              if (!isNaN(id)) {
                                setSavedTokenIds(prev => {
                                  const next = prev.filter(x => x !== id);
                                  next.push(id);
                                  localStorage.setItem('gochi_saved_token_ids', JSON.stringify(next));
                                  localStorage.setItem('gochi_last_token_id', id.toString());
                                  return next;
                                });
                                onMint(id);
                              }
                            }}
                            disabled={!loadInput}
                            className="px-4 bg-[var(--gochi-panel)] border border-[var(--gochi-border)] text-[var(--gochi-text)] text-xs font-display rounded-lg hover:bg-[var(--gochi-border)] disabled:opacity-50 transition-colors"
                          >
                            LOAD
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="font-display text-lg mb-4 text-[var(--gochi-cyan)] text-center">Resume Life</h2>
                      <div className="flex-1 flex flex-col items-center justify-center mb-6">
                        <Ghost className="w-16 h-16 text-[var(--gochi-cyan)] animate-pulse mb-4" strokeWidth={1.5} />
                        <p className="text-[var(--gochi-muted)] text-sm font-mono leading-relaxed text-center">
                          Awaken Gochi <strong className="text-[var(--gochi-amber)]">#{opt.id}</strong> from 0G Storage.
                        </p>
                      </div>
                      <button
                        onClick={() => onMint(opt.id)}
                        className="w-full py-4 bg-[var(--gochi-panel)] border border-[var(--gochi-cyan)]/30 text-[var(--gochi-cyan)] font-display text-xs rounded-lg hover:bg-[var(--gochi-cyan)]/10 transition-colors flex items-center justify-center gap-2"
                      >
                        RESUME GOCHI #{opt.id}
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
            
            {/* Arrows & Dots */}
            {options.length > 1 && (
              <div className="flex justify-between items-center px-4 py-4 bg-[var(--gochi-panel)] border-t border-[var(--gochi-border)] z-10">
                <button 
                  onClick={() => scrollTo(Math.max(0, selectedIndex - 1))}
                  disabled={selectedIndex === 0}
                  className="p-1 rounded hover:bg-[var(--gochi-border)] disabled:opacity-30 transition-colors text-[var(--gochi-cyan)]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <div className="flex gap-2">
                  {options.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => scrollTo(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === selectedIndex ? 'bg-[var(--gochi-cyan)]' : 'bg-[var(--gochi-border)] hover:bg-[var(--gochi-cyan)]/50'}`} 
                    />
                  ))}
                </div>
                <button 
                  onClick={() => scrollTo(Math.min(options.length - 1, selectedIndex + 1))}
                  disabled={selectedIndex === options.length - 1}
                  className="p-1 rounded hover:bg-[var(--gochi-border)] disabled:opacity-30 transition-colors text-[var(--gochi-cyan)]"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── MINTING state ── */}
        {stage === 'minting' && (
          <>
            <h2 className="font-display text-base mb-3 text-[var(--gochi-cyan)]">Confirming on-chain…</h2>
            <p className="text-[var(--gochi-muted)] text-xs font-mono mb-5 leading-relaxed">
              Transaction submitted. Waiting for block confirmation on 0G Galileo Testnet.
            </p>
            {mintTxHash && (
              <a
                href={`${CHAIN_SCAN}/tx/${mintTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[var(--gochi-cyan)] text-xs font-mono hover:underline mb-4"
              >
                <ExternalLink className="w-3 h-3" />
                {mintTxHash.slice(0, 14)}…
              </a>
            )}
            <div className="w-full py-4 bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-lg font-display text-xs text-[var(--gochi-muted)] flex items-center justify-center gap-2 opacity-60">
              <span className="animate-pulse">CONFIRMING TX...</span>
            </div>
          </>
        )}

        {/* ── HATCHING state ── */}
        {stage === 'hatching' && (
          <>
            <div className="flex items-center justify-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-[var(--gochi-green)]" />
              <h2 className="font-display text-base text-[var(--gochi-green)]">BORN ON 0G CHAIN</h2>
            </div>

            {mintedTokenId !== undefined && (
              <div className="font-display text-5xl text-[var(--gochi-amber)] mb-3 animate-pulse">
                #{mintedTokenId}
              </div>
            )}

            <p className="text-[var(--gochi-muted)] text-xs font-mono mb-4">
              Your Gochi is now an INFT on the 0G Galileo Testnet.
              It will live forever.
            </p>

            {mintTxHash && (
              <a
                href={`${CHAIN_SCAN}/tx/${mintTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--gochi-cyan)]/40 text-[var(--gochi-cyan)] text-xs font-mono hover:bg-[var(--gochi-cyan)]/10 transition-colors mb-4"
              >
                <ExternalLink className="w-3 h-3" />
                Verify on ChainScan
              </a>
            )}

            <p className="font-mono text-[10px] text-[var(--gochi-green)] animate-pulse">
              Entering your world…
            </p>
          </>
        )}
      </div>
    </div>
  );
}
