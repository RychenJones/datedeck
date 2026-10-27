import './FilterBar.css';
import { NO_FILTERS } from '../../hooks/useIdeas.js';
import { CATEGORY_OPTIONS, LOCATION_OPTIONS, PRICE_OPTIONS } from './FilterBarOptions.js';

function isPriceSelected(filters, option) {
  return filters.minPrice === option.minPrice && filters.maxPrice === option.maxPrice;
}

export default function FilterBar({ filters, onChange, counts }) {
  const hasActiveFilters =
    filters.areas.length > 0 ||
    filters.categories.length > 0 ||
    filters.minPrice != null ||
    filters.maxPrice != null ||
    filters.search.trim() !== '';

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
    <aside className="filter-bar" aria-label="Filter date ideas">
      <div className="filter-bar__heading">
        <h2>Filter ideas</h2>
        {hasActiveFilters && (
          <button type="button" className="filter-bar__clear" onClick={() => onChange(NO_FILTERS)}>
            Clear all
          </button>
        )}
      </div>

      <label className="filter-bar__search">
        <span>Search ideas</span>
        <input
          type="search"
          value={filters.search}
          placeholder="Title, description, or place"
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
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
    </aside>
  );
}
