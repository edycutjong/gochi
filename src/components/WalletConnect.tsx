'use client';

import * as React from 'react';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';

const REQUIRED_CHAIN_ID = 16602;

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="bg-[var(--gochi-panel)] text-[var(--gochi-text)] border border-[var(--gochi-border)] px-4 py-2 rounded font-mono text-xs opacity-50 cursor-not-allowed">
        Loading...
      </button>
    );
  }

  if (isConnected && address) {
    const onCorrectChain = chainId === REQUIRED_CHAIN_ID;
    return (
      <div className="flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${onCorrectChain ? 'bg-[var(--gochi-green)]' : 'bg-[var(--gochi-amber)] animate-pulse'}`} />
          <span className="font-mono text-[10px] text-[var(--gochi-muted)]">
            {onCorrectChain ? '0G Galileo' : 'Wrong network'}
          </span>
          <span className="font-mono text-[10px] text-[var(--gochi-text)] opacity-60 ml-1">
            {address.slice(0, 6)}…{address.slice(-4)}
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-[var(--gochi-panel)] hover:bg-red-500/10 text-red-400 border border-[var(--gochi-border)] hover:border-red-500/30 transition-colors p-2 rounded"
          aria-label="Disconnect"
          title="Disconnect"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    );
  }

  const connector =
    connectors.find((c) => c.id === 'metaMask') ||
    connectors.find((c) => c.id === 'injected') ||
    connectors[0];

  return (
    <div className="flex items-center gap-2">
      {connector && (
        <button
          onClick={() => connect({ connector })}
          className="bg-[var(--gochi-cyan)]/10 hover:bg-[var(--gochi-cyan)]/20 text-[var(--gochi-cyan)] border border-[var(--gochi-cyan)]/30 hover:border-[var(--gochi-cyan)]/60 transition-all px-4 py-2 rounded font-mono text-xs shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
        >
          Connect Wallet
        </button>
      )}
      {error && (
        <div className="text-[var(--gochi-amber)] text-[10px] font-mono animate-pulse">
          {error.message.includes('already pending') 
            ? 'Connection request pending in wallet...'
            : error.message}
        </div>
      )}
    </div>
  );
}
