import './ResultsTable.css'

function ResultsTable({ lineItems }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  return (
    <div className="results-table">
      <h2>Extracted Line Items</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Description</th>
              <th>HTS</th>
              <th>Country</th>
              <th>Packages</th>
              <th className="text-right">Quantity</th>
              <th className="text-right">Net Weight</th>
              <th className="text-right">Gross Weight</th>
              <th className="text-right">Unit Price</th>
              <th className="text-right">Value</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.map((item, index) => (
              <tr key={index}>
                <td>{item.SKU}</td>
                <td className="description-cell">{item.DESCRIPTION}</td>
                <td>{item.HTS}</td>
                <td>{item.COUNTRY_OF_ORIGIN}</td>
                <td>{item.NO_OF_PACKAGE || '-'}</td>
                <td className="text-right">{item.QUANTITY}</td>
                <td className="text-right">{item.NET_WEIGHT.toFixed(2)}</td>
                <td className="text-right">{item.GROSS_WEIGHT.toFixed(2)}</td>
                <td className="text-right">{formatCurrency(item.UNIT_PRICE)}</td>
                <td className="text-right font-bold">{formatCurrency(item.VALUE)}</td>
                <td>{item.QTY_UNIT}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ResultsTable

