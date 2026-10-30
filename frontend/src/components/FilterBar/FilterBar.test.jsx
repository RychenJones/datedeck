import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NO_FILTERS } from '../../hooks/useIdeas.js';
import FilterBar from './FilterBar.jsx';

describe('FilterBar', () => {
  const counts = {
    locations: { 'Downtown Rexburg': 3 },
    prices: { free: 2 },
    categories: { Outdoors: 1 },
  };

  it('selects and clears a location filter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<FilterBar filters={NO_FILTERS} onChange={onChange} counts={counts} />);

    await user.click(screen.getByRole('button', { name: /^Downtown Rexburg/ }));

    expect(onChange).toHaveBeenLastCalledWith({
      ...NO_FILTERS,
      areas: ['Downtown Rexburg'],
    });
  });

  it('selects a price range and clicking it again clears the range', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const filters = { ...NO_FILTERS, minPrice: 10, maxPrice: 25 };

    const { rerender } = render(
      <FilterBar filters={NO_FILTERS} onChange={onChange} counts={counts} />,
    );

    await user.click(screen.getByRole('button', { name: /^\$10 to \$25/ }));
    expect(onChange).toHaveBeenLastCalledWith(filters);

    rerender(<FilterBar filters={filters} onChange={onChange} counts={counts} />);
    await user.click(screen.getByRole('button', { name: /^\$10 to \$25/ }));
    expect(onChange).toHaveBeenLastCalledWith(NO_FILTERS);
  });

  it('selects and clears a category', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<FilterBar filters={NO_FILTERS} onChange={onChange} counts={counts} />);

    await user.click(screen.getByRole('button', { name: /^Outdoors/ }));

    expect(onChange).toHaveBeenLastCalledWith({
      ...NO_FILTERS,
      categories: ['Outdoors'],
    });
  });

  it('updates the search text', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(<FilterBar filters={NO_FILTERS} onChange={onChange} counts={counts} />);

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

    const { rerender } = render(
      <FilterBar filters={NO_FILTERS} onChange={onChange} counts={counts} />,
    );

    expect(screen.queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument();

    rerender(<FilterBar filters={filters} onChange={onChange} counts={counts} />);
    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    expect(onChange).toHaveBeenCalledWith(NO_FILTERS);
  });

  it('shows counts for each filter option', () => {
    render(<FilterBar filters={NO_FILTERS} onChange={vi.fn()} counts={counts} />);

    expect(screen.getByRole('button', { name: 'Downtown Rexburg (3)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Free (2)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Outdoors (1)' })).toBeInTheDocument();
  });

  it('marks active filters with the selected outline class', () => {
    const filters = {
      ...NO_FILTERS,
      areas: ['Downtown Rexburg'],
      minPrice: 10,
      maxPrice: 25,
      categories: ['Outdoors'],
    };

    render(<FilterBar filters={filters} onChange={vi.fn()} counts={counts} />);

    expect(screen.getByRole('button', { name: /^Downtown Rexburg/ })).toHaveClass(
      'filter-bar__option--selected',
    );
    expect(screen.getByRole('button', { name: /^\$10 to \$25/ })).toHaveClass(
      'filter-bar__option--selected',
    );
    expect(screen.getByRole('button', { name: /^Outdoors/ })).toHaveClass(
      'filter-bar__option--selected',
    );
  });

  it('keeps long option labels inside their buttons', () => {
    const longCounts = {
      locations: { 'Downtown Rexburg': 123456 },
      prices: { free: 123456 },
      categories: { Outdoors: 123456 },
    };

    render(<FilterBar filters={NO_FILTERS} onChange={vi.fn()} counts={longCounts} />);

    expect(screen.getByRole('button', { name: 'Downtown Rexburg (123456)' })).toHaveClass(
      'filter-bar__option',
    );
  });
});
