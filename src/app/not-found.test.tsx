import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from './not-found';

describe('NotFound Page', () => {
  it('renders the 404 text and Ghost icon', () => {
    const { container } = render(<NotFound />);
    
    // Check for the 404 heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('404');
    expect(heading).toHaveClass('glitch-text');

    // Check for the descriptive text
    expect(screen.getByText(/The entity you are looking for does not exist on the 0G Network/i)).toBeInTheDocument();
    
    // Check for the ghost icon (lucide-react adds the class name matching the icon name generally, but we can check for svg)
    const ghostIcon = container.querySelector('.lucide-ghost');
    expect(ghostIcon).toBeInTheDocument();
  });

  it('renders the return to base link', () => {
    render(<NotFound />);
    
    // Check for the link
    const link = screen.getByRole('link', { name: /RETURN TO BASE/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');

    // Check for the icon inside the link (an svg element)
    const svgIcon = link.querySelector('svg');
    expect(svgIcon).toBeInTheDocument();
  });
});
