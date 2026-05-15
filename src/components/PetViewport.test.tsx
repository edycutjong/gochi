import React from 'react';
import { render, act } from '@testing-library/react';
import PetViewport from './PetViewport';

jest.useFakeTimers();

describe('PetViewport', () => {
  it('renders idle state correctly', () => {
    const { container } = render(<PetViewport action="idle" />);
    expect(container.querySelector('.text-\\[var\\(--gochi-cyan\\)\\]')).toBeInTheDocument();
  });

  it('renders play state correctly', () => {
    const { container } = render(<PetViewport action="play" />);
    expect(container.querySelector('.animate-bounce')).toBeInTheDocument();
    expect(container.querySelector('.text-\\[\\#67e8f9\\]')).toBeInTheDocument();
  });

  it('renders sleep state correctly', () => {
    const { container } = render(<PetViewport action="sleep" />);
    expect(container.querySelector('.animate-pulse.text-\\[var\\(--gochi-purple\\)\\]')).toBeInTheDocument();
    expect(container.querySelector('.text-\\[\\#d8b4fe\\]')).toBeInTheDocument();
  });

  it('renders feed state correctly', () => {
    const { container } = render(<PetViewport action="feed" />);
    expect(container.querySelector('.text-\\[\\#fca5a5\\]')).toBeInTheDocument();
    expect(container.querySelector('.scale-110')).toBeInTheDocument();
  });

  it('updates frame on interval', () => {
    const { container } = render(<PetViewport action="idle" />);
    
    // Initial frame (0) -> frame % 2 === 0
    expect(container.querySelector('.scale-y-95')).toBeInTheDocument();

    // Advance 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });
    // Frame (1) -> frame % 2 !== 0
    expect(container.querySelector('.scale-y-95')).not.toBeInTheDocument();

    // Advance 500ms
    act(() => {
      jest.advanceTimersByTime(500);
    });
    // Frame (2) -> frame % 2 === 0
    expect(container.querySelector('.scale-y-95')).toBeInTheDocument();
  });

  it('clears interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const { unmount } = render(<PetViewport />);
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });
});
