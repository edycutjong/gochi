import React from 'react';
import { render, screen } from '@testing-library/react';
import LatencyMonitor from './LatencyMonitor';

describe('LatencyMonitor', () => {
  it('renders correctly with null latencies', () => {
    const latencies = { kvRead: null, kvWrite: null, log: null, ai: null };
    render(<LatencyMonitor latencies={latencies} />);
    
    expect(screen.getByText('0G Network Latency')).toBeInTheDocument();
    
    const doubleDashes = screen.getAllByText('--');
    expect(doubleDashes).toHaveLength(4); // One for each metric
  });

  it('renders correct values when latencies are provided', () => {
    const latencies = { kvRead: 15, kvWrite: 45, log: 850, ai: null };
    render(<LatencyMonitor latencies={latencies} />);

    expect(screen.getByText('15ms')).toBeInTheDocument();
    expect(screen.getByText('15ms')).toHaveClass('text-[var(--gochi-green)]'); // < 20

    expect(screen.getByText('45ms')).toBeInTheDocument();
    expect(screen.getByText('45ms')).toHaveClass('text-[var(--gochi-amber)]'); // 20 <= val < 50

    expect(screen.getByText('850ms')).toBeInTheDocument();
    expect(screen.getByText('850ms')).toHaveClass('text-[var(--gochi-red)]'); // >= 800

    expect(screen.getByText('--')).toBeInTheDocument(); // For ai
    expect(screen.getByText('--')).toHaveClass('text-[var(--gochi-muted)]');
  });
});
