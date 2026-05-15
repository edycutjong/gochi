'use client';

import * as React from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { injected, metaMask } from 'wagmi/connectors';

// 0G Mainnet custom chain definition
const zeroG = {
  id: 16661,
  name: '0G Mainnet',
  iconUrl: 'https://0g.ai/favicon.ico',
  nativeCurrency: { name: 'A0GI', symbol: 'A0GI', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://evmrpc.0g.ai'] },
  },
  blockExplorers: {
    default: { name: 'ChainScan', url: 'https://chainscan.0g.ai' },
  },
} as const;

const config = createConfig({
  chains: [zeroG],
  connectors: [
    metaMask(),
    injected(),
  ],
  transports: {
    [zeroG.id]: http(),
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
