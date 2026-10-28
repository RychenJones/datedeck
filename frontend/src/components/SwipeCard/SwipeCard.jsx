import { useEffect, useRef, useState } from 'react';
import './SwipeCard.css';

// How far (in px) the card has to travel before letting go saves or hides it.
export const SWIPE_DISTANCE = 120;
// Smaller moves still count as a tap, so buttons inside the card keep working.
const TAP_SLOP = 5;

// Fields, dialogs and widgets that already use the arrow keys keep them.
const OWNS_ARROW_KEYS = [
  'input',
  'textarea',
  'select',
  'a[href]',
  '[role="dialog"]',
  '[role="tablist"]',
  '[role="radiogroup"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="slider"]',
].join(', ');

function ownsArrowKeys(target) {
  if (!(target instanceof Element)) return false;
  return target.isContentEditable || Boolean(target.closest(OWNS_ARROW_KEYS));
}

// Arrows only count when nothing is focused or focus is in the deck around this card, so a
// stray arrow on the header or the add idea form does not hide a card you can't see.
function isInDeck(target, card) {
  if (target === document.body) return true;
  const deck = card?.closest('section') ?? card;
  return Boolean(deck?.contains(target));
}

/**
 * Wraps the top card of the deck. Drag right (or press →) to save, drag left (or press ←)
 * to hide. Short drags spring back. Pointer events cover mouse, touch and pen.
 */
export default function SwipeCard({ onSave, onHide, children }) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const drag = useRef(null);
  const card = useRef(null);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      // Holding a key down would otherwise run through the deck.
      if (event.shiftKey || event.repeat || ownsArrowKeys(event.target)) return;
      if (!isInDeck(event.target, card.current)) return;
      if (document.querySelector('[role="dialog"]')) return;
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onSave();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onHide();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSave, onHide]);

  function handlePointerDown(event) {
    // Only the main mouse button drags; touch and pen always report button 0.
    if (event.button !== 0 || drag.current?.pointerId !== undefined) return;
    drag.current = { pointerId: event.pointerId, startX: event.clientX, moved: false };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsDragging(true);
  }

  function handlePointerMove(event) {
    if (drag.current?.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.current.startX;
    if (Math.abs(distance) > TAP_SLOP) drag.current.moved = true;
    setOffset(distance);
  }

  function endDrag(event, { cancelled }) {
    if (drag.current?.pointerId !== event.pointerId) return;
    const distance = event.clientX - drag.current.startX;
    // Keep `moved` until the click that follows pointerup has been swallowed.
    const { moved } = drag.current;
    drag.current = moved ? { moved } : null;
    // Browsers fire that click in the same task, so drop the flag if no click came.
    if (moved) {
      setTimeout(() => {
        if (drag.current?.pointerId === undefined) drag.current = null;
      }, 0);
    }
    setIsDragging(false);
    setOffset(0);
    if (cancelled) return;
    if (distance >= SWIPE_DISTANCE) onSave();
    else if (distance <= -SWIPE_DISTANCE) onHide();
  }

  // A drag that ends on a button should not also press it. Keyboard clicks (detail 0) always pass.
  function handleClickCapture(event) {
    if (drag.current?.pointerId !== undefined) return;
    if (drag.current?.moved && event.detail > 0) {
      event.preventDefault();
      event.stopPropagation();
    }
    drag.current = null;
  }

  const progress = Math.min(Math.abs(offset) / SWIPE_DISTANCE, 1);
  const style = {
    '--swipe-x': offset,
    '--save-opacity': offset > 0 ? progress : 0,
    '--hide-opacity': offset < 0 ? progress : 0,
  };

  return (
    <div
      ref={card}
      className={`swipe-card${isDragging ? ' swipe-card--dragging' : ''}`}
      style={style}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={(event) => endDrag(event, { cancelled: false })}
      onPointerCancel={(event) => endDrag(event, { cancelled: true })}
      onLostPointerCapture={(event) => endDrag(event, { cancelled: true })}
      onClickCapture={handleClickCapture}
      onDragStart={(event) => event.preventDefault()}
    >
      <span className="swipe-card__stamp swipe-card__stamp--save" aria-hidden="true">
        SAVE
      </span>
      <span className="swipe-card__stamp swipe-card__stamp--hide" aria-hidden="true">
        HIDE
      </span>
      {children}
    </div>
  );
}
