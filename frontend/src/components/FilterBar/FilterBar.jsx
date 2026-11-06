import { useEffect, useRef, useState } from 'react';
import './FilterBar.css';
import { NO_FILTERS } from '../../hooks/useIdeas.js';
import { CATEGORY_OPTIONS, LOCATION_OPTIONS, PRICE_OPTIONS } from './FilterBarOptions.js';

function isPriceSelected(filters, option) {
  return filters.minPrice === option.minPrice && filters.maxPrice === option.maxPrice;
}

// Must match the breakpoint in FilterBar.css where the panel moves beside the content.
const SIDE_PANEL_QUERY = '(min-width: 800px)';

function countActiveFilters(filters) {
  const hasPrice = filters.minPrice != null || filters.maxPrice != null;
  return (
    filters.areas.length +
    filters.categories.length +
    (hasPrice ? 1 : 0) +
    (filters.search.trim() ? 1 : 0)
  );
}

/** The filter panel: beside the content on a laptop, a sheet behind a Filters button on a phone. */
export default function FilterBar({ filters, onChange, counts }) {
  const [isOpen, setIsOpen] = useState(false);
  const toggleButton = useRef(null);
  const doneButton = useRef(null);
  const activeCount = countActiveFilters(filters);
  const hasActiveFilters = activeCount > 0;

  useEffect(() => {
    if (!isOpen) return undefined;
    doneButton.current?.focus();

    function handleKeyDown(event) {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      toggleButton.current?.focus();
    }

    // Turning a phone sideways can make room for the side panel, so the sheet is no longer needed.
    const sidePanel = window.matchMedia?.(SIDE_PANEL_QUERY);
    function handleResize(event) {
      if (event.matches) setIsOpen(false);
    }

    document.addEventListener('keydown', handleKeyDown);
    sidePanel?.addEventListener('change', handleResize);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      sidePanel?.removeEventListener('change', handleResize);
    };
  }, [isOpen]);

  function closeSheet() {
    setIsOpen(false);
    toggleButton.current?.focus();
  }

  // Keeps Tab inside the open sheet, so keyboard users cannot land on the page behind it.
  function keepFocusInSheet(event) {
    if (!isOpen || event.key !== 'Tab') return;
    const focusable = event.currentTarget.querySelectorAll('button, input');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function toggleLocation(location) {
    const areas = filters.areas.includes(location)
      ? filters.areas.filter((area) => area !== location)
      : [...filters.areas, location];
    onChange({ ...filters, areas });
  }

  function selectPrice(option) {
    const selected = isPriceSelected(filters, option);
    onChange({
      ...filters,
      minPrice: selected ? null : option.minPrice,
      maxPrice: selected ? null : option.maxPrice,
    });
  }

  function toggleCategory(category) {
    const categories = filters.categories.includes(category)
      ? filters.categories.filter((item) => item !== category)
      : [...filters.categories, category];
    onChange({ ...filters, categories });
  }

  return (
    <div className="filter-panel">
      <button
        ref={toggleButton}
        type="button"
        className="filter-panel__toggle"
        aria-expanded={isOpen}
        aria-controls="filter-bar"
        aria-label={activeCount > 0 ? `Filters, ${activeCount} on` : 'Filters'}
        onClick={() => setIsOpen(true)}
      >
        Filters
        {activeCount > 0 && <span className="filter-panel__badge">{activeCount}</span>}
      </button>

      {isOpen && (
        <button
          type="button"
          className="filter-panel__backdrop"
          aria-label="Close filters"
          tabIndex={-1}
          onClick={closeSheet}
        />
      )}

      <section
        id="filter-bar"
        className={`filter-bar${isOpen ? ' filter-bar--open' : ''}`}
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen ? 'true' : undefined}
        aria-labelledby="filter-bar-heading"
        onKeyDown={keepFocusInSheet}
      >
        <div className="filter-bar__heading">
          <h2 id="filter-bar-heading">Find your mood</h2>
          <div className="filter-bar__actions">
            {hasActiveFilters && (
              <button
                type="button"
                className="filter-bar__clear"
                onClick={() => onChange(NO_FILTERS)}
              >
                Clear all
              </button>
            )}
            <button
              ref={doneButton}
              type="button"
              className="filter-bar__done"
              onClick={closeSheet}
            >
              Done
            </button>
          </div>
        </div>

        <label className="filter-bar__search">
          <span>Search ideas</span>
          <span className="filter-bar__field">
            <svg
              className="filter-bar__search-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={filters.search}
              placeholder="Pizza, hike…"
              onChange={(event) => onChange({ ...filters, search: event.target.value })}
            />
          </span>
        </label>

        <fieldset className="filter-bar__group">
          <legend>Category</legend>
          <div className="filter-bar__options">
            {CATEGORY_OPTIONS.map((option) => {
              const selected = filters.categories.includes(option.label);
              return (
                <button
                  className={`filter-bar__option filter-bar__category filter-bar__category--${option.tone}${selected ? ' filter-bar__option--selected' : ''}`}
                  type="button"
                  aria-pressed={selected}
                  key={option.id}
                  onClick={() => toggleCategory(option.label)}
                >
                  {option.label} <small>({counts.categories[option.label] ?? 0})</small>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="filter-bar__group">
          <legend>Location</legend>
          <div className="filter-bar__options">
            {LOCATION_OPTIONS.map((location) => {
              const selected = filters.areas.includes(location);
              return (
                <button
                  className={`filter-bar__option${selected ? ' filter-bar__option--selected' : ''}`}
                  type="button"
                  aria-pressed={selected}
                  key={location}
                  onClick={() => toggleLocation(location)}
                >
                  {location} <small>({counts.locations[location] ?? 0})</small>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="filter-bar__group">
          <legend>Price</legend>
          <div className="filter-bar__options">
            {PRICE_OPTIONS.map((option) => {
              const selected = isPriceSelected(filters, option);
              return (
                <button
                  className={`filter-bar__option${selected ? ' filter-bar__option--selected' : ''}`}
                  type="button"
                  aria-pressed={selected}
                  key={option.id}
                  onClick={() => selectPrice(option)}
                >
                  {option.label} <small>({counts.prices[option.id] ?? 0})</small>
                </button>
              );
            })}
          </div>
        </fieldset>
      </section>
    </div>
  );
}
