import React from 'react';
import { render, screen } from '@testing-library/react';
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
      energy: 10, // < 20
    };
    const { container } = render(<StatBars stats={lowStats} />);
    
    // Hunger bar chunks should have 'bg-gochi-red'
    expect(container.querySelectorAll('.bg-gochi-red').length).toBeGreaterThan(0);
    
    // Energy bar chunks should have 'animate-pulse' and 'bg-gochi-amber'
    expect(container.querySelectorAll('.bg-gochi-amber.animate-pulse').length).toBeGreaterThan(0);
  });

  it('applies normal styling when stats are high', () => {
    const highStats = {
      hunger: 90,
      mood: 90,
      energy: 90,
    };
    const { container } = render(<StatBars stats={highStats} />);
    
    // Hunger bar chunks should have 'bg-gochi-green'
    expect(container.querySelectorAll('.bg-gochi-green').length).toBeGreaterThan(0);
    
    // Energy bar chunks should have 'bg-gochi-pixel'
    expect(container.querySelectorAll('.bg-gochi-pixel').length).toBeGreaterThan(0);
  });
});
