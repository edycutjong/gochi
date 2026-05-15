import React from 'react';
import { render, screen } from '@testing-library/react';
import MemoryLog from './MemoryLog';

describe('MemoryLog', () => {
  it('renders correctly with no memories', () => {
    render(<MemoryLog memories={[]} />);
    
    expect(screen.getByText('Core Memories')).toBeInTheDocument();
    expect(screen.getByText(/No memories yet/i)).toBeInTheDocument();
  });

  it('renders correct values when memories are provided', () => {
    const memories = [
      { id: '1', type: 'FEED', title: 'Fed Apple', time: '12:00 PM', merkleRoot: '0xabc123', txHash: '0xdef456' },
      { id: '2', type: 'PLAY', title: 'Played ball', time: '12:15 PM', merkleRoot: '', txHash: '0xghi789' },
      { id: '3', type: 'SLEEP', title: 'Took a nap', time: '01:00 PM', merkleRoot: '0xjkl012', txHash: '0xmno345' },
      { id: '4', type: 'UNKNOWN', title: 'Unknown action', time: '02:00 PM', merkleRoot: '0xpqr678', txHash: '0xstu901' },
    ];
    
    render(<MemoryLog memories={memories} />);

    expect(screen.getByText('Fed Apple')).toBeInTheDocument();
    expect(screen.getByText('Played ball')).toBeInTheDocument();
    expect(screen.getByText('Took a nap')).toBeInTheDocument();
    
    expect(screen.getByText('0xabc123…')).toBeInTheDocument();
    expect(screen.getByText('pending…')).toBeInTheDocument(); // Missing merkleRoot
    
    // Links
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
    expect(links[0]).toHaveAttribute('href', 'https://storagescan.0g.ai');
  });
});
