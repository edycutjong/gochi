import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ActionButtons from './ActionButtons';

describe('ActionButtons', () => {
  it('renders all three action buttons', () => {
    render(<ActionButtons onAction={jest.fn()} />);
    expect(screen.getByRole('button', { name: /feed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sleep/i })).toBeInTheDocument();
  });

  it('calls onAction with the correct action and disables buttons while loading', async () => {
    let resolveAction: (value: void) => void = () => {};
    const mockOnAction = jest.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        resolveAction = resolve;
      })
    );

    render(<ActionButtons onAction={mockOnAction} />);
    
    const feedButton = screen.getByRole('button', { name: /feed/i });
    const playButton = screen.getByRole('button', { name: /play/i });
    const sleepButton = screen.getByRole('button', { name: /sleep/i });

    expect(feedButton).not.toBeDisabled();
    
    fireEvent.click(feedButton);
    expect(mockOnAction).toHaveBeenCalledWith('feed');
    
    // All buttons should be disabled during loading
    expect(feedButton).toBeDisabled();
    expect(playButton).toBeDisabled();
    expect(sleepButton).toBeDisabled();

    // Re-enable after resolving
    resolveAction();
    await waitFor(() => {
      expect(feedButton).not.toBeDisabled();
      expect(playButton).not.toBeDisabled();
      expect(sleepButton).not.toBeDisabled();
    });
  });

  it('shows loading state text for the clicked button', async () => {
    let resolveAction: (value: void) => void = () => {};
    const mockOnAction = jest.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        resolveAction = resolve;
      })
    );

    render(<ActionButtons onAction={mockOnAction} />);
    
    const playButton = screen.getByRole('button', { name: /play/i });
    fireEvent.click(playButton);

    expect(screen.getByText('...')).toBeInTheDocument(); // Loading text

    resolveAction();
    await waitFor(() => {
      expect(screen.queryByText('...')).not.toBeInTheDocument();
    });
  });
});
