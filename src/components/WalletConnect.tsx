'use client';

import * as React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, error } = useConnect();
  const { disconnect } = useDisconnect();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <button className="bg-[var(--gochi-panel)] text-[var(--gochi-text)] border border-[var(--gochi-border)] px-4 py-2 rounded-none font-mono text-xs opacity-50 cursor-not-allowed">
        Loading...
      </button>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-block font-mono text-[10px] text-[var(--gochi-text)] opacity-70">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="bg-[var(--gochi-panel)] hover:bg-red-500/10 text-red-400 border border-[var(--gochi-border)] hover:border-red-500/30 transition-colors px-4 py-2 rounded-none font-mono text-xs shadow-[0_0_10px_rgba(239,68,68,0.1)]"
        >
          Disconnect
        </button>
      </div>
    );
  }

  const connector = connectors.find((c) => c.id === 'metaMask') || connectors.find((c) => c.id === 'injected') || connectors[0];

  return (
    <div className="flex items-center gap-2">
      {connector && (
        <button
          onClick={() => connect({ connector })}
          className="bg-[var(--gochi-cyan)]/10 hover:bg-[var(--gochi-cyan)]/20 text-[var(--gochi-cyan)] border border-[var(--gochi-cyan)]/30 transition-colors px-4 py-2 rounded-none font-mono text-xs shadow-[0_0_10px_rgba(6,182,212,0.15)]"
        >
          Connect Wallet
        </button>
      )}
      {error && <div className="text-red-500 text-xs font-mono">{error.message}</div>}
    </div>
  );
}
