#!/usr/bin/env node

/**
 * Compare Request Format
 * Compares our request format with Clear Audit 7501 format
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load our request payload (if exists)
const ourPayloadPath = path.join(__dirname, 'request_payload.json')
const clearAuditPayloadPath = path.join(__dirname, 'clear_audit_7501_payload.json')

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🔍 REQUEST FORMAT COMPARISON')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

// Our expected format
const ourFormat = {
  agent_name: 'Unified PDF Parser',
  agent_inputs: {
    pdf_document: '<base64_string>',
    custom_instructions: '<instructions_string>'
  }
}

console.log('📋 Our Format:')
console.log(JSON.stringify(ourFormat, null, 2))
console.log('')

// Load actual payloads if they exist
let ourPayload = null
let clearAuditPayload = null

if (fs.existsSync(ourPayloadPath)) {
  try {
    ourPayload = JSON.parse(fs.readFileSync(ourPayloadPath, 'utf8'))
    console.log('✅ Loaded our request payload')
  } catch (e) {
    console.log('⚠️  Could not parse our payload:', e.message)
  }
}

if (fs.existsSync(clearAuditPayloadPath)) {
  try {
    clearAuditPayload = JSON.parse(fs.readFileSync(clearAuditPayloadPath, 'utf8'))
    console.log('✅ Loaded Clear Audit 7501 payload')
  } catch (e) {
    console.log('⚠️  Clear Audit 7501 payload not found')
    console.log('   Expected at:', clearAuditPayloadPath)
  }
}

console.log('')

// Compare structures
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 COMPARISON')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

if (ourPayload && clearAuditPayload) {
  // Compare top-level keys
  const ourKeys = Object.keys(ourPayload).sort()
  const clearAuditKeys = Object.keys(clearAuditPayload).sort()
  
  console.log('Top-level keys:')
  console.log('  Our format:', ourKeys.join(', '))
  console.log('  Clear Audit:', clearAuditKeys.join(', '))
  
  if (JSON.stringify(ourKeys) === JSON.stringify(clearAuditKeys)) {
    console.log('  ✅ Keys match')
  } else {
    console.log('  ❌ Keys differ')
    const missing = ourKeys.filter(k => !clearAuditKeys.includes(k))
    const extra = clearAuditKeys.filter(k => !ourKeys.includes(k))
    if (missing.length > 0) console.log('     Missing in Clear Audit:', missing.join(', '))
    if (extra.length > 0) console.log('     Extra in Clear Audit:', extra.join(', '))
  }
  console.log('')
  
  // Compare agent_inputs structure
  if (ourPayload.agent_inputs && clearAuditPayload.agent_inputs) {
    const ourInputs = Object.keys(ourPayload.agent_inputs).sort()
    const clearAuditInputs = Object.keys(clearAuditPayload.agent_inputs).sort()
    
    console.log('agent_inputs keys:')
    console.log('  Our format:', ourInputs.join(', '))
    console.log('  Clear Audit:', clearAuditInputs.join(', '))
    
    if (JSON.stringify(ourInputs) === JSON.stringify(clearAuditInputs)) {
      console.log('  ✅ Keys match')
    } else {
      console.log('  ❌ Keys differ')
    }
    console.log('')
  }
  
  // Compare agent_name
  if (ourPayload.agent_name && clearAuditPayload.agent_name) {
    console.log('Agent name:')
    console.log('  Our format:', ourPayload.agent_name)
    console.log('  Clear Audit:', clearAuditPayload.agent_name)
    
    if (ourPayload.agent_name === clearAuditPayload.agent_name) {
      console.log('  ✅ Match')
    } else {
      console.log('  ❌ Different')
    }
    console.log('')
  }
  
  // Check base64 format
  if (ourPayload.agent_inputs?.pdf_document && clearAuditPayload.agent_inputs?.pdf_document) {
    const ourBase64 = ourPayload.agent_inputs.pdf_document
    const clearAuditBase64 = clearAuditPayload.agent_inputs.pdf_document
    
    console.log('Base64 encoding:')
    console.log('  Our length:', ourBase64.length)
    console.log('  Clear Audit length:', clearAuditBase64.length)
    console.log('  Our starts with:', ourBase64.substring(0, 20))
    console.log('  Clear Audit starts with:', clearAuditBase64.substring(0, 20))
    
    // Check for data URL prefix
    if (ourBase64.includes(',')) {
      console.log('  ⚠️  Our base64 contains comma (data URL prefix?)')
    }
    if (clearAuditBase64.includes(',')) {
      console.log('  ⚠️  Clear Audit base64 contains comma (data URL prefix?)')
    }
    console.log('')
  }
  
} else {
  console.log('⚠️  Cannot compare - missing payload files')
  console.log('')
  console.log('To capture Clear Audit 7501 payload:')
  console.log('  1. Run Clear Audit 7501')
  console.log('  2. Capture the request payload')
  console.log('  3. Save to:', clearAuditPayloadPath)
  console.log('')
}

// Expected differences to check
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('🔍 CHECKLIST')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('')

const checks = [
  { name: 'agent_name field exists', check: () => ourPayload?.agent_name },
  { name: 'agent_inputs field exists', check: () => ourPayload?.agent_inputs },
  { name: 'pdf_document in agent_inputs', check: () => ourPayload?.agent_inputs?.pdf_document },
  { name: 'custom_instructions in agent_inputs', check: () => ourPayload?.agent_inputs?.custom_instructions },
  { name: 'No data URL prefix in base64', check: () => !ourPayload?.agent_inputs?.pdf_document?.includes(',') },
  { name: 'Base64 is valid format', check: () => {
    const base64 = ourPayload?.agent_inputs?.pdf_document
    return base64 && /^[A-Za-z0-9+/]*={0,2}$/.test(base64)
  }}
]

checks.forEach(({ name, check }) => {
  const result = check()
  console.log(`  ${result ? '✅' : '❌'} ${name}`)
})

console.log('')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

