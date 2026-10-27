import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NO_FILTERS } from '../../hooks/useIdeas.js';
import FilterBar from './FilterBar.jsx';

describe('FilterBar', () => {
  it('selects and clears a location filter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<FilterBar filters={NO_FILTERS} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Downtown Rexburg' }));

    expect(onChange).toHaveBeenLastCalledWith({
      ...NO_FILTERS,
      areas: ['Downtown Rexburg'],
    });
  });

  it('selects a price range and clicking it again clears the range', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const filters = { ...NO_FILTERS, minPrice: 10, maxPrice: 25 };

    const { rerender } = render(<FilterBar filters={NO_FILTERS} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: '$10 to $25' }));
    expect(onChange).toHaveBeenLastCalledWith(filters);

    rerender(<FilterBar filters={filters} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: '$10 to $25' }));
    expect(onChange).toHaveBeenLastCalledWith(NO_FILTERS);
  });

  it('selects and clears a category', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<FilterBar filters={NO_FILTERS} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Outdoors' }));

    expect(onChange).toHaveBeenLastCalledWith({
      ...NO_FILTERS,
      categories: ['Outdoors'],
    });
  });

  it('updates the search text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<FilterBar filters={NO_FILTERS} onChange={onChange} />);

    await user.type(screen.getByRole('searchbox', { name: 'Search ideas' }), 'park');

    expect(onChange).toHaveBeenLastCalledWith({ ...NO_FILTERS, search: 'k' });
    expect(onChange).toHaveBeenCalledTimes(4);
  });

  it('shows Clear all only when filters are active and resets every filter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const filters = {
      areas: ['Downtown Rexburg'],
      minPrice: 10,
      maxPrice: 25,
      categories: ['Outdoors'],
      search: 'park',
    };

    const { rerender } = render(<FilterBar filters={NO_FILTERS} onChange={onChange} />);

    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();

    rerender(<FilterBar filters={filters} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(onChange).toHaveBeenCalledWith(NO_FILTERS);
  });
});
