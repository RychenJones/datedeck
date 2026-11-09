import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import sampleIdeas from '../data/sample-ideas.json';
import SwipesProvider from '../components/SwipesProvider/SwipesProvider.jsx';
import Liked from './Liked.jsx';

vi.mock('../lib/pocketbase.js', () => ({
  pb: { files: { getURL: vi.fn() } },
}));

function saveInBrowser(saved, done) {
  window.localStorage.setItem('datedeck.swipes', JSON.stringify({ saved, hidden: [], done }));
}

function renderLiked() {
  return render(
    <SwipesProvider>
      <Liked signedIn />
    </SwipesProvider>,
  );
}

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
    expect(screen.getByRole('heading', { name: '1 liked ideas' })).toHaveFocus();
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

  describe('We did this (DD-27)', () => {
    afterEach(() => vi.useRealTimers());

    function doneSection() {
      return screen.getByRole('region', { name: /^Done/ });
    }

    it('shows a We did this button on each liked idea', async () => {
      saveInBrowser([sampleIdeas[0].id, sampleIdeas[1].id]);
      renderLiked();

      expect(
        await screen.findByRole('button', { name: `We did ${sampleIdeas[0].title}` }),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: `We did ${sampleIdeas[1].title}` })).toBeVisible();
    });

    it('moves a done idea to the Done section with the date you marked it', async () => {
      vi.useFakeTimers({ toFake: ['Date'] });
      vi.setSystemTime(new Date(2026, 10, 8, 19, 30));
      const user = userEvent.setup();
      saveInBrowser([sampleIdeas[0].id, sampleIdeas[1].id]);
      renderLiked();

      await user.click(
        await screen.findByRole('button', { name: `We did ${sampleIdeas[0].title}` }),
      );

      expect(screen.queryByRole('heading', { name: sampleIdeas[0].title })).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { name: sampleIdeas[1].title })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '1 liked ideas' })).toHaveFocus();
      const done = within(doneSection());
      expect(done.getByText(sampleIdeas[0].title)).toBeVisible();
      expect(done.getByText('Nov 8, 2026')).toBeVisible();
      const stored = JSON.parse(window.localStorage.getItem('datedeck.swipes'));
      expect(stored.saved).toEqual([sampleIdeas[0].id, sampleIdeas[1].id]);
      expect(Object.keys(stored.done)).toEqual([sampleIdeas[0].id]);
    });

    it('puts an idea back with the ones left to try when you undo its done mark', async () => {
      const user = userEvent.setup();
      saveInBrowser([sampleIdeas[0].id], { [sampleIdeas[0].id]: '2026-11-07T03:00:00.000Z' });
      renderLiked();

      await user.click(
        await within(doneSection()).findByRole('button', {
          name: `Undo done for ${sampleIdeas[0].title}`,
        }),
      );

      expect(
        await screen.findByRole('heading', { name: sampleIdeas[0].title }),
      ).toBeInTheDocument();
      expect(within(doneSection()).queryByText(sampleIdeas[0].title)).not.toBeInTheDocument();
      expect(within(doneSection()).getByRole('heading', { name: /^Done/ })).toHaveFocus();
      expect(JSON.parse(window.localStorage.getItem('datedeck.swipes')).done).toBeUndefined();
    });

    it('keeps done ideas after a reload, newest first', async () => {
      saveInBrowser([sampleIdeas[0].id, sampleIdeas[1].id], {
        [sampleIdeas[0].id]: '2026-10-01T18:00:00.000Z',
        [sampleIdeas[1].id]: '2026-11-02T18:00:00.000Z',
      });
      renderLiked();

      const items = await within(doneSection()).findAllByRole('listitem');
      expect(items[0]).toHaveTextContent(sampleIdeas[1].title);
      expect(items[1]).toHaveTextContent(sampleIdeas[0].title);
      expect(screen.getByRole('heading', { name: '0 liked ideas' })).toBeInTheDocument();
    });

    it('explains what to do once every liked idea is done', async () => {
      saveInBrowser([sampleIdeas[0].id], { [sampleIdeas[0].id]: '2026-11-02T18:00:00.000Z' });
      renderLiked();

      expect(
        await screen.findByRole('heading', { name: 'You did every idea you liked' }),
      ).toBeVisible();
      expect(screen.getByRole('button', { name: 'All Ideas' })).toBeVisible();
    });
  });

  it('has no Hide button', async () => {
    saveInBrowser([sampleIdeas[0].id]);
    renderLiked();

    await screen.findByRole('heading', { name: sampleIdeas[0].title });

    expect(screen.queryByRole('button', { name: /^(Hide|Unhide) / })).not.toBeInTheDocument();
  });
});
