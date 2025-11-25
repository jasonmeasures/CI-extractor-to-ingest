# Commercial Invoice Extraction Validation Checks

## Overview

This document outlines all validation checks that should be performed on extracted commercial invoice data to ensure quality, completeness, and accuracy.

---

## Pre-Extraction Validation

### Input Validation

- [ ] **PDF File Validation**
  - File is a valid PDF (check magic bytes: `%PDF`)
  - File size is within limits (< 10MB)
  - File is not corrupted or password-protected

- [ ] **Request Parameters**
  - `document_type` is valid (e.g., "commercial_invoice")
  - `customer_number` exists (if provided)
  - `custom_instructions` are reasonable length (< 2000 chars)

---

## Post-Extraction Validation

### Structure Validation

- [ ] **JSON Structure**
  - Response is valid JSON
  - Required top-level fields present: `line_items`, `invoice_number`, `invoice_date`
  - No null or undefined values (use defaults instead)

- [ ] **Line Items Array**
  - `line_items` is an array
  - Array is not empty (unless document has no items)
  - All items are objects (not strings or numbers)

### Completeness Validation

- [ ] **All Items Extracted**
  - Count matches expected (if known)
  - No items skipped (check sequential numbering)
  - Multi-page invoices: All pages processed
  - No early stopping (all items from all pages)

- [ ] **Required Fields Present**
  - Every line item has: `item_number`, `description`, `quantity`, `unit_price`, `value`
  - Every line item has: `sku` (may be empty string)
  - Every line item has: `hts_code`, `country_of_origin` (may be "N/A")

### Data Type Validation

- [ ] **String Fields (Preserve Formatting)**
  - `item_number`: String (e.g., "1", "2", "3")
  - `sku`: String (empty string "" if no part number)
  - `description`: String (not null)
  - `hts_code`: String (preserves leading zeros, e.g., "0123.45.6789")
  - `country_of_origin`: String (2-letter ISO code or "N/A")
  - `quantity`: String (e.g., "100")
  - `unit_price`: String (e.g., "45.20")
  - `value`: String WITH currency symbol (e.g., "$226.00")
  - `unit_of_measure`: String (default "EA")

- [ ] **Number Fields**
  - `net_weight`: Number (in kg)
  - `gross_weight`: Number (in kg)

- [ ] **HTS Code Format**
  - Format: "####.##.####" (10 digits with dots)
  - OR "N/A" if not present
  - Leading zeros preserved: "0123.45.6789" ✅ not 123456789 ❌

### SKU Validation

- [ ] **SKU Rules**
  - SKU is either actual part number OR empty string ""
  - SKU is NOT sequential number ("1", "2", "3")
  - SKU is NOT "Item 1", "Item 2", "Line 1"
  - SKU is NOT generated placeholder ("ITEM-1", "ITEM-2")
  - If part number column exists, SKU should be populated
  - If no part number column, SKU should be empty string ""

### Currency Symbol Validation

- [ ] **Currency Symbols Removed**
  - `quantity`: No currency symbols ("100" ✅ not "$100" ❌)
  - `unit_price`: No currency symbols ("45.20" ✅ not "$45.20" ❌)

- [ ] **Currency Symbols Preserved**
  - `value`: Has currency symbol ("$226.00" ✅)
  - `totals.subtotal`: Has currency symbol ("$476.00" ✅)
  - `totals.gross_invoice_value`: Has currency symbol ("$526.00" ✅)

### Country of Origin Validation

- [ ] **COO Format**
  - Format: 2-letter ISO code ("US", "CN", "MX", "DE")
  - OR "N/A" if not determinable
  - Not full country names ("United States" ❌, "US" ✅)

- [ ] **COO Inference Applied**
  - Explicit COO on line item (highest priority)
  - Global COO statement applied to all items
  - Shipper address inference applied
  - "N/A" only as last resort

### Calculation Validation

- [ ] **Value Calculations**
  - `value` = `quantity` × `unit_price` (within rounding tolerance)
  - If `value` explicitly stated, use that value
  - Otherwise, calculate from quantity and unit_price

- [ ] **Totals Validation**
  - `totals.subtotal` matches sum of line item values
  - `totals.gross_invoice_value` = subtotal + tax + freight + insurance
  - All totals have currency symbols

### Multi-Language Validation

- [ ] **Language Recognition**
  - Spanish headers recognized: "Descripción", "Cantidad", "Kilos Brutos", "Kilos Netos"
  - Portuguese headers recognized: "Descripción", "Quantidade", "Peso Bruto", "Peso Líquido"
  - German headers recognized: "Beschreibung", "Menge", "Bruttogewicht", "Nettogewicht"
  - Weight fields correctly identified in all languages

### Weight Validation

- [ ] **Weight Fields**
  - `net_weight`: Number in kg (recognize "Kilos Netos"/"Peso Neto")
  - `gross_weight`: Number in kg (recognize "Kilos Brutos"/"Peso Bruto")
  - If only one weight given, use same value for both
  - Convert to kg if in other units (lbs → kg)

### Comprehensive Field Validation

- [ ] **Parties Information**
  - `shipper`: name, address (street, city, state, postal_code, country)
  - `consignee`: name, address (street, city, state, postal_code, country)
  - `seller`: name, address, tax_id (if available)
  - `buyer`: name, address, tax_id (if available)

- [ ] **Routing Information**
  - `port_of_loading`: Port name
  - `port_of_discharge`: Port name
  - `place_of_delivery`: Delivery location
  - `carrier`: Shipping company
  - `vessel_flight`: Vessel or flight number
  - `bill_of_lading`: B/L number
  - `container_numbers`: Array of container IDs

- [ ] **Financial Information**
  - `invoice_number`: Present and valid
  - `invoice_date`: Format "Month Day, Year" (e.g., "November 19, 2025")
  - `payment_terms`: Terms (e.g., "Net 30", "FOB")
  - `currency`: Currency code (USD, EUR, etc.)
  - `totals`: All total fields present with currency symbols

### Customer-Specific Validation

- [ ] **Customer Fields (if customer_number provided)**
  - Additional fields from customer config are extracted
  - Special rules from customer config are applied
  - Field mappings from customer config are applied

---

## Automated Validation Checklist

### Quick Validation Script

```javascript
function validateExtraction(result) {
  const errors = []
  
  // Structure checks
  if (!result.line_items || !Array.isArray(result.line_items)) {
    errors.push('line_items must be an array')
  }
  
  // Completeness checks
  if (result.line_items.length === 0) {
    errors.push('No line items extracted')
  }
  
  // Data type checks
  result.line_items.forEach((item, index) => {
    if (typeof item.sku !== 'string') {
      errors.push(`Item ${index + 1}: SKU must be string`)
    }
    if (item.sku && /^ITEM-\d+$/.test(item.sku)) {
      errors.push(`Item ${index + 1}: SKU should not be generated placeholder`)
    }
    if (typeof item.hts_code !== 'string') {
      errors.push(`Item ${index + 1}: HTS code must be string`)
    }
    if (typeof item.quantity !== 'string') {
      errors.push(`Item ${index + 1}: Quantity must be string`)
    }
    if (item.value && !/^\$/.test(item.value)) {
      errors.push(`Item ${index + 1}: Value should have currency symbol`)
    }
  })
  
  return errors
}
```

---

## Manual Validation Checklist

### Single-Page Invoice (5 items)
- [ ] All 5 items extracted
- [ ] Sequential numbering (1, 2, 3, 4, 5)
- [ ] Shipper/consignee present
- [ ] Totals calculated correctly
- [ ] Currency symbols correct

### Multi-Page Invoice (25+ items)
- [ ] ALL items from ALL pages
- [ ] No early stopping
- [ ] Sequential numbering continuous across pages
- [ ] All pages processed

### HTS Codes
- [ ] Leading zeros preserved ("0123.45.6789" ✅)
- [ ] Dots preserved
- [ ] Stored as strings (not numbers)

### Currency Handling
- [ ] `unit_price` has no $ ("45.20" ✅)
- [ ] `value` has $ ("$226.00" ✅)
- [ ] All totals have $

### SKU Handling
- [ ] Actual part numbers used when available
- [ ] Empty string "" when no part number exists
- [ ] No "ITEM-N" placeholders

---

## Error Handling Validation

- [ ] **Invalid Document**
  - Returns: `{ "error": "Document does not appear to be a commercial invoice", "line_items": [] }`

- [ ] **No Line Items**
  - Returns: `{ "error": "No line items found in document", "line_items": [] }`

- [ ] **API Errors**
  - Error messages are clear and actionable
  - Error codes are appropriate
  - Stack traces not exposed in production

---

## Quality Metrics

### Target Metrics

- **Completeness**: 100% of line items extracted
- **Accuracy**: 95%+ field accuracy
- **SKU Accuracy**: 100% (empty string when no part number)
- **HTS Code Preservation**: 100% (leading zeros preserved)
- **Currency Handling**: 100% (correct removal/preservation)

### Monitoring

Track these metrics over time:
- Average items per invoice
- SKU population rate (non-empty SKUs / total items)
- COO inference success rate
- Multi-language recognition rate
- Currency symbol handling accuracy

---

## Related Files

- **A79 System Prompt**: `A79_SYSTEM_PROMPT.md`
- **Instructions**: `INSTRUCTIONS.md`
- **Validation Middleware**: `backend/middleware/validation.js`
- **Test Validation**: `test/validate_integration.js`

---

**Version:** 2.0  
**Last Updated:** November 2024

