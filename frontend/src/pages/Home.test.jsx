import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pb } from '../lib/pocketbase.js';
import Home from './Home.jsx';

vi.mock('../lib/pocketbase.js', () => ({
  pb: {
    collection: vi.fn(),
  },
}));

const collection = {
  getFullList: vi.fn(),
  create: vi.fn(),
};

function topIdeaTitle() {
  const deck = screen.getByRole('region', { name: 'Date idea deck' });
  return within(deck).getByRole('heading', { level: 2 }).textContent;
}

describe('Home deck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    pb.collection.mockReturnValue(collection);
    collection.getFullList.mockResolvedValue([]);
  });

  it('shows the top idea with two cards stacked behind it and how many are left', () => {
    const { container } = render(<Home />);

    expect(topIdeaTitle()).toBe('Picnic at Porter Park');
    expect(container.querySelectorAll('.deck__behind')).toHaveLength(2);
    expect(screen.getByText('5 ideas left')).toBeInTheDocument();
  });

  it('moves to the next idea when you save one', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole('button', { name: 'Save Picnic at Porter Park' }));

    expect(topIdeaTitle()).toBe('Sunset at the sand dunes');
    expect(screen.getByText('4 ideas left')).toBeInTheDocument();
  });

  it('moves to the next idea when you hide one', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole('button', { name: 'Hide Picnic at Porter Park' }));

    expect(topIdeaTitle()).toBe('Sunset at the sand dunes');
    expect(screen.getByText('4 ideas left')).toBeInTheDocument();
  });

  it('remembers saved and hidden ideas after a reload', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Home />);

    await user.click(screen.getByRole('button', { name: 'Save Picnic at Porter Park' }));
    await user.click(screen.getByRole('button', { name: 'Hide Sunset at the sand dunes' }));
    unmount();
    render(<Home />);

    expect(topIdeaTitle()).toBe('Hike the Menan Buttes');
    expect(screen.getByText('3 ideas left')).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes'))).toEqual({
      saved: ['sample-1'],
      hidden: ['sample-2'],
    });
  });

  it('shows every idea in a grid when you open the All ideas tab', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));

    const grid = screen.getByRole('region', { name: 'Date ideas' });
    expect(within(grid).getAllByRole('heading', { level: 2 })).toHaveLength(5);
    expect(screen.queryByRole('region', { name: 'Date idea deck' })).not.toBeInTheDocument();
  });

  it('shows an empty state when you reach the end of the deck', async () => {
    const user = userEvent.setup();
    render(<Home />);

    for (let i = 0; i < 5; i += 1) {
      await user.click(screen.getByRole('button', { name: /^Hide / }));
    }

    expect(screen.getByRole('heading', { name: 'You are all caught up' })).toBeInTheDocument();
    expect(screen.getByText('0 ideas left')).toBeInTheDocument();
  });

  it('opens the selected idea details from the All ideas grid', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    await user.click(
      screen.getByRole('button', { name: 'View details for Picnic at Porter Park' }),
    );

    expect(screen.getByRole('dialog', { name: 'Picnic at Porter Park' })).toBeInTheDocument();
    expect(
      screen.getByText('Bring a blanket and some snacks and spend a slow evening in the park.'),
    ).toBeInTheDocument();
  });

  it('closes idea details with the Close button', async () => {
    const user = userEvent.setup();
    render(<Home />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    await user.click(
      screen.getByRole('button', { name: 'View details for Picnic at Porter Park' }),
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
    render(<Home />);

    await user.click(screen.getByRole('button', { name: 'All ideas' }));
    await user.click(
      screen.getByRole('button', { name: 'View details for Picnic at Porter Park' }),
    );
    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
