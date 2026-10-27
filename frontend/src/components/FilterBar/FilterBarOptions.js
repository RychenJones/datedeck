export const LOCATION_OPTIONS = ['Downtown Rexburg', 'Outside Rexburg', 'BYU-Idaho Campus'];

export const CATEGORY_OPTIONS = [
  { id: 'outdoors', label: 'Outdoors', tone: 'outdoorsy' },
  { id: 'active', label: 'Active', tone: 'active' },
  { id: 'show', label: 'Show', tone: 'cultured' },
  { id: 'animals', label: 'Animals', tone: 'cozy' },
  { id: 'creative', label: 'Creative', tone: 'creative' },
  { id: 'food', label: 'Food', tone: 'foodie' },
];

export const PRICE_OPTIONS = [
  { id: 'free', label: 'Free', minPrice: 0, maxPrice: 0 },
  { id: 'under-10', label: 'Under $10', minPrice: null, maxPrice: 9.99 },
  { id: '10-to-25', label: '$10 to $25', minPrice: 10, maxPrice: 25 },
  { id: '25-plus', label: '$25 and up', minPrice: 25, maxPrice: null },
];
