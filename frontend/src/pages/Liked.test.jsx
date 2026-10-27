import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import sampleIdeas from '../data/sample-ideas.json';
import Liked from './Liked.jsx';

vi.mock('../lib/pocketbase.js', () => ({
  pb: { files: { getURL: vi.fn() } },
}));

describe('Liked', () => {
  it('shows no ideas and asks you to sign in when you are signed out', async () => {
    const user = userEvent.setup();
    const onSignIn = vi.fn();
    render(<Liked onSignIn={onSignIn} />);

    expect(screen.getByRole('heading', { name: '0 liked ideas' })).toBeInTheDocument();
    expect(screen.getByText('Sign in to be able to save your ideas.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: sampleIdeas[0].title })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(onSignIn).toHaveBeenCalledOnce();
  });

  it('shows the ideas grid when you are signed in', () => {
    render(<Liked signedIn />);

    expect(screen.getByRole('heading', { name: sampleIdeas[0].title })).toBeInTheDocument();
    expect(screen.queryByText('Sign in to be able to save your ideas.')).not.toBeInTheDocument();
  });
});
