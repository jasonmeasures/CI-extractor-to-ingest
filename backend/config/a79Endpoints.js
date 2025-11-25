/**
 * A79 API Endpoints Configuration
 * AI79 Public Workflow API endpoints
 */

export const A79_ENDPOINTS = {
  // Base URL
  baseUrl: process.env.A79_BASE_URL || 'https://klearnow.prod.a79.ai/api/v1/public/workflow',
  
  // Main extraction endpoint (agent-based)
  extract: process.env.A79_API_ENDPOINT || 'https://klearnow.prod.a79.ai/api/v1/public/workflow/run',
  
  // Workflow ID-based endpoint (if workflow_id is configured)
  extractWithWorkflow: (workflowId) => {
    return `${A79_ENDPOINTS.baseUrl}/${workflowId}/run`
  },
  
  // Primary polling endpoint (recommended)
  status: (runId) => {
    return `${A79_ENDPOINTS.baseUrl}/${runId}/status?output_var=final_display_output`
  },
  
  // Alternate polling endpoints (fallback)
  statusAlternatives: (runId, workflowId) => {
    const alternatives = []
    
    // Only add workflow-specific endpoints if workflowId is provided
    if (workflowId) {
      alternatives.push(
        // Workflow-specific with run_id
        `${A79_ENDPOINTS.baseUrl}/${workflowId}/run/${runId}`,
        // Workflow-specific status
        `${A79_ENDPOINTS.baseUrl}/${workflowId}/runs/${runId}/status`
      )
    }
    
    // Add general endpoints (work regardless of workflowId)
    alternatives.push(
      // Simple run status (without workflowId)
      `${A79_ENDPOINTS.baseUrl}/run/${runId}`,
      // Run ID only
      `${A79_ENDPOINTS.baseUrl}/${runId}`,
      // Legacy workflow cards
      `https://klearnow.prod.a79.ai/api/v1/workflow/cards/${runId}`
    )
    
    return alternatives
  },
  
  // Agent name
  // NOTE: Clear Audit 7501 uses "Unified PDF Parser" successfully
  agentName: process.env.A79_AGENT_NAME || 'Unified PDF Parser',
  
  // Workflow ID (optional - set to use workflow_id-based endpoint)
  workflowId: process.env.A79_WORKFLOW_ID || null,
  
  // Dashboard URL
  dashboardUrl: 'https://klearnow.prod.a79.ai'
}

/**
 * Get A79 endpoint
 */
export const getA79Endpoint = (type = 'extract', workflowId = null) => {
  const workflow = workflowId || A79_ENDPOINTS.workflowId
  
  switch (type) {
    case 'extract':
      return workflow 
        ? A79_ENDPOINTS.extractWithWorkflow(workflow)
        : A79_ENDPOINTS.extract
    case 'status':
      return A79_ENDPOINTS.status
    case 'baseUrl':
      return A79_ENDPOINTS.baseUrl
    default:
      return A79_ENDPOINTS.extract
  }
}

/**
 * Build status endpoint URL for a run
 */
export const buildStatusUrl = (runId, workflowId = null) => {
  return A79_ENDPOINTS.status(runId)
}

/**
 * Get alternate status endpoints for fallback
 */
export const getAlternateStatusEndpoints = (runId, workflowId = null) => {
  return A79_ENDPOINTS.statusAlternatives(runId, workflowId)
}
