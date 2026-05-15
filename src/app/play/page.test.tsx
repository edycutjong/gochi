/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import PlayPage from './page';
import { useAccount, useChainId } from 'wagmi';

// Mock components
jest.mock('@/components/PetViewport', () => ({
  __esModule: true,
  default: ({ action }: any) => <div data-testid="pet-viewport" data-action={action} />
}));
jest.mock('@/components/StatBars', () => ({
  __esModule: true,
  default: ({ stats }: any) => <div data-testid="stat-bars">{JSON.stringify(stats)}</div>
}));
jest.mock('@/components/ActionButtons', () => ({
  __esModule: true,
  default: ({ onAction }: any) => (
    <div data-testid="action-buttons">
      <button onClick={() => onAction('feed')}>Feed</button>
      <button onClick={() => onAction('play')}>Play</button>
      <button onClick={() => onAction('sleep')}>Sleep</button>
    </div>
  )
}));
jest.mock('@/components/ChatPanel', () => ({
  __esModule: true,
  default: ({ state, onLatency }: any) => (
    <div data-testid="chat-panel" onClick={() => onLatency(150)}>
      Chat: {JSON.stringify(state)}
    </div>
  )
}));
jest.mock('@/components/MemoryLog', () => ({
  __esModule: true,
  default: ({ memories }: any) => <div data-testid="memory-log">{memories.length} memories</div>
}));
jest.mock('@/components/LatencyMonitor', () => ({
  __esModule: true,
  default: ({ latencies }: any) => <div data-testid="latency-monitor">{JSON.stringify(latencies)}</div>
}));
jest.mock('@/components/MintFlow', () => ({
  __esModule: true,
  default: ({ onMint }: any) => <button data-testid="mint-button" onClick={onMint}>Mint Now</button>
}));

describe('PlayPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders disconnected state', () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: false });
    render(<PlayPage />);
    expect(screen.getByText('Please connect your wallet to interact with your Gochi.')).toBeInTheDocument();
  });

  it('renders wrong network state', () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(1); // Not 16602
    render(<PlayPage />);
    expect(screen.getByText('Wrong network detected.')).toBeInTheDocument();
  });

  it('renders mint flow if not minted', () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(16602);
    
    render(<PlayPage />);
    expect(screen.getByTestId('mint-button')).toBeInTheDocument();
  });

  it('renders game UI after minting and fetches initial state', async () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(16602);
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({
        value: { hunger: 50, mood: 50, energy: 50 },
        latency: 100
      })
    });

    render(<PlayPage />);
    
    // Trigger mint
    await act(async () => {
      fireEvent.click(screen.getByTestId('mint-button'));
    });

    expect(screen.getByTestId('pet-viewport')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/kv/read?key=gochi_state');
    
    // Verify fetched state is passed down
    expect(screen.getByTestId('stat-bars')).toHaveTextContent('{"hunger":50,"mood":50,"energy":50}');
  });

  it('handles actions correctly', async () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(16602);
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ value: null }) // read initially
      })
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ txHash: '0x123', latency: 200 }) // write kv
      })
      .mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue({ success: true, merkleRoot: '0xabc', latency: 300 }) // archive log
      });

    render(<PlayPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('mint-button'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Feed'));
    });

    // Pet action should be set to 'feed'
    expect(screen.getByTestId('pet-viewport')).toHaveAttribute('data-action', 'feed');
    
    // Stats should update optimistically (hunger +20)
    expect(screen.getByTestId('stat-bars')).toHaveTextContent('{"hunger":90,"mood":80,"energy":60}');
    
    // Check fetch calls
    expect(global.fetch).toHaveBeenCalledWith('/api/kv/write', expect.any(Object));
    expect(global.fetch).toHaveBeenCalledWith('/api/log/archive', expect.any(Object));

    // Memory log should be updated
    expect(screen.getByTestId('memory-log')).toHaveTextContent('1 memories');

    // Fast-forward 2000ms to clear action
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByTestId('pet-viewport')).toHaveAttribute('data-action', 'idle');
  });

  it('updates ai latency when chat panel triggers it', async () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(16602);
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValue({ value: null })
    });

    render(<PlayPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('mint-button'));
    });

    act(() => {
      fireEvent.click(screen.getByTestId('chat-panel'));
    });

    expect(screen.getByTestId('latency-monitor')).toHaveTextContent('"ai":150');
  });
});
