'use client';
import { useState, useEffect, useCallback } from 'react';
import { Egg, Ghost, Sparkles, ExternalLink, CheckCircle2 } from 'lucide-react';
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
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

export default function MintFlow({ onMint, isDemo }: { onMint: (tokenId?: number) => Promise<void>, isDemo?: boolean }) {
  const [stage, setStage] = useState<'idle' | 'minting' | 'hatching'>('idle');
  const [mintTxHash, setMintTxHash] = useState<`0x${string}` | undefined>();
  const [mintedTokenId, setMintedTokenId] = useState<number | undefined>();
  const [errorInfo, setErrorInfo] = useState<{ message: string; docsUrl?: string } | null>(null);
  const [loadInput, setLoadInput] = useState('');

  const [savedTokenIds, setSavedTokenIds] = useState<number[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('gochi_saved_token_ids');
        if (saved) return JSON.parse(saved);
        const oldSaved = localStorage.getItem('gochi_last_token_id');
        if (oldSaved) return [Number(oldSaved)];
      } catch {}
    }
    return [];
  });

  const options = [{ type: 'new' as const }, ...[...savedTokenIds].reverse().map(id => ({ type: 'resume' as const, id }))];
  const [selectedIndex, setSelectedIndex] = useState(options.length > 1 ? 1 : 0);

  const slideTo = useCallback((index: number) => {
    setSelectedIndex(Math.max(0, Math.min(options.length - 1, index)));
  }, [options.length]);

  useEffect(() => {
    if (stage !== 'idle') return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') slideTo(selectedIndex - 1);
      else if (e.key === 'ArrowRight') slideTo(selectedIndex + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stage, selectedIndex, options.length, slideTo]);
  const [eggColor, setEggColor] = useState('');
  const [eggMotion, setEggMotion] = useState(false);

  const handleEggClick = () => {
    const colors = ['#fca5a5', '#86efac', '#93c5fd', '#fcd34d', '#d8b4fe', '#06b6d4', '#f472b6'];
    setEggColor(colors[Math.floor(Math.random() * colors.length)]);
    setEggMotion(true);
    setTimeout(() => setEggMotion(false), 500);
  };

  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
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
    setErrorInfo(null);
    setStage('minting');

    try {
      if (!isDemo) {
        await switchChainAsync({ chainId: 16602 });
      }
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}` | undefined;
      if (contractAddress && !isDemo) {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: GOCHI_ABI,
          functionName: 'mint',
          chainId: 16602,
        });
        setMintTxHash(hash);
      } else {
        await new Promise((r) => setTimeout(r, 2000));
        setMintedTokenId(undefined);
        setStage('hatching');
        await new Promise((r) => setTimeout(r, 3000));
        await onMint(undefined);
      }
    } catch (err) {
      const e = err as { shortMessage?: string; message?: string };
      console.error(e);
      let errMsg = 'Transaction failed';
      let docsUrl: string | undefined;

      if (e.shortMessage) {
        errMsg = e.shortMessage;
      } else if (e.message) {
        errMsg = e.message.split('\n')[0];
      }

      if (e.message) {
        const docsMatch = e.message.match(/Docs:\s*(https:\/\/[^\s]+)/);
        if (docsMatch) {
          docsUrl = docsMatch[1];
        }
      }

      setErrorInfo({ message: errMsg, docsUrl });
      setStage('idle');
    }
  };

  const displayAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  // ── Minting state ──
  if (stage === 'minting') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-8">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[var(--gochi-cyan)]/10 blur-2xl animate-pulse" />
          <div className="relative z-10">
            <Egg className="w-32 h-32 text-[var(--gochi-cyan)] animate-pulse" strokeWidth={1.5} />
            <Sparkles className="absolute -top-4 -right-4 w-8 h-8 text-[var(--gochi-amber)] animate-spin-slow" />
          </div>
        </div>
        <div className="bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-xl p-8 w-full max-w-sm shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <h2 className="font-display text-base mb-3 text-[var(--gochi-cyan)]">Confirming on-chain…</h2>
          <p className="text-[var(--gochi-muted)] text-xs font-mono mb-5 leading-relaxed">
            Transaction submitted. Waiting for block confirmation on 0G Galileo Testnet.
          </p>
          {mintTxHash && (
            <a href={`${CHAIN_SCAN}/tx/${mintTxHash}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[var(--gochi-cyan)] text-xs font-mono hover:underline mb-4 block">
              <ExternalLink className="w-3 h-3" />
              {mintTxHash.slice(0, 14)}…
            </a>
          )}
          <div className="w-full py-3 border border-[var(--gochi-border)] rounded-lg font-display text-xs text-[var(--gochi-muted)] flex items-center justify-center gap-2 opacity-60">
            <span className="animate-pulse">CONFIRMING TX...</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Hatching state ──
  if (stage === 'hatching') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-8">
        <div className="relative w-40 h-40 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[var(--gochi-cyan)]/10 blur-2xl animate-pulse" />
          <div className="relative z-10 w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--gochi-cyan)]/40 animate-ping" />
            <div className="absolute -inset-6 rounded-full border border-[var(--gochi-amber)]/20 animate-ping" style={{ animationDelay: '0.4s' }} />
            <Ghost className="w-32 h-32 text-[var(--gochi-cyan)] animate-bounce" strokeWidth={1.5} style={{ filter: 'drop-shadow(0 0 20px #06b6d4)' }} />
          </div>
        </div>
        <div className="bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-xl p-8 w-full max-w-sm shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <div className="flex items-center justify-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-[var(--gochi-green)]" />
            <h2 className="font-display text-base text-[var(--gochi-green)]">BORN ON 0G CHAIN</h2>
          </div>
          {mintedTokenId !== undefined && (
            <div className="font-display text-5xl text-[var(--gochi-amber)] mb-3 animate-pulse">#{mintedTokenId}</div>
          )}
          <p className="text-[var(--gochi-muted)] text-xs font-mono mb-4">
            Your Gochi is now an INFT on the 0G Galileo Testnet. It will live forever.
          </p>
          {mintTxHash && (
            <a href={`${CHAIN_SCAN}/tx/${mintTxHash}`} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[var(--gochi-cyan)]/40 text-[var(--gochi-cyan)] text-xs font-mono hover:bg-[var(--gochi-cyan)]/10 transition-colors mb-4">
              <ExternalLink className="w-3 h-3" />
              Verify on ChainScan
            </a>
          )}
          <p className="font-mono text-[10px] text-[var(--gochi-green)] animate-pulse">Entering your world…</p>
        </div>
      </div>
    );
  }

  /* ── IDLE state: redesigned selection layout ── */
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 w-full max-w-2xl mx-auto gap-6 py-10">

      {/* Header: egg + title */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full blur-2xl animate-pulse" style={{ background: eggColor ? `${eggColor}40` : 'rgba(6,182,212,0.15)' }} />
          <Egg
            onClick={handleEggClick}
            className={`relative z-10 w-20 h-20 cursor-pointer transition-all duration-300 ${eggMotion ? 'scale-125 -rotate-12' : 'animate-breathe'}`}
            style={{ color: eggColor || 'var(--gochi-text)', filter: eggColor ? `drop-shadow(0 0 20px ${eggColor})` : 'none' }}
            strokeWidth={1.5}
          />
        </div>
        <div className="text-center">
          <h1 className="font-display text-xl text-[var(--gochi-cyan)]">HATCH YOUR GOCHI</h1>
          <p className="font-mono text-xs text-[var(--gochi-muted)] mt-1">An immortal AI pet on the 0G Network</p>
        </div>
      </div>

      {/* Two-panel choice layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">

        {/* ── Left: New Life ── */}
        <div className="bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-xl p-6 flex flex-col gap-4 hover:border-[var(--gochi-cyan)]/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.08)] transition-all">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--gochi-cyan)] shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
            <span className="font-display text-sm text-[var(--gochi-cyan)]">NEW LIFE</span>
          </div>
          <p className="font-mono text-xs text-[var(--gochi-muted)] leading-relaxed">
            Mint a new Gochi as an INFT on the{' '}
            <strong className="text-[var(--gochi-text)]">0G Galileo Testnet</strong>.
            Its memories will be permanently archived on 0G Storage.
          </p>

          {errorInfo && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-xs font-mono break-words">{errorInfo.message}</p>
              {errorInfo.docsUrl && (
                <a href={errorInfo.docsUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--gochi-cyan)] text-xs font-mono mt-2 hover:underline">
                  <ExternalLink className="w-3 h-3" /> Docs
                </a>
              )}
            </div>
          )}

          <button
            onClick={handleMint}
            className="w-full py-3.5 bg-gradient-to-r from-[var(--gochi-cyan)] to-[var(--gochi-purple)] text-white font-display text-xs rounded-lg hover:opacity-90 transition-opacity active:scale-[0.98] mt-auto"
          >
            MINT YOUR GOCHI
          </button>
          <div className="font-mono text-[10px] text-[var(--gochi-muted)] text-center -mt-2">
            {displayAddress
              ? `Contract: 0x${displayAddress.replace(/^0x/i, '').slice(0, 4)}…${displayAddress.slice(-4)}`
              : 'Est. ~0.01 A0GI gas'}
          </div>
        </div>

        {/* ── Right: Resume ── */}
        <div className="bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-xl p-6 flex flex-col gap-3 hover:border-[var(--gochi-purple)]/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.06)] transition-all">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--gochi-purple)] shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
            <span className="font-display text-sm text-[var(--gochi-purple)]">RESUME</span>
          </div>

          {savedTokenIds.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6 opacity-50">
              <Ghost className="w-8 h-8 text-[var(--gochi-muted)]" strokeWidth={1.5} />
              <p className="font-mono text-xs text-[var(--gochi-muted)]">No saved Gochis yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {[...savedTokenIds].reverse().map((id) => (
                <button
                  key={id}
                  onClick={() => onMint(id)}
                  className="flex items-center justify-between px-4 py-3 bg-[var(--gochi-bg)] border border-[var(--gochi-border)] rounded-lg hover:border-[var(--gochi-cyan)]/50 hover:bg-[var(--gochi-cyan)]/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Ghost className="w-4 h-4 text-[var(--gochi-cyan)] opacity-60 group-hover:opacity-100 transition-opacity" strokeWidth={1.5} />
                    <span className="font-mono text-sm text-[var(--gochi-text)]">
                      Gochi <strong className="text-[var(--gochi-amber)]">#{id}</strong>
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--gochi-muted)] group-hover:text-[var(--gochi-cyan)] transition-colors">
                    AWAKEN →
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Manual token ID */}
          <div className="pt-3 border-t border-[var(--gochi-border)] flex flex-col gap-2 mt-auto">
            <div className="font-mono text-[10px] text-[var(--gochi-muted)]">Load by Token ID</div>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Token ID"
                value={loadInput}
                onChange={(e) => setLoadInput(e.target.value)}
                className="flex-1 bg-[var(--gochi-bg)] border border-[var(--gochi-border)] rounded-lg px-3 py-2 text-[var(--gochi-text)] text-sm font-mono focus:outline-none focus:border-[var(--gochi-cyan)] transition-colors"
              />
              <button
                onClick={() => {
                  const id = parseInt(loadInput);
                  if (!isNaN(id)) {
                    setSavedTokenIds((prev) => {
                      const next = prev.filter((x) => x !== id);
                      next.push(id);
                      localStorage.setItem('gochi_saved_token_ids', JSON.stringify(next));
                      localStorage.setItem('gochi_last_token_id', id.toString());
                      return next;
                    });
                    onMint(id);
                  }
                }}
                disabled={!loadInput}
                className="px-4 bg-[var(--gochi-panel)] border border-[var(--gochi-border)] text-[var(--gochi-text)] text-xs font-display rounded-lg hover:border-[var(--gochi-cyan)]/40 disabled:opacity-40 transition-colors"
              >
                LOAD
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

