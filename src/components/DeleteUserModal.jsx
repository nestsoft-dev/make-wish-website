export function DeleteUserModal({ isOpen, title, message, onCancel, onConfirm }) {
  if (!isOpen) return null

  return (
    <div className="du-modal-overlay" onClick={onCancel}>
      <div className="du-modal" onClick={(e) => e.stopPropagation()}>
        <div className="du-modal-header">
          <h2>{title || 'Delete Worker Account?'}</h2>
          <button type="button" className="du-close" onClick={onCancel} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="du-divider" />

        <div className="du-modal-body">
          <p>
            {message ||
              'Deleting this account will revoke Worker access to his/her account'}
          </p>
        </div>

        <div className="du-divider" />

        <div className="du-actions">
          <button type="button" className="du-cancel" onClick={onCancel}>
            No, Cancel
          </button>
          <button type="button" className="du-confirm" onClick={onConfirm}>
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

