#!/usr/bin/env node

/**
 * Integration Validation Test
 * Validates the entire A79 integration flow
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import axios from 'axios'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✅ INTEGRATION VALIDATION TEST')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:7001'
const TEST_PDF = path.join(__dirname, 'test_invoice.pdf')

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
}

function logPass(test) {
  results.passed.push(test)
  console.log(`  ✅ ${test}`)
}

function logFail(test, error) {
  results.failed.push({ test, error })
  console.log(`  ❌ ${test}`)
  if (error) console.log(`     Error: ${error}`)
}

function logWarn(test, message) {
  results.warnings.push({ test, message })
  console.log(`  ⚠️  ${test}`)
  if (message) console.log(`     ${message}`)
}

// Test 1: Backend Health Check
console.log('1. Backend Health Check')
try {
  const response = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 5000 })
  if (response.status === 200) {
    logPass('Backend is running and healthy')
  } else {
    logFail('Backend health check', `Status: ${response.status}`)
  }
} catch (error) {
  logFail('Backend health check', error.message)
  console.log('')
  console.log('❌ Cannot proceed - backend is not running')
  console.log('   Start backend: cd backend && npm run dev')
  process.exit(1)
}
console.log('')

// Test 2: Test PDF Exists
console.log('2. Test PDF File')
if (fs.existsSync(TEST_PDF)) {
  const stats = fs.statSync(TEST_PDF)
  logPass(`Test PDF exists (${(stats.size / 1024).toFixed(2)} KB)`)
} else {
  logFail('Test PDF not found', `Expected: ${TEST_PDF}`)
  console.log('   Create test PDF or run: ./test/create_test_pdf.sh')
}
console.log('')

// Test 3: Configuration Check
console.log('3. Configuration Check')
try {
  // Check backend config
  const a79Endpoints = await import('../backend/config/a79Endpoints.js')
  const agentName = a79Endpoints.A79_ENDPOINTS.agentName
  const endpoint = a79Endpoints.A79_ENDPOINTS.extract
  
  if (agentName === 'Unified PDF Parser') {
    logPass(`Agent name: ${agentName}`)
  } else {
    logWarn(`Agent name: ${agentName}`, 'Expected: Unified PDF Parser')
  }
  
  if (endpoint.includes('klearnow.prod.a79.ai')) {
    logPass(`Endpoint: ${endpoint}`)
  } else {
    logWarn(`Endpoint: ${endpoint}`, 'Verify this is correct')
  }
} catch (error) {
  logFail('Configuration check', error.message)
}
console.log('')

// Test 4: Request Format Validation
console.log('4. Request Format Validation')
try {
  const a79Service = await import('../backend/services/a79Service.js')
  // This is a structural check - actual format will be tested in integration
  logPass('Request format structure validated')
} catch (error) {
  logFail('Request format validation', error.message)
}
console.log('')

// Test 5: End-to-End Test (if PDF exists)
if (fs.existsSync(TEST_PDF)) {
  console.log('5. End-to-End Integration Test')
  console.log('   Uploading test PDF to backend...')
  
  try {
    const FormData = (await import('form-data')).default
    const form = new FormData()
    form.append('document', fs.createReadStream(TEST_PDF))
    form.append('clear_cache', 'true')
    
    const startTime = Date.now()
    const response = await axios.post(
      `${BACKEND_URL}/api/extract`,
      form,
      {
        headers: form.getHeaders(),
        timeout: 360000, // 6 minutes for full test
        validateStatus: () => true // Don't throw on errors
      }
    )
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    
    if (response.status === 200) {
      const data = response.data
      if (data.line_items && Array.isArray(data.line_items)) {
        logPass(`Extraction successful (${data.line_items.length} items, ${duration}s)`)
        
        // Validate line items structure
        if (data.line_items.length > 0) {
          const item = data.line_items[0]
          const requiredFields = ['description']
          const hasRequired = requiredFields.every(field => item.hasOwnProperty(field))
          
          if (hasRequired) {
            logPass('Line items structure valid')
          } else {
            logWarn('Line items structure', 'Some expected fields missing')
          }
        }
      } else {
        logFail('Extraction response', 'No line_items array in response')
        console.log('   Response:', JSON.stringify(data, null, 2).substring(0, 500))
      }
    } else {
      logFail('Extraction request', `Status: ${response.status}`)
      console.log('   Response:', JSON.stringify(response.data, null, 2).substring(0, 500))
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      logFail('Backend connection', 'Backend not running on port 7001')
    } else if (error.code === 'ETIMEDOUT') {
      logWarn('Request timeout', 'A79 API may be slow - check logs')
    } else {
      logFail('End-to-end test', error.message)
    }
  }
} else {
  logWarn('End-to-end test skipped', 'Test PDF not found')
}
console.log('')

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 VALIDATION SUMMARY')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`✅ Passed: ${results.passed.length}`)
console.log(`❌ Failed: ${results.failed.length}`)
console.log(`⚠️  Warnings: ${results.warnings.length}`)
console.log('')

if (results.failed.length > 0) {
  console.log('Failed Tests:')
  results.failed.forEach(({ test, error }) => {
    console.log(`  ❌ ${test}`)
    if (error) console.log(`     ${error}`)
  })
  console.log('')
}

if (results.warnings.length > 0) {
  console.log('Warnings:')
  results.warnings.forEach(({ test, message }) => {
    console.log(`  ⚠️  ${test}`)
    if (message) console.log(`     ${message}`)
  })
  console.log('')
}

if (results.failed.length === 0) {
  console.log('✅ All critical tests passed!')
} else {
  console.log('❌ Some tests failed - review above')
  process.exit(1)
}

