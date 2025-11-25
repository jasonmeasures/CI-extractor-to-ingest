import request from 'supertest'
import app from '../../backend/server.js'

describe('Health API', () => {
  describe('GET /api/health', () => {
    test('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)

      expect(response.body.status).toBe('healthy')
      expect(response.body).toHaveProperty('timestamp')
      expect(response.body).toHaveProperty('uptime')
    })
  })

  describe('GET /api/health/ready', () => {
    test('should return ready status', async () => {
      const response = await request(app)
        .get('/api/health/ready')
        .expect(200)

      expect(response.body.status).toBe('ready')
    })
  })
})

