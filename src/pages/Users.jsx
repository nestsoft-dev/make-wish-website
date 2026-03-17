import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import '../styles/Users.css'

const PAGE_LIMIT = 20

const STATUS_CARDS = [
  { id: 'all', label: 'All Users' },
  { id: 'verified', label: 'Verified' },
  { id: 'unverified', label: 'Unverified' },
]

function formatDate(dateString) {
  if (!dateString) return '--'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString))
}

function mapUserToRow(user) {
  return {
    id: user._id,
    name: user.fullName || '--',
    email: user.email || '--',
    phone: user.phoneNumber || '--',
    dateJoined: formatDate(user.createdAt),
    status: user.isVerified ? 'active' : 'inactive',
  }
}

export function Users() {
  const [users, setUsers] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [activeStatus, setActiveStatus] = useState('all')
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_LIMIT, pages: 1 })
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let isCancelled = false

    const loadUsers = async () => {
      const adminToken = localStorage.getItem('adminToken')

      if (!adminToken) {
        navigate('/')
        return
      }

      setIsLoading(true)
      setFetchError('')

      try {
        const response = await fetch(`/api/users?page=${pagination.page}&limit=${PAGE_LIMIT}`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
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

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Unable to fetch users.')
        }

        if (isCancelled) return

        setUsers((result?.data?.users || []).map(mapUserToRow))
        setPagination((prev) => ({
          ...prev,
          ...(result?.data?.pagination || {}),
        }))
        setSelectedRows([])
      } catch (err) {
        if (!isCancelled) {
          setFetchError(err.message || 'Unable to fetch users.')
          setUsers([])

          if ((err.message || '') === 'Invalid token. Please log in again.') {
            navigate('/')
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      isCancelled = true
    }
  }, [navigate, pagination.page])

  const filtered = useMemo(() => {
    if (activeStatus === 'verified') return users.filter((u) => u.status === 'active')
    if (activeStatus === 'unverified') return users.filter((u) => u.status === 'inactive')
    return users
  }, [activeStatus, users])

  const statusCounts = useMemo(() => ({
    all: users.length,
    verified: users.filter((u) => u.status === 'active').length,
    unverified: users.filter((u) => u.status === 'inactive').length,
  }), [users])

  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedRows.length === filtered.length) setSelectedRows([])
    else setSelectedRows(filtered.map((r) => r.id))
  }

  const startResult = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1
  const endResult = pagination.total === 0
    ? 0
    : Math.min(pagination.page * pagination.limit, pagination.total)

  return (
    <div className="dashboard-main">
      <Header title="Users" />
      <div className="dashboard-content users-content">
        <div className="users-topbar">
          <div className="users-customers">
            <span className="customers-label">Number of Customers:</span>
            <span className="customers-value">{pagination.total}</span>
          </div>

          <button type="button" className="users-download">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download all as .csv
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <div className="users-filters-row">
          <div className="status-cards">
            {STATUS_CARDS.map((card) => (
              <button
                key={card.id}
                type="button"
                className={`status-card ${activeStatus === card.id ? 'active' : ''}`}
                onClick={() => setActiveStatus(card.id)}
              >
                <span className={`status-radio ${card.id}`} />
                <span className="status-card-label">{card.label}</span>
                <span className="status-card-count">{statusCounts[card.id]}</span>
              </button>
            ))}
          </div>

          <div className="users-actions">
            <button type="button" className="users-btn users-btn-outline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <line x1="4" y1="21" x2="4" y2="14" />
                <line x1="4" y1="10" x2="4" y2="3" />
                <line x1="12" y1="21" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12" y2="3" />
                <line x1="20" y1="21" x2="20" y2="16" />
                <line x1="20" y1="12" x2="20" y2="3" />
                <line x1="1" y1="14" x2="7" y2="14" />
                <line x1="9" y1="8" x2="15" y2="8" />
                <line x1="17" y1="16" x2="23" y2="16" />
              </svg>
              Filters
            </button>
            <button type="button" className="users-btn users-btn-outline">
              Show all
            </button>
          </div>
        </div>

        {fetchError ? <p className="users-message users-message-error">{fetchError}</p> : null}

        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={filtered.length > 0 && selectedRows.length === filtered.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th>NAME</th>
                <th>EMAIL</th>
                <th>PHONE NUMBER</th>
                <th>DATE JOINED</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="users-empty-state">Loading users...</td>
                </tr>
              ) : null}

              {!isLoading && filtered.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Select ${row.name}`}
                    />
                  </td>
                  <td className="users-name">{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.phone}</td>
                  <td>{row.dateJoined}</td>
                  <td>
                    <span className={`users-status ${row.status}`}>
                      <span className="users-status-dot" />
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="users-eye"
                      aria-label="View"
                      onClick={() => navigate(`/users/${row.id}`)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}

              {!isLoading && !filtered.length ? (
                <tr>
                  <td colSpan="7" className="users-empty-state">No users found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="users-footer">
          <span className="users-results">Showing {startResult} to {endResult} of {pagination.total} results</span>
          <div className="users-pagination">
            <button
              type="button"
              className="page-btn"
              aria-label="Previous"
              disabled={pagination.page <= 1 || isLoading}
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
            >
              ‹
            </button>
            {Array.from({ length: Math.max(1, pagination.pages || 1) }, (_, index) => index + 1)
              .slice(0, 5)
              .map((page) => (
                <button
                  key={page}
                  type="button"
                  className={`page-num ${pagination.page === page ? 'active' : ''}`}
                  disabled={isLoading}
                  onClick={() => setPagination((prev) => ({ ...prev, page }))}
                >
                  {page}
                </button>
              ))}
            <button
              type="button"
              className="page-btn"
              aria-label="Next"
              disabled={pagination.page >= (pagination.pages || 1) || isLoading}
              onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(pagination.pages || 1, prev.page + 1) }))}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

