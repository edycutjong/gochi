import React from 'react';
import { render, screen } from '@testing-library/react';

// Setup global fetch mock BEFORE importing providers
const mockFetch = jest.fn();
Object.defineProperty(window, 'fetch', {
  value: mockFetch,
  writable: true,
});

// Mock wagmi and react-query to prevent actual initialization issues
jest.mock('wagmi', () => ({
  WagmiProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="wagmi-provider">{children}</div>,
  createConfig: jest.fn(),
  http: jest.fn(),
}));

jest.mock('@tanstack/react-query', () => ({
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="query-provider">{children}</div>,
  QueryClient: jest.fn(),
}));

jest.mock('wagmi/connectors', () => ({
  injected: jest.fn(),
  metaMask: jest.fn(),
  walletConnect: jest.fn(),
}));

// Require providers AFTER mocks are set
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Providers } = require('./providers');

describe('Providers', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

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

  it('blocks telemetry URLs', async () => {
    const blockedUrls = [
      'https://pulse.walletconnect.org/api',
      'https://api.web3modal.com/v1',
      'https://api.web3modal.org/v1',
      'https://walletlink.org/api',
      'https://mm-sdk-analytics.api.cx.metamask.io/v1'
    ];

    for (const url of blockedUrls) {
      const response = await window.fetch(url);
      expect(response.status).toBe(200);
      const text = await response.text();
      expect(text).toBe('{}');
      // Ensure the underlying fetch was never called
      expect(mockFetch).not.toHaveBeenCalled();
    }
  });

  it('suppresses network errors and returns 502', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network offline'));

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const response = await window.fetch('https://some-api.com/data');
    
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Network] Fetch failed for https://some-api.com/data:'),
      expect.any(Error)
    );
    expect(response.status).toBe(502);
    const data = await response.json();
    expect(data).toEqual({ error: 'Fetch failed' });

    warnSpy.mockRestore();
  });

  it('passes through successful fetch calls', async () => {
    const mockResponse = new Response('{"success":true}', { status: 200 });
    mockFetch.mockResolvedValueOnce(mockResponse);

    const response = await window.fetch('https://api.example.com/data');
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', undefined);
  });

  it('handles Request objects as input', async () => {
     const req = new Request('https://pulse.walletconnect.org/api');
     const res = await window.fetch(req);
     expect(res.status).toBe(200);
     expect(mockFetch).not.toHaveBeenCalled();
  });
  
  it('handles URLs casted to string', async () => {
     const res = await window.fetch(new URL('https://pulse.walletconnect.org/api') as unknown as URL);
     expect(res.status).toBe(200);
     expect(mockFetch).not.toHaveBeenCalled();
  });
});
