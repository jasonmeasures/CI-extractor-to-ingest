import { body, validationResult } from 'express-validator'
import { logger } from '../utils/logger.js'

/**
 * Validate extract request body
 */
export const validateExtractRequest = [
  body('document')
    .notEmpty()
    .withMessage('Document (base64) is required')
    .isString()
    .withMessage('Document must be a base64 string'),
  
  body('document_type')
    .optional()
    .isString()
    .withMessage('Document type must be a string'),
  
  body('extract_fields')
    .optional()
    .isArray()
    .withMessage('Extract fields must be an array'),
  
  body('format')
    .optional()
    .isString()
    .withMessage('Format must be a string'),

  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      logger.warn('Validation errors:', errors.array())
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      })
    }
    next()
  }
]

