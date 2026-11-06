// Home owns tab state. Ask its existing controlled header to switch views.
export default function AllIdeasButton() {
  return (
    <button
      type="button"
      className="home__empty-action"
      onClick={() => window.dispatchEvent(new Event('datedeck:show-all-ideas'))}
    >
      All Ideas
    </button>
  );
}
