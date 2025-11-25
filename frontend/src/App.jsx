import { useState } from 'react'
import FileUpload from './components/FileUpload'
import ResultsTable from './components/ResultsTable'
import SummaryStats from './components/SummaryStats'
import { extractLineItems } from './services/api'
import { convertToCSV } from './utils/csv'
import './App.css'

function App() {
  const [file, setFile] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [lineItems, setLineItems] = useState([])
  const [csvData, setCsvData] = useState(null)
  const [clearCache, setClearCache] = useState(false)
  const [lastExtractedFile, setLastExtractedFile] = useState(null)
  
  // Always use backend proxy - API settings managed in backend only
  const apiConfig = {
    endpoint: '/api/extract', // Backend proxy - handles A79 automatically
    apiKey: '', // Not needed - backend handles authentication
    timeout: 300000 // 5 minutes for A79 processing
  }

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) {
      return
    }
    
    // Check if it's a PDF by extension or MIME type
    const fileName = selectedFile.name.toLowerCase()
    const isPdf = fileName.endsWith('.pdf') || selectedFile.type === 'application/pdf'
    
    if (isPdf) {
      // Check if this is the same file that was just extracted
      const isResubmit = lastExtractedFile && 
        lastExtractedFile.name === selectedFile.name && 
        lastExtractedFile.size === selectedFile.size
      
      setFile(selectedFile)
      setError('')
      setStatus('')
      setCsvData(null)
      setLineItems([])
      
      // Auto-enable cache clearing if resubmitting same file
      if (isResubmit) {
        setClearCache(true)
      }
    } else {
      setError('Please select a valid PDF file (.pdf extension required)')
      setFile(null)
    }
  }

  const handleExtract = async () => {
    if (!file) {
      setError('Please select a PDF file first')
      return
    }

    setProcessing(true)
    setStatus('Reading PDF file...')
    setError('')

    try {
      setStatus(clearCache ? 'Sending to A79 API (cache cleared - fresh extraction)...' : 'Sending to A79 API for extraction...')
      
      const result = await extractLineItems(file, apiConfig, clearCache)
      
      setStatus('Processing A79 response...')
      
      // Remember this file was extracted
      setLastExtractedFile(file)
      
      // Debug: Log the response structure
      console.log('A79 Response:', result)
      console.log('Line items:', result.line_items)
      console.log('Line items count:', result.line_items?.length)
      console.log('First item:', result.line_items?.[0])
      
      if (result.error) {
        throw new Error(result.error)
      }

      if (!result.line_items || result.line_items.length === 0) {
        console.error('No line_items in response:', result)
        throw new Error('No line items found in A79 response')
      }

      // Normalize items - handle different field names from A79
      const normalizedItems = result.line_items.map((item, index) => {
        // Debug each item
        if (index === 0) {
          console.log('Raw item structure:', item)
          console.log('Item keys:', Object.keys(item))
        }
        
        // Extract values with multiple fallbacks for each field
        // Match A79 enhanced instructions field names exactly
        const quantity = parseFloat(item.quantity || item.qty || item.QUANTITY || item.q || 1)
        const unitPrice = parseFloat(item.unit_price || item.price || item.UNIT_PRICE || item.price_per_unit || item.unit_cost || 0)
        const totalValue = parseFloat(item.total_value || item.value || item.VALUE || item.total || item.amount || 0)
        
        const normalized = {
          SKU: item.sku || item.part_number || item.SKU || item.sku_number || '', // Leave empty if no part number
          DESCRIPTION: item.description || item.DESCRIPTION || item.desc || item.product_description || '',
          HTS: item.hts_code || item.hts || item.HTS || item.tariff_code || 'N/A',
          COUNTRY_OF_ORIGIN: item.country_of_origin || item.origin_country || item.COUNTRY_OF_ORIGIN || item.coo || item.origin || 'N/A',
          NO_OF_PACKAGE: item.package_count || item.packages || item.NO_OF_PACKAGE || item.pkg_count || '',
          QUANTITY: isNaN(quantity) || quantity <= 0 ? 1 : quantity,
          NET_WEIGHT: parseFloat(item.net_weight || item.net_wt || item.NET_WEIGHT || item.weight_net || 0) || 0,
          GROSS_WEIGHT: parseFloat(item.gross_weight || item.gross_wt || item.GROSS_WEIGHT || item.weight_gross || item.weight || 0) || 0,
          UNIT_PRICE: isNaN(unitPrice) ? 0 : unitPrice,
          VALUE: 0, // Will calculate below
          QTY_UNIT: item.unit_of_measure || item.uom || item.QTY_UNIT || item.unit || item.measure || 'EA'
        }
        
        // Calculate VALUE: Use provided value, or calculate from quantity × unit_price
        if (!isNaN(totalValue) && totalValue > 0) {
          normalized.VALUE = totalValue
        } else if (normalized.QUANTITY > 0 && normalized.UNIT_PRICE > 0) {
          normalized.VALUE = normalized.QUANTITY * normalized.UNIT_PRICE
        } else {
          normalized.VALUE = 0
        }
        
        return normalized
      })

      setLineItems(normalizedItems)
      
      // Convert to CSV
      const csv = convertToCSV(normalizedItems)
      setCsvData(csv)
      
      setStatus(`Successfully extracted ${normalizedItems.length} line items via A79`)

    } catch (err) {
      console.error('Extraction error:', err)
      setError(`Error: ${err.message}`)
      setStatus('')
    } finally {
      setProcessing(false)
    }
  }

  const handleDownloadCSV = () => {
    if (!csvData) return

    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice_line_items_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }


  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div>
            <h1>Commercial Invoice Line Item Extractor</h1>
            <p>Upload a commercial invoice PDF to extract line items using A79 API</p>
          </div>
        </header>

        <div className="card">
          <FileUpload
            file={file}
            onFileSelect={handleFileSelect}
            onExtract={handleExtract}
            processing={processing}
            disabled={!file || processing}
          />

          {status && (
            <div className="status-message">
              <span className="spinner">⚙️</span>
              {status}
            </div>
          )}

          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          {file && !processing && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={clearCache}
                  onChange={(e) => setClearCache(e.target.checked)}
                  style={{ marginRight: '0.5rem', cursor: 'pointer' }}
                />
                <span>
                  <strong>Clear A79 cache</strong> - Force fresh extraction (use when resubmitting same document)
                  {lastExtractedFile && file.name === lastExtractedFile.name && file.size === lastExtractedFile.size && (
                    <span style={{ color: '#28a745', marginLeft: '0.5rem' }}>✓ Same file detected</span>
                  )}
                </span>
              </label>
            </div>
          )}

          {csvData && (
            <button
              onClick={handleDownloadCSV}
              className="download-btn"
            >
              ⬇️ Download CSV File
            </button>
          )}
        </div>

        {lineItems.length > 0 && (
          <>
            <SummaryStats lineItems={lineItems} />
            <ResultsTable lineItems={lineItems} />
          </>
        )}

        <div className="instructions">
          <h3>How to Use</h3>
          <ol>
            <li>Click "Choose File" and select your commercial invoice PDF</li>
            <li>Click "Extract Line Items via A79" to process the PDF</li>
            <li>Wait for extraction to complete (may take a few minutes for large PDFs)</li>
            <li>Review the extracted line items in the table below</li>
            <li>Click "Download CSV File" to save the data</li>
          </ol>
        <div className="info-box">
          <strong>ℹ️ Pre-Configured:</strong> The app uses the backend proxy (<code>/api/extract</code>) by default, 
          which automatically handles A79 API communication with these endpoints:
          <ul style={{marginTop: '0.5rem', marginLeft: '1.5rem'}}>
            <li><strong>Base URL:</strong> <code>https://klearnow.prod.a79.ai/api/v1/public/workflow</code></li>
            <li><strong>Extract Endpoint:</strong> <code>https://klearnow.prod.a79.ai/api/v1/public/workflow/run</code></li>
            <li><strong>Agent:</strong> <code>Unified PDF Parser</code></li>
            <li><strong>API Key:</strong> Configured in backend (from Clear Audit 7501)</li>
            <li><strong>Polling:</strong> Automatic (5s interval, up to 10 minutes)</li>
            <li><strong>Dashboard:</strong> <a href="https://klearnow.prod.a79.ai" target="_blank" rel="noopener noreferrer">https://klearnow.prod.a79.ai</a></li>
          </ul>
          <br/>
          <strong>Note:</strong> All API configuration is managed in the backend. No settings needed in the UI.
        </div>
        </div>
      </div>
    </div>
  )
}

export default App

