import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import IdeaArt from './IdeaArt.jsx';

function sceneOf(container) {
  return container.querySelector('svg')?.dataset.scene;
}

describe('IdeaArt', () => {
  it.each([
    ['Food', 'food'],
    ['Active', 'active'],
    ['Outdoors', 'outdoors'],
    ['Creative', 'creative'],
    ['Show', 'nightlife'],
    ['Animals', 'outdoors'],
  ])('draws the %s category as the %s scene', (category, scene) => {
    const { container } = render(<IdeaArt category={category} />);

    expect(sceneOf(container)).toBe(scene);
  });

  it('matches the category no matter the capital letters', () => {
    const { container } = render(<IdeaArt category="food" />);

    expect(sceneOf(container)).toBe('food');
  });

  it('is hidden from screen readers because it is decoration', () => {
    const { container } = render(<IdeaArt category="Food" />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('says a photo is coming when the category has no drawing', () => {
    const { container } = render(<IdeaArt category="Something new" />);

    expect(container.querySelector('svg')).not.toBeInTheDocument();
    expect(screen.getByText('Photo coming soon')).toBeInTheDocument();
  });
});
