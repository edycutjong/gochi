import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import PetViewport from './PetViewport';

jest.useFakeTimers();

describe('PetViewport', () => {
  it('renders idle state correctly', () => {
    const { container } = render(<PetViewport action="idle" />);
    // idle color is #06b6d4 (unless stats are low, which defaults to 70 avg)
    const petChar = container.querySelector('.lucide-ghost')?.parentElement;
    expect(petChar).toHaveStyle('color: #06b6d4');
  });

  it('renders play state correctly', () => {
    const { container } = render(<PetViewport action="play" />);
    expect(container.querySelector('.animate-bounce')).toBeInTheDocument();
    const petChar = container.querySelector('.lucide-ghost')?.parentElement;
    expect(petChar).toHaveStyle('color: #06b6d4');
  });

  it('renders sleep state correctly', () => {
    const { container } = render(<PetViewport action="sleep" />);
    expect(container.querySelector('.lucide-moon')).toBeInTheDocument();
    const petChar = container.querySelector('.lucide-ghost')?.parentElement;
    expect(petChar).toHaveStyle('color: #d8b4fe');
  });

  it('renders feed state correctly', () => {
    const { container } = render(<PetViewport action="feed" />);
    const petChar = container.querySelector('.lucide-ghost')?.parentElement;
    expect(petChar).toHaveStyle('color: #fca5a5');
    expect(petChar).toHaveClass('scale-110');
  });

  it('renders critical state correctly', () => {
    const { container } = render(
      <PetViewport 
        stats={{ hunger: 10, mood: 10, energy: 10 }} 
        action="idle" 
      />
    );
    // The container should have the red border class when critical
    expect(container.firstChild).toHaveClass('border-gochi-red');
    // It should also display the critical warning
    expect(container.textContent).toContain('NEEDS ATTENTION');
  });

  it('renders amber state correctly when avgStat is < 50', () => {
    const { container } = render(
      <PetViewport 
        stats={{ hunger: 40, mood: 40, energy: 40 }} 
        action="idle" 
      />
    );
    const petChar = container.querySelector('.lucide-ghost')?.parentElement;
    expect(petChar).toHaveStyle('color: #f59e0b');
  });

  it('handles pet click animation', () => {
    const { container } = render(<PetViewport action="idle" />);
    const petChar = container.querySelector('.lucide-ghost')?.parentElement;
    
    fireEvent.click(petChar!);
    expect(petChar).toHaveClass('scale-125');

    act(() => {
      jest.advanceTimersByTime(400);
    });

    expect(petChar).not.toHaveClass('scale-125');
  });

  it('handles viewport click to focus chat input', () => {
    const focusSpy = jest.fn();
    const mockInput = document.createElement('input');
    mockInput.id = 'chat-input';
    mockInput.focus = focusSpy;
    document.body.appendChild(mockInput);

    const { container } = render(<PetViewport action="idle" />);
    fireEvent.click(container.firstChild as HTMLElement);

    expect(focusSpy).toHaveBeenCalled();
    document.body.removeChild(mockInput);
  });
});
