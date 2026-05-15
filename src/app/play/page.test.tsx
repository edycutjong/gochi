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
  default: ({ onMint }: any) => (
    <div>
      <button data-testid="mint-button" onClick={() => onMint(1)}>Mint Now</button>
      <button data-testid="mint-button-undefined" onClick={() => onMint(undefined)}>Mint Now Undefined</button>
    </div>
  )
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
    expect(screen.getByText('Connect your wallet to hatch your Gochi.')).toBeInTheDocument();
  });

  it('renders wrong network state', () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(1); // Not 16602
    render(<PlayPage />);
    expect(screen.getByText('Wrong network')).toBeInTheDocument();
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
      ok: true,
      json: jest.fn().mockResolvedValue({
        value: { hunger: 50, mood: 50, energy: 50, lastUpdate: Date.now() },
        latency: 100
      })
    }).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ memories: [{ id: '1', title: 'Initial memory' }] })
    });

    render(<PlayPage />);
    
    // Trigger mint
    await act(async () => {
      fireEvent.click(screen.getByTestId('mint-button'));
    });

    expect(screen.getByTestId('pet-viewport')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('/api/kv/read?key=gochi_state_1');
    
    // Verify fetched state is passed down
    expect(screen.getByTestId('stat-bars').textContent).toMatch(/{"hunger":50,"mood":50,"energy":50,"lastUpdate":\d+}/);
    expect(screen.getByTestId('memory-log')).toHaveTextContent('1 memories');
  });

  it('handles actions correctly', async () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(16602);
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ value: null }) // read initially
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ memories: [] }) // read memories initially
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ txHash: '0x123', latency: 200 }) // write kv
      })
      .mockResolvedValueOnce({
        ok: true,
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
    expect(screen.getByTestId('stat-bars')).toHaveTextContent(/"hunger":90,"mood":80,"energy":60,"lastUpdate":\d+/);
    
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
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ value: null })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ memories: [] })
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

  it('handles sleep action', async () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(16602);
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ value: null })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ memories: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ txHash: '0x123', latency: 200 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, merkleRoot: '0xabc', latency: 300 })
      });

    render(<PlayPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('mint-button'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Sleep'));
    });
    expect(screen.getByTestId('pet-viewport')).toHaveAttribute('data-action', 'sleep');

    // Also trigger Play to cover the "play" branch of the ternary without network errors
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ txHash: '0x456', latency: 200 })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, merkleRoot: '0xdef', latency: 300 })
      });

    await act(async () => {
      fireEvent.click(screen.getByText('Play'));
    });
    expect(screen.getByTestId('pet-viewport')).toHaveAttribute('data-action', 'play');
  });

  it('handles play action and network errors', async () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(16602);
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ value: null }) // read initially
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ memories: [] }) // read memories initially
      })
      .mockRejectedValueOnce(new Error('Network failure')); // write kv fails

    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<PlayPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('mint-button'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Play'));
    });

    // Pet action should be set to 'play'
    expect(screen.getByTestId('pet-viewport')).toHaveAttribute('data-action', 'play');
    
    // Check fetch calls error is caught
    expect(consoleErrorMock).toHaveBeenCalledWith(expect.any(Error));

    consoleErrorMock.mockRestore();
  });

  it('applies passive decay over time', async () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(16602);
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          value: { hunger: 50, mood: 50, energy: 50, lastUpdate: Date.now() - 60000 }, // 1 minute old
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ memories: [] })
      });

    render(<PlayPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('mint-button'));
    });

    expect(screen.getByTestId('pet-viewport')).toBeInTheDocument();
    
    // Advance time to trigger the passive decay tick
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // We should see decayed stats in stat-bars
    // At 1 minute elapsed from 60000ms ago: hunger drops by 1 (per minute rate), mood by 0.5, energy by 0.5
    // Actually the mock returns lastUpdate Date.now() - 60000. So when it loads it decays for 1 minute.
    // Then after advancing 60s, it decays another 1 minute. Total 2 minutes decay.
    // DECAY_PER_MINUTE is { hunger: 0.1, mood: 0.05, energy: 0.03 }
    // After 2 elapsed minutes: hunger -0.2 (49.8), mood -0.1 (49.9), energy -0.06 (49.94)
    expect(screen.getByTestId('stat-bars')).toHaveTextContent(/\"hunger\":49\.8,\"mood\":49\.9.*,\"energy\":49\.94/);
  });

  it('handles missing lastUpdate in stats gracefully', async () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(16602);
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({
          value: { hunger: 50, mood: 50, energy: 50 }, // no lastUpdate
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ memories: [] })
      });

    render(<PlayPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('mint-button'));
    });

    expect(screen.getByTestId('pet-viewport')).toBeInTheDocument();
  });

  it('handles fetch errors during initial load', async () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(16602);
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500
      });

    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(<PlayPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('mint-button'));
    });

    expect(consoleErrorMock).toHaveBeenCalled();
    consoleErrorMock.mockRestore();
  });

  it('handles sleep action and undefined tokenId', async () => {
    (useAccount as jest.Mock).mockReturnValue({ isConnected: true });
    (useChainId as jest.Mock).mockReturnValue(16602);
    
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ value: null })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ memories: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ txHash: '0x123', latency: 200 }) // write kv
      })
      .mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true, merkleRoot: '0xabc', latency: 300 }) // archive log
      });

    render(<PlayPage />);
    
    await act(async () => {
      fireEvent.click(screen.getByTestId('mint-button-undefined'));
    });

    await act(async () => {
      fireEvent.click(screen.getByText('Sleep'));
    });

    expect(screen.getByTestId('pet-viewport')).toHaveAttribute('data-action', 'sleep');
    
    // Check state key was 'gochi_state' instead of 'gochi_state_1'
    expect(global.fetch).toHaveBeenCalledWith('/api/kv/write', expect.objectContaining({
      body: expect.stringContaining('"key":"gochi_state"')
    }));
  });
});
