/**
 * Hybrid Baseline Instructions
 * 
 * Combines comprehensive field coverage with laser-focused line item precision.
 * This baseline serves all use cases: customs clearance, accounts payable, 
 * logistics coordination, and financial analysis.
 */

export const BASELINE_INSTRUCTIONS = `Extract structured data from commercial invoices with comprehensive coverage and precision.

=== COMPREHENSIVE FIELD COVERAGE ===

PARTIES:
- shipper: { name, address: { street, city, state, postal_code, country }, contact: { phone, email } }
- consignee: { name, address: { street, city, state, postal_code, country }, contact: { phone, email } }
- seller: { name, address, tax_id }
- buyer: { name, address, tax_id }

ROUTING:
- port_of_loading: Port where goods are loaded
- port_of_discharge: Port where goods are unloaded
- place_of_delivery: Final delivery location
- carrier: Shipping company name
- vessel_flight: Vessel or flight number
- bill_of_lading: B/L number
- container_numbers: Array of container IDs

FINANCIALS:
- invoice_number: Invoice identifier
- invoice_date: Date in format "Month Day, Year" (e.g., "November 19, 2025")
- payment_terms: Terms of payment (e.g., "Net 30", "FOB")
- currency: Currency code (USD, EUR, etc.)
- exchange_rate: If applicable
- bank_information: { bank_name, account_number, swift_code }
- totals: {
    subtotal: String with currency symbol (e.g., "$476.00")
    tax: String with currency symbol
    freight: String with currency symbol
    insurance: String with currency symbol
    gross_invoice_value: String with currency symbol (e.g., "$526.00")
  }

=== LASER-FOCUSED LINE ITEMS ===

**CRITICAL: EXTRACT EVERY SINGLE LINE ITEM FROM ALL PAGES**
- DO NOT STOP after a few items
- If invoice has 50 items, extract all 50
- Process ALL text from ALL pages
- Sequential numbering must be continuous (1, 2, 3...)

LINE ITEM FIELDS (all as STRINGS to preserve leading zeros):
- item_number: String (e.g., "1", "2", "3")
- sku: String - ONLY use ACTUAL part numbers (e.g., "COMP001", "214N53")
  **CRITICAL: If no part number exists, leave SKU EMPTY (empty string "")**
  **NEVER use sequential numbers like "1", "2", "Item 1" as SKU**
- description: Complete product description
- hts_code: String preserving leading zeros (e.g., "0123.45.6789")
  **NOTE: Commodity Code = HTS Code - treat "Commodity Code" fields as HTS codes**
- country_of_origin: 2-letter ISO code (use intelligent inference)
- quantity: String (e.g., "100") - REMOVE currency symbols and units
- unit_price: String (e.g., "45.20") - REMOVE currency symbols
- value: String WITH currency symbol (e.g., "$226.00") - PRESERVE currency
- net_weight: Number in kg (recognize "Kilos Netos"/"Peso Neto")
- gross_weight: Number in kg (recognize "Kilos Brutos"/"Peso Bruto")
- unit_of_measure: String (default "EA")

=== CURRENCY SYMBOL RULES ===

REMOVE currency symbols from:
- quantity: "100" not "100 PCS"
- unit_price: "45.20" not "$45.20"

PRESERVE currency symbols in:
- value: "$226.00" ✅
- subtotal: "$476.00" ✅
- gross_invoice_value: "$541.00" ✅
- All totals fields ✅

=== DATA TYPES: ALL STRINGS ===

All numeric fields must be strings to preserve:
- Leading zeros in HTS codes: "0123.45.6789" not 123456789
- Exact formatting: "1" not 1, "45.20" not 45.2

=== COUNTRY OF ORIGIN INFERENCE ===

Priority order:
1. Explicit COO on line item (highest priority)
2. Global COO statement ("Country of Origin: Germany" → apply to all)
3. Infer from shipper/seller address ("Guadalupe, N.L., Mexico" → "MX")
4. "N/A" only as last resort

=== SKU DETECTION RULES ===

✅ USE (actual part numbers):
- "COMP001", "214N53", "ABC-12345", "PART-789", "SKU-456"
- Must contain letters OR be complex alphanumeric
- Look for headers: Part No., P/N, SKU, Article No., Material No., Product Code

❌ NEVER USE:
- "1", "2", "3" (pure numbers - these are row counters)
- "Item 1", "Item 2" (row labels)
- "001", "002" (sequential numbering)
- If no part number exists, use empty string ""

=== MULTI-LANGUAGE SUPPORT ===

Recognize column headers in:
- Spanish: "Descripción", "Cantidad", "Kilos Brutos", "Kilos Netos"
- Portuguese: "Descrição", "Quantidade", "Peso Bruto", "Peso Líquido"
- German: "Beschreibung", "Menge", "Bruttogewicht", "Nettogewicht"
- French: "Description", "Quantité", "Poids Brut", "Poids Net"
- Chinese: Recognize common invoice terms

=== FUZZY MATCHING ===

Recognize synonyms automatically:
- Part Number = P/N = SKU = Material # = Product Code = Article No.
- Quantity = Qty = QTY = Shipped Qty = No. of units = Cantidad
- Unit Price = U/P = Price/Unit = Rate = Unit Cost = Precio Unitario
- Description = Desc = Product Description = Item Description = Descripción
- HTS Code = Commodity Code = HS Code = Tariff Code = Harmonized Code
  **CRITICAL: "Commodity Code" is the same as HTS Code - extract as hts_code field**

=== CONFIDENCE SCORING ===

For each extracted line item, provide confidence scores indicating certainty:

- confidence_score: Overall confidence for the line item (0.0-1.0, where 1.0 = highest confidence)
- field_confidence: Object with confidence for each field (0.0-1.0):
  - sku_confidence: Confidence in SKU extraction (high if actual part number found, low if empty)
  - description_confidence: Confidence in description completeness and accuracy
  - hts_code_confidence: Confidence in HTS code extraction and format
  - country_of_origin_confidence: Confidence in COO inference (higher if explicit, lower if inferred)
  - quantity_confidence: Confidence in quantity extraction
  - unit_price_confidence: Confidence in unit price extraction
  - value_confidence: Confidence in total value (higher if matches calculation)
  - net_weight_confidence: Confidence in net weight extraction
  - gross_weight_confidence: Confidence in gross weight extraction

Confidence scoring guidelines:
- 0.90-1.00: Very high confidence - data clearly visible and unambiguous
- 0.70-0.89: Medium-high confidence - data visible but some ambiguity
- 0.50-0.69: Medium confidence - data inferred or partially visible
- 0.30-0.49: Low confidence - significant uncertainty or inference required
- 0.00-0.29: Very low confidence - data unclear or missing

Include confidence scores in the output to help identify fields that may need manual review.

=== VALIDATION CHECKS ===

Perform validation checks on extracted data and include validation results:

- validation_status: Overall validation status ("passed", "warning", "failed")
- validation_checks: Object with results of specific checks:
  - completeness_check: "passed" if all required fields present, "failed" if critical fields missing
  - data_type_check: "passed" if data types correct (strings for SKU/HTS, numbers for weights)
  - currency_check: "passed" if currency symbols correctly removed/preserved
  - calculation_check: "passed" if value = quantity × unit_price (within rounding tolerance)
  - sku_check: "passed" if SKU is actual part number or empty string (not sequential number or ITEM-N)
  - hts_format_check: "passed" if HTS code format correct (10 digits with dots or "N/A")
  - coo_format_check: "passed" if country_of_origin is 2-letter ISO code or "N/A"
  - weight_check: "passed" if weights are numbers in kg

Validation rules to check:
1. ✅ SKU is either actual part number or empty string "" (never sequential numbers or ITEM-N)
2. ✅ All numeric fields are strings (except weights) to preserve leading zeros
3. ✅ Currency symbols removed from quantity and unit_price
4. ✅ Currency symbols preserved in value and totals
5. ✅ HTS codes preserve leading zeros (stored as strings)
6. ✅ Country codes are 2 letters or "N/A"
7. ✅ No null or undefined values (use defaults instead)
8. ✅ value = quantity × unit_price (within 0.01 tolerance)

For each validation check:
- Set status to "passed" if check passes
- Set status to "warning" if minor issue (e.g., missing optional field)
- Set status to "failed" if critical issue (e.g., wrong data type, missing required field)

Include validation_checks in the output to help identify data quality issues.

=== OUTPUT FORMAT ===

Return valid JSON with:
- All party information (shipper, consignee, seller, buyer)
- Complete routing details
- Financial breakdown with totals
- line_items array with ALL items from ALL pages
- Each line item as a complete object with all fields including:
  - confidence_score: Overall confidence (0.0-1.0)
  - field_confidence: Object with per-field confidence scores
  - validation_status: Overall validation status
  - validation_checks: Object with validation check results

Example line item structure:
{
  "item_number": "1",
  "sku": "COMP001",
  "description": "Computer Processor",
  "hts_code": "8471.30.0100",
  "country_of_origin": "US",
  "quantity": "50",
  "unit_price": "850.00",
  "value": "$42,500.00",
  "net_weight": 25.5,
  "gross_weight": 28.0,
  "unit_of_measure": "EA",
  "confidence_score": 0.95,
  "field_confidence": {
    "sku": 0.98,
    "description": 0.95,
    "hts_code": 0.92,
    "country_of_origin": 0.88,
    "quantity": 0.99,
    "unit_price": 0.97,
    "value": 0.96
  },
  "validation_status": "passed",
  "validation_checks": {
    "completeness_check": "passed",
    "data_type_check": "passed",
    "currency_check": "passed",
    "calculation_check": "passed",
    "sku_check": "passed",
    "hts_format_check": "passed",
    "coo_format_check": "passed",
    "weight_check": "passed"
  }
}

Always return valid JSON.`

