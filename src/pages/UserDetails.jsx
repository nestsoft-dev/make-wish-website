import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Header } from '../components/Header'
import { TransactionDetailsModal } from '../components/TransactionDetailsModal'
import { DeleteUserModal } from '../components/DeleteUserModal'
import { DeleteUserReasonModal } from '../components/DeleteUserReasonModal'
import { AccountDeletedModal } from '../components/AccountDeletedModal'
import '../styles/UserDetails.css'

const PAGE_LIMIT = 20

function formatCurrency(amount, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function formatDate(dateString) {
  if (!dateString) return '--'

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString))
}

function prettifyValue(value) {
  if (!value) return '--'

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function mapUserTransaction(transaction, user) {
  return {
    apiId: transaction._id,
    id: transaction.reference || transaction._id,
    type: prettifyValue(transaction.category || transaction.type),
    rawType: transaction.category || transaction.type || 'all',
    date: formatDate(transaction.createdAt),
    amount: formatCurrency(transaction.amount, transaction.walletId?.currency || 'NGN'),
    rawAmount: transaction.amount || 0,
    status: transaction.status || 'pending',
    reference: transaction.reference || '--',
    description: transaction.description || '--',
    fromName: transaction.type === 'credit' ? 'System / Provider' : (user?.fullName || '--'),
    toName: transaction.type === 'credit' ? (user?.fullName || '--') : 'Platform',
    fromTo: transaction.type === 'credit'
      ? `System → ${user?.fullName || 'User'}`
      : `${user?.fullName || 'User'} → Platform`,
  }
}

export function UserDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [userData, setUserData] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_LIMIT, pages: 1 })
  const [isLoadingUser, setIsLoadingUser] = useState(false)
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false)
  const [pageError, setPageError] = useState('')

  const [q, setQ] = useState('')
  const [typeSort, setTypeSort] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState([])
  const [showDelete, setShowDelete] = useState(false)
  const [showDeleteReason, setShowDeleteReason] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [transactionDetails, setTransactionDetails] = useState({ isOpen: false, transaction: null })
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  useEffect(() => {
    let isCancelled = false

    const loadUser = async () => {
      const adminToken = localStorage.getItem('adminToken')

      if (!adminToken) {
        navigate('/')
        return
      }

      setIsLoadingUser(true)
      setPageError('')

      try {
        const response = await fetch(`/api/users/${id}`, {
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
          throw new Error(result?.message || 'Unable to fetch user details.')
        }

        if (!isCancelled) {
          setUserData(result?.data || null)
        }
      } catch (err) {
        if (!isCancelled) {
          setPageError(err.message || 'Unable to fetch user details.')
          if ((err.message || '') === 'Invalid token. Please log in again.') {
            navigate('/')
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingUser(false)
        }
      }
    }

    loadUser()

    return () => {
      isCancelled = true
    }
  }, [id, navigate])

  useEffect(() => {
    let isCancelled = false

    const loadTransactions = async () => {
      const adminToken = localStorage.getItem('adminToken')

      if (!adminToken) {
        navigate('/')
        return
      }

      setIsLoadingTransactions(true)
      setPageError('')

      try {
        const response = await fetch(`/api/users/${id}/transactions?page=${pagination.page}&limit=${PAGE_LIMIT}`, {
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
          throw new Error(result?.message || 'Unable to fetch user transactions.')
        }

        if (!isCancelled) {
          const txUser = result?.data?.user || userData?.user
          setTransactions((result?.data?.transactions || []).map((transaction) => mapUserTransaction(transaction, txUser)))
          setPagination((prev) => ({
            ...prev,
            ...(result?.data?.pagination || {}),
          }))
          setSelected([])
        }
      } catch (err) {
        if (!isCancelled) {
          setPageError(err.message || 'Unable to fetch user transactions.')
          setTransactions([])
          if ((err.message || '') === 'Invalid token. Please log in again.') {
            navigate('/')
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingTransactions(false)
        }
      }
    }

    loadTransactions()

    return () => {
      isCancelled = true
    }
  }, [id, navigate, pagination.page, userData?.user])

  const user = userData?.user || null
  const wallet = userData?.wallet || null
  const stats = userData?.stats || { transactionsCount: 0, predictionsPurchased: 0 }

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return transactions.filter((t) => {
      const matchesQ =
        !query ||
        t.id.toLowerCase().includes(query) ||
        t.type.toLowerCase().includes(query)
      const matchesType = typeSort === 'all' ? true : t.rawType === typeSort
      const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter
      return matchesQ && matchesType && matchesStatus
    })
  }, [q, transactions, typeSort, statusFilter])

  const typeOptions = useMemo(
    () => Array.from(new Set(transactions.map((item) => item.rawType).filter(Boolean))),
    [transactions]
  )

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([])
    else setSelected(filtered.map((_, i) => i))
  }

  const toggleRow = (idx) => {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    )
  }

  const handleDelete = () => {
    setShowDelete(true)
  }

  const cancelDelete = () => setShowDelete(false)
  const confirmDelete = () => {
    setShowDelete(false)
    setShowDeleteReason(true)
  }

  const closeDeleteReason = () => setShowDeleteReason(false)
  const confirmDeleteReason = async () => {
    const adminToken = localStorage.getItem('adminToken')

    if (!adminToken) {
      navigate('/')
      return
    }

    setIsDeleting(true)
    setPageError('')

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
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
        throw new Error(result?.message || 'Unable to delete user account.')
      }

      setShowDeleteReason(false)
      setShowDeleted(true)
    } catch (err) {
      setPageError(err.message || 'Unable to delete user account.')
      if ((err.message || '') === 'Invalid token. Please log in again.') {
        navigate('/')
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const closeDeleted = () => {
    setShowDeleted(false)
    navigate('/users')
  }

  const openTransactionDetails = async (transaction) => {
    const adminToken = localStorage.getItem('adminToken')

    if (!adminToken) {
      navigate('/')
      return
    }

    setTransactionDetails({ isOpen: true, transaction })
    setIsLoadingDetails(true)
    setDetailsError('')

    try {
      const response = await fetch(`/api/users/${id}/transactions/${transaction.apiId}`, {
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
        throw new Error(result?.message || 'Unable to fetch transaction details.')
      }

      const detailUser = result?.data?.user || user
      const detailTransaction = result?.data?.transaction || {}
      const predictionPurchase = result?.data?.predictionPurchase
      const mapped = mapUserTransaction(detailTransaction, detailUser)

      setTransactionDetails({
        isOpen: true,
        transaction: {
          ...mapped,
          extraDetails: predictionPurchase
            ? [
                {
                  label: 'Prediction Title',
                  value: predictionPurchase.predictionId?.title || '--',
                },
                {
                  label: 'Prediction Price',
                  value: formatCurrency(predictionPurchase.predictionId?.price || 0),
                },
                {
                  label: 'Match Kickoff',
                  value: formatDate(predictionPurchase.matchId?.kickoffAt),
                },
                {
                  label: 'Match Status',
                  value: prettifyValue(predictionPurchase.matchId?.status),
                },
              ]
            : [
                {
                  label: 'Category',
                  value: prettifyValue(detailTransaction.category),
                },
                {
                  label: 'Balance Before',
                  value: formatCurrency(detailTransaction.balanceBefore || 0),
                },
                {
                  label: 'Balance After',
                  value: formatCurrency(detailTransaction.balanceAfter || 0),
                },
                {
                  label: 'Provider Ref',
                  value: detailTransaction.providerReference || '--',
                },
              ],
        },
      })
    } catch (err) {
      setDetailsError(err.message || 'Unable to fetch transaction details.')
      if ((err.message || '') === 'Invalid token. Please log in again.') {
        navigate('/')
      }
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeTransactionDetails = () => {
    setTransactionDetails({ isOpen: false, transaction: null })
    setDetailsError('')
  }

  return (
    <div className="dashboard-main">
      <Header title="User Details" />
      <div className="dashboard-content ud-content">
        {pageError ? <p className="ud-message ud-message-error">{pageError}</p> : null}

        <div className="ud-subheader">
          <button type="button" className="ud-back" onClick={() => navigate('/users')}>
            <span className="ud-back-icon">←</span>
            <span>User Details</span>
          </button>
          <span className="ud-badge">
            <span className="ud-badge-dot" />
            {isLoadingUser ? 'Loading...' : user?.isVerified ? 'Verified' : 'Unverified'}
          </span>
        </div>

        <div className="ud-top">
          <div className="ud-card">
            <div className="ud-card-header">
              <h2 className="ud-name">{isLoadingUser ? 'Loading...' : (user?.fullName || '--')}</h2>
            </div>
            <div className="ud-grid">
              <div className="ud-item">
                <span className="ud-k">Email Address</span>
                <span className="ud-v strong">{isLoadingUser ? 'Loading...' : (user?.email || '--')}</span>
              </div>
              <div className="ud-item">
                <span className="ud-k">Phone Number</span>
                <span className="ud-v strong">{isLoadingUser ? 'Loading...' : (user?.phoneNumber || '--')}</span>
              </div>
              <div className="ud-item">
                <span className="ud-k">Gender</span>
                <span className="ud-v strong">{isLoadingUser ? 'Loading...' : prettifyValue(user?.gender)}</span>
              </div>
              <div className="ud-item">
                <span className="ud-k">Status</span>
                <span className={`ud-v ${user?.isVerified ? 'verified' : ''}`}>{isLoadingUser ? 'Loading...' : (user?.isVerified ? 'Verified' : 'Unverified')}</span>
              </div>
              <div className="ud-item">
                <span className="ud-k">Country</span>
                <span className="ud-v strong">{isLoadingUser ? 'Loading...' : (user?.country || '--')}</span>
              </div>
              <div className="ud-item">
                <span className="ud-k">Referral Code</span>
                <span className="ud-v strong">{isLoadingUser ? 'Loading...' : (user?.referralCode || '--')}</span>
              </div>
            </div>
          </div>

          <div className="ud-side">
            <div className="ud-actions">
              <button type="button" className="ud-btn ud-btn-outline" onClick={handleDelete}>
                Disable Account
              </button>
              <button type="button" className="ud-btn ud-btn-outline">Suspend User</button>
            </div>

            <div className="ud-referral">
              <div className="ud-referral-top">
                <div>
                  <div className="ud-referral-title">WALLET & STATS</div>
                  <div className="ud-referral-sub">Transactions: <span>{stats.transactionsCount}</span></div>
                </div>
                <button type="button" className="ud-history">
                  Purchases: <span className="ud-history-arrow">{stats.predictionsPurchased}</span>
                </button>
              </div>
              <div className="ud-referral-body ud-wallet-body">
                <div className="ud-wallet-row">
                  <span>Available Balance</span>
                  <strong>{formatCurrency(wallet?.availableBalance || 0, wallet?.currency || 'NGN')}</strong>
                </div>
                <div className="ud-wallet-row">
                  <span>Locked Balance</span>
                  <strong>{formatCurrency(wallet?.lockedBalance || 0, wallet?.currency || 'NGN')}</strong>
                </div>
                <div className="ud-wallet-row">
                  <span>Reward Balance</span>
                  <strong>{formatCurrency(user?.rewardBalance || 0, wallet?.currency || 'NGN')}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="ud-tx-shell">
          <div className="ud-tx-header">
            <h3>All Transactions</h3>
            <div className="ud-tx-controls">
              <div className="ud-tx-search">
                <svg className="ud-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  placeholder="Search by Transaction ID"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <select className="ud-tx-select" value={typeSort} onChange={(e) => setTypeSort(e.target.value)}>
                <option value="all">Sort by Types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>{prettifyValue(type)}</option>
                ))}
              </select>
              <select className="ud-tx-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="ud-table-wrap">
            <table className="ud-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={filtered.length > 0 && selected.length === filtered.length}
                      onChange={toggleAll}
                      aria-label="Select all"
                    />
                  </th>
                  <th>TRANSACTION ID</th>
                  <th>TYPE</th>
                  <th>DATE</th>
                  <th>AMOUNT</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingTransactions ? (
                  <tr>
                    <td colSpan="7" className="ud-empty-state">Loading transactions...</td>
                  </tr>
                ) : null}

                {!isLoadingTransactions && filtered.map((row, idx) => (
                  <tr key={`${row.id}-${idx}`}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(idx)}
                        onChange={() => toggleRow(idx)}
                        aria-label={`Select ${row.id}`}
                      />
                    </td>
                    <td className="ud-tx-id">{row.id}</td>
                    <td>{row.type}</td>
                    <td>{row.date}</td>
                    <td>{row.amount}</td>
                    <td>
                      <span className={`ud-status ${row.status}`}>
                        <span className="ud-status-dot" />
                        {row.status === 'success' ? 'Success' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="ud-more" aria-label="More" onClick={() => openTransactionDetails(row)}>
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                          <circle cx="12" cy="6" r="1.5" />
                          <circle cx="12" cy="12" r="1.5" />
                          <circle cx="12" cy="18" r="1.5" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoadingTransactions && !filtered.length ? (
                  <tr>
                    <td colSpan="7" className="ud-empty-state">No transactions found.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="ud-footer">
            <span className="ud-results">
              Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} to {pagination.total === 0 ? 0 : Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </span>
            <div className="ud-pagination">
              <button type="button" className="page-btn" aria-label="Previous" disabled={pagination.page <= 1 || isLoadingTransactions} onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}>‹</button>
              {Array.from({ length: Math.max(1, pagination.pages || 1) }, (_, index) => index + 1)
                .slice(0, 5)
                .map((page) => (
                  <button key={page} type="button" className={`page-num ${pagination.page === page ? 'active' : ''}`} disabled={isLoadingTransactions} onClick={() => setPagination((prev) => ({ ...prev, page }))}>{page}</button>
                ))}
              <button type="button" className="page-btn" aria-label="Next" disabled={pagination.page >= (pagination.pages || 1) || isLoadingTransactions} onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(pagination.pages || 1, prev.page + 1) }))}>›</button>
            </div>
          </div>
        </div>

        <DeleteUserModal
          isOpen={showDelete}
          title="Delete Worker Account?"
          message="Deleting this account will revoke Worker access to his/her account"
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
        />

        <DeleteUserReasonModal
          isOpen={showDeleteReason}
          onClose={closeDeleteReason}
          onDelete={confirmDeleteReason}
          isSubmitting={isDeleting}
        />

        <AccountDeletedModal isOpen={showDeleted} onClose={closeDeleted} />

        <TransactionDetailsModal
          isOpen={transactionDetails.isOpen}
          transaction={transactionDetails.transaction}
          isLoading={isLoadingDetails}
          error={detailsError}
          onClose={closeTransactionDetails}
        />
      </div>
    </div>
  )
}

