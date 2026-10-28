import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { pb } from '../lib/pocketbase.js';
import sampleIdeas from '../data/sample-ideas.json';

vi.mock('../lib/pocketbase.js', () => ({
  pb: {
    authStore: { isValid: false, record: null, onChange: () => () => {} },
    collection: vi.fn(),
    filter: vi.fn((query) => query),
    files: { getURL: vi.fn(() => 'https://example.com/park.jpg') },
  },
}));
const idea = {
  ...sampleIdeas[0],
  id: 'database-idea',
  title: 'A picnic from PocketBase',
  photo: 'park.jpg',
};
beforeEach(() => {
  localStorage.clear();
  pb.collection.mockReturnValue({
    getList: vi.fn().mockResolvedValue({ items: [idea], totalItems: 1, totalPages: 1, page: 1 }),
    getFullList: vi.fn().mockResolvedValue([idea]),
  });
});

it('keeps hearts, the liked grid, and the sidebar together without deleting the idea', async () => {
  const user = userEvent.setup();
  render(<App />);
  await user.click(screen.getByRole('button', { name: 'All ideas' }));
  const grid = await screen.findByRole('region', { name: 'Date ideas' });
  const heart = await within(grid).findByRole('button', {
    name: `Save ${idea.title}`,
    exact: true,
  });
  expect(heart).toHaveAttribute('aria-pressed', 'false');
  await user.click(heart);
  expect(heart).toHaveAttribute('aria-pressed', 'true');
  await user.click(screen.getByRole('button', { name: 'Liked', exact: true }));
  const liked = await screen.findByRole('region', { name: 'Liked ideas' });
  expect(await within(liked).findByRole('img', { name: idea.title })).toHaveAttribute(
    'src',
    'https://example.com/park.jpg',
  );
  expect(within(liked).getByText(idea.location)).toBeVisible();
  expect(within(liked).getByText('Free')).toBeVisible();
  await user.click(within(liked).getByRole('button', { name: `Save ${idea.title}` }));
  expect(screen.getByRole('heading', { name: '0 liked ideas' })).toBeVisible();
  expect(screen.getByRole('heading', { name: '0 liked ideas' })).toHaveFocus();
  expect(
    within(screen.getByRole('complementary', { name: 'Saved for later' })).queryByText(idea.title),
  ).not.toBeInTheDocument();
  await user.click(within(liked).getByRole('button', { name: 'All Ideas' }));
  expect(screen.getByRole('button', { name: 'All ideas' })).toHaveFocus();
  const newGrid = await screen.findByRole('region', { name: 'Date ideas' });
  await user.click(await within(newGrid).findByRole('button', { name: `Save ${idea.title}` }));
  const sidebar = screen.getByRole('complementary', { name: 'Saved for later' });
  await user.click(await within(sidebar).findByRole('button', { name: `Unlike ${idea.title}` }));
  expect(within(newGrid).getByRole('button', { name: `Save ${idea.title}` })).toHaveAttribute(
    'aria-pressed',
    'false',
  );
  expect(within(newGrid).getByRole('heading', { name: idea.title })).toBeVisible();
});

it('brings a hidden idea back to the deck with the keyboard', async () => {
  localStorage.setItem(
    'datedeck.swipes',
    JSON.stringify({ saved: [], hidden: [idea.id], version: 3 }),
  );
  const user = userEvent.setup();
  render(<App />);
  const button = await screen.findByRole('button', { name: `Bring back ${idea.title}` });
  button.focus();
  await user.keyboard('{Enter}');
  const deck = screen.getByRole('region', { name: 'Date idea deck' });
  expect(await within(deck).findByRole('heading', { name: idea.title })).toBeVisible();
  await waitFor(() =>
    expect(JSON.parse(localStorage.getItem('datedeck.swipes'))).toEqual({
      saved: [],
      hidden: [],
      version: 3,
    }),
  );
});

it('explains unreadable storage and preserves the original value', async () => {
  localStorage.setItem('datedeck.swipes', 'broken data');
  render(<App />);
  expect(screen.getByRole('alert')).toHaveTextContent(/could not read/i);
  expect(localStorage.getItem('datedeck.swipes')).toBe('broken data');
});
