function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export function RevenueBreakdown({ data, year, totalRevenue, isLoading }) {
  const soldItems = (data || []).map((item, index) => ({
    id: index + 1,
    label: `${item.month} Predictions Sold`,
    value: `${item.predictionsSold}`,
    revenue: formatCurrency(item.revenue),
  }))

  const topMonth = [...(data || [])].sort((a, b) => (b.revenue || 0) - (a.revenue || 0))[0]

  return (
    <div className="revenue-breakdown-card">
      <div className="breakdown-header">
        <h3>Revenue Breakdown</h3>
        <select className="breakdown-dropdown" defaultValue={String(year || new Date().getFullYear())}>
          <option value={String(year || new Date().getFullYear())}>{year || new Date().getFullYear()}</option>
        </select>
      </div>
      {isLoading ? <div className="dashboard-state">Loading revenue breakdown...</div> : null}
      {!isLoading && <ul className="breakdown-list">
        {soldItems.map((item) => (
          <li key={item.id} className="breakdown-item">
            <span>{item.label}</span>
            <span className="breakdown-value">{item.value}</span>
          </li>
        ))}
      </ul>}
      {!isLoading && <div className="breakdown-total">
        <div className="total-row">
          <span>Total Prediction Sold</span>
          <span className="total-value">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="total-trend">
          <svg className="trend-icon" viewBox="0 0 24 24" width="16" height="16">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>{topMonth ? `${topMonth.month} highest revenue: ${formatCurrency(topMonth.revenue)}` : 'No monthly revenue yet'}</span>
        </div>
      </div>}
    </div>
  )
}
