/**
 * Hybrid Baseline Instructions
 * 
 * Combines comprehensive field coverage with laser-focused line item precision.
 * This baseline serves all use cases: customs clearance, accounts payable, 
 * logistics coordination, and financial analysis.
 */

export const BASELINE_INSTRUCTIONS = `[CRITICAL] MULTI-PAGE EXTRACTION PROTOCOL [CRITICAL]
## READ THIS FIRST - BEFORE EXTRACTING ANY DATA

THIS IS THE MOST IMPORTANT RULE: YOU MUST PROCESS EVERY PAGE OF THE DOCUMENT.

IF YOU ONLY EXTRACT ITEMS FROM PAGE 1 AND STOP, YOU HAVE FAILED COMPLETELY.

### MANDATORY PRE-EXTRACTION CHECKLIST (DO THIS FIRST)

**Step 0: Document Analysis (MANDATORY - DO NOT SKIP)**
1. Count total pages in PDF - Write down the number: "This PDF has X pages"
2. Scan ALL pages for line item tables - Note which pages have tables
3. Find totals section (usually last page) - Read the total cartons/pieces/value
4. Look for "Total cartons/pieces/value" - This tells you how many items to expect
5. Estimate expected line item count - If totals show 1,020 cartons, expect 50-100 line items

**Step 1: Set Mental Expectations (REQUIRED)**
Before extracting a single item, you MUST answer these questions:
- "How many pages does this document have?" → Write the answer
- "Where do line item tables appear?" → List the page numbers
- "What's the total cartons/pieces shown?" → Write the number
- "Approximately how many line items should I find?" → Write your estimate

**Step 2: Page-by-Page Processing (MANDATORY)**
You MUST process each page separately:
- Page 1: Extract ALL items from page 1 → Count them → Write: "Page 1: X items"
- Page 2: Extract ALL items from page 2 → Count them → Write: "Page 2: X items"
- Page 3: Extract ALL items from page 3 → Count them → Write: "Page 3: X items"
- Continue for ALL pages until you reach the last page
- Track your progress: "Page 1: Items 1-5, Page 2: Items 6-35, Page 3: Items 36-65"

**Step 3: Pre-Output Verification (MANDATORY - DO NOT SKIP)**
Before outputting JSON, you MUST verify:
- [CHECK] Did I process all pages? Count the pages you processed vs. total pages
- [CHECK] Does my item count match the estimate from totals?
- [CHECK] Is the numbering sequential? (1,2,3...N with no gaps)
- [CHECK] Do the totals match the invoice footer?

**Step 4: Only Output JSON After ALL Checks Pass**

IF ANY CHECK FAILS, GO BACK AND RE-SCAN THE PAGES YOU MISSED.

[WARNING] ABSOLUTE FAILURE MODES TO AVOID [WARNING]

[X] NEVER DO THESE:
1. STOP after page 1 if document has multiple pages
2. OUTPUT JSON before processing all pages
3. SKIP pages even if they look different
4. ASSUME "done" without checking totals
5. IGNORE plain-text items (items without table borders)
6. TRUST first impression - verify against totals

[OK] ALWAYS DO THESE:
1. PROCESS every page completely
2. VERIFY counts against totals
3. CHECK continuations across pages
4. SCAN entire text for patterns (tables may not have borders)
5. COUNT extracted items before outputting
6. COMPARE to expectations set in Step 1

[INFO] TABLE CONTINUATION RECOGNITION

Commercial invoice tables often span multiple pages with NO visual continuation markers.

**Signs of continuation:**
- Page 1 table ends mid-page or at bottom
- No "TOTAL" or "END" marker on page
- Page 2 starts with similar data structure
- Item numbers increase sequentially (5 → 6 → 7)

**Line items can appear as:**
1. Formatted tables with borders
2. Plain text with spacing
3. Compressed text: FlooringLVTVietnam3918.10.901011
4. Tab or comma-separated values

**Don't require table borders!** Look for data patterns:
- Description + Country + HTS Code + Quantity + Price + Weight

---

Extract structured data from commercial invoices with comprehensive coverage and precision.

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

[CRITICAL] MULTI-PAGE EXTRACTION REQUIREMENTS [CRITICAL]

1. **PRE-SCAN ENTIRE DOCUMENT FIRST:**
   - Count total pages
   - Identify which pages contain line item tables
   - Note total cartons/pieces from footer
   - Estimate expected line item count

2. **PAGE-BY-PAGE EXTRACTION:**
   - Page 1: Extract all items → count them
   - Page 2: Extract all items → count them
   - Page 3: Extract all items → count them
   - Continue for ALL pages

3. **VERIFICATION BEFORE OUTPUT:**
   - [CHECK] All pages processed?
   - [CHECK] Item count matches estimate from totals?
   - [CHECK] Sequential numbering (1,2,3...N with no gaps)?
   - [CHECK] Sum of values matches gross_invoice_value?

4. **ONLY OUTPUT JSON AFTER ALL VERIFICATIONS PASS**

**CRITICAL RULES (THESE ARE NON-NEGOTIABLE):**
- DO NOT STOP after page 1 if document has multiple pages - THIS IS A CRITICAL FAILURE
- DO NOT OUTPUT JSON until all pages processed - CHECK YOUR PAGE COUNT FIRST
- DO NOT SKIP pages even if they look different - EVERY PAGE MUST BE PROCESSED
- DO NOT ASSUME "done" without checking totals - VERIFY AGAINST INVOICE FOOTER
- DO NOT IGNORE plain-text line items (without table borders) - THEY ARE STILL LINE ITEMS
- If invoice has 65 items across 3 pages, extract ALL 65 items - NOT JUST THE FIRST 5
- Process ALL text from ALL pages - SCAN EVERY PAGE COMPLETELY
- Sequential numbering must be continuous (1, 2, 3...65) - NO GAPS ALLOWED

**REAL EXAMPLE - Next Floor Invoice 792050416:**
- This invoice has 3 pages
- Total cartons: 1,020
- Expected items: 65 line items
- Page 1: Items 1-5 (Flooring, Carpet Tile, Moulding)
- Page 2: Items 6-35 (Flooring-LVT-Miracle through Carpet Tile-Luminous) - DO NOT SKIP THIS PAGE
- Page 3: Items 36-65 (Flooring-LVT-Tuscan through Display Cards) - DO NOT SKIP THIS PAGE
- CORRECT: Extract all 65 items
- WRONG: Extract only 5 items from page 1 and stop

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
- value: "$226.00" [PRESERVE]
- subtotal: "$476.00" [PRESERVE]
- gross_invoice_value: "$541.00" [PRESERVE]
- All totals fields [PRESERVE]

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

[OK] USE (actual part numbers):
- "COMP001", "214N53", "ABC-12345", "PART-789", "SKU-456"
- Must contain letters OR be complex alphanumeric
- Look for headers: Part No., P/N, SKU, Article No., Material No., Product Code

[X] NEVER USE:
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
- extraction_metadata object (REQUIRED for multi-page documents):

Example extraction_metadata structure:
"extraction_metadata": {
  "total_pages_processed": 3,
  "pages_with_line_items": [1, 2, 3],
  "total_items_extracted": 65,
  "expected_items_estimate": 65,
  "completeness_score": 1.0,
  "sequential_check_passed": true,
  "totals_verified": true
}

Always return valid JSON.

---

[FINAL REMINDER - READ THIS BEFORE OUTPUTTING JSON]

BEFORE YOU OUTPUT YOUR JSON RESPONSE, ASK YOURSELF:

1. "Did I count the total pages in this PDF?" → If NO, go back and count them
2. "Did I process every single page?" → If NO, go back and process the missing pages
3. "Did I extract items from page 2, page 3, and all subsequent pages?" → If NO, go back and extract them
4. "Does my item count match what the invoice totals suggest?" → If NO, you're missing items - go back and find them
5. "Am I stopping after page 1 even though there are more pages?" → If YES, THIS IS WRONG - continue to page 2, page 3, etc.

IF YOU ONLY EXTRACTED 5 ITEMS FROM A 3-PAGE DOCUMENT, YOU HAVE FAILED.
GO BACK AND EXTRACT THE REMAINING 60 ITEMS FROM PAGES 2 AND 3.

ONLY OUTPUT JSON WHEN YOU HAVE PROCESSED EVERY PAGE AND EXTRACTED EVERY LINE ITEM.`

