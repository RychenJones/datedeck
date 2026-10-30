import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sampleIdeas from '../data/sample-ideas.json';
import SwipesProvider from '../components/SwipesProvider/SwipesProvider.jsx';
import Liked from './Liked.jsx';

vi.mock('../lib/pocketbase.js', () => ({
  pb: { files: { getURL: vi.fn() } },
}));

describe('Liked', () => {
  beforeEach(() => localStorage.clear());

  it('explains hearts and swiping and offers All Ideas even when signed out', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    window.addEventListener('datedeck:show-all-ideas', navigate);
    render(
      <SwipesProvider>
        <Liked />
      </SwipesProvider>,
    );
    const liked = screen.getByRole('region', { name: 'Liked ideas' });
    expect(within(liked).getByRole('heading', { name: '0 liked ideas' })).toBeVisible();
    expect(within(liked).getByText(/Swipe right in the Deck/)).toBeVisible();
    expect(
      within(liked).queryByRole('heading', { name: sampleIdeas[0].title }),
    ).not.toBeInTheDocument();
    await user.click(within(liked).getByRole('button', { name: 'All Ideas' }));
    expect(navigate).toHaveBeenCalledOnce();
    window.removeEventListener('datedeck:show-all-ideas', navigate);
  });

  it('shows the ideas grid when you are signed in', () => {
    render(
      <SwipesProvider>
        <Liked signedIn />
      </SwipesProvider>,
    );

    expect(screen.getByRole('heading', { name: sampleIdeas[0].title })).toBeInTheDocument();
    expect(screen.queryByText('Sign in to be able to save your ideas.')).not.toBeInTheDocument();
  });

  it('opens idea details from a liked idea card', async () => {
    const user = userEvent.setup();

    render(
      <SwipesProvider>
        <Liked signedIn />
      </SwipesProvider>,
    );

    await user.click(
      screen.getByRole('button', { name: `View details for ${sampleIdeas[0].title}` }),
    );

    expect(screen.getByRole('dialog', { name: sampleIdeas[0].title })).toBeInTheDocument();
  });
});
