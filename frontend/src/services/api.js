import axios from 'axios'

export const extractLineItems = async (file, config, clearCache = false) => {
  // Convert file to base64
  const base64Data = await fileToBase64(file)

  // Determine if using backend proxy or direct A79 endpoint
  const isBackendProxy = config.endpoint.startsWith('/api/') || config.endpoint.includes('localhost:7001') || config.endpoint.includes('localhost:7000')
  
  // Create axios instance with timeout
  const apiClient = axios.create({
    baseURL: isBackendProxy ? '' : '', // Use relative URL for proxy, absolute for direct
    timeout: config.timeout || 300000, // 5 minutes for A79
    headers: {
      'Content-Type': 'application/json',
      ...(config.apiKey && !isBackendProxy && {
        'Authorization': `Bearer ${config.apiKey}`
      })
    },
    withCredentials: false // Don't send credentials for CORS
  })

  try {
    // If using backend proxy, send simple format
    // Backend will handle A79 API formatting
    const requestPayload = isBackendProxy
      ? {
          document: base64Data,
          document_type: 'commercial_invoice',
          extract_fields: [
            'sku',
            'description',
            'hts_code',
            'country_of_origin',
            'package_count',
            'quantity',
            'net_weight',
            'gross_weight',
            'unit_price',
            'total_value',
            'unit_of_measure'
          ],
          format: 'line_items',
          clear_cache: clearCache // Add cache clearing flag
        }
      : {
          // Direct A79 API format
          agent_name: 'Unified PDF Parser',
          agent_inputs: {
            pdf_document: base64Data,
            custom_instructions: 'Extract all line items from commercial invoice'
          }
        }

    const response = await apiClient.post(config.endpoint, requestPayload)

    // Handle different response structures
    let data = response.data
    
    if (data.line_items) {
      return data
    } else if (data.data && data.data.line_items) {
      return data.data
    } else if (Array.isArray(data)) {
      return { line_items: data }
    } else {
      throw new Error('Unable to parse A79 response format')
    }
  } catch (error) {
    if (error.response) {
      throw new Error(`A79 API error: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`)
    } else if (error.request) {
      throw new Error('No response from A79 API. Please check the endpoint URL and your connection.')
    } else {
      throw new Error(`Request error: ${error.message}`)
    }
  }
}

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

