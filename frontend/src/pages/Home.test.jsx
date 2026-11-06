import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

  it('saves the top idea when you swipe it right', async () => {
    render(<App />);
    const card = (await screen.findByText('SAVE')).parentElement;

    fireEvent.pointerDown(card, { pointerId: 1, pointerType: 'touch', button: 0, clientX: 100 });
    fireEvent.pointerMove(card, { pointerId: 1, pointerType: 'touch', clientX: 300 });
    fireEvent.pointerUp(card, { pointerId: 1, pointerType: 'touch', clientX: 300 });

    expect(await topIdeaTitle()).toBe('Sunset at the sand dunes');
    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes')).saved).toEqual(['sample-1']);
  });

  it('hides the top idea when you press the left arrow key', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await topIdeaTitle()).toBe('Picnic at Porter Park');

    await user.keyboard('{ArrowLeft}');

    expect(await topIdeaTitle()).toBe('Sunset at the sand dunes');
    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes')).hidden).toEqual(['sample-1']);
  });

  it('keeps the top idea when you press an arrow key on a header button or the add form', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await topIdeaTitle()).toBe('Picnic at Porter Park');

    screen.getByRole('button', { name: 'Switch to light theme' }).focus();
    await user.keyboard('{ArrowLeft}');
    await user.click(screen.getByRole('button', { name: 'Add idea' }));
    await user.keyboard('{ArrowRight}');

    expect(await topIdeaTitle()).toBe('Picnic at Porter Park');
  });

  it('shows the add idea form only after you press Add idea', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(await topIdeaTitle()).toBe('Picnic at Porter Park');

    expect(screen.queryByRole('heading', { name: 'Add a date idea' })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add idea' }));

    const modal = screen.getByRole('dialog', { name: 'Add a date idea' });
    expect(within(modal).getByRole('heading', { name: 'Add a date idea' })).toBeInTheDocument();
    expect(within(modal).getByRole('button', { name: 'Sign in to add an idea' })).toHaveFocus();
  });

  it('opens the add idea modal from every tab', async () => {
    const user = userEvent.setup();
    render(<App />);

    for (const tab of ['Deck', 'All ideas', 'Liked']) {
      await user.click(screen.getByRole('button', { name: tab }));
      await user.click(screen.getByRole('button', { name: 'Add idea' }));
      expect(screen.getByRole('dialog', { name: 'Add a date idea' })).toBeInTheDocument();
      await user.keyboard('{Escape}');
    }
  });

  it('closes the add idea modal with Close or Escape and returns to the Add idea button', async () => {
    const user = userEvent.setup();
    render(<App />);
    const add = screen.getByRole('button', { name: 'Add idea' });

    await user.click(add);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(add).toHaveFocus();

    await user.click(add);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(add).toHaveFocus();
  });

  it('keeps Tab inside the add idea modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Add idea' }));
    const close = screen.getByRole('button', { name: 'Close' });
    const signIn = screen.getByRole('button', { name: 'Sign in to add an idea' });

    await user.tab();
    expect(close).toHaveFocus();
    await user.tab();
    expect(signIn).toHaveFocus();
    await user.tab({ shift: true });
    expect(close).toHaveFocus();
    await user.tab({ shift: true });
    expect(signIn).toHaveFocus();
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

  it('starts with Undo turned off until you make a choice', async () => {
    const user = userEvent.setup();
    render(<App />);
    const undo = await screen.findByRole('button', { name: 'Undo last choice' });
    expect(undo).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Hide Picnic at Porter Park' }));

    expect(screen.getByRole('button', { name: 'Undo last choice' })).toBeEnabled();
  });

  it('brings back the idea when you undo a button save', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: 'Save Picnic at Porter Park' }));
    await user.click(screen.getByRole('button', { name: 'Undo last choice' }));

    expect(await topIdeaTitle()).toBe('Picnic at Porter Park');
    expect(screen.getByText('5 ideas left')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes')).saved).toEqual([]);
  });

  it('brings back the idea when you undo a swipe left', async () => {
    const user = userEvent.setup();
    render(<App />);
    const card = (await screen.findByText('HIDE')).parentElement;

    fireEvent.pointerDown(card, { pointerId: 1, pointerType: 'touch', button: 0, clientX: 300 });
    fireEvent.pointerMove(card, { pointerId: 1, pointerType: 'touch', clientX: 100 });
    fireEvent.pointerUp(card, { pointerId: 1, pointerType: 'touch', clientX: 100 });
    expect(await topIdeaTitle()).toBe('Sunset at the sand dunes');

    await user.click(screen.getByRole('button', { name: 'Undo last choice' }));

    expect(await topIdeaTitle()).toBe('Picnic at Porter Park');
    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes')).hidden).toEqual([]);
  });

  it('brings back the idea when you undo a swipe right', async () => {
    const user = userEvent.setup();
    render(<App />);
    const card = (await screen.findByText('SAVE')).parentElement;

    fireEvent.pointerDown(card, { pointerId: 1, pointerType: 'touch', button: 0, clientX: 100 });
    fireEvent.pointerMove(card, { pointerId: 1, pointerType: 'touch', clientX: 300 });
    fireEvent.pointerUp(card, { pointerId: 1, pointerType: 'touch', clientX: 300 });
    expect(await topIdeaTitle()).toBe('Sunset at the sand dunes');

    await user.click(screen.getByRole('button', { name: 'Undo last choice' }));

    expect(await topIdeaTitle()).toBe('Picnic at Porter Park');
    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes')).saved).toEqual([]);
  });

  it('lets you undo your last card from the all caught up screen and keeps focus on Undo', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (let i = 0; i < 5; i += 1) {
      await user.click(await screen.findByRole('button', { name: /^Hide / }));
    }
    expect(screen.getByRole('heading', { name: 'You are all caught up' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo last choice' }));

    expect(await topIdeaTitle()).toBe(sampleIdeas[4].title);
    expect(screen.getByText('1 idea left')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo last choice' })).toHaveFocus();
  });

  it('does not offer Undo on the all caught up screen after a reload', async () => {
    window.localStorage.setItem(
      'datedeck.swipes',
      JSON.stringify({ saved: [], hidden: sampleIdeas.map((idea) => idea.id) }),
    );
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'You are all caught up' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Undo last choice' })).not.toBeInTheDocument();
  });

  it('shuffles only the ideas that are left and shows a new top card', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Hide Picnic at Porter Park' }));

    await user.click(screen.getByRole('button', { name: 'Shuffle ideas' }));

    expect(await topIdeaTitle()).not.toBe('Sunset at the sand dunes');
    expect(screen.getByText('4 ideas left')).toBeInTheDocument();

    // Going through the shuffled deck shows each idea that was left exactly once.
    const seen = [];
    for (let i = 0; i < 4; i += 1) {
      seen.push(await topIdeaTitle());
      await user.click(screen.getByRole('button', { name: `Hide ${seen.at(-1)}` }));
    }
    expect(seen.sort()).toEqual(
      sampleIdeas
        .slice(1)
        .map((idea) => idea.title)
        .sort(),
    );
    expect(screen.getByRole('heading', { name: 'You are all caught up' })).toBeInTheDocument();
  });

  it('mixes ideas from pages not loaded yet into a shuffle', async () => {
    const manyIdeas = Array.from({ length: PAGE_SIZE + 2 }, (_, index) => ({
      ...sampleIdeas[0],
      id: `idea-${index + 1}`,
      title: `Idea ${index + 1}`,
    }));
    serve(manyIdeas);
    // With this value the shuffle swaps the top card with the very last idea.
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const user = userEvent.setup();
    render(<App />);
    expect(await topIdeaTitle()).toBe('Idea 1');

    await user.click(screen.getByRole('button', { name: 'Shuffle ideas' }));

    expect(
      await screen.findByRole('heading', { level: 2, name: `Idea ${PAGE_SIZE + 2}` }),
    ).toBeInTheDocument();
    expect(collection.getList).toHaveBeenCalledWith(2, PAGE_SIZE, expect.any(Object));
    expect(screen.getByText(`${PAGE_SIZE + 2} ideas left`)).toBeInTheDocument();
    random.mockRestore();
  });

  it('offers Undo on the no ideas found screen', async () => {
    const idea = { ...sampleIdeas[0], id: 'database-1', title: 'Database date' };
    collection.getList.mockImplementation(async (page, perPage, options) => {
      const items = options?.filter ? [] : [idea];
      return { page, perPage, totalItems: items.length, totalPages: 1, items };
    });
    pb.filter.mockImplementation((filter) => filter);
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Hide Database date' }));

    await user.click(screen.getByRole('button', { name: /^Downtown Rexburg/ }));
    expect(await screen.findByRole('heading', { name: 'No ideas found' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo last choice' }));

    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes')).hidden).toEqual([]);
    expect(screen.queryByRole('button', { name: 'Undo last choice' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Date idea deck' })).toHaveFocus();
  });

  it('offers Undo on the error screen when the next page fails to load', async () => {
    const manyIdeas = Array.from({ length: PAGE_SIZE + 2 }, (_, index) => ({
      ...sampleIdeas[0],
      id: `idea-${index + 1}`,
      title: `Idea ${index + 1}`,
    }));
    collection.getList.mockImplementation(async (page, perPage) => {
      if (page > 1) throw new Error('PocketBase is unavailable');
      return {
        page,
        perPage,
        totalItems: manyIdeas.length,
        totalPages: 2,
        items: manyIdeas.slice(0, perPage),
      };
    });
    // Only the last idea on page one is left, so the deck asks for page two straight away.
    window.localStorage.setItem(
      'datedeck.swipes',
      JSON.stringify({
        saved: [],
        hidden: manyIdeas.slice(0, PAGE_SIZE - 1).map((idea) => idea.id),
      }),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: `Hide Idea ${PAGE_SIZE}` }));
    expect(
      await screen.findByRole('heading', { name: 'Could not load ideas' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Undo last choice' }));

    expect(await topIdeaTitle()).toBe(`Idea ${PAGE_SIZE}`);
  });

  it('still shuffles the ideas it has when the next page fails to load', async () => {
    const manyIdeas = Array.from({ length: PAGE_SIZE + 2 }, (_, index) => ({
      ...sampleIdeas[0],
      id: `idea-${index + 1}`,
      title: `Idea ${index + 1}`,
    }));
    collection.getList.mockImplementation(async (page, perPage) => {
      if (page > 1) throw new Error('PocketBase is unavailable');
      return {
        page,
        perPage,
        totalItems: manyIdeas.length,
        totalPages: 2,
        items: manyIdeas.slice(0, perPage),
      };
    });
    // With this value the shuffle swaps the top card with the last loaded idea.
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.99);
    const user = userEvent.setup();
    render(<App />);
    expect(await topIdeaTitle()).toBe('Idea 1');

    await user.click(screen.getByRole('button', { name: 'Shuffle ideas' }));

    expect(
      await screen.findByRole('heading', { level: 2, name: `Idea ${PAGE_SIZE}` }),
    ).toBeInTheDocument();
    random.mockRestore();
  });

  it('turns Shuffle off when only one idea is left', async () => {
    const user = userEvent.setup();
    render(<App />);
    for (let i = 0; i < 4; i += 1) {
      await user.click(await screen.findByRole('button', { name: /^Hide / }));
    }

    expect(screen.getByRole('button', { name: 'Shuffle ideas' })).toBeDisabled();
  });

  it('puts an undone idea back on top even after a shuffle', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Hide Picnic at Porter Park' }));
    await user.click(screen.getByRole('button', { name: 'Shuffle ideas' }));

    await user.click(screen.getByRole('button', { name: 'Undo last choice' }));

    expect(await topIdeaTitle()).toBe('Picnic at Porter Park');
  });

  it('keeps the shuffled order when you switch tabs and come back', async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole('button', { name: 'Shuffle ideas' });
    await user.click(screen.getByRole('button', { name: 'Shuffle ideas' }));
    const shuffledTop = await topIdeaTitle();
    expect(shuffledTop).not.toBe('Picnic at Porter Park');

    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    await user.click(screen.getByRole('button', { name: 'Deck' }));

    expect(await topIdeaTitle()).toBe(shuffledTop);
  });

  it('never brings a hidden idea back after a shuffle and a reload', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.click(await screen.findByRole('button', { name: 'Hide Picnic at Porter Park' }));
    await user.click(screen.getByRole('button', { name: 'Shuffle ideas' }));
    unmount();

    render(<App />);

    expect(await topIdeaTitle()).toBe('Sunset at the sand dunes');
    expect(screen.getByText('4 ideas left')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Undo last choice' })).toBeDisabled();
    expect(screen.queryByRole('heading', { name: 'Picnic at Porter Park' })).toBeNull();
  });

  it('keeps ideas hidden on any page out of the deck after a reload', async () => {
    const manyIdeas = Array.from({ length: PAGE_SIZE + 2 }, (_, index) => ({
      ...sampleIdeas[0],
      id: `idea-${index + 1}`,
      title: `Idea ${index + 1}`,
    }));
    serve(manyIdeas);
    // Hidden: all of page one but its last idea, and the first idea on page two.
    window.localStorage.setItem(
      'datedeck.swipes',
      JSON.stringify({
        saved: [],
        hidden: [...manyIdeas.slice(0, PAGE_SIZE - 1), manyIdeas[PAGE_SIZE]].map((idea) => idea.id),
      }),
    );
    const user = userEvent.setup();
    const { unmount } = render(<App />);

    expect(await topIdeaTitle()).toBe(`Idea ${PAGE_SIZE}`);
    await user.click(screen.getByRole('button', { name: `Hide Idea ${PAGE_SIZE}` }));
    expect(await topIdeaTitle()).toBe(`Idea ${PAGE_SIZE + 2}`);
    await user.click(screen.getByRole('button', { name: `Hide Idea ${PAGE_SIZE + 2}` }));
    expect(
      await screen.findByRole('heading', { name: 'You are all caught up' }),
    ).toBeInTheDocument();
    unmount();

    render(<App />);

    expect(
      await screen.findByRole('heading', { name: 'You are all caught up' }),
    ).toBeInTheDocument();
    expect(screen.getByText('0 ideas left')).toBeInTheDocument();
  });

  it('shows every idea in a grid when you open the All ideas tab', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));

    const grid = await screen.findByRole('region', { name: 'Date ideas' });
    expect(within(grid).getAllByRole('heading', { level: 2 })).toHaveLength(5);
    expect(screen.queryByRole('region', { name: 'Date idea deck' })).not.toBeInTheDocument();
  });

  it('shares location and price filters between the deck and All ideas', async () => {
    const user = userEvent.setup();
    pb.filter.mockImplementation((filter) => filter);
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^Downtown Rexburg/ }));
    await waitFor(() =>
      expect(collection.getList).toHaveBeenLastCalledWith(1, PAGE_SIZE, {
        filter: '(location = {:area0})',
        sort: '-created,id',
        requestKey: null,
      }),
    );

    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    expect(screen.getByRole('button', { name: /^Downtown Rexburg/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /^Free/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('keeps the filter panel on the deck and All ideas but not on Liked', async () => {
    const user = userEvent.setup();
    render(<App />);
    const panel = () => screen.queryByRole('heading', { name: 'Find your mood' });

    expect(panel()).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    expect(panel()).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Liked' }));
    expect(panel()).not.toBeInTheDocument();
  });

  it('Clear all resets the deck and All ideas together', async () => {
    const user = userEvent.setup();
    pb.filter.mockImplementation((filter) => filter);
    render(<App />);

    await user.click(screen.getByRole('button', { name: /^Downtown Rexburg/ }));
    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    await waitFor(() =>
      expect(collection.getList).toHaveBeenLastCalledWith(1, PAGE_SIZE, {
        filter: '',
        sort: '-created,id',
        requestKey: null,
      }),
    );
    await user.click(screen.getByRole('button', { name: 'Deck' }));
    expect(screen.getByRole('button', { name: /^Downtown Rexburg/ })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
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

  it('shows only database ideas in the deck when the database has ideas', async () => {
    serve([{ ...sampleIdeas[0], id: 'database-1', title: 'Database date' }]);
    render(<App />);

    expect(await topIdeaTitle()).toBe('Database date');
    expect(screen.getByText('1 idea left')).toBeInTheDocument();
  });

  it('shows the sample ideas in the deck when the database has no ideas yet', async () => {
    serve([]);
    const user = userEvent.setup();
    render(<App />);

    expect(await topIdeaTitle()).toBe('Picnic at Porter Park');
    expect(screen.getByText('5 ideas left')).toBeInTheDocument();

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

    await user.click(screen.getByRole('button', { name: 'Add idea' }));
    await user.click(screen.getByRole('button', { name: 'Sign in to add an idea' }));
    expect(account).toBeVisible();
    expect(screen.queryByRole('dialog', { name: 'Add a date idea' })).not.toBeInTheDocument();
  });

  it('asks signed-out people to sign in on the Liked tab', async () => {
    const user = userEvent.setup();
    Element.prototype.scrollIntoView = vi.fn();
    const { container } = render(<App />);

    await user.click(screen.getByRole('button', { name: 'Liked' }));

    expect(screen.getByRole('heading', { name: '0 liked ideas' })).toBeInTheDocument();
    await user.click(
      within(container.querySelector('#date-ideas')).getByRole('button', { name: 'Sign in' }),
    );
    expect(container.querySelector('#account-panel')).toBeVisible();
  });
});
