import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import DateDeckHeader from './DateDeckHeader.jsx';

describe('DateDeckHeader', () => {
  it('shows Deck, All ideas and Liked in that order with the selected view announced', () => {
    const { rerender } = render(<DateDeckHeader view="deck" />);
    const navigation = screen.getByRole('navigation', { name: 'Date idea views' });
    expect(
      within(navigation)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Deck', 'All ideas', 'Liked']);
    expect(screen.getByRole('button', { name: 'Deck' })).toHaveAttribute('aria-pressed', 'true');
    rerender(<DateDeckHeader view="liked" />);
    expect(screen.getByRole('button', { name: 'Liked' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Deck' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('lets you choose the list and liked views using mouse and keyboard', async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();
    render(<DateDeckHeader onViewChange={onViewChange} />);
    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    expect(onViewChange).toHaveBeenLastCalledWith('browse');
    await user.tab();
    expect(screen.getByRole('button', { name: 'Liked' })).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onViewChange).toHaveBeenLastCalledWith('liked');
  });

  it('offers accessible theme and Add idea controls', async () => {
    const user = userEvent.setup();
    const onThemeToggle = vi.fn();
    const onAddIdea = vi.fn();
    render(
      <DateDeckHeader
        theme="light"
        isAddIdeaOpen
        onThemeToggle={onThemeToggle}
        onAddIdea={onAddIdea}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Switch to dark theme' }));
    expect(onThemeToggle).toHaveBeenCalledOnce();
    const add = screen.getByRole('button', { name: 'Add idea' });
    expect(add).toHaveAttribute('aria-expanded', 'true');
    await user.click(add);
    expect(onAddIdea).toHaveBeenCalledOnce();
  });
});
