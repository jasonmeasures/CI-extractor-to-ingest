/**
 * Debug Utilities for CI PDF Extractor
 * Use these utilities to debug issues during development
 */

export const debugLogger = {
  log: (message, data) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] ${message}`, data || '')
    }
  },
  
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error)
  },
  
  api: (endpoint, request, response) => {
    console.group(`[API] ${endpoint}`)
    console.log('Request:', request)
    console.log('Response:', response)
    console.groupEnd()
  }
}

export const validateLineItem = (item) => {
  const errors = []
  
  if (!item.sku && !item.part_number && !item.SKU) {
    errors.push('Missing SKU')
  }
  
  if (!item.description && !item.DESCRIPTION) {
    errors.push('Missing description')
  }
  
  if (typeof item.quantity !== 'number' || item.quantity <= 0) {
    errors.push('Invalid quantity')
  }
  
  if (typeof item.unit_price !== 'number' || item.unit_price < 0) {
    errors.push('Invalid unit_price')
  }
  
  if (item.total_value !== undefined) {
    const expected = item.quantity * item.unit_price
    if (Math.abs(item.total_value - expected) > 0.01) {
      errors.push(`total_value mismatch: expected ${expected}, got ${item.total_value}`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export const validateResponse = (response) => {
  const issues = []
  
  if (!response.line_items || !Array.isArray(response.line_items)) {
    issues.push('Missing or invalid line_items array')
    return { valid: false, issues }
  }
  
  if (response.line_items.length === 0) {
    issues.push('Empty line_items array')
  }
  
  response.line_items.forEach((item, index) => {
    const validation = validateLineItem(item)
    if (!validation.valid) {
      issues.push(`Item ${index}: ${validation.errors.join(', ')}`)
    }
  })
  
  return {
    valid: issues.length === 0,
    issues
  }
}

export const formatDebugInfo = (data) => {
  return {
    timestamp: new Date().toISOString(),
    data: JSON.stringify(data, null, 2),
    size: JSON.stringify(data).length
  }
}

