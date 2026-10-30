import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import sampleIdeas from '../../data/sample-ideas.json';
import SwipesProvider from '../SwipesProvider/SwipesProvider.jsx';
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

function renderDetails(props = {}) {
  return render(
    <SwipesProvider>
      <IdeaDetails idea={idea} onClose={vi.fn()} {...props} />
    </SwipesProvider>,
  );
}

describe('IdeaDetails', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows the selected idea and closes when requested', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <SwipesProvider>
        <IdeaDetails idea={idea} onClose={onClose} />
      </SwipesProvider>,
    );

    expect(screen.getByRole('dialog', { name: 'Sunset at the sand dunes' })).toBeInTheDocument();
    expect(
      screen.getByText('Watch the sun go down from the top of the dunes.'),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('shows the full description and required details', () => {
    renderDetails();

    expect(screen.getByText(idea.description)).toBeInTheDocument();
    expect(screen.getByText(idea.category)).toBeInTheDocument();
    expect(screen.getByText(idea.address)).toBeInTheDocument();
    expect(screen.getByText('$12 per person')).toBeInTheDocument();
    expect(screen.getByText('1 hr 30 min')).toBeInTheDocument();
  });

  it('shows details for a sample idea', () => {
    render(
      <SwipesProvider>
        <IdeaDetails idea={sampleIdeas[0]} onClose={vi.fn()} />
      </SwipesProvider>,
    );

    expect(screen.getByText(sampleIdeas[0].title)).toBeInTheDocument();
    expect(screen.getByText(sampleIdeas[0].description)).toBeInTheDocument();
    expect(screen.getByText(sampleIdeas[0].address)).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('1 hr 30 min')).toBeInTheDocument();
    expect(screen.getByText(sampleIdeas[0].category)).toBeInTheDocument();
  });

  it('shows the placeholder when the photo cannot be loaded', () => {
    renderDetails({ idea: { ...idea, photo: 'https://example.com/dunes.jpg' } });

    fireEvent.error(screen.getByRole('img', { name: idea.title }));

    expect(screen.getByText('No photo')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: idea.title })).not.toBeInTheDocument();
  });

  it('keeps the placeholder when the same failed photo receives refreshed idea data', () => {
    const photoIdea = { ...idea, photo: 'https://example.com/dunes.jpg' };
    const onClose = vi.fn();
    const { rerender } = render(
      <SwipesProvider>
        <IdeaDetails idea={photoIdea} onClose={onClose} />
      </SwipesProvider>,
    );

    fireEvent.error(screen.getByRole('img', { name: idea.title }));
    rerender(
      <SwipesProvider>
        <IdeaDetails idea={{ ...photoIdea }} onClose={onClose} />
      </SwipesProvider>,
    );

    expect(screen.getByText('No photo')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: idea.title })).not.toBeInTheDocument();
  });

  it('shows a new photo after the previous photo failed', () => {
    const onClose = vi.fn();
    const { rerender } = renderDetails({
      idea: { ...idea, photo: 'https://example.com/dunes.jpg' },
      onClose,
    });

    fireEvent.error(screen.getByRole('img', { name: idea.title }));
    rerender(
      <SwipesProvider>
        <IdeaDetails
          idea={{ ...idea, photo: 'https://example.com/new-dunes.jpg' }}
          onClose={onClose}
        />
      </SwipesProvider>,
    );

    expect(screen.getByRole('img', { name: idea.title })).toHaveAttribute(
      'src',
      'https://example.com/new-dunes.jpg',
    );
    expect(screen.queryByText('No photo')).not.toBeInTheDocument();
  });

  it('links to the address in Maps', () => {
    renderDetails();

    expect(screen.getByRole('link', { name: /Open in Maps/ })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=St.%20Anthony%2C%20ID%2083445',
    );
  });

  it('leaves out the Maps link when the idea has no address', () => {
    renderDetails({ idea: { ...idea, address: '' } });

    expect(screen.getByText('Address coming soon')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open in Maps/ })).not.toBeInTheDocument();
  });

  it('shows a drawing for the category when the idea has no photo', () => {
    renderDetails();

    const dialog = screen.getByRole('dialog');
    expect(dialog.querySelector('svg[data-scene="outdoors"]')).toBeInTheDocument();
    expect(screen.getByText('No photo')).toBeInTheDocument();
  });

  it('saves an idea from the details actions', async () => {
    const user = userEvent.setup();

    renderDetails();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('button', { name: 'Unsave' })).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes'))).toMatchObject({
      saved: [idea.id],
      hidden: [],
    });
  });

  it('hides an idea from the details actions', async () => {
    const user = userEvent.setup();

    renderDetails();

    await user.click(screen.getByRole('button', { name: 'Hide' }));

    expect(screen.getByRole('button', { name: 'Unhide' })).toHaveAttribute('aria-pressed', 'true');
    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes'))).toMatchObject({
      saved: [],
      hidden: [idea.id],
    });
  });

  it('shows an idea already saved in shared swipe state', () => {
    window.localStorage.setItem(
      'datedeck.swipes',
      JSON.stringify({ saved: [idea.id], hidden: [] }),
    );

    renderDetails();

    expect(screen.getByRole('button', { name: 'Unsave' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Hide' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('undoes Save and Hide when their buttons are clicked again', async () => {
    const user = userEvent.setup();

    renderDetails();

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.click(screen.getByRole('button', { name: 'Unsave' }));
    await user.click(screen.getByRole('button', { name: 'Hide' }));
    await user.click(screen.getByRole('button', { name: 'Unhide' }));

    expect(screen.getByRole('button', { name: 'Save' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Hide' })).toHaveAttribute('aria-pressed', 'false');
    expect(JSON.parse(window.localStorage.getItem('datedeck.swipes'))).toMatchObject({
      saved: [],
      hidden: [],
    });
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <SwipesProvider>
        <IdeaDetails idea={idea} onClose={onClose} />
      </SwipesProvider>,
    );

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });
});
