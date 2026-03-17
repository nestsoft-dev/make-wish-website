import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const revenue = payload.find((item) => item.dataKey === 'revenue')?.value || 0
  const predictionsSold = payload.find((item) => item.dataKey === 'predictionsSold')?.value || 0

  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      <p className="tooltip-revenue">Revenue {formatCurrency(revenue)}</p>
      <p className="tooltip-profits">Predictions Sold {predictionsSold}</p>
    </div>
  )
}

export function RevenueChart({ data, year, isLoading }) {
  const chartData = data || []

  return (
    <div className="revenue-chart-card">
      <div className="chart-header">
        <h3>Revenue Chart</h3>
        <div className="chart-legend-row">
          <div className="chart-legend">
            <span className="legend-dot revenue" />
            <span>Total Revenue</span>
            <span className="legend-dot profits" />
            <span>Predictions Sold</span>
          </div>
          <select className="chart-dropdown" defaultValue={String(year || new Date().getFullYear())}>
            <option value={String(year || new Date().getFullYear())}>{year || new Date().getFullYear()}</option>
          </select>
        </div>
      </div>
      <div className="chart-container">
        {isLoading ? <div className="dashboard-state">Loading revenue chart...</div> : null}
        {!isLoading && (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar dataKey="revenue" fill="#fbbf24" radius={[4, 4, 0, 0]} name="Total Revenue" />
            <Bar dataKey="predictionsSold" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Predictions Sold" />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
