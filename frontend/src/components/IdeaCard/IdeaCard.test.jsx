import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import IdeaCard from './IdeaCard.jsx';

const idea = {
  id: 'test-1',
  title: 'Sunset at the sand dunes',
  place_name: 'St. Anthony Sand Dunes',
  location: 'Outside Rexburg',
  price: 12,
  duration: 90,
  photo: '',
};

describe('IdeaCard', () => {
  it('shows the title, place, location area, price and duration', () => {
    render(<IdeaCard idea={idea} />);

    expect(screen.getByRole('heading', { name: 'Sunset at the sand dunes' })).toBeInTheDocument();
    expect(screen.getByText('St. Anthony Sand Dunes')).toBeInTheDocument();
    expect(screen.getByText('Outside Rexburg')).toBeInTheDocument();
    expect(screen.getByText('$12 per person')).toBeInTheDocument();
    expect(screen.getByText('1 hr 30 min')).toBeInTheDocument();
  });

  it('says Free when the price is 0', () => {
    render(<IdeaCard idea={{ ...idea, price: 0 }} />);

    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows short and whole-hour durations in a readable way', () => {
    const { rerender } = render(<IdeaCard idea={{ ...idea, duration: 45 }} />);
    expect(screen.getByText('45 min')).toBeInTheDocument();

    rerender(<IdeaCard idea={{ ...idea, duration: 120 }} />);
    expect(screen.getByText('2 hr')).toBeInTheDocument();
  });

  it('shows a placeholder when the idea has no photo', () => {
    render(<IdeaCard idea={idea} />);

    expect(screen.getByText('No photo')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('shows the photo when the idea has one', () => {
    render(<IdeaCard idea={{ ...idea, photo: 'https://example.com/dunes.jpg' }} />);

    expect(screen.getByRole('img', { name: 'Sunset at the sand dunes' })).toHaveAttribute(
      'src',
      'https://example.com/dunes.jpg',
    );
    expect(screen.queryByText('No photo')).not.toBeInTheDocument();
  });
});
