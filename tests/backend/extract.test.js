import request from 'supertest'
import app from '../../backend/server.js'
import { a79ExtractService } from '../../backend/services/a79Service.js'

jest.mock('../../backend/services/a79Service.js')

describe('Extract API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/extract', () => {
    test('should return 400 if no file provided', async () => {
      const response = await request(app)
        .post('/api/extract')
        .expect(400)

      expect(response.body.error).toBe('No PDF file provided')
    })

    test('should extract line items from PDF file', async () => {
      const mockResult = {
        line_items: [
          {
            sku: 'TEST001',
            description: 'Test Product',
            quantity: 10,
            unit_price: 100.0,
            total_value: 1000.0
          }
        ]
      }

      a79ExtractService.extractLineItems.mockResolvedValue(mockResult)

      const response = await request(app)
        .post('/api/extract')
        .attach('document', Buffer.from('fake pdf content'), 'test.pdf')
        .expect(200)

      expect(response.body.line_items).toHaveLength(1)
      expect(response.body.line_items[0].sku).toBe('TEST001')
    })

    test('should return 400 for non-PDF files', async () => {
      const response = await request(app)
        .post('/api/extract')
        .attach('document', Buffer.from('not a pdf'), 'test.txt')
        .expect(400)

      expect(response.body.error).toContain('Only PDF files')
    })
  })

  describe('POST /api/extract/base64', () => {
    test('should return 400 if document is missing', async () => {
      const response = await request(app)
        .post('/api/extract/base64')
        .send({})
        .expect(400)

      expect(response.body.error).toBe('Validation failed')
    })

    test('should extract line items from base64 document', async () => {
      const mockResult = {
        line_items: [
          {
            sku: 'TEST001',
            description: 'Test Product',
            quantity: 10,
            unit_price: 100.0,
            total_value: 1000.0
          }
        ]
      }

      a79ExtractService.extractLineItems.mockResolvedValue(mockResult)

      const response = await request(app)
        .post('/api/extract/base64')
        .send({
          document: Buffer.from('fake pdf').toString('base64'),
          document_type: 'commercial_invoice'
        })
        .expect(200)

      expect(response.body.line_items).toHaveLength(1)
    })

    test('should handle A79 API errors', async () => {
      a79ExtractService.extractLineItems.mockRejectedValue(
        new Error('A79 API error: 500')
      )

      const response = await request(app)
        .post('/api/extract/base64')
        .send({
          document: Buffer.from('fake pdf').toString('base64')
        })
        .expect(502)

      expect(response.body.error).toContain('A79 API')
    })
  })
})

