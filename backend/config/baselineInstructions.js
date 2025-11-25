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

=== OUTPUT FORMAT ===

Return valid JSON with:
- All party information (shipper, consignee, seller, buyer)
- Complete routing details
- Financial breakdown with totals
- line_items array with ALL items from ALL pages
- Each line item as a complete object with all fields

Always return valid JSON.`

