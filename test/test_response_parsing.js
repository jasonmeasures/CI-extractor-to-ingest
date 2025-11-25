#!/usr/bin/env node

/**
 * Test Response Parsing
 * Tests our A79 response parsing logic with various response formats
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🧪 RESPONSE PARSING TEST')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

// Test response formats (based on A79 API documentation and observed formats)
const testResponses = [
  {
    name: 'Format 1: Direct line_items',
    response: {
      status: 'succeeded',
      run_id: 'test-run-123',
      line_items: [
        {
          sku: 'TEST001',
          description: 'Test Product',
          hts_code: '8471.30.0100',
          country_of_origin: 'US',
          quantity: 10,
          unit_price: 100.00
        }
      ]
    }
  },
  {
    name: 'Format 2: Nested in data',
    response: {
      status: 'succeeded',
      run_id: 'test-run-123',
      data: {
        line_items: [
          {
            sku: 'TEST001',
            description: 'Test Product',
            hts_code: '8471.30.0100',
            country_of_origin: 'US',
            quantity: 10,
            unit_price: 100.00
          }
        ]
      }
    }
  },
  {
    name: 'Format 3: Nested in output.text (Run-Classified-Workflow)',
    response: {
      status: 'succeeded',
      run_id: 'test-run-123',
      output: {
        'Run-Classified-Workflow': {
          output: {
            text: JSON.stringify({
              line_items: [
                {
                  sku: 'TEST001',
                  description: 'Test Product',
                  hts_code: '8471.30.0100',
                  country_of_origin: 'US',
                  quantity: 10,
                  unit_price: 100.00
                }
              ]
            })
          }
        }
      }
    }
  },
  {
    name: 'Format 4: Nested in content',
    response: {
      status: 'succeeded',
      run_id: 'test-run-123',
      content: {
        items: [
          {
            sku: 'TEST001',
            description: 'Test Product',
            hts_code: '8471.30.0100',
            country_of_origin: 'US',
            quantity: 10,
            unit_price: 100.00
          }
        ]
      }
    }
  },
  {
    name: 'Format 5: Empty line_items',
    response: {
      status: 'succeeded',
      run_id: 'test-run-123',
      line_items: []
    }
  },
  {
    name: 'Format 6: Error response',
    response: {
      status: 'workflow_execution_failed',
      error: 'Unsupported file type',
      workflow_executed: 'None (failed)'
    }
  }
]

// Our parsing logic (from a79Service.js)
function parseA79Response(response) {
  // Check for workflow failure
  if (response.status === 'workflow_execution_failed' || response.workflow_executed === 'None (failed)') {
    throw new Error(`A79 workflow failed: ${response.error || 'Unknown error'}`)
  }
  
  // Try to extract line_items from various locations
  let lineItems = null
  
  // 1. Direct line_items
  if (response.line_items && Array.isArray(response.line_items)) {
    lineItems = response.line_items
  }
  // 2. Nested in data
  else if (response.data?.line_items && Array.isArray(response.data.line_items)) {
    lineItems = response.data.line_items
  }
  // 3. Nested in output.text (Run-Classified-Workflow)
  else if (response.output?.['Run-Classified-Workflow']?.output?.text) {
    try {
      const parsed = JSON.parse(response.output['Run-Classified-Workflow'].output.text)
      if (parsed.line_items && Array.isArray(parsed.line_items)) {
        lineItems = parsed.line_items
      } else if (parsed.items && Array.isArray(parsed.items)) {
        lineItems = parsed.items
      }
    } catch (e) {
      // Not JSON, try to find line_items elsewhere
    }
  }
  // 4. Nested in content.items or content.line_items
  else if (response.content?.items && Array.isArray(response.content.items)) {
    lineItems = response.content.items
  }
  else if (response.content?.line_items && Array.isArray(response.content.line_items)) {
    lineItems = response.content.line_items
  }
  
  if (!lineItems) {
    throw new Error('No line_items found in A79 response')
  }
  
  return {
    line_items: lineItems,
    status: response.status,
    run_id: response.run_id
  }
}

// Test each format
let passed = 0
let failed = 0

testResponses.forEach(({ name, response }) => {
  console.log(`Testing: ${name}`)
  
  try {
    const result = parseA79Response(response)
    
    if (response.status === 'workflow_execution_failed') {
      console.log('  ❌ Should have thrown error for failed workflow')
      failed++
    } else if (result.line_items && Array.isArray(result.line_items)) {
      console.log(`  ✅ Parsed ${result.line_items.length} line items`)
      passed++
    } else {
      console.log('  ❌ Failed to parse line_items')
      failed++
    }
  } catch (error) {
    if (response.status === 'workflow_execution_failed') {
      console.log(`  ✅ Correctly detected workflow failure: ${error.message}`)
      passed++
    } else {
      console.log(`  ❌ Parsing error: ${error.message}`)
      failed++
    }
  }
  
  console.log('')
})

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 RESULTS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log(`📊 Total: ${passed + failed}`)
console.log('')

if (failed === 0) {
  console.log('✅ All parsing tests passed!')
} else {
  console.log('⚠️  Some parsing tests failed - review logic')
}

console.log('')

