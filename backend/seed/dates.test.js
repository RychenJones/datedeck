import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const seedPath = resolve(dirname(fileURLToPath(import.meta.url)), 'dates.json');
const ideas = JSON.parse(readFileSync(seedPath, 'utf8'));

const areas = ['BYU-Idaho Campus', 'Downtown Rexburg', 'Outside Rexburg'];
const categories = ['Active', 'Animals', 'Creative', 'Food', 'Outdoors', 'Show'];

describe('date idea seed data', () => {
  it('contains exactly 30 ideas', () => {
    expect(ideas).toHaveLength(30);
  });

  it('gives every idea an address and a recognized location area', () => {
    for (const idea of ideas) {
      expect(typeof idea.address).toBe('string');
      expect(idea.address.trim().length).toBeGreaterThan(0);
      expect(areas).toContain(idea.location);
    }
  });

  it('covers free, under $10, $10 to $25, and $25 and up', () => {
    for (const idea of ideas) {
      expect(Number.isFinite(idea.price)).toBe(true);
      expect(idea.price).toBeGreaterThanOrEqual(0);
    }

    expect(ideas.some(({ price }) => price === 0)).toBe(true);
    expect(ideas.some(({ price }) => price > 0 && price < 10)).toBe(true);
    expect(ideas.some(({ price }) => price >= 10 && price < 25)).toBe(true);
    expect(ideas.some(({ price }) => price >= 25)).toBe(true);
  });

  it.each(areas)('offers at least three ideas in %s', (area) => {
    expect(ideas.filter(({ location }) => location === area).length).toBeGreaterThanOrEqual(3);
  });

  it('uses only recognized categories', () => {
    for (const idea of ideas) expect(categories).toContain(idea.category);
  });

  it.each(categories)('offers at least three %s ideas', (category) => {
    expect(ideas.filter((idea) => idea.category === category).length).toBeGreaterThanOrEqual(3);
  });
});
