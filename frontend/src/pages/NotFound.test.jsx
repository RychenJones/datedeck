import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import sampleIdeas from '../data/sample-ideas.json';
import { pb } from '../lib/pocketbase.js';

vi.mock('../lib/pocketbase.js', () => ({
  pb: {
    authStore: { isValid: false, record: null, onChange: () => () => {}, clear: () => {} },
    collection: vi.fn(),
    filter: vi.fn(),
    files: { getURL: vi.fn() },
  },
}));

const collection = {
  getList: vi.fn(async (page, perPage) => ({
    page,
    perPage,
    totalItems: sampleIdeas.length,
    totalPages: 1,
    items: sampleIdeas,
  })),
  getFullList: vi.fn(async () => sampleIdeas),
};

function visit(path) {
  window.history.pushState({}, '', path);
}

describe('Not found screen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    pb.collection.mockReturnValue(collection);
  });

  afterEach(() => {
    visit('/');
  });

  it('shows Not found with a way back to the deck for an unknown link', () => {
    visit('/ideas/does-not-exist');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to the deck' })).toHaveAttribute('href', '/');
    expect(screen.queryByRole('region', { name: 'Date idea deck' })).not.toBeInTheDocument();
    // An unknown link has nothing to load, so it does not ask PocketBase.
    expect(collection.getList).not.toHaveBeenCalled();
  });

  it('gives the page a title that says it was not found', () => {
    visit('/nope');
    render(<App />);

    expect(document.title).toBe('Page not found · DateDeck');
  });

  it('shows the deck for the home link', async () => {
    visit('/');
    render(<App />);

    expect(screen.getByRole('region', { name: 'Date idea deck' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Page not found' })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Picnic at Porter Park' })).toBeVisible();
  });

  it('shows the deck for /index.html and for a link with a search or a #hash', () => {
    for (const path of ['/index.html', '/?utm_source=flyer', '/#date-ideas']) {
      visit(path);
      const { unmount } = render(<App />);
      expect(screen.getByRole('region', { name: 'Date idea deck' })).toBeInTheDocument();
      unmount();
    }
  });
});
