import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import sampleIdeas from '../data/sample-ideas.json';
import { PAGE_SIZE } from '../hooks/useIdeas.js';
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
  getList: vi.fn(),
  create: vi.fn(),
};

// Answers getList like PocketBase does, from a list of ideas.
function serve(allIdeas) {
  collection.getList.mockImplementation(async (page, perPage) => ({
    page,
    perPage,
    totalItems: allIdeas.length,
    totalPages: Math.ceil(allIdeas.length / perPage),
    items: allIdeas.slice((page - 1) * perPage, page * perPage),
  }));
}

async function topIdeaTitle() {
  const deck = screen.getByRole('region', { name: 'Date idea deck' });
  const title = await within(deck).findByRole('heading', { level: 2, name: /^(?!Loading)/ });
  return title.textContent;
}

describe('Home deck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    pb.collection.mockReturnValue(collection);
    serve(sampleIdeas);
  });

  it('shows a loading message while the ideas load', async () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Loading ideas' })).toBeInTheDocument();
    expect(await topIdeaTitle()).toBe('Picnic at Porter Park');
  });

  it('shows the top idea from PocketBase with two cards stacked behind it and how many are left', async () => {
    const { container } = render(<App />);

    expect(await topIdeaTitle()).toBe('Picnic at Porter Park');
    expect(container.querySelectorAll('.deck__behind')).toHaveLength(2);
    expect(screen.getByText('5 ideas left')).toBeInTheDocument();
    expect(collection.getList).toHaveBeenCalledWith(1, PAGE_SIZE, {
      filter: '',
      sort: '-created,id',
      requestKey: null,
    });
  });

  it('moves to the next idea when you save one', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Save Picnic at Porter Park' }));

    expect(await topIdeaTitle()).toBe('Sunset at the sand dunes');
    expect(screen.getByText('4 ideas left')).toBeInTheDocument();
  });

  it('moves to the next idea when you hide one', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Hide Picnic at Porter Park' }));

    expect(await topIdeaTitle()).toBe('Sunset at the sand dunes');
    expect(screen.getByText('4 ideas left')).toBeInTheDocument();
  });

  it('remembers saved and hidden ideas after a reload', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Save Picnic at Porter Park' }));
    await user.click(await screen.findByRole('button', { name: 'Hide Sunset at the sand dunes' }));
    unmount();
    render(<App />);

    expect(await topIdeaTitle()).toBe('Hike the Menan Buttes');
    expect(screen.getByText('3 ideas left')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes'))).toEqual({
      saved: ['sample-1'],
      hidden: ['sample-2'],
    });
  });

  it('keeps your choices when you switch tabs and come back', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Hide Picnic at Porter Park' }));
    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    await user.click(screen.getByRole('button', { name: 'Deck' }));

    expect(await topIdeaTitle()).toBe('Sunset at the sand dunes');
  });

  it('loads more ideas before the deck runs out', async () => {
    const manyIdeas = Array.from({ length: PAGE_SIZE + 2 }, (_, index) => ({
      ...sampleIdeas[0],
      id: `idea-${index + 1}`,
      title: `Idea ${index + 1}`,
    }));
    serve(manyIdeas);
    // Every idea on the first page but the last one is already hidden.
    window.localStorage.setItem(
      'datedeck.swipes',
      JSON.stringify({
        saved: [],
        hidden: manyIdeas.slice(0, PAGE_SIZE - 1).map((idea) => idea.id),
      }),
    );
    const { container } = render(<App />);

    expect(await topIdeaTitle()).toBe(`Idea ${PAGE_SIZE}`);
    expect(screen.getByText('3 ideas left')).toBeInTheDocument();
    await waitFor(() => expect(container.querySelectorAll('.deck__behind')).toHaveLength(2));
    expect(collection.getList).toHaveBeenCalledWith(2, PAGE_SIZE, expect.any(Object));
    expect(screen.getByText('3 ideas left')).toBeInTheDocument();
  });

  it('shows every idea in a grid when you open the All ideas tab', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));

    const grid = await screen.findByRole('region', { name: 'Date ideas' });
    expect(within(grid).getAllByRole('heading', { level: 2 })).toHaveLength(5);
    expect(screen.queryByRole('region', { name: 'Date idea deck' })).not.toBeInTheDocument();
  });

  it('shows sample and PocketBase ideas together in the All ideas grid', async () => {
    serve([{ ...sampleIdeas[0], id: 'database-1', title: 'Database date' }]);
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));

    const grid = await screen.findByRole('region', { name: 'Date ideas' });
    expect(within(grid).getByRole('heading', { name: 'Database date' })).toBeInTheDocument();
    expect(
      within(grid).getByRole('heading', { name: 'Picnic at Porter Park' }),
    ).toBeInTheDocument();
  });

  it('shows sample ideas in the All ideas grid when PocketBase is unavailable', async () => {
    collection.getList.mockRejectedValue(new Error('PocketBase is unavailable'));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));

    const grid = await screen.findByRole('region', { name: 'Date ideas' });
    expect(
      within(grid).getByRole('heading', { name: 'Picnic at Porter Park' }),
    ).toBeInTheDocument();
  });

  it('opens the selected idea details from the All ideas grid', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    await user.click(
      await screen.findByRole('button', { name: 'View details for Picnic at Porter Park' }),
    );

    const dialog = screen.getByRole('dialog', { name: 'Picnic at Porter Park' });
    expect(
      within(dialog).getByText(
        'Bring a blanket and some snacks and spend a slow evening in the park.',
      ),
    ).toBeInTheDocument();
  });

  it('shows the PocketBase photo in the idea details', async () => {
    serve([{ ...sampleIdeas[0], photo: 'porter_park.jpg' }]);
    pb.files.getURL.mockReturnValue('http://pb.test/files/porter_park.jpg');
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    await user.click(
      await screen.findByRole('button', { name: 'View details for Picnic at Porter Park' }),
    );

    const dialog = screen.getByRole('dialog', { name: 'Picnic at Porter Park' });
    expect(within(dialog).getByRole('img', { name: 'Picnic at Porter Park' })).toHaveAttribute(
      'src',
      'http://pb.test/files/porter_park.jpg',
    );
  });

  it('closes idea details with the Close button', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    await user.click(
      await screen.findByRole('button', { name: 'View details for Picnic at Porter Park' }),
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All ideas' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('closes idea details with Escape', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    await user.click(
      await screen.findByRole('button', { name: 'View details for Picnic at Porter Park' }),
    );
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows more ideas in the grid when you click Show more ideas', async () => {
    const manyIdeas = Array.from({ length: PAGE_SIZE + 1 }, (_, index) => ({
      ...sampleIdeas[0],
      id: `idea-${index + 1}`,
      title: `Idea ${index + 1}`,
    }));
    serve(manyIdeas);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'All ideas' }));

    const grid = await screen.findByRole('region', { name: 'Date ideas' });
    expect(within(grid).getAllByRole('heading', { level: 2 })).toHaveLength(PAGE_SIZE + 5);

    await user.click(screen.getByRole('button', { name: 'Show more ideas' }));

    expect(
      await within(grid).findByRole('heading', { name: `Idea ${PAGE_SIZE + 1}` }),
    ).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Show more ideas' })).not.toBeInTheDocument();
  });

  it('shows an empty state when you reach the end of the deck', async () => {
    const user = userEvent.setup();
    render(<App />);

    for (let i = 0; i < 5; i += 1) {
      await user.click(await screen.findByRole('button', { name: /^Hide / }));
    }

    expect(screen.getByRole('heading', { name: 'You are all caught up' })).toBeInTheDocument();
    expect(screen.getByText('0 ideas left')).toBeInTheDocument();
  });

  it('says so when there are no ideas yet', async () => {
    serve([]);
    const user = userEvent.setup();
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'No ideas found' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    expect(
      await screen.findByRole('heading', { name: 'Picnic at Porter Park' }),
    ).toBeInTheDocument();
  });

  it('shows an error message when the ideas cannot load', async () => {
    collection.getList.mockRejectedValue(new Error('PocketBase is unavailable'));
    const user = userEvent.setup();
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'Could not load ideas' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    expect(
      await screen.findByRole('heading', { name: 'Picnic at Porter Park' }),
    ).toBeInTheDocument();
  });

  it('opens the account panel from the header and from the add idea form', async () => {
    const user = userEvent.setup();
    // jsdom has no layout, so it does not implement scrolling.
    Element.prototype.scrollIntoView = vi.fn();
    const { container } = render(<App />);

    const account = container.querySelector('#account-panel');
    expect(account).not.toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(screen.getByRole('region', { name: 'Your DateDeck account' })).toBe(account);
    expect(within(account).getByLabelText('Email')).toHaveFocus();

    await user.click(within(account).getByRole('button', { name: 'Close' }));
    expect(account).not.toBeVisible();

    await user.click(screen.getByRole('button', { name: 'Sign in to add an idea' }));
    expect(account).toBeVisible();
  });
});
