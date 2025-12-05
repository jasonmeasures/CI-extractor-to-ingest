/**
 * PDF Utilities
 * Functions for working with PDF documents
 */

import { PDFDocument } from 'pdf-lib'
import { logger } from './logger.js'

/**
 * Get page count from base64 encoded PDF
 * @param {string} base64Pdf - Base64 encoded PDF string
 * @returns {Promise<number>} Number of pages in the PDF
 */
export async function getPdfPageCount(base64Pdf) {
  try {
    const pdfBytes = Buffer.from(base64Pdf, 'base64')
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pageCount = pdfDoc.getPageCount()
    logger.info(`PDF page count detected: ${pageCount} pages`)
    return pageCount
  } catch (error) {
    logger.warn(`Failed to get PDF page count: ${error.message}. Assuming 1 page.`)
    // If we can't parse it, assume 1 page (better than failing completely)
    return 1
  }
}

/**
 * Check if PDF appears to be multi-page based on size
 * Large PDFs are more likely to be multi-page
 * @param {string} base64Pdf - Base64 encoded PDF string
 * @returns {boolean} True if PDF might be multi-page
 */
export function mightBeMultiPage(base64Pdf) {
  // Base64 is ~33% larger than binary, so a 200KB base64 = ~150KB binary
  // Most single-page invoices are <100KB, multi-page are usually >150KB
  const sizeKB = (base64Pdf.length * 3) / 4 / 1024
  return sizeKB > 100
}

