function getStatusLabel(status) {
  if (!status) return '--'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function renderValue(value) {
  if (value === null || value === undefined || value === '') return '--'
  return value
}

export function TransactionDetailsModal({ isOpen, transaction, isLoading, error, onClose }) {
  if (!isOpen) return null

  return (
    <div className="tx-modal-overlay" onClick={onClose}>
      <div className="tx-modal" onClick={(e) => e.stopPropagation()}>
        <div className="tx-modal-header">
          <h2>Transaction details</h2>
          <button type="button" className="tx-modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="tx-modal-state">Loading transaction details...</div>
        ) : null}

        {!isLoading && error ? (
          <div className="tx-modal-state tx-modal-state-error">{error}</div>
        ) : null}

        {!isLoading && !error && !transaction ? (
          <div className="tx-modal-state">No transaction details available.</div>
        ) : null}

        {!isLoading && !error && transaction ? (
        <div className="tx-modal-card">
          <div className="tx-modal-top">
            <div className="tx-modal-id">{transaction.id}</div>
          </div>

          <div className="tx-modal-grid">
            <div className="tx-row">
              <span className="tx-k">Type</span>
              <span className="tx-v">{transaction.type}</span>
            </div>
            <div className="tx-row">
              <span className="tx-k">Amount</span>
              <span className="tx-v">{transaction.amount}</span>
            </div>
            <div className="tx-row">
              <span className="tx-k">From</span>
              <span className="tx-v strong">{transaction.fromName}</span>
            </div>
            <div className="tx-row">
              <span className="tx-k">To</span>
              <span className="tx-v strong">{transaction.toName}</span>
            </div>
            <div className="tx-row">
              <span className="tx-k">Reference</span>
              <span className="tx-v">{transaction.reference}</span>
            </div>
            <div className="tx-row">
              <span className="tx-k">Date</span>
              <span className="tx-v">{transaction.date}</span>
            </div>
          </div>

          <div className="tx-modal-section">
            <h3>Additional Details</h3>
          </div>

          <div className="tx-modal-divider" />

          <div className="tx-modal-grid">
            <div className="tx-row">
              <span className="tx-k">Counterparty</span>
              <span className="tx-v strong">{renderValue(transaction.fromTo)}</span>
            </div>
            <div className="tx-row">
              <span className="tx-k">Status</span>
              <span className={`tx-pill ${transaction.status || 'pending'}`}>
                <span className="tx-pill-dot" />
                {getStatusLabel(transaction.status)}
              </span>
            </div>
            <div className="tx-row">
              <span className="tx-k">Description</span>
              <span className="tx-v">{renderValue(transaction.description)}</span>
            </div>
            <div className="tx-row">
              <span className="tx-k">Occurred At</span>
              <span className="tx-v">{transaction.date}</span>
            </div>
            {(transaction.extraDetails || []).map((detail) => (
              <div className="tx-row" key={detail.label}>
                <span className="tx-k">{detail.label}</span>
                <span className="tx-v">{renderValue(detail.value)}</span>
              </div>
            ))}
          </div>
        </div>
        ) : null}
      </div>
    </div>
  )
}

