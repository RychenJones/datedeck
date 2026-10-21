import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<IdeaDetails idea={idea} onClose={onClose} />);

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalledOnce();
  });
});
