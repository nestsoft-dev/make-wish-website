import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { TransactionDetailsModal } from '../components/TransactionDetailsModal'
import '../styles/Transactions.css'

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
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString))
}

function prettifyTransactionType(type) {
  if (!type) return '--'

  return type
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function mapTransactionToRow(transaction) {
  return {
    apiId: transaction._id,
    id: transaction.transactionId || transaction.reference || transaction._id,
    type: prettifyTransactionType(transaction.type),
    rawType: transaction.type || 'unknown',
    fromTo: transaction.counterparty?.label || '--',
    amount: formatCurrency(transaction.amount, transaction.currency),
    rawAmount: transaction.amount || 0,
    currency: transaction.currency || 'NGN',
    date: formatDate(transaction.occurredAt || transaction.createdAt),
    occurredAt: transaction.occurredAt || transaction.createdAt,
    status: transaction.status || 'pending',
    reference: transaction.reference || '--',
    description: transaction.description || '--',
    fromName: transaction.counterparty?.from?.fullName || '--',
    toName: transaction.counterparty?.to?.fullName || '--',
  }
}

function MoneyIcon() {
  return (
    <div className="tx-card-icon">
      <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
        <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="2" />
        <path d="M7 10h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M17 14h0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function Transactions() {
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [query, setQuery] = useState('')
  const [sortType, setSortType] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState([])
  const [details, setDetails] = useState({ isOpen: false, transaction: null })
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_LIMIT, pages: 1 })
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [detailsError, setDetailsError] = useState('')

  useEffect(() => {
    let isCancelled = false

    const loadTransactions = async () => {
      const adminToken = localStorage.getItem('adminToken')

      if (!adminToken) {
        navigate('/')
        return
      }

      setIsLoading(true)
      setFetchError('')

      try {
        const response = await fetch(`/api/transactions?page=${pagination.page}&limit=${PAGE_LIMIT}`, {
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
          throw new Error(result?.message || 'Unable to fetch transactions.')
        }

        if (isCancelled) return

        setTransactions((result?.data?.transactions || []).map(mapTransactionToRow))
        setPagination((prev) => ({
          ...prev,
          ...(result?.data?.pagination || {}),
        }))
        setSelected([])
      } catch (err) {
        if (!isCancelled) {
          setFetchError(err.message || 'Unable to fetch transactions.')
          setTransactions([])

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

    loadTransactions()

    return () => {
      isCancelled = true
    }
  }, [navigate, pagination.page])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((t) => {
      const matchesQuery =
        !q ||
        t.id.toLowerCase().includes(q) ||
        t.type.toLowerCase().includes(q) ||
        t.fromTo.toLowerCase().includes(q)

      const matchesType = sortType === 'all' ? true : t.rawType === sortType
      const matchesStatus = statusFilter === 'all' ? true : t.status === statusFilter
      return matchesQuery && matchesType && matchesStatus
    })
  }, [query, sortType, statusFilter, transactions])

  const summary = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        if (transaction.status === 'success') acc.inflow += transaction.rawAmount
        else acc.outflow += transaction.rawAmount
        return acc
      },
      { inflow: 0, outflow: 0 }
    )
  }, [transactions])

  const typeOptions = useMemo(() => {
    return Array.from(new Set(transactions.map((transaction) => transaction.rawType).filter(Boolean)))
  }, [transactions])

  const toggleRow = (idx) => {
    setSelected((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    )
  }

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([])
    else setSelected(filtered.map((_, i) => i))
  }

  const openDetails = async (transaction) => {
    const adminToken = localStorage.getItem('adminToken')

    if (!adminToken) {
      navigate('/')
      return
    }

    setDetails({ isOpen: true, transaction })
    setDetailsError('')
    setIsLoadingDetails(true)

    try {
      const response = await fetch(`/api/transactions/${transaction.apiId}`, {
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

      const payload = result?.data?.transaction || result?.data || transaction
      setDetails({ isOpen: true, transaction: mapTransactionToRow(payload) })
    } catch (err) {
      setDetailsError(err.message || 'Unable to fetch transaction details.')

      if ((err.message || '') === 'Invalid token. Please log in again.') {
        navigate('/')
      }
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const closeDetails = () => {
    setDetails({ isOpen: false, transaction: null })
  }

  return (
    <div className="dashboard-main">
      <Header title="Transactions" />
      <div className="dashboard-content tx-content">
        <div className="tx-summary">
          <div className="tx-card">
            <MoneyIcon />
            <div className="tx-card-body">
              <span className="tx-card-label">Total Inflow</span>
              <span className="tx-card-value">{formatCurrency(summary.inflow)}</span>
            </div>
          </div>
          <div className="tx-card">
            <MoneyIcon />
            <div className="tx-card-body">
              <span className="tx-card-label">Total Outflow</span>
              <span className="tx-card-value">{formatCurrency(summary.outflow)}</span>
            </div>
          </div>
        </div>

        <div className="tx-table-shell">
          <div className="tx-toolbar">
            <div className="tx-search">
              <svg className="tx-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search by Transaction ID"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="tx-filters">
              <select
                className="tx-select"
                value={sortType}
                onChange={(e) => setSortType(e.target.value)}
              >
                <option value="all">Sort by Types</option>
                {typeOptions.map((type) => (
                  <option key={type} value={type}>{prettifyTransactionType(type)}</option>
                ))}
              </select>
              <select
                className="tx-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Status</option>
                <option value="success">Success</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {fetchError ? <p className="tx-message tx-message-error">{fetchError}</p> : null}

          <div className="tx-table-wrapper">
            <table className="tx-table">
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
                  <th>FROM → TO</th>
                  <th>AMOUNT</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="tx-empty">
                      Loading transactions...
                    </td>
                  </tr>
                ) : null}

                {!isLoading && filtered.map((row, idx) => (
                  <tr key={`${row.id}-${idx}`}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(idx)}
                        onChange={() => toggleRow(idx)}
                        aria-label={`Select ${row.id}`}
                      />
                    </td>
                    <td className="tx-id">{row.id}</td>
                    <td>{row.type}</td>
                    <td>{row.fromTo}</td>
                    <td>{row.amount}</td>
                    <td>{row.date}</td>
                    <td>
                      <span className={`tx-status ${row.status}`}>
                        <span className="tx-status-dot" />
                        {row.status === 'success' ? 'Success' : 'Pending'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="tx-view"
                        type="button"
                        aria-label="View"
                        onClick={() => openDetails(row)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="tx-empty">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="tx-footer">
            <span className="tx-results">
              Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} to {pagination.total === 0 ? 0 : Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </span>
            <div className="tx-pagination">
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

      <TransactionDetailsModal
        isOpen={details.isOpen}
        transaction={details.transaction}
        isLoading={isLoadingDetails}
        error={detailsError}
        onClose={closeDetails}
      />
    </div>
  )
}

