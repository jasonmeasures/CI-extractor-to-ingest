#!/usr/bin/env node

/**
 * Test A79 API Connection
 * This script tests the A79 API connection directly
 */

import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config({ path: './backend/.env' })

const A79_ENDPOINT = process.env.A79_API_ENDPOINT || 'https://klearnow.prod.a79.ai/api/v1/public/workflow/run'
const A79_API_KEY = process.env.A79_API_KEY || 'sk-a79-wvymMMk2FdgHPGBP9mGakuGLnc/FZg3i'
const AGENT_NAME = process.env.A79_AGENT_NAME || 'Unified PDF Parser'

async function testA79Connection() {
  console.log('🧪 Testing A79 API Connection...\n')
  console.log(`Endpoint: ${A79_ENDPOINT}`)
  console.log(`API Key: ${A79_API_KEY.substring(0, 15)}...`)
  console.log(`Agent: ${AGENT_NAME}\n`)

  const testPayload = {
    agent_name: AGENT_NAME,
    agent_inputs: {
      pdf_document: 'dGVzdA==', // base64 "test"
      custom_instructions: 'Test connection'
    }
  }

  try {
    console.log('📤 Sending test request...')
    const response = await axios.post(
      A79_ENDPOINT,
      testPayload,
      {
        headers: {
          'Authorization': `Bearer ${A79_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': '*/*'
        },
        timeout: 10000,
        validateStatus: (status) => status < 600 // Accept all status codes for testing
      }
    )

    console.log(`\n✅ Response Status: ${response.status} ${response.statusText}`)
    console.log(`📦 Response Data:`, JSON.stringify(response.data, null, 2))
    
    if (response.status === 200 || response.status === 201) {
      console.log('\n✅ SUCCESS: A79 API connection is working!')
      if (response.data.run_id) {
        console.log(`   Run ID: ${response.data.run_id}`)
      }
    } else if (response.status === 403) {
      console.log('\n❌ ERROR: 403 Forbidden')
      console.log('   Response:', JSON.stringify(response.data, null, 2))
      console.log('\n   Possible causes:')
      console.log('   - Invalid API key')
      console.log('   - Incorrect endpoint')
      console.log('   - Request format issue')
    } else {
      console.log(`\n⚠️  Unexpected status: ${response.status}`)
      console.log('   Response:', JSON.stringify(response.data, null, 2))
    }

  } catch (error) {
    console.log('\n❌ ERROR:', error.message)
    
    if (error.response) {
      console.log(`   Status: ${error.response.status}`)
      console.log(`   Data:`, JSON.stringify(error.response.data, null, 2))
      console.log(`   Headers:`, JSON.stringify(error.response.headers, null, 2))
    } else if (error.request) {
      console.log('   No response received - check network connection')
    } else {
      console.log('   Error:', error.message)
    }
  }
}

testA79Connection()

