'use client';

import * as React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { injected, metaMask, walletConnect } from 'wagmi/connectors';

// Silently swallow WalletConnect analytics/telemetry POSTs so they don't
// pollute the console with "Failed to fetch" errors. Relay WebSocket
// connections are unaffected — only HTTP analytics endpoints are blocked.
if (typeof window !== 'undefined') {
  const _fetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url =
      typeof input === 'string' ? input
      : input instanceof Request ? input.url
      : String(input);
    
    // Block WalletConnect & MetaMask analytics/telemetry to avoid console spam
    if (
      url.includes('pulse.walletconnect.org') || 
      url.includes('api.web3modal.com') ||
      url.includes('api.web3modal.org') ||
      url.includes('walletlink.org') ||
      url.includes('mm-sdk-analytics.api.cx.metamask.io')
    ) {
      return Promise.resolve(new Response('{}', { status: 200 }));
    }

    try {
      return await _fetch(input, init);
    } catch (error) {
      // Suppress noisy network errors in dev console from random background polls
      console.warn(`[Network] Fetch failed for ${url}:`, error);
      // Return a dummy error response instead of throwing to prevent Next.js overlay spam
      return new Response(JSON.stringify({ error: 'Fetch failed' }), { 
        status: 502,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}

// 0G Galileo Testnet custom chain definition
const zeroG = {
  id: 16602,
  name: '0G Galileo Testnet',
  iconUrl: 'https://0g.ai/favicon.ico',
  nativeCurrency: { name: 'A0GI', symbol: 'A0GI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc-testnet.0g.ai'] },
  },
  blockExplorers: {
    default: { name: 'ChainScan', url: 'https://chainscan-galileo.0g.ai' },
  },
} as const;

const config = createConfig({
  chains: [zeroG],
  connectors: [
    metaMask(),
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID! }),
    injected(),
  ],
  transports: {
    [zeroG.id]: http('https://evmrpc-testnet.0g.ai', {
      batch: false,
      retryCount: 3,
      retryDelay: 1000,
    }),
  },
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
