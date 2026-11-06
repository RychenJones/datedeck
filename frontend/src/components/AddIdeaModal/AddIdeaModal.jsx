import { useEffect, useRef } from 'react';
import AddIdeaForm from '../AddIdeaForm/AddIdeaForm.jsx';

import './AddIdeaModal.css';

const FOCUSABLE = 'button:not(:disabled), input, select, textarea';

/** The add idea form in a modal, opened from the header on any tab. */
export default function AddIdeaModal({ signedIn, onSignIn, onClose }) {
  const dialog = useRef(null);

  // Land on the first field, and go back to the button that opened the modal when it closes.
  useEffect(() => {
    const opener = document.activeElement;
    dialog.current?.querySelector(`.add-idea ${FOCUSABLE}`)?.focus();
    return () => opener?.focus?.();
  }, []);

  // Escape closes the modal, and Tab stays inside it.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = dialog.current.querySelectorAll(FOCUSABLE);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const isInside = dialog.current.contains(active);

      if (event.shiftKey && (active === first || !isInside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !isInside)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="add-idea-modal__backdrop">
      <section
        ref={dialog}
        id="add-idea-panel"
        className="add-idea-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Add a date idea"
      >
        <div className="add-idea-modal__bar">
          <button type="button" className="add-idea-modal__close" onClick={onClose}>
            Close
          </button>
        </div>
        <AddIdeaForm signedIn={signedIn} onSignIn={onSignIn} />
      </section>
    </div>
  );
}
