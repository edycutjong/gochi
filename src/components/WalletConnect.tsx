'use client';

import * as React from 'react';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { useRouter } from 'next/navigation';

const REQUIRED_CHAIN_ID = 16602;

const CONNECTOR_LABELS: Record<string, string> = {
  metaMask:      'MetaMask',
  walletConnect: 'WalletConnect',
  injected:      'Browser Wallet',
  coinbaseWallet:'Coinbase',
};

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  const [mounted, setMounted] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
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
          onClick={() => { disconnect(); router.push('/'); }}
          className="bg-[var(--gochi-panel)] hover:bg-red-500/10 text-red-400 border border-[var(--gochi-border)] hover:border-red-500/30 transition-colors p-2 rounded"
          aria-label="Disconnect"
          title="Disconnect"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    );
  }

  // Deduplicate: skip 'injected' if metaMask is also present (both map to MetaMask)
  const hasMetaMask = connectors.some((c) => c.id === 'metaMask');
  const visibleConnectors = connectors.filter(
    (c) => !(c.id === 'injected' && hasMetaMask)
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-[var(--gochi-cyan)]/10 hover:bg-[var(--gochi-cyan)]/20 text-[var(--gochi-cyan)] border border-[var(--gochi-cyan)]/30 hover:border-[var(--gochi-cyan)]/60 transition-all px-4 py-2 rounded font-mono text-xs shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)] flex items-center gap-2"
      >
        Connect Wallet
        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.4)] overflow-hidden z-50">
          {visibleConnectors.map((c) => (
            <button
              key={c.id}
              onClick={() => { connect({ connector: c }); setOpen(false); }}
              className="w-full px-4 py-3 text-left font-mono text-xs text-[var(--gochi-text)] hover:bg-[var(--gochi-cyan)]/10 hover:text-[var(--gochi-cyan)] transition-colors border-b border-[var(--gochi-border)] last:border-0"
            >
              {CONNECTOR_LABELS[c.id] ?? c.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="absolute right-0 top-full mt-2 text-[var(--gochi-amber)] text-[10px] font-mono bg-[var(--gochi-panel)] border border-[var(--gochi-border)] rounded px-3 py-2 max-w-[200px] z-50">
          {error.message.includes('pending') ? 'Open your wallet extension' : error.message}
        </div>
      )}
    </div>
  );
}
