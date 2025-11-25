import './SummaryStats.css'

function SummaryStats({ lineItems }) {
  const totalValue = lineItems.reduce((sum, item) => sum + (item.VALUE || 0), 0)
  const totalQuantity = lineItems.reduce((sum, item) => sum + (item.QUANTITY || 0), 0)
  const totalNetWeight = lineItems.reduce((sum, item) => sum + (item.NET_WEIGHT || 0), 0)
  const totalGrossWeight = lineItems.reduce((sum, item) => sum + (item.GROSS_WEIGHT || 0), 0)

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return (
    <div className="summary-stats">
      <h2>Summary</h2>
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <p className="stat-label">Total Line Items</p>
          <p className="stat-value">{lineItems.length}</p>
        </div>
        <div className="stat-card stat-green">
          <p className="stat-label">Total Quantity</p>
          <p className="stat-value">{totalQuantity}</p>
        </div>
        <div className="stat-card stat-purple">
          <p className="stat-label">Total Value</p>
          <p className="stat-value">{formatCurrency(totalValue)}</p>
        </div>
        <div className="stat-card stat-orange">
          <p className="stat-label">Total Net Weight</p>
          <p className="stat-value">{totalNetWeight.toFixed(2)} kg</p>
        </div>
        <div className="stat-card stat-teal">
          <p className="stat-label">Total Gross Weight</p>
          <p className="stat-value">{totalGrossWeight.toFixed(2)} kg</p>
        </div>
      </div>
    </div>
  )
}

export default SummaryStats

