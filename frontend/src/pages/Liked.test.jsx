import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sampleIdeas from '../data/sample-ideas.json';
import SwipesProvider from '../components/SwipesProvider/SwipesProvider.jsx';
import Liked from './Liked.jsx';

vi.mock('../lib/pocketbase.js', () => ({
  pb: { files: { getURL: vi.fn() } },
}));

function saveInBrowser(saved) {
  window.localStorage.setItem('datedeck.swipes', JSON.stringify({ saved, hidden: [] }));
}

function renderLiked() {
  return render(
    <SwipesProvider>
      <Liked signedIn />
    </SwipesProvider>,
  );
}

describe('Liked', () => {
  beforeEach(() => window.localStorage.clear());

  it('shows no ideas and asks you to sign in when you are signed out', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    render(<Liked onSignIn={onSignIn} />);

    expect(screen.getByRole('heading', { name: '0 liked ideas' })).toBeInTheDocument();
    expect(screen.getByText('Sign in to be able to save your ideas.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: sampleIdeas[0].title })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSignIn).toHaveBeenCalledOnce();
  });

  it('shows only the ideas you saved', async () => {
    saveInBrowser([sampleIdeas[0].id]);
    renderLiked();

    expect(await screen.findByRole('heading', { name: sampleIdeas[0].title })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: sampleIdeas[1].title })).not.toBeInTheDocument();
    expect(screen.queryByText('Sign in to be able to save your ideas.')).not.toBeInTheDocument();
  });

  it('removes a liked idea and keeps the others', async () => {
    const user = userEvent.setup();
    saveInBrowser([sampleIdeas[0].id, sampleIdeas[1].id]);
    renderLiked();

    await user.click(
      await screen.findByRole('button', {
        name: `Remove ${sampleIdeas[0].title} from liked ideas`,
      }),
    );

    expect(screen.queryByRole('heading', { name: sampleIdeas[0].title })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: sampleIdeas[1].title })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Date ideas' })).toHaveFocus();
    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes')).saved).toEqual([
      sampleIdeas[1].id,
    ]);
  });

  it('explains what to do once you have removed every liked idea', async () => {
    const user = userEvent.setup();
    saveInBrowser([sampleIdeas[0].id]);
    renderLiked();

    await user.click(await screen.findByRole('button', { name: /^Remove / }));

    expect(screen.getByRole('heading', { name: 'No liked ideas yet' })).toBeInTheDocument();
  });

  it('has no Hide button', async () => {
    saveInBrowser([sampleIdeas[0].id]);
    renderLiked();

    await screen.findByRole('heading', { name: sampleIdeas[0].title });

    expect(screen.queryByRole('button', { name: /^(Hide|Unhide) / })).not.toBeInTheDocument();
  });
});
