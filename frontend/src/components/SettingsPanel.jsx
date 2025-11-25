import { useState, useEffect } from 'react'
import './SettingsPanel.css'

function SettingsPanel({ config, onSave, onClose }) {
  const [localConfig, setLocalConfig] = useState(config)

  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  const handleChange = (field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = () => {
    onSave(localConfig)
    onClose()
  }

  return (
    <div className="settings-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h3>A79 API Configuration</h3>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <div className="settings-content">
          <div className="form-group">
            <label>A79 API Endpoint</label>
            <input
              type="text"
              value={localConfig.endpoint}
              onChange={(e) => handleChange('endpoint', e.target.value)}
              placeholder="https://your-a79-api.com/api/extract-invoice"
            />
          </div>
          <div className="form-group">
            <label>API Key (Optional)</label>
            <input
              type="password"
              value={localConfig.apiKey}
              onChange={(e) => handleChange('apiKey', e.target.value)}
              placeholder="Enter API key if required"
            />
          </div>
          <div className="form-group">
            <label>Timeout (ms)</label>
            <input
              type="number"
              value={localConfig.timeout}
              onChange={(e) => handleChange('timeout', parseInt(e.target.value))}
              min="10000"
              max="300000"
            />
          </div>
          <p className="settings-help">
            <strong>Recommended:</strong> Use <code>/api/extract</code> to route through the backend (handles A79 automatically).<br/>
            <strong>Alternative:</strong> Use direct A79 endpoint for testing or custom configurations.<br/>
            The API key is optional when using backend proxy. Required for direct A79 access.
          </p>
          <div className="settings-info">
            <h4>Current A79 API Configuration:</h4>
            <ul>
              <li><strong>Base URL:</strong> <code>https://klearnow.prod.a79.ai/api/v1/public/workflow</code></li>
              <li><strong>Extract Endpoint:</strong> <code>https://klearnow.prod.a79.ai/api/v1/public/workflow/run</code></li>
              <li><strong>Agent Name:</strong> <code>Unified PDF Parser</code></li>
              <li><strong>Dashboard:</strong> <a href="https://klearnow.prod.a79.ai" target="_blank" rel="noopener noreferrer">https://klearnow.prod.a79.ai</a></li>
              <li><strong>Timeout:</strong> 300 seconds (5 minutes) - A79 processes PDFs in 6-page chunks</li>
            </ul>
          </div>
          <div className="settings-presets">
            <button 
              type="button"
              onClick={() => {
                handleChange('endpoint', '/api/extract')
                handleChange('apiKey', '')
                handleChange('timeout', 300000)
              }}
              className="preset-btn"
            >
              Use Backend Proxy (Recommended)
            </button>
            <button 
              type="button"
              onClick={() => {
                handleChange('endpoint', 'https://klearnow.prod.a79.ai/api/v1/public/workflow/run')
                handleChange('apiKey', 'sk-a79-wvymMMk2FdgHPGBP9mGakuGLnc/FZg3i')
                handleChange('timeout', 300000)
              }}
              className="preset-btn"
            >
              Use Direct A79 Endpoint
            </button>
          </div>
        </div>
        <div className="settings-footer">
          <button onClick={onClose} className="cancel-btn">Cancel</button>
          <button onClick={handleSave} className="save-btn">Save</button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel

