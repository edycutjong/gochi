import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingPage from './page';

describe('LandingPage', () => {
  it('renders hero section and calls to action', () => {
    render(<LandingPage />);
    
    expect(screen.getByText('GOCHI')).toBeInTheDocument();
    expect(screen.getByText(/The first on-chain AI virtual pet that lives entirely on the 0G Network/i)).toBeInTheDocument();
    
    const link = screen.getByRole('link', { name: /HATCH YOUR GOCHI/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/play');
  });

  it('renders feature cards', () => {
    render(<LandingPage />);
    
    expect(screen.getByText('Permanent Memory')).toBeInTheDocument();
    expect(screen.getByText('0G Compute AI')).toBeInTheDocument();
    expect(screen.getByText('Real-Time State')).toBeInTheDocument();
  });
});
