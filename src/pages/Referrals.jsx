import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { ConfirmModal } from '../components/ConfirmModal'
import { apiFetch } from '../utils/api'
import '../styles/Referrals.css'

const PAGE_LIMIT = 20

function formatCurrency(amount, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function mapReferralToRow(referral) {
  return {
    id: referral._id,
    referrer: referral.referrer?.fullName || '--',
    email: referral.refereeEmail || referral.referee?.email || '--',
    referee: referral.referee?.fullName || '--',
    code: referral.referralCode || '--',
    amount: formatCurrency(referral.amount, referral.currency),
    rawAmount: referral.amount || 0,
    currency: referral.currency || 'NGN',
    status: referral.status || 'pending',
  }
}

export function Referrals() {
  const navigate = useNavigate()
  const [referrals, setReferrals] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_LIMIT, pages: 1 })
  const [selectedRows, setSelectedRows] = useState([])
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, variant: null, referral: null })
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    let isCancelled = false

    const loadReferrals = async () => {
      const adminToken = localStorage.getItem('adminToken')

      if (!adminToken) {
        navigate('/')
        return
      }

      setIsLoading(true)
      setFetchError('')

      try {
        const response = await apiFetch(`/api/referrals?page=${pagination.page}&limit=${PAGE_LIMIT}`, {
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
          throw new Error(result?.message || 'Unable to fetch referrals.')
        }

        if (isCancelled) return

        setReferrals((result?.data?.referrals || []).map(mapReferralToRow))
        setPagination((prev) => ({
          ...prev,
          ...(result?.data?.pagination || {}),
        }))
        setSelectedRows([])
      } catch (err) {
        if (!isCancelled) {
          setFetchError(err.message || 'Unable to fetch referrals.')
          setReferrals([])

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

    loadReferrals()

    return () => {
      isCancelled = true
    }
  }, [navigate, pagination.page])

  const metrics = useMemo(() => {
    const pending = referrals.filter((item) => item.status === 'pending').length
    const confirmed = referrals.filter((item) => item.status === 'confirmed').length
    const rewardPaid = referrals
      .filter((item) => item.status === 'confirmed')
      .reduce((sum, item) => sum + item.rawAmount, 0)

    return {
      total: pagination.total,
      pending,
      confirmed,
      rewardPaid: formatCurrency(rewardPaid),
    }
  }, [pagination.total, referrals])

  const toggleRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedRows.length === referrals.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(referrals.map((r) => r.id))
    }
  }

  const handleApprove = (referral) => {
    setConfirmModal({ isOpen: true, variant: 'credit', referral })
  }

  const handleReject = (referral) => {
    setConfirmModal({ isOpen: true, variant: 'expire', referral })
  }

  const handleConfirm = () => {
    if (confirmModal.variant === 'expire') {
      setReferrals((prev) => prev.map((item) => (
        item.id === confirmModal.referral?.id ? { ...item, status: 'expired' } : item
      )))
    } else {
      setReferrals((prev) => prev.map((item) => (
        item.id === confirmModal.referral?.id ? { ...item, status: 'confirmed' } : item
      )))
    }
    setConfirmModal({ isOpen: false, variant: null, referral: null })
  }

  const handleCancelConfirm = () => {
    setConfirmModal({ isOpen: false, variant: null, referral: null })
  }

  return (
    <div className="dashboard-main">
      <Header title="Referrals" />
      <div className="dashboard-content referrals-content">
        <div className="referrals-overview">
          <div className="overview-item">
            <span className="overview-label">Total Referrals</span>
            <span className="overview-value">{metrics.total}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Pending Referrals</span>
            <span className="overview-value">{metrics.pending}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Credited</span>
            <span className="overview-value">{metrics.confirmed}</span>
          </div>
          <div className="overview-item">
            <span className="overview-label">Reward Paid</span>
            <span className="overview-value">{metrics.rewardPaid}</span>
          </div>
        </div>

        {fetchError ? <p className="referrals-message referrals-message-error">{fetchError}</p> : null}

        <div className="referrals-table-wrapper">
          <table className="referrals-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={referrals.length > 0 && selectedRows.length === referrals.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th>REFERRER</th>
                <th>Email</th>
                <th>REFEREE</th>
                <th>Code</th>
                <th>AMOUNT</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="referrals-empty-state">Loading referrals...</td>
                </tr>
              ) : null}

              {!isLoading && referrals.map((row) => (
                <tr key={row.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Select ${row.referee}`}
                    />
                  </td>
                  <td>{row.referrer}</td>
                  <td>{row.email}</td>
                  <td>{row.referee}</td>
                  <td>{row.code}</td>
                  <td>{row.amount}</td>
                  <td>
                    <span className={`status-pill status-${row.status}`}>
                      <span className="status-dot" />
                      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    {row.status === 'pending' ? (
                      <div className="action-buttons">
                        <button
                          type="button"
                          className="action-btn action-approve"
                          onClick={() => handleApprove(row)}
                          aria-label="Approve"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          className="action-btn action-reject"
                          onClick={() => handleReject(row)}
                          aria-label="Reject"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <span className="action-dash">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {!isLoading && !referrals.length ? (
                <tr>
                  <td colSpan="8" className="referrals-empty-state">No referrals found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="referrals-footer">
          <span className="referrals-results">
            Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} to {pagination.total === 0 ? 0 : Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </span>
          <div className="referrals-pagination">
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

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        variant={confirmModal.variant}
        referral={confirmModal.referral}
        onConfirm={handleConfirm}
        onCancel={handleCancelConfirm}
      />
    </div>
  )
}
