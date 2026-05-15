import React from 'react';
import { render, screen } from '@testing-library/react';
import LandingPage from './page';

describe('LandingPage', () => {
  it('renders hero section and calls to action', () => {
    render(<LandingPage />);
    
    expect(screen.getByText('GOCHI')).toBeInTheDocument();
    expect(screen.getByText(/The first fully autonomous, on-chain virtual pet/i)).toBeInTheDocument();
    
    const link = screen.getByRole('link', { name: /ENTER 0G NETWORK/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/play');
  });

  it('renders feature cards', () => {
    render(<LandingPage />);
    
    expect(screen.getByText('On-Chain Memory')).toBeInTheDocument();
    expect(screen.getByText('0G Compute AI')).toBeInTheDocument();
    expect(screen.getByText('Autonomous')).toBeInTheDocument();
  });
});
