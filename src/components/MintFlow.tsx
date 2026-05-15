'use client';
import { useState, useEffect } from 'react';
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
            <Egg className="w-32 h-32 text-[var(--gochi-text)] animate-breathe" strokeWidth={1.5} />
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
          <>
            <h2 className="font-display text-lg mb-4 text-[var(--gochi-cyan)]">A new life awaits</h2>
            <p className="text-[var(--gochi-muted)] text-sm mb-6 font-mono leading-relaxed">
              Your Gochi will be born as an INFT on the{' '}
              <strong className="text-[var(--gochi-text)]">0G Galileo Testnet</strong>.
              Its memories will be permanently archived on 0G Storage.
            </p>
            {error && <p className="text-red-400 text-xs font-mono mb-4 break-all">{error}</p>}
            <button
              onClick={handleMint}
              className="w-full py-4 bg-gradient-to-r from-[var(--gochi-cyan)] to-[var(--gochi-purple)] text-white font-display text-xs rounded-lg hover:opacity-90 transition-opacity active:scale-[0.98] flex items-center justify-center gap-3 relative z-10"
            >
              MINT YOUR GOCHI
            </button>
            <div className="mt-4 text-xs font-mono text-[var(--gochi-muted)]">
              {displayAddress ? `Contract: ${displayAddress.slice(0, 10)}…` : 'Est. Cost: ~0.01 A0GI (gas)'}
            </div>
          </>
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
