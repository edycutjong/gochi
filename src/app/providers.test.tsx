import React from 'react';
import { render, screen } from '@testing-library/react';
import { Providers } from './providers';

// Mock wagmi and react-query to prevent actual initialization issues
jest.mock('wagmi', () => {
  return {
    WagmiProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="wagmi-provider">{children}</div>,
    createConfig: jest.fn(),
    http: jest.fn(),
  };
});

jest.mock('@tanstack/react-query', () => {
  return {
    QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="query-provider">{children}</div>,
    QueryClient: jest.fn(),
  };
});

jest.mock('wagmi/connectors', () => ({
  injected: jest.fn(),
  metaMask: jest.fn(),
}));

describe('Providers', () => {
  it('renders children wrapped in necessary providers', () => {
    render(
      <Providers>
        <div data-testid="child">Test Child</div>
      </Providers>
    );

    expect(screen.getByTestId('wagmi-provider')).toBeInTheDocument();
    expect(screen.getByTestId('query-provider')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
