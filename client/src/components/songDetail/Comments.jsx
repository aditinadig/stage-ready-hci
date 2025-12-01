// src/components/songDetail/CommentsModal.jsx
export default function CommentsModal({ close }) {
  return (
    <div className="comments-modal__backdrop" onClick={close}>
      <div className="comments-modal" onClick={e => e.stopPropagation()}>
        <h2 className="comments-modal__title">Comments on update</h2>

        <p className="comments-modal__body">
          Placeholder for threaded comments. Later: manager notes, assignments,
          reasons for change, etc.
        </p>

        <button
          type="button"
          className="primary-btn primary-btn--active"
          onClick={close}
        >
          Close
        </button>
      </div>
    </div>
  );
}
