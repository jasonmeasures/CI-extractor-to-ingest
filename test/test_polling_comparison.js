#!/usr/bin/env node

/**
 * Polling Comparison Test
 * Tests A79 polling behavior and compares with our implementation
 */

import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
const envPath = path.join(__dirname, '../backend/.env')
let A79_API_KEY = 'sk-a79-wvymMMk2FdgHPGBP9mGakuGLnc/FZg3i'
let A79_BASE_URL = 'https://klearnow.prod.a79.ai/api/v1/public/workflow'

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      if (key === 'A79_API_KEY') A79_API_KEY = value
      if (key === 'A79_BASE_URL') A79_BASE_URL = value
    }
  })
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🔍 A79 POLLING COMPARISON TEST')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

// Test run_id from previous test (or use a new one)
const TEST_RUN_ID = process.argv[2] || 'b7395e3e-1103-47fd-bae6-20f3c1fd7585'

console.log(`📋 Using Run ID: ${TEST_RUN_ID}`)
console.log('')

// Polling endpoints to test
const pollingEndpoints = [
  {
    name: 'Primary (with output_var)',
    url: `${A79_BASE_URL}/${TEST_RUN_ID}/status?output_var=final_display_output`
  },
  {
    name: 'Primary (without output_var)',
    url: `${A79_BASE_URL}/${TEST_RUN_ID}/status`
  },
  {
    name: 'Simple run status',
    url: `${A79_BASE_URL}/run/${TEST_RUN_ID}`
  },
  {
    name: 'Run ID only',
    url: `${A79_BASE_URL}/${TEST_RUN_ID}`
  }
]

// Our polling configuration
const ourConfig = {
  pollInterval: 5000, // 5 seconds
  pollTimeout: 30000, // 30 seconds per poll
  maxPollAttempts: 120, // 10 minutes total
  statusChecks: ['completed', 'succeeded']
}

console.log('📊 Our Polling Configuration:')
console.log(`  Interval: ${ourConfig.pollInterval / 1000}s`)
console.log(`  Timeout: ${ourConfig.pollTimeout / 1000}s per poll`)
console.log(`  Max Attempts: ${ourConfig.maxPollAttempts} (${(ourConfig.maxPollAttempts * ourConfig.pollInterval) / 1000 / 60} minutes)`)
console.log(`  Status Checks: ${ourConfig.statusChecks.join(', ')}`)
console.log('')

// Test each endpoint
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🧪 TESTING POLLING ENDPOINTS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const results = []

for (const endpoint of pollingEndpoints) {
  console.log(`Testing: ${endpoint.name}`)
  console.log(`  URL: ${endpoint.url}`)
  
  try {
    const startTime = Date.now()
    const response = await axios.get(endpoint.url, {
      headers: {
        'Authorization': `Bearer ${A79_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': '*/*'
      },
      timeout: 10000
    })
    const duration = Date.now() - startTime
    
    const data = response.data
    
    // Analyze response structure
    const analysis = {
      endpoint: endpoint.name,
      url: endpoint.url,
      status: response.status,
      duration: `${duration}ms`,
      hasStatus: !!data.status,
      statusValue: data.status,
      hasRunId: !!data.run_id,
      hasNodes: !!data.nodes,
      nodesCount: data.nodes?.length || 0,
      hasOutput: !!data.output,
      outputType: typeof data.output,
      responseKeys: Object.keys(data).join(', ')
    }
    
    results.push(analysis)
    
    console.log(`  ✅ Status: ${response.status}`)
    console.log(`  ⏱️  Duration: ${duration}ms`)
    console.log(`  📋 Response Status: ${data.status || 'N/A'}`)
    console.log(`  🔑 Response Keys: ${analysis.responseKeys}`)
    
    if (data.nodes && data.nodes.length > 0) {
      console.log(`  📦 Nodes: ${data.nodes.length}`)
      data.nodes.forEach((node, i) => {
        console.log(`     ${i + 1}. ${node.name}: ${node.run_status || 'N/A'}`)
        if (node.output && node.output.text) {
          const textPreview = String(node.output.text).substring(0, 50)
          console.log(`        Output preview: ${textPreview}...`)
        }
      })
    }
    
    // Check if this endpoint indicates completion
    const isComplete = data.status === 'completed' || data.status === 'succeeded'
    if (isComplete) {
      console.log(`  ✅ Status indicates completion`)
    } else if (data.status === 'running' || data.status === 'pending') {
      console.log(`  ⏳ Status indicates still processing`)
    }
    
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`)
    if (error.response) {
      console.log(`     Status: ${error.response.status}`)
      console.log(`     Data: ${JSON.stringify(error.response.data).substring(0, 100)}`)
    }
    results.push({
      endpoint: endpoint.name,
      url: endpoint.url,
      error: error.message,
      status: error.response?.status
    })
  }
  
  console.log('')
}

// Summary
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 POLLING ANALYSIS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

// Find best endpoint
const workingEndpoints = results.filter(r => !r.error && r.hasStatus)
if (workingEndpoints.length > 0) {
  console.log('✅ Working Endpoints:')
  workingEndpoints.forEach(ep => {
    console.log(`  • ${ep.endpoint}`)
    console.log(`    Status: ${ep.statusValue}`)
    console.log(`    Has Nodes: ${ep.hasNodes} (${ep.nodesCount} nodes)`)
    console.log(`    Has Output: ${ep.hasOutput} (${ep.outputType})`)
  })
  console.log('')
}

// Status value analysis
const statusValues = [...new Set(workingEndpoints.map(e => e.statusValue).filter(Boolean))]
console.log('📋 Status Values Found:')
statusValues.forEach(status => {
  const count = workingEndpoints.filter(e => e.statusValue === status).length
  console.log(`  • "${status}": ${count} endpoint(s)`)
})
console.log('')

// Recommendations
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('💡 RECOMMENDATIONS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const primaryEndpoint = workingEndpoints.find(e => e.endpoint.includes('Primary'))
if (primaryEndpoint) {
  console.log('✅ Primary endpoint works:')
  console.log(`   ${primaryEndpoint.url}`)
  console.log(`   Status: ${primaryEndpoint.statusValue}`)
  console.log('')
}

if (statusValues.includes('running')) {
  console.log('⚠️  Status is "running" - workflow still processing')
  console.log('   Our code checks for: "completed" or "succeeded"')
  console.log('   Should also handle: "running", "pending", "processing"')
  console.log('')
}

if (statusValues.includes('succeeded')) {
  console.log('✅ Status "succeeded" found - our code handles this')
  console.log('')
}

if (statusValues.includes('completed')) {
  console.log('✅ Status "completed" found - our code handles this')
  console.log('')
}

// Compare with our implementation
console.log('🔍 Comparison with Our Implementation:')
console.log(`  Our status checks: ${ourConfig.statusChecks.join(', ')}`)
console.log(`  Found status values: ${statusValues.join(', ')}`)
const missingStatuses = statusValues.filter(s => !ourConfig.statusChecks.includes(s))
if (missingStatuses.length > 0) {
  console.log(`  ⚠️  Missing status checks: ${missingStatuses.join(', ')}`)
} else {
  console.log(`  ✅ All status values are handled`)
}
console.log('')

// Save results
const resultsPath = path.join(__dirname, 'polling_analysis.json')
fs.writeFileSync(resultsPath, JSON.stringify({
  runId: TEST_RUN_ID,
  timestamp: new Date().toISOString(),
  ourConfig,
  endpoints: results,
  statusValues,
  recommendations: {
    primaryEndpoint: primaryEndpoint?.url,
    statusChecks: statusValues,
    missingChecks: missingStatuses
  }
}, null, 2))

console.log(`💾 Results saved to: ${resultsPath}`)
console.log('')

