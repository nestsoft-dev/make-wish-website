import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { NewMatchModal } from '../components/NewMatchModal'
import { UpdateMatchStatusModal } from '../components/UpdateMatchStatusModal'
import { apiFetch } from '../utils/api'
import '../styles/Matches.css'

const TABS = [
  { id: 'all', label: 'All Matches' },
  { id: 'upcoming', label: 'Upcoming Matches' },
  { id: 'pending', label: 'Pending Matches' },
  { id: 'completed', label: 'Completed matches' },
]

const PAGE_LIMIT = 20

function formatMatchDateTime(isoDate) {
  if (!isoDate) return '--'

  const date = new Date(isoDate)

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

function getStatusLabel(status) {
  if (status === 'last8hr') return 'Last 8 hr'
  return status ? `${status.charAt(0).toUpperCase()}${status.slice(1)}` : '--'
}

function mapApiMatchToRow(match) {
  return {
    id: match._id,
    homeTeam: match.homeTeam?.name || '--',
    awayTeam: match.awayTeam?.name || '--',
    match: `${match.homeTeam?.name || '--'} vs ${match.awayTeam?.name || '--'}`,
    league: match.league?.name || '--',
    dateTime: formatMatchDateTime(match.kickoffAt),
    prediction: match.isPredictionAvailable ? `₦${match.predictionPrice ?? 0}` : 'Unavailable',
    status: match.status || 'upcoming',
    result: match.result || { homeScore: null, awayScore: null },
  }
}

export function Matches() {
  const navigate = useNavigate()
  const [matches, setMatches] = useState([])
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRows, setSelectedRows] = useState([])
  const [showNewMatchModal, setShowNewMatchModal] = useState(false)
  const [statusModal, setStatusModal] = useState({ isOpen: false, match: null })
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    let isCancelled = false

    const loadMatches = async () => {
      setIsLoading(true)
      setFetchError('')

      try {
        const params = new URLSearchParams({
          page: '1',
          limit: String(PAGE_LIMIT),
        })

        if (activeTab !== 'all') {
          params.set('status', activeTab)
        }

        const response = await apiFetch(`/api/matches?${params.toString()}`)
        const result = await response.json()

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Unable to fetch matches.')
        }

        if (isCancelled) return

        const nextMatches = (result?.data?.matches || []).map(mapApiMatchToRow)
        setMatches(nextMatches)
        setSelectedRows([])
      } catch (err) {
        if (!isCancelled) {
          setFetchError(err.message || 'Unable to fetch matches.')
          setMatches([])
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadMatches()

    return () => {
      isCancelled = true
    }
  }, [activeTab, refreshCount])

  const filteredMatches = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return matches.filter((row) => {
      const matchesTab = activeTab === 'all' ? true : row.status === activeTab
      const matchesQuery =
        !query ||
        row.match.toLowerCase().includes(query) ||
        row.league.toLowerCase().includes(query)

      return matchesTab && matchesQuery
    })
  }, [activeTab, matches, searchQuery])

  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedRows.length === filteredMatches.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(filteredMatches.map((m) => m.id))
    }
  }

  const handleMatchCreated = () => {
    setSelectedRows([])
    setShowNewMatchModal(false)
    setRefreshCount((prev) => prev + 1)
  }

  const openStatusModal = (match) => {
    setStatusModal({ isOpen: true, match })
  }

  const closeStatusModal = () => {
    setStatusModal({ isOpen: false, match: null })
  }

  const handleStatusUpdated = async ({ status, result }) => {
    const adminToken = localStorage.getItem('adminToken')

    if (!adminToken) {
      navigate('/')
      return
    }

    const matchId = statusModal.match?.id

    if (!matchId) return

    try {
      const response = await apiFetch(`/api/admin/matches/${matchId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          status,
          ...(status === 'completed' ? { result } : {}),
        }),
      })

      const payload = await response.json()

      if (response.status === 401) {
        localStorage.removeItem('adminToken')
        localStorage.removeItem('adminUser')
        throw new Error('Invalid token. Please log in again.')
      }

      if (response.status === 403) {
        throw new Error('Admin access required.')
      }

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || 'Unable to update match status.')
      }

      const updatedMatch = mapApiMatchToRow(payload?.data?.match || {})
      setMatches((prev) => prev.map((match) => (match.id === updatedMatch.id ? updatedMatch : match)))
      closeStatusModal()
    } catch (err) {
      if ((err.message || '') === 'Invalid token. Please log in again.') {
        navigate('/')
      }

      throw err
    }
  }

  return (
    <div className="dashboard-main">
      <Header title="Match Management" />
      <div className="dashboard-content matches-content">
        <div className="matches-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="matches-toolbar">
          <div className="matches-search">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="Search by club name or league"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="matches-filters">
            <div className="dropdown-wrapper">
              <button
                className="status-dropdown"
                onClick={() => {}}
              >
                Status
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>
            <button type="button" className="btn-new-match" onClick={() => setShowNewMatchModal(true)}>
              <span>New Match</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {fetchError ? <p className="match-form-message error">{fetchError}</p> : null}

        <div className="matches-table-wrapper">
          <table className="matches-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={filteredMatches.length > 0 && selectedRows.length === filteredMatches.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th>Match</th>
                <th>League</th>
                <th>Date & Time</th>
                <th>Prediction</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="matches-empty-state">Loading matches...</td>
                </tr>
              ) : null}

              {!isLoading && filteredMatches.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Select ${row.match}`}
                    />
                  </td>
                  <td className="match-cell">{row.match}</td>
                  <td>{row.league}</td>
                  <td>{row.dateTime}</td>
                  <td>{row.prediction}</td>
                  <td>
                    <span className={`status-pill ${row.status}`}>
                      <span className="status-dot" />
                      {getStatusLabel(row.status)}
                    </span>
                  </td>
                  <td>
                    <button className="action-btn" aria-label="Update status" onClick={() => openStatusModal(row)}>
                      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                        <circle cx="12" cy="6" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="18" r="1.5" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && !filteredMatches.length && (
                <tr>
                  <td colSpan="7" className="matches-empty-state">No matches found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NewMatchModal
        isOpen={showNewMatchModal}
        onClose={() => setShowNewMatchModal(false)}
        onCreated={handleMatchCreated}
      />

      <UpdateMatchStatusModal
        isOpen={statusModal.isOpen}
        match={statusModal.match}
        onClose={closeStatusModal}
        onSubmit={handleStatusUpdated}
      />
    </div>
  )
}
