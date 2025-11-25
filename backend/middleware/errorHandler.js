import { logger } from '../utils/logger.js'

/**
 * Global error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
    path: req.path,
    method: req.method
  })

  // Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Maximum file size is 10MB'
      })
    }
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    })
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation error',
      message: err.message
    })
  }

  // A79 API errors
  if (err.message && err.message.includes('A79 API')) {
    return res.status(502).json({
      error: 'A79 API error',
      message: err.message
    })
  }

  // Default error
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack
    })
  })
}

