import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../frontend/src/App'
import * as api from '../../frontend/src/services/api'

// Mock the API service
jest.mock('../../frontend/src/services/api')

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders the main heading', () => {
    render(<App />)
    expect(screen.getByText('Commercial Invoice Line Item Extractor')).toBeInTheDocument()
  })

  test('shows settings panel when settings button is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const settingsBtn = screen.getByLabelText('Settings')
    await user.click(settingsBtn)
    
    expect(screen.getByText('A79 API Configuration')).toBeInTheDocument()
  })

  test('shows error when no file is selected and extract is clicked', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const extractBtn = screen.getByText('Extract Line Items via A79')
    await user.click(extractBtn)
    
    await waitFor(() => {
      expect(screen.getByText(/Please select a PDF file first/)).toBeInTheDocument()
    })
  })

  test('handles file selection', async () => {
    const user = userEvent.setup()
    render(<App />)
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = screen.getByLabelText(/Select Commercial Invoice PDF/i).parentElement.querySelector('input[type="file"]')
    
    await user.upload(fileInput, file)
    
    expect(screen.getByText(/Selected: test.pdf/)).toBeInTheDocument()
  })

  test('handles successful extraction', async () => {
    const mockResult = {
      line_items: [
        {
          sku: 'TEST001',
          description: 'Test Product',
          hts_code: '1234567890',
          country_of_origin: 'US',
          package_count: '1',
          quantity: 10,
          net_weight: 5.0,
          gross_weight: 5.5,
          unit_price: 100.0,
          total_value: 1000.0,
          unit_of_measure: 'EA'
        }
      ]
    }

    api.extractLineItems.mockResolvedValue(mockResult)

    const user = userEvent.setup()
    render(<App />)
    
    // Configure API endpoint first
    const settingsBtn = screen.getByLabelText('Settings')
    await user.click(settingsBtn)
    
    const endpointInput = screen.getByLabelText('A79 API Endpoint')
    await user.clear(endpointInput)
    await user.type(endpointInput, 'http://test-api.com/extract')
    
    const saveBtn = screen.getByText('Save')
    await user.click(saveBtn)
    
    // Upload file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = screen.getByLabelText(/Select Commercial Invoice PDF/i).parentElement.querySelector('input[type="file"]')
    await user.upload(fileInput, file)
    
    // Extract
    const extractBtn = screen.getByText('Extract Line Items via A79')
    await user.click(extractBtn)
    
    await waitFor(() => {
      expect(screen.getByText(/Successfully extracted/)).toBeInTheDocument()
      expect(screen.getByText('TEST001')).toBeInTheDocument()
    })
  })

  test('handles extraction error', async () => {
    api.extractLineItems.mockRejectedValue(new Error('API Error'))

    const user = userEvent.setup()
    render(<App />)
    
    // Configure API endpoint
    const settingsBtn = screen.getByLabelText('Settings')
    await user.click(settingsBtn)
    
    const endpointInput = screen.getByLabelText('A79 API Endpoint')
    await user.clear(endpointInput)
    await user.type(endpointInput, 'http://test-api.com/extract')
    
    const saveBtn = screen.getByText('Save')
    await user.click(saveBtn)
    
    // Upload file
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    const fileInput = screen.getByLabelText(/Select Commercial Invoice PDF/i).parentElement.querySelector('input[type="file"]')
    await user.upload(fileInput, file)
    
    // Extract
    const extractBtn = screen.getByText('Extract Line Items via A79')
    await user.click(extractBtn)
    
    await waitFor(() => {
      expect(screen.getByText(/Error: API Error/)).toBeInTheDocument()
    })
  })
})

