/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatPanel from './ChatPanel';

describe('ChatPanel', () => {
  const mockState = { hunger: 50, mood: 50, energy: 50 };
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: async () => ({ reply: 'I am a test reply', latency: 123 }),
    } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders initial message', () => {
    render(<ChatPanel state={mockState} />);
    expect(screen.getByText("Beep boop! I'm online.")).toBeInTheDocument();
  });

  it('allows user to send a message and displays response', async () => {
    const mockOnLatency = jest.fn();
    render(<ChatPanel state={mockState} onLatency={mockOnLatency} />);

    const input = screen.getByPlaceholderText('Talk to your Gochi...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    // Message should be added to the UI
    expect(screen.getByText('Hello')).toBeInTheDocument();

    // Verify fetch was called correctly
    expect(fetchSpy).toHaveBeenCalledWith('/api/chat', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ message: 'Hello', state: mockState }),
    }));

    // Wait for the bot response
    await waitFor(() => {
      expect(screen.getByText('I am a test reply')).toBeInTheDocument();
    });

    expect(mockOnLatency).toHaveBeenCalledWith(123);
  });

  it('does not send empty messages', () => {
    render(<ChatPanel state={mockState} />);
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();

    const input = screen.getByPlaceholderText('Talk to your Gochi...');
    fireEvent.change(input, { target: { value: '   ' } });
    
    fireEvent.click(sendButton);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('handles API errors gracefully', async () => {
    // Console error is expected here
    jest.spyOn(console, 'error').mockImplementation(() => {});
    fetchSpy.mockRejectedValue(new Error('Network error'));

    render(<ChatPanel state={mockState} />);

    const input = screen.getByPlaceholderText('Talk to your Gochi...');
    const sendButton = screen.getByRole('button', { name: /send/i });

    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      // Input should be cleared and typing state reset
      expect(input).toHaveValue('');
    });
  });
});
