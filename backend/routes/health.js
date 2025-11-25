import express from 'express'
import { logger } from '../utils/logger.js'
import { a79ExtractService } from '../services/a79Service.js'

const router = express.Router()

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  })
})

/**
 * GET /api/health/ready
 * Readiness check endpoint (includes A79 connection check)
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if A79 service is available
    const a79Endpoint = process.env.A79_API_ENDPOINT
    if (!a79Endpoint) {
      return res.status(503).json({
        status: 'not ready',
        reason: 'A79_API_ENDPOINT not configured',
        timestamp: new Date().toISOString()
      })
    }

    // Optionally check A79 connection (can be slow, so make it optional)
    const checkConnection = req.query.check === 'true'
    let a79Status = null

    if (checkConnection) {
      try {
        const connectionCheck = await a79ExtractService.checkConnection()
        a79Status = {
          connected: connectionCheck.connected,
          responseTime: connectionCheck.responseTime || 'N/A'
        }
      } catch (error) {
        a79Status = {
          connected: false,
          error: error.message
        }
      }
    }

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      a79Endpoint: a79Endpoint,
      a79Status: a79Status || 'not checked (add ?check=true to verify connection)'
    })
  } catch (error) {
    logger.error('Readiness check failed:', error)
    res.status(503).json({
      status: 'not ready',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/health/a79
 * Check A79 API connection specifically
 */
router.get('/a79', async (req, res) => {
  try {
    const connectionCheck = await a79ExtractService.checkConnection()
    
    if (connectionCheck.connected) {
      res.json({
        status: 'connected',
        ...connectionCheck,
        timestamp: new Date().toISOString()
      })
    } else {
      res.status(503).json({
        status: 'disconnected',
        ...connectionCheck,
        timestamp: new Date().toISOString()
      })
    }
  } catch (error) {
    logger.error('A79 health check failed:', error)
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

export { router as healthRouter }
