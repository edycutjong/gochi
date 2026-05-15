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

  it('shows loading state text for all buttons', async () => {
    let resolveAction: (value: void) => void = () => {};
    const mockOnAction = jest.fn().mockReturnValue(
      new Promise<void>((resolve) => {
        resolveAction = resolve;
      })
    );

    const { container } = render(<ActionButtons onAction={mockOnAction} />);
    
    // Play
    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(container.querySelector('.lucide-loader-circle')).toBeInTheDocument();
    resolveAction();
    await waitFor(() => expect(container.querySelector('.lucide-loader-circle')).not.toBeInTheDocument());

    // Feed
    mockOnAction.mockReturnValue(new Promise<void>((resolve) => { resolveAction = resolve; }));
    fireEvent.click(screen.getByRole('button', { name: /feed/i }));
    expect(container.querySelector('.lucide-loader-circle')).toBeInTheDocument();
    resolveAction();
    await waitFor(() => expect(container.querySelector('.lucide-loader-circle')).not.toBeInTheDocument());

    // Sleep
    mockOnAction.mockReturnValue(new Promise<void>((resolve) => { resolveAction = resolve; }));
    fireEvent.click(screen.getByRole('button', { name: /sleep/i }));
    expect(container.querySelector('.lucide-loader-circle')).toBeInTheDocument();
    resolveAction();
    await waitFor(() => expect(container.querySelector('.lucide-loader-circle')).not.toBeInTheDocument());
  });
});
