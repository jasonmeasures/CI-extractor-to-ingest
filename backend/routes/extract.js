import express from 'express'
import multer from 'multer'
import { logger } from '../utils/logger.js'
import { a79ExtractService } from '../services/a79Service.js'
import { validateExtractRequest } from '../middleware/validation.js'

const router = express.Router()

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed'), false)
    }
  }
})

/**
 * POST /api/extract
 * Extract line items from commercial invoice PDF
 * Supports both multipart/form-data (file upload) and JSON (base64)
 */
router.post('/', (req, res, next) => {
  // Check content type to determine which middleware to use
  const contentType = req.headers['content-type'] || ''
  
  if (contentType.includes('multipart/form-data')) {
    // Use multer for file uploads
    upload.single('document')(req, res, next)
  } else {
    // Skip multer for JSON requests, just pass through
    next()
  }
}, async (req, res, next) => {
  try {
    let base64Data = null
    let documentType = 'commercial_invoice'

    // Check if request has file upload (multipart/form-data)
    if (req.file) {
      logger.info(`Extraction request received: ${req.file.originalname} (${req.file.size} bytes, MIME: ${req.file.mimetype})`)
      
      // Verify it's actually a PDF
      if (req.file.mimetype !== 'application/pdf') {
        logger.warn(`⚠️ File MIME type is ${req.file.mimetype}, not application/pdf`)
      }
      
      // Check PDF magic bytes
      const pdfMagicBytes = req.file.buffer.slice(0, 4).toString('ascii')
      if (pdfMagicBytes !== '%PDF') {
        logger.error(`❌ File does not start with PDF magic bytes. Got: ${pdfMagicBytes}`)
        return res.status(400).json({
          error: 'Invalid PDF file',
          message: 'The uploaded file does not appear to be a valid PDF file'
        })
      }
      
      base64Data = req.file.buffer.toString('base64')
      logger.debug(`Base64 length: ${base64Data.length} chars, starts with: ${base64Data.substring(0, 20)}`)
      documentType = req.body.document_type || 'commercial_invoice'
    } 
    // Check if request has base64 document (JSON)
    else if (req.body && req.body.document) {
      logger.info('Extraction request received: base64 document')
      base64Data = req.body.document
      
      // Remove data URL prefix if present (e.g., "data:application/pdf;base64,")
      if (base64Data.includes(',')) {
        base64Data = base64Data.split(',')[1]
        logger.debug('Removed data URL prefix from base64 document')
      }
      
      // Validate base64 format (basic check)
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
        logger.warn('Base64 data may be invalid - contains non-base64 characters')
      }
      
      documentType = req.body.document_type || 'commercial_invoice'
    }
    // Neither file nor base64 provided
    else {
      return res.status(400).json({
        error: 'No PDF file provided',
        message: 'Please upload a PDF file or provide base64 document in request body'
      })
    }

    // Check if cache should be cleared (for resubmitting same document)
    const clearCache = req.body.clear_cache === true || req.body.clear_cache === 'true' || req.query.clear_cache === 'true'
    
    if (clearCache) {
      logger.info('Cache clearing requested - will force fresh extraction')
    }

    // Extract using A79 service with enhanced instructions
    const result = await a79ExtractService.extractLineItems({
      document: base64Data,
      document_type: documentType,
      customer_number: req.body.customer_number,
      custom_instructions: req.body.custom_instructions,
      extract_fields: req.body.extract_fields || [
        'line_items',
        'sku',
        'description',
        'hts_code',
        'country_of_origin',
        'quantity',
        'unit_price',
        'total_value',
        'weight',
        'unit_of_measure'
      ],
      format: req.body.format || 'line_items',
      clear_cache: clearCache
    })

    logger.info(`Extraction successful: ${result.line_items?.length || 0} items extracted`)

    res.json(result)
  } catch (error) {
    logger.error('Extraction error:', error)
    next(error)
  }
})

/**
 * POST /api/extract/base64
 * Extract line items from base64 encoded PDF (alternative endpoint)
 */
router.post('/base64', validateExtractRequest, async (req, res, next) => {
  try {
    const { document, document_type, extract_fields, format } = req.body

    logger.info('Extraction request received (base64)')

    // Check if cache should be cleared
    const clearCache = req.body.clear_cache === true || req.body.clear_cache === 'true' || req.query.clear_cache === 'true'
    
    if (clearCache) {
      logger.info('Cache clearing requested - will force fresh extraction')
    }

    const result = await a79ExtractService.extractLineItems({
      document,
      document_type: document_type || 'commercial_invoice',
      customer_number: req.body.customer_number,
      custom_instructions: req.body.custom_instructions,
      extract_fields: extract_fields || [
        'line_items',
        'sku',
        'description',
        'hts_code',
        'country_of_origin',
        'quantity',
        'unit_price',
        'total_value',
        'weight',
        'unit_of_measure'
      ],
      format: format || 'line_items',
      clear_cache: clearCache
    })

    logger.info(`Extraction successful: ${result.line_items?.length || 0} items extracted`)

    res.json(result)
  } catch (error) {
    logger.error('Extraction error:', error)
    next(error)
  }
})

export { router as extractRouter }

