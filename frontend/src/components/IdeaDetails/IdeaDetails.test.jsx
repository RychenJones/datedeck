import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import sampleIdeas from '../../data/sample-ideas.json';
import IdeaDetails from './IdeaDetails.jsx';

const idea = {
  id: 'test-1',
  title: 'Sunset at the sand dunes',
  description: 'Watch the sun go down from the top of the dunes.',
  place_name: 'St. Anthony Sand Dunes',
  address: 'St. Anthony, ID 83445',
  location: 'Outside Rexburg',
  price: 12,
  duration: 90,
  category: 'Outdoors',
  photo: '',
};

describe('IdeaDetails', () => {
  it('shows the selected idea and closes when requested', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<IdeaDetails idea={idea} onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'Sunset at the sand dunes' })).toBeInTheDocument();
    expect(
      screen.getByText('Watch the sun go down from the top of the dunes.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the full description and required details', () => {
    render(<IdeaDetails idea={idea} onClose={vi.fn()} />);

    expect(screen.getByText(idea.description)).toBeInTheDocument();
    expect(screen.getByText(idea.category)).toBeInTheDocument();
    expect(screen.getByText(idea.address)).toBeInTheDocument();
    expect(screen.getByText('$12 per person')).toBeInTheDocument();
    expect(screen.getByText('1 hr 30 min')).toBeInTheDocument();
  });

  it('shows details for a sample idea', () => {
    render(<IdeaDetails idea={sampleIdeas[0]} onClose={vi.fn()} />);

    expect(screen.getByText(sampleIdeas[0].title)).toBeInTheDocument();
    expect(screen.getByText(sampleIdeas[0].description)).toBeInTheDocument();
    expect(screen.getByText(sampleIdeas[0].address)).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('1 hr 30 min')).toBeInTheDocument();
    expect(screen.getByText(sampleIdeas[0].category)).toBeInTheDocument();
  });

  it('shows the placeholder when the photo cannot be loaded', () => {
    render(
      <IdeaDetails idea={{ ...idea, photo: 'https://example.com/dunes.jpg' }} onClose={vi.fn()} />,
    );

    fireEvent.error(screen.getByRole('img', { name: idea.title }));

    expect(screen.getByText('No photo')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: idea.title })).not.toBeInTheDocument();
  });

  it('links to the address in Maps', () => {
    render(<IdeaDetails idea={idea} onClose={vi.fn()} />);

    expect(screen.getByRole('link', { name: /Open in Maps/ })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=St.%20Anthony%2C%20ID%2083445',
    );
  });

  it('leaves out the Maps link when the idea has no address', () => {
    render(<IdeaDetails idea={{ ...idea, address: '' }} onClose={vi.fn()} />);

    expect(screen.getByText('Address coming soon')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open in Maps/ })).not.toBeInTheDocument();
  });

  it('shows a drawing for the category when the idea has no photo', () => {
    render(<IdeaDetails idea={idea} onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('svg[data-scene="outdoors"]')).toBeInTheDocument();
    expect(screen.getByText('No photo')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<IdeaDetails idea={idea} onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });
});
