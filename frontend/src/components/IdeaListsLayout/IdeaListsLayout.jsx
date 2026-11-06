import { useSwipes } from '../../hooks/useSwipes.js';
import ChoiceList from './ChoiceList.jsx';
import './IdeaListsLayout.css';

/** A page's content with any storage warning, and the hidden ideas list unless `showLists` is off. */
export default function IdeaListsLayout({ children, showLists = true }) {
  const { hidden, unhide, storageError, lists } = useSwipes();
  const warning = storageError && (
    <p role="alert" className="storage-message">
      {storageError}
    </p>
  );

  if (!showLists) {
    return (
      <>
        {warning}
        {children}
      </>
    );
  }

  return (
    <>
      {warning}
      <div className="idea-lists-layout">
        <div className="idea-lists-layout__main">{children}</div>
        <aside className="choice-sidebar" aria-label="Hidden ideas list">
          <ChoiceList
            ids={hidden}
            title="Hidden ideas"
            action="Bring back"
            onAction={unhide}
            {...lists}
          />
        </aside>
      </div>
    </>
  );
}
