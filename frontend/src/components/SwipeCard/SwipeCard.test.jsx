import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SwipeCard, { SWIPE_DISTANCE } from './SwipeCard.jsx';

function renderCard(children = <p>Picnic at Porter Park</p>) {
  const onSave = vi.fn();
  const onHide = vi.fn();
  render(
    <SwipeCard onSave={onSave} onHide={onHide}>
      {children}
    </SwipeCard>,
  );
  const card = screen.getByText('SAVE').parentElement;
  return { card, onSave, onHide };
}

function drag(card, distance, { pointerType = 'mouse', end = 'pointerUp' } = {}) {
  const pointer = { pointerId: 1, pointerType, button: 0 };
  fireEvent.pointerDown(card, { ...pointer, clientX: 200 });
  fireEvent.pointerMove(card, { ...pointer, clientX: 200 + distance });
  fireEvent[end](card, { ...pointer, clientX: 200 + distance });
}

describe('SwipeCard', () => {
  it('shows the card inside it', () => {
    renderCard();

    expect(screen.getByText('Picnic at Porter Park')).toBeInTheDocument();
  });

  it('saves the idea when you drag it far enough to the right', () => {
    const { card, onSave, onHide } = renderCard();

    drag(card, SWIPE_DISTANCE + 10);

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onHide).not.toHaveBeenCalled();
  });

  it('hides the idea when you drag it far enough to the left', () => {
    const { card, onSave, onHide } = renderCard();

    drag(card, -(SWIPE_DISTANCE + 10));

    expect(onHide).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('springs back without choosing when the drag is short', () => {
    const { card, onSave, onHide } = renderCard();

    drag(card, SWIPE_DISTANCE - 10);

    expect(onSave).not.toHaveBeenCalled();
    expect(onHide).not.toHaveBeenCalled();
    expect(card.style.getPropertyValue('--swipe-x')).toBe('0');
  });

  it('springs back without choosing when the browser cancels the drag', () => {
    const { card, onSave } = renderCard();

    drag(card, SWIPE_DISTANCE + 10, { pointerType: 'touch', end: 'pointerCancel' });

    expect(onSave).not.toHaveBeenCalled();
    expect(card.style.getPropertyValue('--swipe-x')).toBe('0');
  });

  it('springs back and can be dragged again when the browser loses the pointer', () => {
    const { card, onSave } = renderCard();
    const pointer = { pointerId: 1, pointerType: 'pen', button: 0 };

    fireEvent.pointerDown(card, { ...pointer, clientX: 200 });
    fireEvent.pointerMove(card, { ...pointer, clientX: 200 + SWIPE_DISTANCE + 10 });
    fireEvent.lostPointerCapture(card, pointer);
    expect(card).not.toHaveClass('swipe-card--dragging');
    expect(card.style.getPropertyValue('--swipe-x')).toBe('0');
    expect(onSave).not.toHaveBeenCalled();

    drag(card, SWIPE_DISTANCE + 10, { pointerType: 'pen' });
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('fades in the SAVE stamp while you drag right and the HIDE stamp while you drag left', () => {
    const { card } = renderCard();
    const pointer = { pointerId: 1, pointerType: 'mouse', button: 0 };

    fireEvent.pointerDown(card, { ...pointer, clientX: 200 });
    fireEvent.pointerMove(card, { ...pointer, clientX: 200 + SWIPE_DISTANCE / 2 });
    expect(card).toHaveClass('swipe-card--dragging');
    expect(card.style.getPropertyValue('--save-opacity')).toBe('0.5');
    expect(card.style.getPropertyValue('--hide-opacity')).toBe('0');

    fireEvent.pointerMove(card, { ...pointer, clientX: 200 - SWIPE_DISTANCE * 2 });
    expect(card.style.getPropertyValue('--save-opacity')).toBe('0');
    expect(card.style.getPropertyValue('--hide-opacity')).toBe('1');

    fireEvent.pointerUp(card, { ...pointer, clientX: 200 });
    expect(card).not.toHaveClass('swipe-card--dragging');
    expect(card.style.getPropertyValue('--hide-opacity')).toBe('0');
  });

  it.each(['mouse', 'touch', 'pen'])('works when you drag with a %s', (pointerType) => {
    const { card, onSave, onHide } = renderCard();

    drag(card, SWIPE_DISTANCE + 10, { pointerType });
    drag(card, -(SWIPE_DISTANCE + 10), { pointerType });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('ignores drags with the right mouse button', () => {
    const { card, onSave } = renderCard();

    fireEvent.pointerDown(card, { pointerId: 1, pointerType: 'mouse', button: 2, clientX: 200 });
    fireEvent.pointerMove(card, { pointerId: 1, pointerType: 'mouse', clientX: 400 });
    fireEvent.pointerUp(card, { pointerId: 1, pointerType: 'mouse', clientX: 400 });

    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves with the right arrow key and hides with the left arrow key', async () => {
    const user = userEvent.setup();
    const { onSave, onHide } = renderCard();

    await user.keyboard('{ArrowRight}');
    expect(onSave).toHaveBeenCalledTimes(1);

    await user.keyboard('{ArrowLeft}');
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('leaves the arrow keys alone while you type in a field', async () => {
    const user = userEvent.setup();
    const { onSave, onHide } = renderCard(
      <label>
        Search
        <input />
      </label>,
    );

    await user.click(screen.getByLabelText('Search'));
    await user.keyboard('ab{ArrowLeft}{ArrowRight}');

    expect(onSave).not.toHaveBeenCalled();
    expect(onHide).not.toHaveBeenCalled();
  });

  it('still uses the arrow keys after you press a button', async () => {
    const user = userEvent.setup();
    const { onSave } = renderCard(<button type="button">Save</button>);

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await user.keyboard('{ArrowRight}');

    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('leaves the arrow keys alone in links, tabs and radio buttons', async () => {
    const user = userEvent.setup();
    const { onSave, onHide } = renderCard(
      <>
        <a href="#ideas">All ideas</a>
        <div role="tablist">
          <button type="button" role="tab">
            Deck
          </button>
        </div>
        <label>
          <input type="radio" name="when" /> Evening
        </label>
      </>,
    );

    for (const control of [
      screen.getByRole('link', { name: 'All ideas' }),
      screen.getByRole('tab', { name: 'Deck' }),
      screen.getByRole('radio', { name: 'Evening' }),
    ]) {
      control.focus();
      await user.keyboard('{ArrowLeft}{ArrowRight}');
    }

    expect(onSave).not.toHaveBeenCalled();
    expect(onHide).not.toHaveBeenCalled();
  });

  it('does not press a button inside the card when a drag ends on it', () => {
    const onClick = vi.fn();
    const { card } = renderCard(
      <button type="button" onClick={onClick}>
        View details
      </button>,
    );
    const button = screen.getByRole('button', { name: 'View details' });

    drag(card, 40);
    fireEvent.click(button, { detail: 1 });
    expect(onClick).not.toHaveBeenCalled();

    fireEvent.click(button, { detail: 1 });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('lets a later click through when a drag ends without a click', async () => {
    const onClick = vi.fn();
    const { card } = renderCard(
      <button type="button" onClick={onClick}>
        View details
      </button>,
    );

    drag(card, 40, { pointerType: 'touch' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.click(screen.getByRole('button', { name: 'View details' }), { detail: 1 });

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
