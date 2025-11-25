import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import helmet from 'helmet'
import compression from 'compression'
import { logger, requestLogger } from './utils/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { extractRouter } from './routes/extract.js'
import { healthRouter } from './routes/health.js'
import { debugRouter } from './routes/debug.js'
import { customersRouter } from './routes/customers.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 7001 // Changed from 7000 due to Apple AirTunes conflict

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}))
app.use(compression())

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}))

// Body parsing middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Request logging
app.use(requestLogger)

// Health check
app.use('/api/health', healthRouter)

// Debug endpoints (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/debug', debugRouter)
}

// Main extraction endpoint
app.use('/api/extract', extractRouter)

// Customer management endpoints
app.use('/api/customers', customersRouter)

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Commercial Invoice PDF Extractor API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      extract: '/api/extract',
      customers: '/api/customers',
      ...(process.env.NODE_ENV !== 'production' && { debug: '/api/debug' })
    }
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' })
})

// Error handling middleware (must be last)
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
  logger.info(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
})

export default app

