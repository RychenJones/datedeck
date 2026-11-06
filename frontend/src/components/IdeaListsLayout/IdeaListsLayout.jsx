import { useSwipes } from '../../hooks/useSwipes.js';
import ChoiceList from './ChoiceList.jsx';
import './IdeaListsLayout.css';

export default function IdeaListsLayout({ children }) {
  const { saved, hidden, unsave, unhide, storageError, lists } = useSwipes();
  return (
    <>
      {storageError && (
        <p role="alert" className="storage-message">
          {storageError}
        </p>
      )}
      <div className="idea-lists-layout">
        <div className="idea-lists-layout__main">{children}</div>
        <aside className="choice-sidebar" aria-label="Saved for later">
          <ChoiceList
            ids={saved}
            title="Saved for later"
            action="Unlike"
            onAction={unsave}
            {...lists}
          />
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
