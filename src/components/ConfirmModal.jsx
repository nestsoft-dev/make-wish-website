export function ConfirmModal({ isOpen, variant, referral, onConfirm, onCancel }) {
  if (!isOpen) return null

  const isExpire = variant === 'expire'

  return (
    <div className="confirm-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="confirm-modal-close"
          onClick={onCancel}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <h3 className="confirm-modal-title">
          {isExpire ? 'Expire Referral?' : 'Credit Referral Reward?'}
        </h3>

        <p className="confirm-modal-message">
          {isExpire
            ? `Are you sure you want to mark this referral from ${referral?.referrer || 'this user'} as expired?`
            : `Are you sure you want to credit N1,500 to ${referral?.referrer || 'this user'} for referring ${referral?.referee || 'this user'}?`}
        </p>

        <div className="confirm-modal-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            No, Cancel
          </button>
          <button
            type="button"
            className={isExpire ? 'btn-confirm btn-expire' : 'btn-confirm btn-credit'}
            onClick={onConfirm}
          >
            {isExpire ? 'Yes, Expire' : 'Yes, Credit Reward'}
          </button>
        </div>
      </div>
    </div>
  )
}
