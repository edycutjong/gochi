import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MintFlow from './MintFlow';

describe('MintFlow', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly in idle state', () => {
    render(<MintFlow onMint={jest.fn()} />);
    expect(screen.getByText('MINT YOUR GOCHI')).toBeInTheDocument();
  });

  it('progresses through minting states and calls onMint', async () => {
    const mockOnMint = jest.fn().mockResolvedValue(undefined);
    render(<MintFlow onMint={mockOnMint} />);

    const button = screen.getByRole('button', { name: /MINT YOUR GOCHI/i });
    
    // Click button
    fireEvent.click(button);
    
    expect(screen.getByText('CONFIRMING TX...')).toBeInTheDocument();
    expect(button).toBeDisabled();

    // Advance 2s for hatching state
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(screen.getByText('HATCHING...')).toBeInTheDocument();

    // Advance 2s for onMint resolution
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockOnMint).toHaveBeenCalled();
  });
});
