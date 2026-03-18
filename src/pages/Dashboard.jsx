import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../components/Header'
import { SummaryCards } from '../components/SummaryCards'
import { RevenueChart } from '../components/RevenueChart'
import { RevenueBreakdown } from '../components/RevenueBreakdown'
import { apiFetch } from '../utils/api'

function formatCurrency(amount, currency = 'NGN') {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export function Dashboard() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isCancelled = false

    const loadOverview = async () => {
      const adminToken = localStorage.getItem('adminToken')

      if (!adminToken) {
        navigate('/')
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const response = await apiFetch('/api/admin/dashboard/overview', {
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
          throw new Error(result?.message || 'Unable to fetch dashboard overview.')
        }

        if (!isCancelled) {
          setOverview(result.data)
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err.message || 'Unable to fetch dashboard overview.')

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

    loadOverview()

    return () => {
      isCancelled = true
    }
  }, [navigate])

  const totals = overview?.totals || {
    generatedRevenue: 0,
    totalUsers: 0,
    predictionsSold: 0,
    totalMatches: 0,
  }
  const monthlyRevenue = overview?.monthlyRevenue || []

  return (
    <div className="dashboard-main">
      <Header title="Dashboard" />
      <div className="dashboard-content">
        {error ? <p className="dashboard-message dashboard-message-error">{error}</p> : null}
        <SummaryCards
          totals={totals}
          revenueLabel={formatCurrency(totals.generatedRevenue)}
          isLoading={isLoading}
        />
        <div className="dashboard-charts">
          <RevenueChart
            data={monthlyRevenue}
            year={overview?.year}
            isLoading={isLoading}
          />
          <RevenueBreakdown
            data={monthlyRevenue}
            year={overview?.year}
            totalRevenue={totals.generatedRevenue}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
