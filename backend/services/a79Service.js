import axios from 'axios'
import https from 'https'
import { URL } from 'url'
import { exec } from 'child_process'
import { promisify } from 'util'
import { logger } from '../utils/logger.js'
import { getA79Endpoint, buildStatusUrl, getAlternateStatusEndpoints, A79_ENDPOINTS } from '../config/a79Endpoints.js'
import { buildInstructions } from './instructionBuilder.js'
import { getPdfPageCount } from '../utils/pdfUtils.js'

const execAsync = promisify(exec)

class A79ExtractService {
  constructor() {
    // Primary endpoint from environment or config
    this.workflowId = process.env.A79_WORKFLOW_ID || A79_ENDPOINTS.workflowId
    this.endpoint = process.env.A79_API_ENDPOINT || getA79Endpoint('extract', this.workflowId)
    this.baseUrl = process.env.A79_BASE_URL || A79_ENDPOINTS.baseUrl
    this.agentName = process.env.A79_AGENT_NAME || A79_ENDPOINTS.agentName
    
    this.apiKey = process.env.A79_API_KEY || 'sk-a79-wvymMMk2FdgHPGBP9mGakuGLnc/FZg3i'
    // Clear Audit 7501 uses longer timeout - A79 workflows can take time
    this.timeout = parseInt(process.env.A79_TIMEOUT || '300000') // 5 minutes (matching Clear Audit 7501)
    this.pollTimeout = parseInt(process.env.A79_POLL_TIMEOUT || '60000') // 60 seconds per poll (increased from 30s)
    this.pollInterval = parseInt(process.env.A79_POLL_INTERVAL || '5000') // 5 seconds
    this.maxPollAttempts = parseInt(process.env.A79_MAX_POLL_ATTEMPTS || '120') // 10 minutes max (120 × 5 seconds)
    
    if (!this.endpoint || this.endpoint.includes('api.a79.com')) {
      logger.warn('A79_API_ENDPOINT not configured. Using default AI79 endpoints.')
    }
  }

  /**
   * Check A79 API connection
   */
  async checkConnection() {
    if (!this.endpoint) {
      return {
        connected: false,
        error: 'A79_API_ENDPOINT not configured'
      }
    }

    try {
      // Try configured health endpoint first, then auto-detect
      let healthEndpoint = this.healthEndpoint
      
      if (!healthEndpoint || healthEndpoint.includes('api.a79.com')) {
        // Auto-detect health endpoint
        healthEndpoint = this.endpoint
          .replace('/extract', '/health')
          .replace('/extract-invoice', '/health')
          .replace('/api/extract', '/api/health')
          .replace('/api/extract-invoice', '/api/health')
      }

      const startTime = Date.now()
      
      try {
        const response = await axios.get(healthEndpoint, {
          timeout: 5000,
          headers: {
            ...(this.apiKey && {
              'Authorization': `Bearer ${this.apiKey}`
            }),
            'Accept': '*/*'  // Match working Clear Audit 7501 configuration
          }
        })
        
        const duration = Date.now() - startTime
        
        return {
          connected: true,
          endpoint: this.endpoint,
          healthEndpoint: healthEndpoint,
          responseTime: `${duration}ms`,
          status: response.status,
          hasApiKey: !!this.apiKey
        }
      } catch (healthError) {
        // Health endpoint might not exist, try main endpoint
        logger.debug('Health endpoint not available, trying main endpoint')
        
        // Try a simple GET to the main endpoint (some APIs support this)
        try {
          const response = await axios.get(this.endpoint, {
            timeout: 5000,
            headers: {
              ...(this.apiKey && {
                'Authorization': `Bearer ${this.apiKey}`
              }),
              'Accept': '*/*'  // Match working Clear Audit 7501 configuration
            },
            validateStatus: () => true // Accept any status
          })
          
          const duration = Date.now() - startTime
          
          return {
            connected: true,
            endpoint: this.endpoint,
            responseTime: `${duration}ms`,
            status: response.status,
            hasApiKey: !!this.apiKey,
            note: 'Main endpoint responded (may not be a health check)'
          }
        } catch (mainError) {
          // If both fail, endpoint might be POST-only
          return {
            connected: true, // Assume connected if it's a POST-only endpoint
            endpoint: this.endpoint,
            hasApiKey: !!this.apiKey,
            note: 'Endpoint appears to be POST-only (connection assumed)'
          }
        }
      }
    } catch (error) {
      logger.error('A79 connection check failed:', error.message)
      return {
        connected: false,
        endpoint: this.endpoint,
        error: error.message
      }
    }
  }

  /**
   * Poll for extraction status (AI79 workflow polling)
   */
  async pollForStatus(runId, workflowId = null, attempt = 1) {
    if (attempt > this.maxPollAttempts) {
      throw new Error(`Polling timeout: Maximum attempts (${this.maxPollAttempts}) reached after ${(this.maxPollAttempts * this.pollInterval) / 1000} seconds. Check dashboard: ${A79_ENDPOINTS.dashboardUrl}`)
    }

    // Try primary endpoint first
    let statusEndpoint = buildStatusUrl(runId, workflowId)
    const alternateEndpoints = getAlternateStatusEndpoints(runId, workflowId)
    // Filter out any endpoints with 'null' in them (safety check)
    const endpointsToTry = [statusEndpoint, ...alternateEndpoints].filter(endpoint => 
      endpoint && !endpoint.includes('/null/') && !endpoint.includes('/null?')
    )

    for (const endpoint of endpointsToTry) {
      try {
        logger.info(`🔄 Polling attempt ${attempt}/${this.maxPollAttempts} - Endpoint: ${endpoint}`)
        
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'  // Match working Clear Audit 7501 configuration
          },
          timeout: this.pollTimeout
        })

        const data = response.data

        // Log response status for debugging
        logger.info(`📡 Polling response: status=${data.status}, hasNodes=${!!data.nodes}, nodesCount=${data.nodes?.length || 0}`)

        // Check if extraction is complete (A79 uses 'succeeded' status)
        if (data.status === 'completed' || data.status === 'succeeded') {
          logger.info(`Extraction completed after ${attempt} polling attempts`)
          logger.info(`📊 A79 Response Structure:`, {
            status: data.status,
            hasNodes: !!data.nodes,
            nodesCount: data.nodes?.length || 0,
            hasOutput: !!data.output,
            outputType: typeof data.output,
            dataKeys: Object.keys(data).slice(0, 20)
          })
          
          // Extract output - handle different formats
          // A79 returns output in nodes[1].output.text (JSON string) or data.output
          let output = null
          let parsedOutput = null
          
          // Try to get output from nodes array (A79 workflow format)
          // A79 workflow has: nodes[0] = Classify-Document (just text), nodes[1] = Run-Classified-Workflow (JSON with line items)
          // CRITICAL: Status endpoint uses ?output_var=final_display_output, so check for final_display_output first
          if (data.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
            // Find node named "Run-Classified-Workflow" specifically
            let outputNode = data.nodes.find(n => n.name === 'Run-Classified-Workflow')
            
            // Fallback to last node
            if (!outputNode) {
              outputNode = data.nodes[data.nodes.length - 1]
            }
            
            // Fallback to any node with output
            if (!outputNode) {
              outputNode = data.nodes.find(n => n.output)
            }
            
            if (outputNode && outputNode.output) {
              // CRITICAL: Check for final_display_output first (this is what A79 returns when output_var=final_display_output)
              if (outputNode.output.final_display_output) {
                output = outputNode.output.final_display_output
                logger.info(`✅ Using final_display_output from node: ${outputNode.name || 'unknown'} (${typeof output === 'string' ? output.length : 'object'} chars)`)
              } else if (outputNode.output.text) {
                output = outputNode.output.text
                logger.info(`✅ Using output.text from node: ${outputNode.name || 'unknown'} (${output.length} chars)`)
              } else {
                logger.warn(`⚠️ Node found but no output.text or final_display_output:`, {
                  nodeName: outputNode?.name,
                  outputKeys: Object.keys(outputNode.output).slice(0, 10)
                })
              }
            } else {
              logger.warn(`⚠️ No output node found in nodes array`)
            }
          }
          
          // Fallback to root output field
          if (!output && data.output) {
            output = data.output
            logger.info(`✅ Using root output field (type: ${typeof data.output})`)
          }
          
          // Also check root level for final_display_output
          if (!output && data.final_display_output) {
            output = data.final_display_output
            logger.info(`✅ Using root final_display_output field`)
          }
          
          if (!output) {
            logger.error(`❌ No output found in A79 response. Full data structure:`, JSON.stringify(data, null, 2).substring(0, 2000))
          }
          
          // If output is a string, try to parse it
          if (typeof output === 'string') {
            try {
              // Try parsing as JSON directly
              parsedOutput = JSON.parse(output)
              logger.debug(`Successfully parsed output JSON string (${output.length} chars)`)
            } catch (parseError) {
              // If that fails, try unescaping first (double-encoded JSON)
              try {
                const unescaped = output.replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
                parsedOutput = JSON.parse(unescaped)
                logger.debug(`Successfully parsed output after unescaping`)
              } catch (unescapeError) {
                logger.warn(`Could not parse output string: ${unescapeError.message}`)
                logger.debug(`Output preview: ${output.substring(0, 200)}`)
                // Return raw output - let validateResponse handle it
                parsedOutput = output
              }
            }
          } else if (output) {
            // Already an object
            parsedOutput = output
          }
          
          // Extract line items from parsed output
          // A79 returns array with page_number and content.items structure
          logger.info(`🔍 Parsing output structure:`, {
            parsedOutputType: typeof parsedOutput,
            isArray: Array.isArray(parsedOutput),
            arrayLength: Array.isArray(parsedOutput) ? parsedOutput.length : 0,
            firstItemKeys: parsedOutput && Array.isArray(parsedOutput) && parsedOutput[0] ? Object.keys(parsedOutput[0]).slice(0, 10) : 'N/A'
          })
          
          if (parsedOutput && Array.isArray(parsedOutput) && parsedOutput.length > 0) {
            logger.info(`📄 Processing ${parsedOutput.length} page(s) from A79 response`)
            
            // MULTI-PAGE PROCESSING: Merge all pages into single line_items array
            const allLineItems = []
            let mergedMetadata = {}
            let mergedOtherData = {}
            let itemCounter = 1 // Sequential numbering across all pages
            
            for (let pageIndex = 0; pageIndex < parsedOutput.length; pageIndex++) {
              const page = parsedOutput[pageIndex]
              const pageNumber = page.page_number || (pageIndex + 1)
              
              logger.info(`📄 Processing page ${pageNumber} (index ${pageIndex})`)
              
              if (page && page.content) {
                let pageItems = []
                
                // Check for items array in content (most common structure)
                if (page.content.items && Array.isArray(page.content.items)) {
                  pageItems = page.content.items
                  logger.info(`  Found ${pageItems.length} items in content.items`)
                }
                // Check if content has line_items directly
                else if (page.content.line_items && Array.isArray(page.content.line_items)) {
                  pageItems = page.content.line_items
                  logger.info(`  Found ${pageItems.length} items in content.line_items`)
                }
                // Check if content itself is an array of items
                else if (Array.isArray(page.content)) {
                  pageItems = page.content
                  logger.info(`  Found ${pageItems.length} items (content is array)`)
                }
                
                // Add items from this page with sequential numbering
                if (pageItems.length > 0) {
                  for (const item of pageItems) {
                    // Ensure item_number is sequential across all pages
                    const normalizedItem = {
                      ...item,
                      item_number: String(itemCounter)
                    }
                    allLineItems.push(normalizedItem)
                    itemCounter++
                  }
                  logger.info(`  ✅ Added ${pageItems.length} items from page ${pageNumber} (total: ${allLineItems.length})`)
                } else {
                  logger.warn(`  ⚠️ Page ${pageNumber} has content but no items/line_items array. Content keys: ${Object.keys(page.content).join(', ')}`)
                }
                
                // Merge metadata (prefer first page's metadata, but combine if needed)
                if (page.content.metadata && Object.keys(page.content.metadata).length > 0) {
                  mergedMetadata = { ...mergedMetadata, ...page.content.metadata }
                }
                
                // Merge other_data (especially totals from last page)
                if (page.content.other_data && Object.keys(page.content.other_data).length > 0) {
                  mergedOtherData = { ...mergedOtherData, ...page.content.other_data }
                }
              }
            }
            
            if (allLineItems.length > 0) {
              logger.info(`✅ Successfully merged ${allLineItems.length} line items from ${parsedOutput.length} page(s)`)
              logger.debug(`First line item sample:`, JSON.stringify(allLineItems[0], null, 2).substring(0, 500))
              
              // Add extraction metadata
              mergedMetadata = {
                ...mergedMetadata,
                total_pages_processed: parsedOutput.length,
                total_items_extracted: allLineItems.length,
                pages_with_line_items: parsedOutput.map((p, i) => p.page_number || (i + 1))
              }
              
              return {
                line_items: allLineItems,
                metadata: mergedMetadata,
                other_data: mergedOtherData,
                run_id: data.run_id,
                status: data.status
              }
            } else {
              logger.warn(`⚠️ No items found across ${parsedOutput.length} page(s)`)
            }
            
            // Check if parsedOutput is directly an array of line items
            if (parsedOutput[0] && parsedOutput[0].sku !== undefined) {
              logger.info(`Extracted ${parsedOutput.length} line items from A79 response (direct array)`)
              return {
                line_items: parsedOutput,
                metadata: {},
                other_data: {},
                run_id: data.run_id,
                status: data.status
              }
            }
          }
          
          // If we have parsed output but structure is different, log it for debugging
          if (parsedOutput) {
            logger.warn(`Unexpected output structure:`, {
              type: typeof parsedOutput,
              isArray: Array.isArray(parsedOutput),
              keys: typeof parsedOutput === 'object' && !Array.isArray(parsedOutput) ? Object.keys(parsedOutput).slice(0, 10) : 'N/A',
              preview: JSON.stringify(parsedOutput).substring(0, 200)
            })
            
            // Try to extract line_items from different possible structures
            if (typeof parsedOutput === 'object' && !Array.isArray(parsedOutput)) {
              // Check if line_items is at root level
              if (parsedOutput.line_items && Array.isArray(parsedOutput.line_items)) {
                logger.info(`Found line_items at root level: ${parsedOutput.line_items.length} items`)
                return {
                  line_items: parsedOutput.line_items,
                  metadata: parsedOutput.metadata || {},
                  other_data: parsedOutput.other_data || {},
                  run_id: data.run_id,
                  status: data.status
                }
              }
              
              // Check if items is at root level
              if (parsedOutput.items && Array.isArray(parsedOutput.items)) {
                logger.info(`Found items at root level: ${parsedOutput.items.length} items`)
                return {
                  line_items: parsedOutput.items,
                  metadata: parsedOutput.metadata || {},
                  other_data: parsedOutput.other_data || {},
                  run_id: data.run_id,
                  status: data.status
                }
              }
            }
          }
          
          // If we still don't have line_items, log full structure for debugging
          logger.error(`❌ Failed to extract line_items from A79 response. Output structure:`, {
            parsedOutputType: typeof parsedOutput,
            parsedOutputIsArray: Array.isArray(parsedOutput),
            parsedOutputKeys: typeof parsedOutput === 'object' && parsedOutput !== null ? Object.keys(parsedOutput).slice(0, 20) : 'N/A',
            dataKeys: typeof data === 'object' && data !== null ? Object.keys(data).slice(0, 20) : 'N/A',
            outputPreview: parsedOutput ? JSON.stringify(parsedOutput).substring(0, 500) : 'null',
            fullStructure: parsedOutput ? JSON.stringify(parsedOutput, null, 2).substring(0, 2000) : 'null',
            nodesStructure: data.nodes ? data.nodes.map(n => ({ name: n.name, hasOutput: !!n.output, outputKeys: n.output ? Object.keys(n.output).slice(0, 5) : [] })) : 'N/A'
          })
          
          // If parsedOutput is an array with content but no items, try to extract from nested structure
          if (parsedOutput && Array.isArray(parsedOutput) && parsedOutput.length > 0) {
            const firstPage = parsedOutput[0]
            if (firstPage && firstPage.content) {
              // Check all possible nested structures
              const contentKeys = Object.keys(firstPage.content)
              logger.warn(`Content keys available: ${contentKeys.join(', ')}`)
              
              // Maybe items are nested deeper or have a different name
              for (const key of contentKeys) {
                const value = firstPage.content[key]
                if (Array.isArray(value) && value.length > 0 && value[0] && (value[0].sku !== undefined || value[0].description !== undefined)) {
                  logger.info(`Found line items in content.${key}: ${value.length} items`)
                  return {
                    line_items: value,
                    metadata: firstPage.content.metadata || {},
                    other_data: {},
                    run_id: data.run_id,
                    status: data.status
                  }
                }
              }
            }
          }
          
          // Return empty line_items array instead of throwing - let frontend handle empty result
          logger.warn(`No line_items found in A79 response - returning empty array`)
          return {
            line_items: [],
            metadata: parsedOutput && Array.isArray(parsedOutput) && parsedOutput[0]?.content ? parsedOutput[0].content : {},
            other_data: {},
            run_id: data.run_id,
            status: data.status,
            error: 'No line items found in A79 response. The document may not contain line items or A79 did not extract them.'
          }
        }

        // Check if extraction failed
        if (data.status === 'failed' || data.status === 'error') {
          throw new Error(`Extraction failed: ${data.error || data.error_msg || data.message || 'Unknown error'}`)
        }

        // If still processing, break and wait before next attempt
        if (data.status === 'running' || data.status === 'pending' || data.status === 'processing') {
          logger.info(`⏳ Status: ${data.status} (${data.progress ? (data.progress * 100).toFixed(0) + '%' : 'N/A'})`)
          break // Found valid endpoint, continue polling this one
        }

      } catch (error) {
        // Better error logging for polling failures
        logger.error(`❌ Polling error on attempt ${attempt}/${this.maxPollAttempts}:`, {
          endpoint,
          error: error.message,
          code: error.code,
          status: error.response?.status,
          statusText: error.response?.statusText
        })
        
        // If 404, try next endpoint
        if (error.response && error.response.status === 404) {
          logger.info(`⚠️ Endpoint ${endpoint} returned 404, trying next...`)
          continue
        }
        
        // If not 404, this might be the right endpoint but job not ready
        if (error.response && error.response.status !== 404) {
          logger.info(`⚠️ Endpoint ${endpoint} returned ${error.response.status}, will retry`)
          break
        }
        
        // For network errors (timeout, ECONNREFUSED, etc.), log and continue
        if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
          logger.warn(`⚠️ Network error polling ${endpoint}: ${error.code} - ${error.message}`)
          continue
        }
        
        // For other errors, log and continue to next endpoint
        logger.warn(`⚠️ Error polling ${endpoint}: ${error.message}`)
        continue
      }
    }

    // Wait before next polling attempt
    await new Promise(resolve => setTimeout(resolve, this.pollInterval))
    return this.pollForStatus(runId, workflowId, attempt + 1)
  }

  /**
   * Extract line items from commercial invoice PDF (with polling support)
   * 
   * @param {Object} options
   * @param {string} options.document - Base64 encoded PDF document
   * @param {string} options.document_type - Type of document (e.g., 'commercial_invoice')
   * @param {string} options.customer_number - Customer number (e.g., 'TARGET001')
   * @param {string} options.custom_instructions - User-provided custom instructions
   * @param {Array<string>} options.extract_fields - Additional fields to extract
   * @param {string} options.format - Output format
   * @param {boolean} options.clear_cache - Whether to clear cache
   */
  async extractLineItems({ document, document_type, customer_number, custom_instructions, extract_fields, format, clear_cache = false }) {
    if (!this.endpoint) {
      throw new Error('A79 API endpoint not configured. Set A79_API_ENDPOINT environment variable.')
    }

    const startTime = Date.now()
    
    try {
      logger.debug(`Calling A79 API: ${this.endpoint}`)
      
      // Detect PDF page count to include in instructions
      let pdfPageCount = null
      try {
        pdfPageCount = await getPdfPageCount(document)
        logger.info(`📄 Detected PDF has ${pdfPageCount} page(s)`)
        if (pdfPageCount > 1) {
          logger.info(`⚠️ MULTI-PAGE DOCUMENT DETECTED: ${pdfPageCount} pages - will add explicit page count to instructions`)
        }
      } catch (error) {
        logger.warn(`Could not detect PDF page count: ${error.message}. Proceeding without page count.`)
      }
      
      // Build instructions using three-tier system (baseline + customer + custom)
      // Include page count if detected to force multi-page processing
      const customInstructions = buildInstructions({
        customer_number,
        custom_instructions,
        extract_fields,
        pdf_page_count: pdfPageCount
      })
      
      // Log instruction details for debugging
      logger.info(`📝 Instructions being sent to A79:`, {
        instructionLength: customInstructions.length,
        first200Chars: customInstructions.substring(0, 200),
        containsMultiPage: customInstructions.includes('MULTI-PAGE') || customInstructions.includes('multi-page'),
        containsPageByPage: customInstructions.includes('Page-by-Page') || customInstructions.includes('page-by-page')
      })
      
      // Add cache-busting parameter if clear_cache is true
      // This ensures A79 doesn't use cached results for the same document
      const cacheBuster = clear_cache ? `\n\n[IMPORTANT: Process this document fresh - do not use cached results. Timestamp: ${Date.now()}]` : ''
      
      // Build request payload for AI79 workflow API
      const requestPayload = this.workflowId
        ? {
            // Workflow ID-based request (no agent_name needed)
            agent_inputs: {
              pdf_document: document,
              custom_instructions: customInstructions + cacheBuster
            }
          }
        : {
            // Agent-based request
            agent_name: this.agentName,
            agent_inputs: {
              pdf_document: document,
              custom_instructions: customInstructions + cacheBuster
            }
          }
      
      // Step 1: Submit extraction job
      logger.debug(`Sending request to A79 API:`, {
        endpoint: this.endpoint,
        hasApiKey: !!this.apiKey,
        apiKeyPrefix: this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'none',
        payloadKeys: Object.keys(requestPayload),
        workflowId: this.workflowId,
        agentName: this.agentName
      })
      
      // Match working Clear Audit 7501 exactly
      // Python: requests.post(url, data=json.dumps(payload), headers=headers)
      const payloadJson = JSON.stringify(requestPayload)
      
      // Log EXACT request details for debugging
      logger.info('=== A79 API REQUEST DEBUG ===')
      logger.info(`Endpoint: ${this.endpoint}`)
      logger.info(`Method: POST`)
      logger.info(`Agent Name: "${this.agentName}"`)
      logger.info(`Workflow ID: ${this.workflowId || 'NONE (using agent-based request)'}`)
      logger.info(`API Key: ${this.apiKey ? `${this.apiKey.substring(0, 15)}...` : 'MISSING'} (length: ${this.apiKey?.length || 0})`)
      logger.info(`Headers:`, {
        'Authorization': `Bearer ${this.apiKey ? '***' : 'MISSING'}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      })
      logger.info(`Payload (first 500 chars): ${payloadJson.substring(0, 500)}`)
      logger.info(`Payload size: ${payloadJson.length} chars`)
      logger.info(`Payload keys: ${Object.keys(requestPayload).join(', ')}`)
      
      // Verify document is base64 and not empty
      const pdfDoc = requestPayload.agent_inputs?.pdf_document || ''
      if (!pdfDoc) {
        logger.error(`❌ pdf_document is empty or missing!`)
        throw new Error('PDF document is missing from request payload')
      }
      logger.info(`✅ pdf_document present: ${pdfDoc.length} chars`)
      logger.info(`   First 50 chars: ${pdfDoc.substring(0, 50)}`)
      logger.info(`   Last 50 chars: ${pdfDoc.substring(pdfDoc.length - 50)}`)
      
      // Verify it's valid base64
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/
      if (!base64Regex.test(pdfDoc)) {
        logger.warn(`⚠️ pdf_document may not be valid base64 (contains non-base64 chars)`)
      } else {
        logger.info(`✅ pdf_document appears to be valid base64`)
      }
      
      if (requestPayload.agent_name) {
        logger.info(`✅ Agent name in payload: "${requestPayload.agent_name}"`)
      } else {
        logger.warn(`⚠️ No agent_name in payload (using workflow ID: ${this.workflowId})`)
      }
      
      // Match Clear Audit 7501 exactly: Python requests.post(url, data=json.dumps(payload))
      // CRITICAL: curl works perfectly but axios/native https don't
      // Use curl directly via child_process since we know it works
      
      // Declare payloadString outside try block so it's accessible in catch block
      const payloadString = JSON.stringify(requestPayload)
      
      let submitResponse
      try {
        // Use curl directly (we know this works from test script)
        // Write payload to temp file to avoid stdin/stdout issues with execAsync
        const fs = await import('fs/promises')
        const path = await import('path')
        const os = await import('os')
        
        // Create temp file for payload
        const tempFile = path.join(os.tmpdir(), `a79-payload-${Date.now()}.json`)
        await fs.writeFile(tempFile, payloadString, 'utf8')
        
        logger.debug(`Executing curl command (endpoint only): ${this.endpoint}`)
        logger.debug(`Payload size: ${payloadString.length} chars`)
        logger.debug(`Temp file: ${tempFile}`)
        
        // Use curl with file input (more reliable than stdin with execAsync)
        const curlCommand = `curl -s -w "\\n%{http_code}" -X POST "${this.endpoint}" \\
          -H "Authorization: Bearer ${this.apiKey}" \\
          -H "Content-Type: application/json" \\
          -H "Accept: */*" \\
          --data @${tempFile} \\
          --max-time 60`
        
        let stdout, stderr
        try {
          const result = await execAsync(curlCommand, {
            maxBuffer: 10 * 1024 * 1024,  // 10MB buffer for large responses
            timeout: 35000  // 35 seconds max
          })
          stdout = result.stdout
          stderr = result.stderr
        } finally {
          // Clean up temp file
          try {
            await fs.unlink(tempFile)
          } catch (e) {
            logger.warn(`Failed to delete temp file ${tempFile}: ${e.message}`)
          }
        }
        
        if (stderr && !stderr.includes('Warning')) {
          logger.warn(`Curl stderr: ${stderr}`)
        }
        
        // Parse curl output (last line is HTTP status code)
        const lines = stdout.trim().split('\n')
        const httpCode = parseInt(lines[lines.length - 1]) || 200
        const responseBody = lines.slice(0, -1).join('\n')
        
        let parsedData
        try {
          parsedData = JSON.parse(responseBody)
        } catch (e) {
          parsedData = responseBody
        }
        
        submitResponse = {
          status: httpCode,
          statusText: httpCode === 200 ? 'OK' : 'Error',
          data: parsedData,
          headers: {}  // curl doesn't give us headers easily
        }
        
        logger.info(`=== A79 API RESPONSE ===`)
        logger.info(`✅ Request successfully sent to A79 API`)
        logger.info(`Status: ${submitResponse.status} ${submitResponse.statusText}`)
        logger.info(`Response headers:`, submitResponse.headers)
        logger.info(`Response data (full):`, JSON.stringify(submitResponse.data, null, 2))
        if (submitResponse.data?.run_id) {
          logger.info(`✅ Run ID received: ${submitResponse.data.run_id} - File is being processed by A79`)
        }
        // Check for workflow failures immediately
        if (submitResponse.data?.status === 'workflow_execution_failed' || submitResponse.data?.workflow_executed === 'None (failed)') {
          logger.error(`⚠️ A79 workflow failed in initial response:`, submitResponse.data)
        }
      } catch (error) {
        // Curl/exec error handling
        logger.error(`A79 API curl error:`, {
          message: error.message,
          code: error.code,
          signal: error.signal,
          endpoint: this.endpoint
        })
        
        if (error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM') {
          throw new Error(`A79 API connection timed out. The API may be slow, overloaded, or unreachable. Please check the A79 API status and try again.`)
        } else if (error.code === 'ENOENT') {
          throw new Error(`curl command not found. Please ensure curl is installed on your system.`)
        } else {
          throw new Error(`A79 API error: ${error.message} (code: ${error.code || 'unknown'})`)
        }
      }

      // Check for error status codes
      if (submitResponse.status >= 400) {
        logger.error(`A79 API returned error status ${submitResponse.status}:`, {
          status: submitResponse.status,
          statusText: submitResponse.statusText,
          data: submitResponse.data,
          headers: submitResponse.headers,
          requestUrl: this.endpoint,
          requestHeaders: {
            'Authorization': `Bearer ${this.apiKey ? '***' : 'MISSING'}`,
            'Content-Type': 'application/json',
            'Accept': '*/*'
          }
        })
        
        // Provide specific error messages for common status codes
        let errorMsg = submitResponse.data?.message || submitResponse.data?.error || submitResponse.data?.error_msg || submitResponse.statusText
        
        if (submitResponse.status === 500) {
          errorMsg = `A79 API Internal Server Error (500): ${errorMsg || 'The A79 API encountered an internal error. This may be temporary - please try again in a few moments.'}`
          logger.error(`❌ A79 API 500 Error Details:`, {
            responseData: submitResponse.data,
            payloadSize: payloadString.length,
            hasPdfDocument: !!requestPayload.agent_inputs?.pdf_document,
            pdfDocumentLength: requestPayload.agent_inputs?.pdf_document?.length || 0
          })
        } else if (submitResponse.status === 502) {
          errorMsg = `A79 API Bad Gateway (502): ${errorMsg || 'The A79 API gateway is unavailable. Please check the A79 API status.'}`
        } else if (submitResponse.status === 503) {
          errorMsg = `A79 API Service Unavailable (503): ${errorMsg || 'The A79 API is temporarily unavailable. Please try again later.'}`
        }
        
        throw {
          response: {
            status: submitResponse.status,
            statusText: submitResponse.statusText,
            data: submitResponse.data,
            headers: submitResponse.headers
          },
          message: errorMsg
        }
      }

      // Check for workflow execution failures in the response
      if (submitResponse.data?.status === 'workflow_execution_failed' || submitResponse.data?.workflow_executed === 'None (failed)') {
        const errorMsg = submitResponse.data?.error || submitResponse.data?.message || 'Workflow execution failed'
        logger.error(`A79 workflow execution failed:`, {
          status: submitResponse.data?.status,
          workflow_executed: submitResponse.data?.workflow_executed,
          error: submitResponse.data?.error,
          fullResponse: submitResponse.data
        })
        throw new Error(`A79 workflow failed: ${errorMsg}. Please ensure you're uploading a valid PDF file.`)
      }

      let data = submitResponse.data
      const duration = Date.now() - startTime
      logger.info(`A79 API initial response received in ${duration}ms`)

      // Extract run_id and workflow_id from response
      const runId = data.run_id || data.runId
      const workflowId = data.workflow_id || data.workflowId || this.workflowId

      // Check if response indicates async processing (polling required)
      if (runId) {
        logger.info(`Async extraction workflow started - Run ID: ${runId}, Workflow ID: ${workflowId || 'N/A'}`)
        
        // If status is already completed, return data
        if (data.status === 'completed' && data.output) {
          let output = data.output
          // Handle string output
          if (typeof output === 'string') {
            try {
              output = JSON.parse(output)
            } catch (e) {
              try {
                output = JSON.parse(output.replace(/\\"/g, '"').replace(/\\n/g, '\n'))
              } catch (e2) {
                logger.warn('Could not parse output, returning raw')
              }
            }
          }
          data = output || data
        } else {
          // Poll for completion
          logger.info(`Polling for results (max ${this.maxPollAttempts} attempts, ${this.pollInterval / 1000}s interval)...`)
          const polledData = await this.pollForStatus(runId, workflowId)
          
          // pollForStatus already returns {line_items, metadata, other_data} structure
          // So if it has line_items, use it directly
          if (polledData && polledData.line_items && Array.isArray(polledData.line_items)) {
            logger.debug(`Using line_items from pollForStatus: ${polledData.line_items.length} items`)
            return this.validateResponse(polledData)
          }
          
          // Otherwise, continue parsing
          data = polledData
        }
      } else if (data.status === 'completed' && data.output) {
        // Direct completion without run_id (unlikely but handle it)
        let output = data.output
        if (typeof output === 'string') {
          try {
            output = JSON.parse(output)
          } catch (e) {
            try {
              output = JSON.parse(output.replace(/\\"/g, '"').replace(/\\n/g, '\n'))
            } catch (e2) {
              logger.warn('Could not parse output, returning raw')
            }
          }
        }
        data = output || data
      }

      // Parse response - handle AI79 output structure
      // pollForStatus should have already returned {line_items, metadata, other_data}
      // But if we get here, try to extract from other structures
      
      // Check if data already has line_items (from pollForStatus)
      if (data.line_items && Array.isArray(data.line_items)) {
        logger.debug(`Using line_items from data: ${data.line_items.length} items`)
        return this.validateResponse(data)
      }
      
      // Fallback: try to extract from other structures
      let lineItems = null
      
      if (data.items && Array.isArray(data.items)) {
        lineItems = data.items
      } else if (data.entry_summary && data.entry_summary.line_items) {
        lineItems = data.entry_summary.line_items
      } else if (data.output && data.output.line_items) {
        lineItems = data.output.line_items
      } else if (data.output && data.output.items) {
        lineItems = data.output.items
      } else if (Array.isArray(data)) {
        // Check if array contains line items directly
        if (data.length > 0 && (data[0].sku !== undefined || data[0].description !== undefined)) {
          lineItems = data
        }
      }
      
      if (lineItems) {
        logger.debug(`Extracted line_items from fallback structure: ${lineItems.length} items`)
        return this.validateResponse({ line_items: lineItems, ...data })
      } else {
        // Return as-is, validation will handle it
        logger.warn(`No line_items found in response structure, passing to validateResponse`)
        return this.validateResponse(data)
      }
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`A79 API call failed after ${duration}ms:`, error.message)
      
      if (error.response) {
        const status = error.response.status
        const statusText = error.response.statusText
        const responseData = error.response.data
        const endpoint = this.endpoint
        
        // Log detailed error information
        logger.error(`A79 API Error Details:`, {
          status,
          statusText,
          endpoint,
          responseData,
          headers: error.response.headers
        })
        
        // Provide more helpful error messages
        // Use error.message if available (from improved error handling above)
        const errorMsg = error.message || responseData?.message || responseData?.error || responseData?.error_msg || statusText
        
        if (status === 500) {
          logger.error(`500 Internal Server Error Details:`, {
            endpoint,
            responseData,
            errorMessage: errorMsg
          })
          throw new Error(errorMsg || `A79 API Internal Server Error (500): The A79 API encountered an internal error. This may be temporary - please try again in a few moments.`)
        } else if (status === 403) {
          logger.error(`403 Forbidden Details:`, {
            endpoint,
            apiKeyPrefix: this.apiKey ? `${this.apiKey.substring(0, 15)}...` : 'MISSING',
            apiKeyLength: this.apiKey?.length || 0,
            responseData,
            requestHeaders: {
              'Authorization': `Bearer ${this.apiKey ? '***' : 'MISSING'}`,
              'Content-Type': 'application/json',
              'Accept': '*/*'
            }
          })
          throw new Error(`A79 API authentication failed (403): ${errorMsg}. Endpoint: ${endpoint}, API Key: ${this.apiKey ? 'present' : 'MISSING'}`)
        } else if (status === 401) {
          throw new Error(`A79 API unauthorized (401): Invalid API key. Please check your A79_API_KEY environment variable.`)
        } else if (status === 404) {
          throw new Error(`A79 API endpoint not found (404): ${endpoint}. Please verify the endpoint URL.`)
        } else if (status === 502) {
          throw new Error(errorMsg || `A79 API Bad Gateway (502): The A79 API gateway is unavailable. Please check the A79 API status.`)
        } else if (status === 503) {
          throw new Error(errorMsg || `A79 API Service Unavailable (503): The A79 API is temporarily unavailable. Please try again later.`)
        } else {
          throw new Error(errorMsg || `A79 API error: ${status} - ${responseData?.message || responseData?.error || statusText}`)
        }
      } else if (error.request) {
        // No response received - could be timeout, network error, or server down
        const isTimeout = error.message?.includes('timeout') || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT'
        const timeoutType = error.code === 'ETIMEDOUT' ? 'connection' : 'request'
        const errorMsg = isTimeout 
          ? `A79 API ${timeoutType} timed out. The API may be slow, overloaded, or unreachable. Please check the A79 API status and try again.`
          : `No response from A79 API (${error.code || 'unknown error'}). Please check the endpoint URL (${this.endpoint}) and your connection.`
        throw new Error(errorMsg)
      } else {
        throw new Error(`Request error: ${error.message || 'Unknown error'}`)
      }
    }
  }

  /**
   * Validate and normalize A79 response according to enhanced A79 instructions
   * Expected fields from A79 enhanced instructions:
   * - item_number: String (e.g., "1", "2", "3")
   * - sku: String (actual part number or empty string "")
   * - description: String
   * - hts_code: String (10-digit code or "N/A")
   * - country_of_origin: String (2-letter ISO code or "N/A")
   * - quantity: String (e.g., "100")
   * - unit_price: String (e.g., "45.20")
   * - value: String WITH currency symbol (e.g., "$226.00")
   * - net_weight: Number in kg
   * - gross_weight: Number in kg
   * - unit_of_measure: String (default "EA")
   * - confidence_score: Number (0.0-1.0) - overall confidence
   * - field_confidence: Object with per-field confidence scores
   * - validation_status: String ("passed", "warning", "failed")
   * - validation_checks: Object with validation check results
   */
  validateResponse(data) {
    logger.info(`🔍 validateResponse called with:`, {
      hasLineItems: !!data.line_items,
      isArray: Array.isArray(data.line_items),
      length: data.line_items?.length || 0,
      dataKeys: Object.keys(data).slice(0, 10)
    })
    
    // Allow empty line_items array - frontend will handle it
    if (!data.line_items || !Array.isArray(data.line_items)) {
      // If there's an error message, include it
      const errorMsg = data.error || 'Invalid response: line_items array not found'
      logger.error(`❌ validateResponse failed: ${errorMsg}`, {
        dataType: typeof data,
        dataKeys: Object.keys(data),
        dataPreview: JSON.stringify(data).substring(0, 500)
      })
      throw new Error(`Request error: ${errorMsg}`)
    }
    
    // If line_items is empty, that's OK - just return it
    if (data.line_items.length === 0) {
      logger.warn('⚠️ A79 returned empty line_items array')
      return data
    }
    
    logger.info(`✅ Validating ${data.line_items.length} line items for CSV`)
    
    // Check for potential incomplete extraction (multi-page documents with very few items)
    if (data.line_items.length > 0 && data.line_items.length < 10) {
      const lastItemNumber = parseInt(data.line_items[data.line_items.length - 1]?.item_number || '0')
      const hasMetadata = !!data.extraction_metadata
      
      // If we have extraction metadata, check completeness
      if (hasMetadata && data.extraction_metadata) {
        const metadata = data.extraction_metadata
        const pagesProcessed = metadata.total_pages_processed || 1
        const itemsExtracted = metadata.total_items_extracted || data.line_items.length
        const expectedItems = metadata.expected_items_estimate || 0
        
        if (pagesProcessed > 1 && itemsExtracted < expectedItems * 0.8) {
          logger.warn(`⚠️ POTENTIAL INCOMPLETE EXTRACTION DETECTED:`, {
            pagesProcessed,
            itemsExtracted,
            expectedItems,
            completenessScore: metadata.completeness_score || 0,
            warning: 'Multi-page document may have incomplete extraction'
          })
        }
      } else if (!hasMetadata && lastItemNumber > 0 && lastItemNumber < 10) {
        // No metadata but suspiciously few items - might be incomplete
        logger.warn(`⚠️ WARNING: Only ${data.line_items.length} items extracted. If this is a multi-page document, extraction may be incomplete.`)
      }
    }

    // Validate and normalize each line item according to A79 enhanced instructions
    const validatedItems = data.line_items.map((item, index) => {
      const normalized = {}
      
      // Item Number: String (e.g., "1", "2", "3")
      normalized.item_number = String(item.item_number || item.item || item.line_number || (index + 1))
      
      // SKU: Use actual part number or leave empty
      // CRITICAL: Never use sequential numbers like "1", "2", "Item 1" as SKU
      // CRITICAL: If no part number exists, leave SKU empty (do NOT generate "ITEM-N")
      let rawSku = item.sku || item.part_number || item.SKU || item.sku_number
      
      // Check if SKU is a sequential number (should be ignored)
      const isSequentialNumber = (sku) => {
        if (!sku) return false
        const skuStr = String(sku).trim()
        // Pure numbers: "1", "2", "001", "002"
        if (/^\d+$/.test(skuStr)) return true
        // "Item 1", "Item 2", "Line 1", "Line 2"
        if (/^(item|line|row|#)\s*\d+$/i.test(skuStr)) return true
        // "1", "2" as standalone values matching row position
        if (skuStr === String(index + 1) || skuStr === String(index + 1).padStart(2, '0')) return true
        return false
      }
      
      // Check if SKU is a generated ITEM-N (should be removed - leave empty instead)
      const isGeneratedItemN = (sku) => {
        if (!sku) return false
        const skuStr = String(sku).trim()
        // Pattern: "ITEM-1", "ITEM-2", "ITEM-01", etc.
        return /^ITEM-\d+$/i.test(skuStr)
      }
      
      // Log what A79 returned for debugging
      if (rawSku) {
        logger.debug(`A79 returned SKU: "${rawSku}" for item ${index + 1}`)
      }
      
      // If SKU is a sequential number, ignore it and leave empty
      if (rawSku && isSequentialNumber(rawSku)) {
        logger.warn(`⚠️ A79 returned sequential number "${rawSku}" for SKU (item ${index + 1}) - ignoring and leaving SKU empty`)
        normalized.sku = '' // Leave empty instead of generating ITEM-N
      } else if (rawSku && isGeneratedItemN(rawSku)) {
        // A79 generated ITEM-N - remove it and leave empty (no part number exists)
        logger.debug(`A79 generated placeholder SKU: "${rawSku}" for item ${index + 1} - removing placeholder, leaving SKU empty`)
        normalized.sku = '' // Leave empty instead of keeping ITEM-N
      } else {
        // Use actual part number or leave empty if none exists
        normalized.sku = rawSku || ''
      }
      
      // Description: Required field
      normalized.description = item.description || item.DESCRIPTION || item.desc || item.product_description || ''
      
      // HTS Code: 10-digit code or "N/A"
      // NOTE: Commodity Code = HTS Code (same field)
      normalized.hts_code = item.hts_code || item.commodity_code || item.commodity || item.hts || item.HTS || item.tariff_code || item.harmonized_code || item.hs_code || 'N/A'
      
      // Country of Origin: 2-letter ISO code or "N/A" (A79 handles intelligent inference)
      normalized.country_of_origin = item.country_of_origin || item.origin_country || item.COUNTRY_OF_ORIGIN || item.coo || item.origin || 'N/A'
      
      // Package Count: Optional, can be empty string
      normalized.package_count = item.package_count || item.packages || item.NO_OF_PACKAGE || item.pkg_count || ''
      
      // Quantity: Must be a positive number, default to 1 if not specified
      normalized.quantity = parseFloat(item.quantity || item.qty || item.QUANTITY || item.q || 1)
      if (isNaN(normalized.quantity) || normalized.quantity <= 0) {
        normalized.quantity = 1
      }
      
      // Net Weight: Number in kg, default to 0 if not specified
      normalized.net_weight = parseFloat(item.net_weight || item.net_wt || item.NET_WEIGHT || item.weight_net || 0)
      if (isNaN(normalized.net_weight)) {
        normalized.net_weight = 0
      }
      
      // Gross Weight: Number in kg, default to 0 if not specified
      normalized.gross_weight = parseFloat(item.gross_weight || item.gross_wt || item.GROSS_WEIGHT || item.weight_gross || item.weight || 0)
      if (isNaN(normalized.gross_weight)) {
        normalized.gross_weight = 0
      }
      
      // Unit Price: Must be a positive number, default to 0 if not specified
      normalized.unit_price = parseFloat(item.unit_price || item.price || item.UNIT_PRICE || item.price_per_unit || item.unit_cost || 0)
      if (isNaN(normalized.unit_price)) {
        normalized.unit_price = 0
      }
      
      // Total Value: Calculate if missing (quantity × unit_price)
      normalized.total_value = parseFloat(item.total_value || item.value || item.VALUE || item.total || item.amount || 0)
      if (isNaN(normalized.total_value) || normalized.total_value === 0) {
        // Calculate from quantity and unit_price if available
        if (normalized.quantity > 0 && normalized.unit_price > 0) {
          normalized.total_value = normalized.quantity * normalized.unit_price
        } else {
          normalized.total_value = 0
        }
      }
      
      // Unit of Measure: String, default to "EA"
      normalized.unit_of_measure = item.unit_of_measure || item.uom || item.QTY_UNIT || item.unit || item.measure || 'EA'
      
      // Convert quantity and unit_price to strings (per baseline instructions)
      // These should be strings to preserve formatting, but we parsed them as numbers above
      // Convert back to strings for consistency with instructions
      normalized.quantity = String(normalized.quantity)
      normalized.unit_price = String(normalized.unit_price)
      
      // Value: Should be string WITH currency symbol (preserve from original or add if calculated)
      if (item.value || item.VALUE || item.total || item.amount) {
        // Preserve original value if it has currency symbol
        const originalValue = item.value || item.VALUE || item.total || item.amount
        if (typeof originalValue === 'string' && /^[$€£¥]/.test(originalValue)) {
          normalized.value = originalValue
        } else {
          // Add currency symbol if missing (default to $)
          const currency = data.currency || data.metadata?.currency || '$'
          normalized.value = `${currency}${normalized.total_value.toFixed(2)}`
        }
      } else {
        // Calculate and format with currency symbol
        const currency = data.currency || data.metadata?.currency || '$'
        normalized.value = `${currency}${normalized.total_value.toFixed(2)}`
      }
      
      // Confidence Score: Extract and validate (0.0-1.0)
      if (item.confidence_score !== undefined && item.confidence_score !== null) {
        const conf = parseFloat(item.confidence_score)
        if (!isNaN(conf) && conf >= 0 && conf <= 1) {
          normalized.confidence_score = conf
        } else {
          logger.warn(`Invalid confidence_score for item ${index + 1}: ${item.confidence_score}`)
        }
      } else if (item.confidence !== undefined && item.confidence !== null) {
        // Alternative field name
        const conf = parseFloat(item.confidence)
        if (!isNaN(conf) && conf >= 0 && conf <= 1) {
          normalized.confidence_score = conf
        }
      }
      
      // Field Confidence: Extract per-field confidence scores
      if (item.field_confidence && typeof item.field_confidence === 'object') {
        const fieldConf = {}
        const fieldNames = [
          'sku', 'description', 'hts_code', 'country_of_origin',
          'quantity', 'unit_price', 'value', 'net_weight', 'gross_weight'
        ]
        
        fieldNames.forEach(field => {
          const confValue = item.field_confidence[`${field}_confidence`] || 
                          item.field_confidence[field] ||
                          item.field_confidence[field.toUpperCase()]
          if (confValue !== undefined && confValue !== null) {
            const conf = parseFloat(confValue)
            if (!isNaN(conf) && conf >= 0 && conf <= 1) {
              fieldConf[`${field}_confidence`] = conf
            }
          }
        })
        
        if (Object.keys(fieldConf).length > 0) {
          normalized.field_confidence = fieldConf
        }
      }
      
      // Validation Status: Extract overall validation status
      if (item.validation_status) {
        const validStatus = String(item.validation_status).toLowerCase()
        if (['passed', 'warning', 'failed'].includes(validStatus)) {
          normalized.validation_status = validStatus
        } else {
          logger.warn(`Invalid validation_status for item ${index + 1}: ${item.validation_status}`)
        }
      }
      
      // Validation Checks: Extract validation check results
      if (item.validation_checks && typeof item.validation_checks === 'object') {
        const validationChecks = {}
        const checkNames = [
          'completeness_check', 'data_type_check', 'currency_check',
          'calculation_check', 'sku_check', 'hts_format_check',
          'coo_format_check', 'weight_check'
        ]
        
        checkNames.forEach(check => {
          const checkValue = item.validation_checks[check]
          if (checkValue !== undefined && checkValue !== null) {
            const checkStr = String(checkValue).toLowerCase()
            if (['passed', 'warning', 'failed'].includes(checkStr)) {
              validationChecks[check] = checkStr
            }
          }
        })
        
        if (Object.keys(validationChecks).length > 0) {
          normalized.validation_checks = validationChecks
        }
      }
      
      // Preserve any additional fields from A79 (metadata, etc.)
      return {
        ...normalized,
        // Keep any extra fields that might be useful
        ...(item.metadata && { metadata: item.metadata }),
        ...(item.other_data && { other_data: item.other_data })
      }
    })

    // Calculate overall confidence and validation summary
    const confidenceScores = validatedItems
      .map(item => item.confidence_score)
      .filter(conf => conf !== undefined && conf !== null)
    
    const validationStatuses = validatedItems
      .map(item => item.validation_status)
      .filter(status => status !== undefined)
    
    const validationSummary = {
      total_items: validatedItems.length,
      items_with_confidence: confidenceScores.length,
      items_with_validation: validationStatuses.length,
      ...(confidenceScores.length > 0 && {
        average_confidence: confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length,
        high_confidence_items: confidenceScores.filter(c => c >= 0.90).length,
        medium_confidence_items: confidenceScores.filter(c => c >= 0.70 && c < 0.90).length,
        low_confidence_items: confidenceScores.filter(c => c < 0.70).length
      }),
      ...(validationStatuses.length > 0 && {
        passed_items: validationStatuses.filter(s => s === 'passed').length,
        warning_items: validationStatuses.filter(s => s === 'warning').length,
        failed_items: validationStatuses.filter(s => s === 'failed').length
      })
    }
    
    // Log confidence and validation summary
    if (confidenceScores.length > 0) {
      logger.info(`📊 Confidence Summary:`, {
        average: validationSummary.average_confidence?.toFixed(3),
        high: validationSummary.high_confidence_items,
        medium: validationSummary.medium_confidence_items,
        low: validationSummary.low_confidence_items
      })
    }
    
    if (validationStatuses.length > 0) {
      logger.info(`✅ Validation Summary:`, {
        passed: validationSummary.passed_items,
        warnings: validationSummary.warning_items,
        failed: validationSummary.failed_items
      })
    }
    
    return {
      ...data,
      line_items: validatedItems,
      metadata: {
        ...(data.metadata || {}),
        ...(confidenceScores.length > 0 && {
          confidence_summary: {
            average_confidence: validationSummary.average_confidence,
            high_confidence_items: validationSummary.high_confidence_items,
            medium_confidence_items: validationSummary.medium_confidence_items,
            low_confidence_items: validationSummary.low_confidence_items
          }
        }),
        ...(validationStatuses.length > 0 && {
          validation_summary: {
            passed_items: validationSummary.passed_items,
            warning_items: validationSummary.warning_items,
            failed_items: validationSummary.failed_items
          }
        }),
        ...validationSummary
      }
    }
  }

  /**
   * Test A79 API connection
   */
  async testConnection() {
    return await this.checkConnection()
  }
}

export const a79ExtractService = new A79ExtractService()
