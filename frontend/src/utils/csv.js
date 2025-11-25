/**
 * Format a number as a plain decimal string (no scientific notation)
 * Ensures numbers are written as plain decimals (e.g., 1234.56 not 1.23456e+3)
 * @param {number|string} value - The number to format
 * @param {number} maxDecimals - Maximum decimal places (default: 10)
 * @returns {string} - Formatted number as string
 */
const formatNumber = (value, maxDecimals = 10) => {
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === '') {
    return '0'
  }
  
  // Convert to number if it's a string
  const num = typeof value === 'string' ? parseFloat(value) : value
  
  // Handle NaN and invalid numbers
  if (isNaN(num) || !isFinite(num)) {
    return '0'
  }
  
  // For very large or very small numbers, use toLocaleString to avoid scientific notation
  // This handles numbers that might be converted to scientific notation
  if (Math.abs(num) >= 1e21 || (Math.abs(num) < 1e-6 && num !== 0)) {
    // Use toLocaleString with maximumFractionDigits to avoid scientific notation
    const formatted = num.toLocaleString('en-US', {
      maximumFractionDigits: maxDecimals,
      minimumFractionDigits: 0,
      useGrouping: false
    })
    return formatted
  }
  
  // For normal numbers, use toFixed to ensure proper decimal formatting
  let formatted = num.toFixed(maxDecimals)
  
  // Remove trailing zeros and decimal point if not needed
  formatted = formatted.replace(/\.?0+$/, '')
  
  // Double-check: if somehow we still have scientific notation, convert it
  if (formatted.includes('e') || formatted.includes('E')) {
    // Fallback: convert scientific notation manually
    const parts = formatted.split(/[eE]/)
    if (parts.length === 2) {
      const base = parseFloat(parts[0])
      const exponent = parseInt(parts[1])
      const multiplier = Math.pow(10, exponent)
      formatted = (base * multiplier).toFixed(maxDecimals).replace(/\.?0+$/, '')
    }
  }
  
  return formatted
}

export const convertToCSV = (items) => {
  const headers = [
    'SKU',
    'DESCRIPTION',
    'HTS',
    'COUNTRY OF ORIGIN',
    'NO. OF PACKAGE',
    'QUANTITY',
    'NET WEIGHT',
    'GROSS WEIGHT',
    'UNIT PRICE',
    'VALUE',
    'QTY UNIT'
  ]

  // Define which columns are numeric (indices)
  const numericColumns = [5, 6, 7, 8, 9] // QUANTITY, NET_WEIGHT, GROSS_WEIGHT, UNIT_PRICE, VALUE

  const rows = items.map(item => [
    item.SKU || '',
    item.DESCRIPTION || '',
    item.HTS || 'N/A',
    item.COUNTRY_OF_ORIGIN || 'N/A',
    item.NO_OF_PACKAGE || '',
    item.QUANTITY || 0,
    item.NET_WEIGHT || 0,
    item.GROSS_WEIGHT || 0,
    item.UNIT_PRICE || 0,
    item.VALUE || 0,
    item.QTY_UNIT || 'EA'
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map((cell, index) => {
      // Format numeric columns as plain numbers (no scientific notation)
      if (numericColumns.includes(index)) {
        return formatNumber(cell)
      }
      
      // For non-numeric cells, convert to string and escape if needed
      const cellStr = String(cell)
      // Escape cells containing commas, quotes, or newlines
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`
      }
      return cellStr
    }).join(','))
  ].join('\n')

  return csvContent
}

