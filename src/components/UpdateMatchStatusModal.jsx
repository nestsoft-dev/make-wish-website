import { useEffect, useState } from 'react'

const STATUS_OPTIONS = ['upcoming', 'live', 'completed', 'cancelled']

export function UpdateMatchStatusModal({ isOpen, match, onClose, onSubmit }) {
  const [status, setStatus] = useState('upcoming')
  const [homeScore, setHomeScore] = useState('')
  const [awayScore, setAwayScore] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    setStatus(match?.status || 'upcoming')
    setHomeScore(match?.result?.homeScore ?? '')
    setAwayScore(match?.result?.awayScore ?? '')
    setError('')
    setIsSubmitting(false)
  }, [isOpen, match])

  if (!isOpen || !match) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (status === 'completed') {
      if (homeScore === '' || awayScore === '') {
        setError('Enter both home and away scores for a completed match.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      await onSubmit?.({
        status,
        result: {
          homeScore: Number(homeScore),
          awayScore: Number(awayScore),
        },
      })
    } catch (err) {
      setError(err.message || 'Unable to update match status.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog status-match-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Match Status</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <p className="status-match-title">{match.match}</p>

          {error ? <p className="match-form-message error">{error}</p> : null}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="match-status">Status</label>
              <select id="match-status" value={status} onChange={(e) => setStatus(e.target.value)} disabled={isSubmitting}>
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {status === 'completed' ? (
            <div className="form-row form-row-2">
              <div className="form-group">
                <label htmlFor="home-score">{match.homeTeam} Score</label>
                <input
                  id="home-score"
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              <div className="form-group">
                <label htmlFor="away-score">{match.awayTeam} Score</label>
                <input
                  id="away-score"
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          ) : null}

          <button type="submit" className="btn-continue" disabled={isSubmitting}>
            {isSubmitting ? 'Updating...' : 'Update Status'}
          </button>
        </form>
      </div>
    </div>
  )
}