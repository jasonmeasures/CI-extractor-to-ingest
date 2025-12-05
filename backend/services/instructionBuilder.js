/**
 * Instruction Builder Service
 * 
 * Implements three-tier instruction system:
 * 1. Baseline Instructions (hybrid: comprehensive + precise)
 * 2. Customer Instructions (customer-specific fields and rules)
 * 3. Custom Instructions (one-off user requirements)
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { BASELINE_INSTRUCTIONS } from '../config/baselineInstructions.js'
import { logger } from '../utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Load customer configuration from JSON file
 */
function loadCustomerConfig(customerNumber) {
  try {
    const customerPath = join(__dirname, '../config/customers', `${customerNumber}.json`)
    const customerData = readFileSync(customerPath, 'utf8')
    return JSON.parse(customerData)
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn(`Customer config not found: ${customerNumber}`)
      return null
    }
    logger.error(`Error loading customer config ${customerNumber}:`, error)
    throw error
  }
}

/**
 * Build customer-specific instructions from config
 */
function buildCustomerInstructions(customerConfig) {
  if (!customerConfig) {
    return ''
  }

  let instructions = `\n\n=== CUSTOMER-SPECIFIC INSTRUCTIONS (${customerConfig.name}) ===\n\n`

  // Add additional fields
  if (customerConfig.additional_fields && customerConfig.additional_fields.length > 0) {
    instructions += `ADDITIONAL FIELDS TO EXTRACT:\n`
    customerConfig.additional_fields.forEach(field => {
      instructions += `- ${field}\n`
    })
    instructions += `\n`
  }

  // Add special rules
  if (customerConfig.special_rules && customerConfig.special_rules.length > 0) {
    instructions += `SPECIAL RULES:\n`
    customerConfig.special_rules.forEach(rule => {
      instructions += `- ${rule}\n`
    })
    instructions += `\n`
  }

  // Add field mappings
  if (customerConfig.field_mappings && Object.keys(customerConfig.field_mappings).length > 0) {
    instructions += `FIELD NAME MAPPINGS:\n`
    Object.entries(customerConfig.field_mappings).forEach(([oldName, newName]) => {
      instructions += `- "${oldName}" should be mapped to "${newName}"\n`
    })
    instructions += `\n`
  }

  return instructions
}

/**
 * Build complete instructions combining all three tiers
 * 
 * @param {Object} options
 * @param {string} options.customer_number - Customer number (e.g., "TARGET001")
 * @param {string} options.custom_instructions - User-provided custom instructions
 * @param {Array<string>} options.extract_fields - Additional fields to extract
 * @param {number} options.pdf_page_count - Number of pages in the PDF (if known)
 * @returns {string} Complete instructions string
 */
export function buildInstructions({ customer_number, custom_instructions, extract_fields = [], pdf_page_count = null } = {}) {
  let instructions = BASELINE_INSTRUCTIONS
  
  // If we know the page count, add explicit instruction at the very top
  if (pdf_page_count && pdf_page_count > 1) {
    const pageCountWarning = `

[CRITICAL] THIS DOCUMENT HAS ${pdf_page_count} PAGES [CRITICAL]

YOU MUST PROCESS ALL ${pdf_page_count} PAGES.

DO NOT STOP AFTER PAGE 1.

YOU MUST EXTRACT LINE ITEMS FROM:
- Page 1
- Page 2
${pdf_page_count > 2 ? `- Page 3\n${pdf_page_count > 3 ? `- Page 4\n${pdf_page_count > 4 ? `- Page 5\n...and all remaining pages up to page ${pdf_page_count}` : ''}` : ''}` : ''}

IF YOU ONLY EXTRACT ITEMS FROM PAGE 1 AND STOP, YOU HAVE FAILED COMPLETELY.

COUNT THE PAGES: This PDF has ${pdf_page_count} pages total.
PROCESS ALL ${pdf_page_count} PAGES BEFORE OUTPUTTING JSON.

`
    instructions = pageCountWarning + instructions
    logger.info(`Added explicit ${pdf_page_count}-page instruction to force multi-page processing`)
  }

  // Tier 2: Customer Instructions
  if (customer_number) {
    const customerConfig = loadCustomerConfig(customer_number)
    if (customerConfig) {
      const customerInstructions = buildCustomerInstructions(customerConfig)
      instructions += customerInstructions
      logger.info(`Applied customer instructions for ${customer_number}`)
    } else {
      logger.warn(`Customer ${customer_number} not found, using baseline only`)
    }
  }

  // Tier 3: Custom Instructions
  if (custom_instructions && custom_instructions.trim()) {
    instructions += `\n\n=== CUSTOM INSTRUCTIONS ===\n\n${custom_instructions.trim()}\n`
    logger.info('Applied custom instructions')
  }

  // Additional extract fields (if specified)
  if (extract_fields && extract_fields.length > 0) {
    const additionalFields = extract_fields
      .filter(field => !['line_items', 'sku', 'description', 'hts_code'].includes(field))
      .join(', ')
    
    if (additionalFields) {
      instructions += `\n\n=== ADDITIONAL FIELDS ===\n\nAlso extract: ${additionalFields}\n`
    }
  }

  return instructions
}

/**
 * Get customer configuration
 */
export function getCustomerConfig(customerNumber) {
  return loadCustomerConfig(customerNumber)
}

/**
 * List all available customers
 */
export async function listCustomers() {
  try {
    const customersDir = join(__dirname, '../config/customers')
    const fs = await import('fs/promises')
    const files = await fs.readdir(customersDir)
    
    const customers = []
    for (const file of files) {
      if (file.endsWith('.json')) {
        const customerNumber = file.replace('.json', '')
        const config = loadCustomerConfig(customerNumber)
        if (config) {
          customers.push({
            customer_number: config.customer_number,
            name: config.name,
            additional_fields_count: config.additional_fields?.length || 0,
            special_rules_count: config.special_rules?.length || 0
          })
        }
      }
    }
    
    return customers
  } catch (error) {
    logger.error('Error listing customers:', error)
    return []
  }
}

