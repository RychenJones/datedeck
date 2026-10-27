import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pb } from '../../lib/pocketbase.js';
import AddIdeaForm from './AddIdeaForm.jsx';

vi.mock('../../lib/pocketbase.js', () => ({
  pb: {
    authStore: { record: { id: 'user-1' } },
    collection: vi.fn(),
  },
}));

const collection = {
  getFullList: vi.fn(),
  create: vi.fn(),
};

async function fillInForm(user) {
  await user.type(screen.getByLabelText('Title'), 'Picnic at Porter Park');
  await user.type(screen.getByLabelText('Place'), 'Porter Park');
  await user.type(screen.getByLabelText('Address'), '250 W 2nd S, Rexburg, ID 83440');
  await user.selectOptions(screen.getByLabelText('Location area'), 'Downtown Rexburg');
  await user.type(screen.getByLabelText('Price per person ($)'), '0');
  await user.type(screen.getByLabelText('Duration (minutes)'), '90');
  await user.selectOptions(screen.getByLabelText('Category'), 'Outdoors');
  await user.type(screen.getByLabelText('Description'), 'Bring a blanket and some snacks.');
}

describe('AddIdeaForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pb.collection.mockReturnValue(collection);
    collection.getFullList.mockResolvedValue([]);
    collection.create.mockResolvedValue({ id: 'new-idea', title: 'Picnic at Porter Park' });
  });

  it('asks you to sign in before you can add an idea', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    render(<AddIdeaForm onSignIn={onSignIn} />);

    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign in to add an idea' }));

    expect(onSignIn).toHaveBeenCalledOnce();
    expect(collection.create).not.toHaveBeenCalled();
  });

  it('shows a field for every part of an idea', () => {
    render(<AddIdeaForm signedIn />);

    for (const label of [
      'Title',
      'Place',
      'Address',
      'Location area',
      'Price per person ($)',
      'Duration (minutes)',
      'Category',
      'Description',
    ]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: 'Add idea' })).toBeInTheDocument();
  });

  it('tells you which fields are missing and does not save', async () => {
    const user = userEvent.setup();
    render(<AddIdeaForm signedIn />);

    await user.click(screen.getByRole('button', { name: 'Add idea' }));

    expect(screen.getByText('Give your idea a title.')).toBeInTheDocument();
    expect(screen.getByText('Add the name of the place.')).toBeInTheDocument();
    expect(screen.getByText('Add the address.')).toBeInTheDocument();
    expect(screen.getByText('Choose a location area.')).toBeInTheDocument();
    expect(screen.getByText('Add the price per person (0 if it is free).')).toBeInTheDocument();
    expect(screen.getByText('Add how long it takes, in minutes.')).toBeInTheDocument();
    expect(screen.getByText('Choose a category.')).toBeInTheDocument();
    expect(screen.getByText('Add a short description.')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true');
    expect(collection.create).not.toHaveBeenCalled();
  });

  it('tells you when the price or duration is not a valid number', async () => {
    const user = userEvent.setup();
    render(<AddIdeaForm signedIn />);

    await fillInForm(user);
    await user.clear(screen.getByLabelText('Price per person ($)'));
    await user.type(screen.getByLabelText('Price per person ($)'), '-5');
    await user.clear(screen.getByLabelText('Duration (minutes)'));
    await user.type(screen.getByLabelText('Duration (minutes)'), '0');
    await user.click(screen.getByRole('button', { name: 'Add idea' }));

    expect(screen.getByText('Price cannot be less than 0.')).toBeInTheDocument();
    expect(screen.getByText('Duration must be at least 1 minute.')).toBeInTheDocument();
    expect(collection.create).not.toHaveBeenCalled();
  });

  it('saves the idea to PocketBase, clears the form and confirms it was added', async () => {
    const user = userEvent.setup();
    render(<AddIdeaForm signedIn />);

    await fillInForm(user);
    await user.click(screen.getByRole('button', { name: 'Add idea' }));

    expect(collection.create).toHaveBeenCalledWith(
      {
        title: 'Picnic at Porter Park',
        place_name: 'Porter Park',
        address: '250 W 2nd S, Rexburg, ID 83440',
        location: 'Downtown Rexburg',
        price: 0,
        duration: 90,
        category: 'Outdoors',
        description: 'Bring a blanket and some snacks.',
        created_by: 'user-1',
      },
      { requestKey: null },
    );
    expect(await screen.findByRole('status')).toHaveTextContent(
      '“Picnic at Porter Park” was added. Thanks!',
    );
    expect(screen.getByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText('Location area')).toHaveValue('');
    expect(screen.getByLabelText('Price per person ($)')).toHaveValue(null);
  });

  it('keeps what you typed and shows an error when saving fails', async () => {
    collection.create.mockRejectedValue(new Error('PocketBase is unavailable'));
    const user = userEvent.setup();
    render(<AddIdeaForm signedIn />);

    await fillInForm(user);
    await user.click(screen.getByRole('button', { name: 'Add idea' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not save your idea. Check your connection and try again.',
    );
    expect(screen.getByLabelText('Title')).toHaveValue('Picnic at Porter Park');
  });
});
