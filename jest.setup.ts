/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock wagmi
jest.mock('wagmi', () => ({
  useAccount: jest.fn(() => ({
    address: '0x1234567890123456789012345678901234567890',
    isConnected: true,
  })),
  useChainId: jest.fn(() => 16602),
  useConnect: jest.fn(() => ({
    connect: jest.fn(),
    connectors: [{ id: 'metaMask', name: 'MetaMask' }],
    error: null,
  })),
  useDisconnect: jest.fn(() => ({
    disconnect: jest.fn(),
  })),
  useWriteContract: jest.fn(() => ({
    writeContractAsync: jest.fn().mockResolvedValue('0xtxhash'),
    isPending: false,
  })),
  useWaitForTransactionReceipt: jest.fn(() => ({
    isLoading: false,
    isSuccess: true,
  })),
  useReadContract: jest.fn(() => ({
    data: undefined,
    refetch: jest.fn(),
  })),
}));

// Mock TextEncoder / TextDecoder
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

if (typeof global.ReadableStream === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ReadableStream, WritableStream, TransformStream } = require('node:stream/web');
  global.ReadableStream = ReadableStream as any;
  global.WritableStream = WritableStream as any;
  global.TransformStream = TransformStream as any;
}

// Polyfill Request, Response, fetch for Next.js API route tests
if (typeof global.Request === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Request, Response, Headers, fetch } = require('undici');
  global.Request = Request as any;
  global.Response = Response as any;
  global.Headers = Headers as any;
  if (typeof global.fetch === 'undefined') {
    global.fetch = fetch as any;
  }
}

