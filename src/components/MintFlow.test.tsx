import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MintFlow from './MintFlow';
import { useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { decodeEventLog } from 'viem';

jest.mock('wagmi', () => ({
  useWriteContract: jest.fn(),
  useWaitForTransactionReceipt: jest.fn(),
  useSwitchChain: jest.fn(),
}));

jest.mock('viem', () => ({
  decodeEventLog: jest.fn(),
}));

describe('MintFlow', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.useFakeTimers();
    process.env = { ...ORIGINAL_ENV };
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = ''; // Default for old tests
    (useSwitchChain as jest.Mock).mockReturnValue({ switchChainAsync: jest.fn().mockResolvedValue(undefined) });
  });

  afterEach(() => {
    jest.useRealTimers();
    process.env = ORIGINAL_ENV;
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders correctly in idle state', async () => {
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: jest.fn() });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    render(<MintFlow onMint={jest.fn()} />);
    expect(screen.getByText('MINT YOUR GOCHI')).toBeInTheDocument();
  });

  it('loads saved token ids from gochi_saved_token_ids', () => {
    localStorage.setItem('gochi_saved_token_ids', JSON.stringify([42, 43]));
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: jest.fn() });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });
    
    render(<MintFlow onMint={jest.fn()} />);
    expect(screen.getByText(/#43/)).toBeInTheDocument();
    expect(screen.getByText(/#42/)).toBeInTheDocument();
  });

  it('loads saved token id from fallback gochi_last_token_id', () => {
    localStorage.setItem('gochi_last_token_id', '99');
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: jest.fn() });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });
    
    render(<MintFlow onMint={jest.fn()} />);
    expect(screen.getByText(/#99/)).toBeInTheDocument();
  });

  it('handles invalid JSON in gochi_saved_token_ids gracefully', () => {
    localStorage.setItem('gochi_saved_token_ids', '{invalid-json');
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: jest.fn() });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });
    
    render(<MintFlow onMint={jest.fn()} />);
    expect(screen.getByText('MINT YOUR GOCHI')).toBeInTheDocument();
  });

  it('progresses through minting states and calls onMint without contract address', async () => {
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: jest.fn() });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    const mockOnMint = jest.fn().mockResolvedValue(undefined);
    render(<MintFlow onMint={mockOnMint} />);

    const button = screen.getByRole('button', { name: /MINT YOUR GOCHI/i });
    
    // Click button
    await act(async () => {
      fireEvent.click(button);
    });
    
    expect(screen.getByText('CONFIRMING TX...')).toBeInTheDocument();

    // Advance 2s for hatching state
    await act(async () => {
      await jest.advanceTimersByTimeAsync(2000);
    });
    
    expect(screen.getByText('BORN ON 0G CHAIN')).toBeInTheDocument();

    // Advance 3s for onMint resolution
    await act(async () => {
      jest.advanceTimersByTime(3000);
      await Promise.resolve();
    });

    expect(mockOnMint).toHaveBeenCalledWith(undefined);
  });

  it('handles actual contract minting when address is provided', async () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x123';
    
    const writeContractAsyncMock = jest.fn().mockResolvedValue('0xhash');
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: writeContractAsyncMock });
    
    // We will simulate tx confirmation later
    let receiptMock = { data: null, isSuccess: false };
    (useWaitForTransactionReceipt as jest.Mock).mockImplementation(() => receiptMock);

    (decodeEventLog as jest.Mock).mockReturnValue({ eventName: 'GochiMinted', args: { tokenId: BigInt(42) } });

    const mockOnMint = jest.fn().mockResolvedValue(undefined);
    
    const { rerender } = render(<MintFlow onMint={mockOnMint} />);

    const button = screen.getByRole('button', { name: /MINT YOUR GOCHI/i });
    fireEvent.click(button);

    await act(async () => {
      await Promise.resolve();
    });

    // It should call writeContractAsync
    expect(writeContractAsyncMock).toHaveBeenCalled();

    // Now simulate transaction confirmation
    receiptMock = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { logs: [{ data: '0x0', topics: [] }, { data: '0x1', topics: [] }] } as any,
      isSuccess: true,
    };
    (useWaitForTransactionReceipt as jest.Mock).mockImplementation(() => receiptMock);
    
    // Also simulate that decodeEventLog throws for the first log and succeeds for the second
    (decodeEventLog as jest.Mock)
      .mockImplementationOnce(() => { throw new Error('Not the right log'); })
      .mockImplementationOnce(() => ({ eventName: 'GochiMinted', args: { tokenId: BigInt(42) } }));

    // Re-render to trigger useEffect
    rerender(<MintFlow onMint={mockOnMint} />);

    // Advance setTimeout inside useEffect
    await act(async () => {
      jest.advanceTimersByTime(0); // for setStage('hatching')
    });
    expect(screen.getByText('BORN ON 0G CHAIN')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(3000); // for hatchDelay
    });

    expect(mockOnMint).toHaveBeenCalledWith(42);
  });

  it('handles error during contract minting', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x123';
    
    const writeContractAsyncMock = jest.fn().mockRejectedValue(new Error('User rejected request'));
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: writeContractAsyncMock });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    const mockOnMint = jest.fn().mockResolvedValue(undefined);
    render(<MintFlow onMint={mockOnMint} />);

    const button = screen.getByRole('button', { name: /MINT YOUR GOCHI/i });
    fireEvent.click(button);

    // Wait for the async error to be caught
    await act(async () => {
      // flush microtasks
    });

    expect(screen.getByText('User rejected request')).toBeInTheDocument();
    expect(screen.getByText('MINT YOUR GOCHI')).toBeInTheDocument(); // button resets
    consoleSpy.mockRestore();
  });

  it('handles error with shortMessage during contract minting', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x123';
    
    const err = new Error('Full error message') as Error & { shortMessage?: string };
    err.shortMessage = 'Short error message';
    const writeContractAsyncMock = jest.fn().mockRejectedValue(err);
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: writeContractAsyncMock });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    const mockOnMint = jest.fn().mockResolvedValue(undefined);
    render(<MintFlow onMint={mockOnMint} />);

    fireEvent.click(screen.getByRole('button', { name: /MINT YOUR GOCHI/i }));

    await act(async () => {
      // flush microtasks
    });

    expect(screen.getByText('Short error message')).toBeInTheDocument();
    expect(screen.getByText('MINT YOUR GOCHI')).toBeInTheDocument(); // button resets
    consoleSpy.mockRestore();
  });

  it('handles error with docs URL during contract minting', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x123';
    
    const err = new Error('Reverted error\nDocs: https://viem.sh/errors/404');
    const writeContractAsyncMock = jest.fn().mockRejectedValue(err);
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: writeContractAsyncMock });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    const mockOnMint = jest.fn().mockResolvedValue(undefined);
    render(<MintFlow onMint={mockOnMint} />);

    fireEvent.click(screen.getByRole('button', { name: /MINT YOUR GOCHI/i }));

    await act(async () => {
      // flush microtasks
    });

    const docLink = screen.getByText('Docs');
    expect(docLink).toBeInTheDocument();
    expect(docLink).toHaveAttribute('href', 'https://viem.sh/errors/404');
    
    consoleSpy.mockRestore();
  });

  it('handles non-Error during contract minting', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x123';
    
    const writeContractAsyncMock = jest.fn().mockRejectedValue('String error, not an Error object');
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: writeContractAsyncMock });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    const mockOnMint = jest.fn().mockResolvedValue(undefined);
    render(<MintFlow onMint={mockOnMint} />);

    fireEvent.click(screen.getByRole('button', { name: /MINT YOUR GOCHI/i }));

    await act(async () => {
      // flush microtasks
    });

    expect(screen.getByText('Transaction failed')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('handles clicking the egg in idle state to trigger animation', () => {
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: jest.fn() });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    const { container } = render(<MintFlow onMint={jest.fn()} />);

    // In 'idle', we have an egg-like shape
    const eggIcon = container.querySelector('.lucide-egg') as HTMLElement;
    
    expect(eggIcon).toHaveClass('animate-breathe');
    
    fireEvent.click(eggIcon);
    
    // Should change animation momentarily
    expect(eggIcon).toHaveClass('scale-125');
    expect(eggIcon).toHaveClass('-rotate-12');
    
    // Fast forward timer to reset animation
    act(() => {
      jest.advanceTimersByTime(500);
    });
    
    // Should revert back to breathe animation
    expect(eggIcon).toHaveClass('animate-breathe');
  });

  it('handles keyboard navigation using ArrowLeft and ArrowRight', () => {
    // Need multiple options to test navigation, so we populate localstorage
    localStorage.setItem('gochi_last_token_id', '99');
    
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: jest.fn() });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    const mockOnMint = jest.fn().mockResolvedValue(undefined);
    render(<MintFlow onMint={mockOnMint} />);

    // By default selectedIndex is 1 when there are multiple options (New + Resume)
    expect(screen.getByRole('button', { name: /MINT YOUR GOCHI/i })).toBeInTheDocument();
    const resumeButton = screen.getByRole('button', { name: /Gochi #99.*AWAKEN/i });

    expect(resumeButton).toBeInTheDocument();
    
    // Press ArrowLeft
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    
    // Press ArrowRight
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    // Press ArrowRight again (should not go beyond options.length - 1)
    fireEvent.keyDown(window, { key: 'ArrowRight' });
  });

  it('loads a saved token id via localStorage and allows resuming', () => {
    localStorage.setItem('gochi_last_token_id', '99');
    
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: jest.fn() });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    const mockOnMint = jest.fn();
    render(<MintFlow onMint={mockOnMint} />);

    const resumeBtn = screen.getByRole('button', { name: /Gochi #99/i });
    expect(resumeBtn).toBeInTheDocument();

    fireEvent.click(resumeBtn);
    expect(mockOnMint).toHaveBeenCalledWith(99);

    localStorage.removeItem('gochi_last_token_id');
  });

  it('allows user to load token ID from input', () => {
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: jest.fn() });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    const mockOnMint = jest.fn();
    render(<MintFlow onMint={mockOnMint} />);

    const input = screen.getByPlaceholderText('Token ID');
    fireEvent.change(input, { target: { value: '42' } });

    const loadBtn = screen.getByRole('button', { name: /LOAD/i });
    fireEvent.click(loadBtn);

    expect(localStorage.getItem('gochi_last_token_id')).toBe('42');
    expect(mockOnMint).toHaveBeenCalledWith(42);
  });
});
