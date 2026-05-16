import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MintFlow from './MintFlow';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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
    const { useSwitchChain } = require('wagmi');
    useSwitchChain.mockReturnValue({ switchChainAsync: jest.fn().mockResolvedValue(undefined) });
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

  it('progresses through minting states and calls onMint without contract address', async () => {
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: jest.fn() });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    const mockOnMint = jest.fn().mockResolvedValue(undefined);
    render(<MintFlow onMint={mockOnMint} />);

    const button = screen.getByRole('button', { name: /MINT YOUR GOCHI/i });
    
    // Click button
    fireEvent.click(button);
    
    expect(screen.getByText('CONFIRMING TX...')).toBeInTheDocument();

    // Advance 2s for hatching state
    await act(async () => {
      await Promise.resolve(); // flush microtasks for switchChainAsync
      jest.advanceTimersByTime(2000);
      await Promise.resolve(); // flush microtasks for setTimeout resolve
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
  });

  it('handles non-Error during contract minting', async () => {
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS = '0x123';
    
    const writeContractAsyncMock = jest.fn().mockRejectedValue('String Error');
    (useWriteContract as jest.Mock).mockReturnValue({ writeContractAsync: writeContractAsyncMock });
    (useWaitForTransactionReceipt as jest.Mock).mockReturnValue({ data: null, isSuccess: false });

    const mockOnMint = jest.fn().mockResolvedValue(undefined);
    render(<MintFlow onMint={mockOnMint} />);

    const button = screen.getByRole('button', { name: /MINT YOUR GOCHI/i });
    fireEvent.click(button);

    await act(async () => {
      // flush microtasks
    });

    expect(screen.getByText('Transaction failed')).toBeInTheDocument();
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
