import { useMemo, useState } from 'react'

export function DeleteUserReasonModal({ isOpen, onClose, onDelete, isSubmitting }) {
  const [reason, setReason] = useState('')

  const canDelete = useMemo(() => reason.trim().length > 0, [reason])

  if (!isOpen) return null

  const handleDelete = () => {
    if (!canDelete) return
    onDelete?.(reason.trim())
    setReason('')
  }

  const handleClose = () => {
    setReason('')
    onClose?.()
  }

  return (
    <div className="dur-overlay" onClick={handleClose}>
      <div className="dur-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dur-header">
          <h2>Delete worker account</h2>
          <button type="button" className="dur-close" onClick={handleClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="dur-body">
          <label className="dur-label" htmlFor="delete-reason">
            Reasons for deleting account
          </label>
          <textarea
            id="delete-reason"
            className="dur-textarea"
            placeholder="e.g worker requested for account to be deleted for some specific reasons"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={6}
          />

          <button
            type="button"
            className={`dur-delete ${canDelete ? 'enabled' : 'disabled'}`}
            onClick={handleDelete}
            disabled={!canDelete || isSubmitting}
          >
            {isSubmitting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

