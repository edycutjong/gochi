import React from 'react';
import { render, screen, act } from '@testing-library/react';
import StatBars from './StatBars';

describe('StatBars', () => {
  const defaultStats = {
    hunger: 70,
    mood: 80,
    energy: 60,
  };

  it('renders all stat labels correctly', () => {
    render(<StatBars stats={defaultStats} />);
    expect(screen.getByText('Hunger')).toBeInTheDocument();
    expect(screen.getByText('Mood')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
  });

  it('renders current values', () => {
    render(<StatBars stats={defaultStats} />);
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it('applies danger styling when stats are low', () => {
    const lowStats = {
      hunger: 20, // < 30
      mood: 10,
      energy: 10, // < 20 (Critical)
    };
    const { container } = render(<StatBars stats={lowStats} />);
    
    // Hunger bar chunks should have 'bg-gochi-red'
    expect(container.querySelectorAll('[class*="bg-gochi-red"]').length).toBeGreaterThan(0);
    
    // Energy bar chunks are critical, so they will be 'bg-gochi-red' and 'animate-pulse'
    expect(container.querySelectorAll('[class*="bg-gochi-red"][class*="animate-pulse"]').length).toBeGreaterThan(0);
  });

  it('applies normal styling when stats are high', () => {
    const highStats = {
      hunger: 90,
      mood: 90,
      energy: 90,
    };
    const { container } = render(<StatBars stats={highStats} />);
    
    // Hunger bar chunks should have 'bg-gochi-green'
    expect(container.querySelectorAll('[class*="bg-gochi-green"]').length).toBeGreaterThan(0);
    
    // Energy bar chunks should have 'bg-gochi-purple'
    expect(container.querySelectorAll('[class*="bg-gochi-purple"]').length).toBeGreaterThan(0);
  });

  it('displays stat deltas when stats change', async () => {
    jest.useFakeTimers();
    const { rerender } = render(<StatBars stats={defaultStats} />);
    
    // Change stats to trigger delta
    rerender(<StatBars stats={{ hunger: 80, mood: 70, energy: 50 }} />);
    
    act(() => {
      jest.advanceTimersByTime(0);
    });

    // Should show +10 for hunger and -10 for mood/energy
    expect(screen.getByText('+10')).toBeInTheDocument();
    expect(screen.getAllByText('-10').length).toBe(2);
    
    // Wait for timeout to clear deltas
    act(() => {
      jest.advanceTimersByTime(1500);
    });
    
    expect(screen.queryByText('+10')).not.toBeInTheDocument();
    expect(screen.queryByText('-10')).not.toBeInTheDocument();
    
    jest.useRealTimers();
  });
});
