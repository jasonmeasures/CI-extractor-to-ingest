import express from 'express'
import { logger } from '../utils/logger.js'
import { getCustomerConfig, listCustomers } from '../services/instructionBuilder.js'

const router = express.Router()

/**
 * GET /api/customers
 * List all available customers
 */
router.get('/', async (req, res, next) => {
  try {
    const customers = await listCustomers()
    res.json({
      success: true,
      customers,
      count: customers.length
    })
  } catch (error) {
    logger.error('Error listing customers:', error)
    next(error)
  }
})

/**
 * GET /api/customers/:customerNumber
 * Get customer configuration
 */
router.get('/:customerNumber', (req, res, next) => {
  try {
    const { customerNumber } = req.params
    const config = getCustomerConfig(customerNumber.toUpperCase())
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found',
        message: `Customer ${customerNumber} not found`
      })
    }
    
    res.json({
      success: true,
      customer: config
    })
  } catch (error) {
    logger.error('Error getting customer config:', error)
    next(error)
  }
})

export { router as customersRouter }

