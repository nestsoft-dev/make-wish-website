import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DEFAULT_LEAGUES = ['Premier League']
const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
]

const INITIAL_FORM_DATA = {
  homeTeam: '',
  awayTeam: '',
  league: 'Premier League',
  date: '',
  time: '',
  status: 'upcoming',
  predictionPrice: 50,
}

const INITIAL_BET_CODE = {
  platform: 'Bet9ja',
  code: 'B9J-2842X',
  prediction: 'Arsenal Win',
}

export function NewMatchModal({ isOpen, onClose, onCreated }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [platforms, setPlatforms] = useState([INITIAL_BET_CODE])
  const [leagues, setLeagues] = useState(DEFAULT_LEAGUES)
  const [teams, setTeams] = useState([])
  const [fetchError, setFetchError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isLoadingOptions, setIsLoadingOptions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen) return undefined

    let isCancelled = false

    const loadOptions = async () => {
      setFetchError('')
      setIsLoadingOptions(true)

      try {
        const [leaguesResponse, teamsResponse] = await Promise.all([
          fetch('/api/matches/leagues'),
          fetch('/api/matches/teams'),
        ])

        const [leaguesResult, teamsResult] = await Promise.all([
          leaguesResponse.json(),
          teamsResponse.json(),
        ])

        if (!leaguesResponse.ok || !leaguesResult?.success) {
          throw new Error(leaguesResult?.message || 'Unable to load leagues.')
        }

        if (!teamsResponse.ok || !teamsResult?.success) {
          throw new Error(teamsResult?.message || 'Unable to load teams.')
        }

        if (isCancelled) return

        const nextLeagues = leaguesResult?.data?.leagues?.length
          ? leaguesResult.data.leagues
          : DEFAULT_LEAGUES
        const nextTeams = teamsResult?.data?.teams || []

        setLeagues(nextLeagues)
        setTeams(nextTeams)
        setFormData((prev) => ({
          ...prev,
          league: nextLeagues.includes(prev.league) ? prev.league : (nextLeagues[0] || ''),
          homeTeam: nextTeams.includes(prev.homeTeam) ? prev.homeTeam : (nextTeams[0] || ''),
          awayTeam:
            nextTeams.includes(prev.awayTeam) && prev.awayTeam !== prev.homeTeam
              ? prev.awayTeam
              : (nextTeams.find((team) => team !== (nextTeams.includes(prev.homeTeam) ? prev.homeTeam : nextTeams[0])) || ''),
        }))
      } catch (err) {
        if (!isCancelled) {
          setFetchError(err.message || 'Unable to load match options.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingOptions(false)
        }
      }
    }

    loadOptions()

    return () => {
      isCancelled = true
    }
  }, [isOpen])

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updatePlatform = (index, field, value) => {
    setPlatforms((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    )
  }

  const addPlatform = () => {
    setPlatforms((prev) => [...prev, { platform: '', code: '', prediction: '' }])
  }

  const removePlatform = (index) => {
    if (platforms.length > 1) {
      setPlatforms((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const resetForm = () => {
    setFormData({
      ...INITIAL_FORM_DATA,
      league: leagues[0] || INITIAL_FORM_DATA.league,
      homeTeam: teams[0] || '',
      awayTeam: teams.find((team) => team !== teams[0]) || '',
    })
    setPlatforms([INITIAL_BET_CODE])
    setSubmitError('')
    setFetchError('')
  }

  const handleClose = () => {
    setSubmitError('')
    onClose()
  }

  const handleContinue = async (e) => {
    e.preventDefault()
    setSubmitError('')

    if (!formData.homeTeam || !formData.awayTeam || !formData.league || !formData.date || !formData.time) {
      setSubmitError('Please complete all required fields.')
      return
    }

    if (formData.homeTeam === formData.awayTeam) {
      setSubmitError('Home team and away team must be different.')
      return
    }

    const cleanedBetCodes = platforms
      .map((platform) => ({
        providerName: platform.platform.trim(),
        providerCode: platform.code.trim(),
        predictionText: platform.prediction.trim(),
      }))
      .filter((platform) => platform.providerName && platform.providerCode && platform.predictionText)

    if (!cleanedBetCodes.length) {
      setSubmitError('Add at least one valid betting platform code.')
      return
    }

    const adminToken = localStorage.getItem('adminToken')

    if (!adminToken) {
      setSubmitError('Invalid token. Please log in again.')
      navigate('/')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/matches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          homeTeamName: formData.homeTeam,
          awayTeamName: formData.awayTeam,
          leagueName: formData.league,
          date: formData.date,
          time: formData.time,
          status: formData.status,
          predictionPrice: Number(formData.predictionPrice),
          betCodes: cleanedBetCodes,
        }),
      })

      const result = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        throw new Error('Invalid token. Please log in again.')
      }

      if (response.status === 403) {
        throw new Error('Admin access required.')
      }

      if (response.status === 409) {
        throw new Error(result?.message || 'Match already exists.')
      }

      if (response.status === 422) {
        throw new Error(result?.message || 'Invalid league, team, date, or time.')
      }

      if (!response.ok || !result?.success || !result?.data?.match) {
        throw new Error(result?.message || 'Unable to create match.')
      }

      onCreated?.(result.data)
      resetForm()
      onClose()
    } catch (err) {
      setSubmitError(err.message || 'Unable to create match.')

      if (err.message === 'Invalid token. Please log in again.') {
        navigate('/')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-dialog new-match-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>New Match</h2>
          <button type="button" className="modal-close" onClick={handleClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleContinue} className="modal-body">
          {fetchError ? <p className="match-form-message error">{fetchError}</p> : null}
          {submitError ? <p className="match-form-message error">{submitError}</p> : null}

          <div className="form-row form-row-2">
            <div className="form-group">
              <label htmlFor="homeTeam">
                Home Team <span className="required">*</span>
              </label>
              <select
                id="homeTeam"
                value={formData.homeTeam}
                disabled={isLoadingOptions || isSubmitting}
                onChange={(e) => updateField('homeTeam', e.target.value)}
              >
                <option value="">Select home team</option>
                {teams.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="awayTeam">
                Away Team <span className="required">*</span>
              </label>
              <select
                id="awayTeam"
                value={formData.awayTeam}
                disabled={isLoadingOptions || isSubmitting}
                onChange={(e) => updateField('awayTeam', e.target.value)}
              >
                <option value="">Select away team</option>
                {teams.map((team) => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label htmlFor="league">League</label>
              <select
                id="league"
                value={formData.league}
                disabled={isLoadingOptions || isSubmitting}
                onChange={(e) => updateField('league', e.target.value)}
              >
                {leagues.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                value={formData.status}
                disabled={isSubmitting}
                onChange={(e) => updateField('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row form-row-2">
            <div className="form-group">
              <label htmlFor="date">
                Date <span className="required">*</span>
              </label>
              <input
                id="date"
                type="date"
                value={formData.date}
                disabled={isSubmitting}
                onChange={(e) => updateField('date', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="time">
                Time <span className="required">*</span>
              </label>
              <input
                id="time"
                type="time"
                value={formData.time}
                disabled={isSubmitting}
                onChange={(e) => updateField('time', e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="predictionPrice">
                Prediction Price <span className="required">*</span>
              </label>
              <input
                id="predictionPrice"
                type="number"
                min="0"
                step="1"
                value={formData.predictionPrice}
                disabled={isSubmitting}
                onChange={(e) => updateField('predictionPrice', e.target.value)}
              />
            </div>
          </div>

          <div className="platform-section">
            <div className="platform-header">
              <h3>Betting Platform Codes</h3>
              <button type="button" className="btn-add-platform" onClick={addPlatform} disabled={isSubmitting}>
                Add Platform +
              </button>
            </div>
            <div className="platform-list">
              {platforms.map((p, index) => (
                <div key={index} className="platform-row">
                  <input
                    type="text"
                    placeholder="Platforms"
                    value={p.platform}
                    disabled={isSubmitting}
                    onChange={(e) => updatePlatform(index, 'platform', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Code"
                    value={p.code}
                    disabled={isSubmitting}
                    onChange={(e) => updatePlatform(index, 'code', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Prediction"
                    value={p.prediction}
                    disabled={isSubmitting}
                    onChange={(e) => updatePlatform(index, 'prediction', e.target.value)}
                  />
                  {platforms.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-platform"
                      disabled={isSubmitting}
                      onClick={() => removePlatform(index)}
                      aria-label="Remove platform"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-continue" disabled={isLoadingOptions || isSubmitting}>
            {isSubmitting ? 'Creating Match...' : 'Create Match'}
          </button>
        </form>
      </div>
    </div>
  )
}
