'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';

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

const config = getDefaultConfig({
  appName: 'Gochi',
  projectId: 'YOUR_PROJECT_ID',
  chains: [zeroG],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#06b6d4',
          accentColorForeground: 'white',
          borderRadius: 'none',
        })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
