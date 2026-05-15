import React from 'react';
import { render, screen } from '@testing-library/react';
import RootLayout from './layout';

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Inter: () => ({ variable: '--font-inter' }),
  JetBrains_Mono: () => ({ variable: '--font-jetbrains' }),
  Press_Start_2P: () => ({ variable: '--font-press-start' }),
}));

// Mock Providers and WalletConnect
jest.mock('./providers', () => ({
  Providers: ({ children }: { children: React.ReactNode }) => <div data-testid="providers">{children}</div>,
}));

jest.mock('@/components/WalletConnect', () => ({
  WalletConnect: () => <div data-testid="wallet-connect">WalletConnect</div>,
}));

describe('RootLayout', () => {
  it('renders children within providers and header', () => {
    const originalError = console.error;
    console.error = jest.fn(); // Suppress HTML inside div warning
    
    render(
      <RootLayout>
        <div data-testid="child">Test Child</div>
      </RootLayout>
    );
    
    console.error = originalError;

    expect(screen.getByTestId('providers')).toBeInTheDocument();
    expect(screen.getByText('GOCHI')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-connect')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
