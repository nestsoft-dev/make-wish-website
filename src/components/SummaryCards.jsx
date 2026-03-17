function CardIcon() {
  return (
    <div className="summary-card-icon">
      <svg viewBox="0 0 24 24" width="24" height="24">
        <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" />
      </svg>
    </div>
  )
}

export function SummaryCards({ totals, revenueLabel, isLoading }) {
  const cards = [
    { title: 'Total Users', value: totals?.totalUsers ?? 0 },
    { title: 'Generated Revenue', value: revenueLabel || '₦0', dropdown: true },
    { title: 'Total Revenue', value: revenueLabel || '₦0' },
    { title: 'Predictions Sold', value: totals?.predictionsSold ?? 0 },
    { title: 'Total Matches', value: totals?.totalMatches ?? 0, dropdown: true },
    {
      title: 'Current Year',
      value: isLoading ? '...' : new Date().getFullYear(),
    },
  ]

  return (
    <div className="summary-cards">
      {cards.map((card) => (
        <div key={card.title} className="summary-card">
          <div className="summary-card-header">
            <CardIcon />
            {card.dropdown && (
              <select className="summary-dropdown" defaultValue="month">
                <option value="month">Month</option>
              </select>
            )}
          </div>
          <div className="summary-card-body">
            <span className="summary-value">{isLoading ? 'Loading...' : card.value}</span>
            <span className="summary-title">{card.title}</span>
            {card.sub && <span className="summary-sub">{card.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  )
}
