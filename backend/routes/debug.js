import express from 'express'
import { logger } from '../utils/logger.js'
import { a79ExtractService } from '../services/a79Service.js'

const router = express.Router()

/**
 * GET /api/debug/config
 * Get current configuration (without sensitive data)
 */
router.get('/config', (req, res) => {
  res.json({
    a79BaseUrl: process.env.A79_BASE_URL || 'https://klearnow.prod.a79.ai/api/v1/public/workflow',
    a79Endpoint: process.env.A79_API_ENDPOINT || 'https://klearnow.prod.a79.ai/api/v1/public/workflow/run',
    a79ApiKey: process.env.A79_API_KEY ? '***configured***' : 'not configured',
    a79AgentName: process.env.A79_AGENT_NAME || 'Unified PDF Parser',
    a79WorkflowId: process.env.A79_WORKFLOW_ID || 'not configured (using agent_name)',
    timeout: process.env.A79_TIMEOUT || 300000,
    pollTimeout: process.env.A79_POLL_TIMEOUT || 60000,
    pollInterval: process.env.A79_POLL_INTERVAL || 5000,
    maxPollAttempts: process.env.A79_MAX_POLL_ATTEMPTS || 120,
    dashboardUrl: 'https://klearnow.prod.a79.ai',
    nodeEnv: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 7000,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001'
  })
})

/**
 * GET /api/debug/compare-requests
 * Compare working curl request vs axios request
 */
router.get('/compare-requests', async (req, res) => {
  try {
    const axios = (await import('axios')).default
    const { execSync } = await import('child_process')
    
    // Test payload
    const testPayload = {
      agent_name: a79ExtractService.agentName,
      agent_inputs: {
        pdf_document: 'dGVzdA==',
        custom_instructions: 'Test connection'
      }
    }
    
    // 1. Test with curl (working)
    console.log('Testing with curl...')
    let curlResult
    try {
      const curlCommand = `curl -X POST "${a79ExtractService.endpoint}" \\
        -H "Authorization: Bearer ${a79ExtractService.apiKey}" \\
        -H "Content-Type: application/json" \\
        -H "Accept: */*" \\
        -d '${JSON.stringify(testPayload)}' \\
        -s -w "\\nHTTP_CODE:%{http_code}"`
      
      const curlOutput = execSync(curlCommand, { encoding: 'utf-8', maxBuffer: 1024 * 1024 })
      const httpCodeMatch = curlOutput.match(/HTTP_CODE:(\d+)/)
      const httpCode = httpCodeMatch ? parseInt(httpCodeMatch[1]) : null
      const responseBody = curlOutput.replace(/HTTP_CODE:\d+$/, '').trim()
      
      curlResult = {
        success: true,
        status: httpCode,
        data: responseBody ? JSON.parse(responseBody) : null,
        raw: curlOutput
      }
    } catch (curlError) {
      curlResult = {
        success: false,
        error: curlError.message
      }
    }
    
    // 2. Test with axios (what backend uses)
    console.log('Testing with axios...')
    let axiosResult
    try {
      const axiosResponse = await axios.post(
        a79ExtractService.endpoint,
        testPayload,
        {
          headers: {
            'Authorization': `Bearer ${a79ExtractService.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
          },
          timeout: 10000,
          validateStatus: () => true
        }
      )
      
      axiosResult = {
        success: true,
        status: axiosResponse.status,
        statusText: axiosResponse.statusText,
        data: axiosResponse.data,
        headers: axiosResponse.headers
      }
    } catch (axiosError) {
      axiosResult = {
        success: false,
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data,
        error: axiosError.message
      }
    }
    
    res.json({
      comparison: {
        curl: curlResult,
        axios: axiosResult,
        match: curlResult.status === axiosResult.status
      },
      requestDetails: {
        endpoint: a79ExtractService.endpoint,
        payload: testPayload,
        headers: {
          'Authorization': `Bearer ${a79ExtractService.apiKey ? '***' : 'MISSING'}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        }
      }
    })
  } catch (error) {
    logger.error('Compare requests error:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/debug/test-a79
 * Test A79 API connection with detailed diagnostics
 */
router.post('/test-a79', async (req, res) => {
  try {
    const axios = (await import('axios')).default
    
    // Get service configuration
    const config = {
      endpoint: a79ExtractService.endpoint,
      apiKey: a79ExtractService.apiKey ? `${a79ExtractService.apiKey.substring(0, 15)}...` : 'NOT SET',
      hasApiKey: !!a79ExtractService.apiKey,
      apiKeyLength: a79ExtractService.apiKey?.length || 0,
      workflowId: a79ExtractService.workflowId,
      agentName: a79ExtractService.agentName
    }
    
    // Build test payload (same format as actual request)
    const testPayload = a79ExtractService.workflowId
      ? {
          agent_inputs: {
            pdf_document: 'dGVzdA==', // base64 "test" (minimal test data)
            custom_instructions: 'Test connection'
          }
        }
      : {
          agent_name: a79ExtractService.agentName,
          agent_inputs: {
            pdf_document: 'dGVzdA==', // base64 "test"
            custom_instructions: 'Test connection'
          }
        }
    
    logger.info('Testing A79 API with detailed diagnostics:', {
      endpoint: config.endpoint,
      hasApiKey: config.hasApiKey,
      workflowId: config.workflowId,
      payloadKeys: Object.keys(testPayload)
    })
    
    // Make test request
    const response = await axios.post(
      a79ExtractService.endpoint,
      testPayload,
      {
        headers: {
          'Authorization': `Bearer ${a79ExtractService.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'  // Match working Clear Audit 7501 configuration
        },
        timeout: 10000,
        validateStatus: () => true // Accept any status for debugging
      }
    )
    
    // Diagnose the response
    let diagnosis = ''
    if (response.status === 403) {
      diagnosis = '403 Forbidden - Possible causes: Invalid API key, incorrect endpoint, or missing workflow_id in URL'
    } else if (response.status === 401) {
      diagnosis = '401 Unauthorized - API key is invalid or expired'
    } else if (response.status === 404) {
      diagnosis = '404 Not Found - Endpoint URL may be incorrect. Try adding workflow_id to URL path.'
    } else if (response.status === 200 || response.status === 201) {
      diagnosis = 'Success - API is responding correctly'
    } else {
      diagnosis = `Status ${response.status} - Check response details`
    }
    
    res.json({
      config,
      testRequest: {
        endpoint: a79ExtractService.endpoint,
        method: 'POST',
        payloadStructure: Object.keys(testPayload),
        hasApiKey: config.hasApiKey,
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        }
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      },
      diagnosis,
      recommendations: response.status === 403 ? [
        '1. Verify API key is correct and not expired',
        '2. Check if endpoint requires workflow_id in URL (e.g., /workflow/{workflow_id}/run)',
        '3. Verify the endpoint URL matches your A79 dashboard configuration',
        '4. Check A79 API documentation for correct request format'
      ] : []
    })
  } catch (error) {
    logger.error('A79 test error:', error)
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined
    })
  }
})

/**
 * GET /api/debug/check-a79
 * Check A79 API connection (GET endpoint for easy browser testing)
 */
router.get('/check-a79', async (req, res) => {
  try {
    const testResult = await a79ExtractService.checkConnection()
    res.json({
      success: testResult.connected,
      ...testResult,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/debug/logs
 * Get recent logs (development only)
 */
router.get('/logs', (req, res) => {
  // In production, this would query from a log storage system
  res.json({
    message: 'Logs endpoint - implement log storage query here',
    note: 'In production, connect to your log aggregation service'
  })
})

export { router as debugRouter }

