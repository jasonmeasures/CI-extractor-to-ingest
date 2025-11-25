# A79 API Endpoints Configuration

## Current Endpoints

Update these endpoints in `backend/config/a79Endpoints.js` or set them as environment variables.

### Environment Variables

Add to `backend/.env`:

```env
# Main A79 API Endpoint
A79_API_ENDPOINT=https://your-a79-api.com/v1/extract

# Health Check Endpoint (optional)
A79_HEALTH_ENDPOINT=https://your-a79-api.com/v1/health

# Status Polling Endpoint (for async jobs)
A79_STATUS_ENDPOINT=https://your-a79-api.com/v1/status

# Job Status Endpoint Pattern (will append /{job_id})
A79_JOB_STATUS_ENDPOINT=https://your-a79-api.com/v1/jobs
```

### Configuration File

Edit `backend/config/a79Endpoints.js` to add your endpoints:

```javascript
export const A79_ENDPOINTS = {
  extract: 'https://your-a79-api.com/v1/extract',
  health: 'https://your-a79-api.com/v1/health',
  status: 'https://your-a79-api.com/v1/status',
  jobStatus: 'https://your-a79-api.com/v1/jobs',
}
```

## Common Endpoint Patterns

The service will automatically try these patterns if endpoints aren't configured:

### Extraction Endpoints
- `/v1/extract`
- `/v1/extract-invoice`
- `/v1/extract/commercial-invoice`
- `/v1/documents/extract`
- `/v1/pdf/extract`

### Status Endpoints
- `/v1/status/{job_id}`
- `/v1/jobs/{job_id}`
- `/v1/job/{job_id}/status`
- `/v1/extract/status/{job_id}`

## Testing Endpoints

Test your endpoints using:

```bash
# Check connection
curl http://localhost:7000/api/debug/check-a79

# View configuration
curl http://localhost:7000/api/debug/config

# Test health endpoint
curl http://localhost:7000/api/health/a79
```

## Adding Your Endpoints

**Please provide your A79 endpoints and I'll add them to the configuration.**

Common formats:
- `https://api.a79.company.com/v1/extract`
- `https://a79-service.internal.com/api/extract`
- `http://localhost:8080/a79/extract`

