export function AccountDeletedModal({ isOpen, onClose }) {
  if (!isOpen) return null

  return (
    <div className="ad-overlay" onClick={onClose}>
      <div className="ad-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ad-icon">
          <div className="ad-icon-inner">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="22" height="22">
              <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <h2 className="ad-title">Account deleted</h2>
        <p className="ad-message">
          An email has been sent to the worker to review his/her deletion request one more time
        </p>

        <button type="button" className="ad-btn" onClick={onClose}>
          Got it
        </button>
      </div>
    </div>
  )
}

