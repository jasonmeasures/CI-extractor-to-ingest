# A79 Commercial Invoice Extraction Instructions

## Overview

This document describes the three-tier instruction system used for commercial invoice extraction. The system combines baseline instructions with customer-specific and custom instructions to provide comprehensive, precise data extraction.

---

## Three-Tier Instruction System

```
┌─────────────────────────────────┐
│   Tier 1: Baseline Instructions │
│   (Hybrid: Comprehensive +      │
│    Precise line items)           │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│   Tier 2: Customer Instructions │
│   (TARGET001: additional        │
│    fields, special rules)        │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│   Tier 3: Custom Instructions   │
│   (One-off: "extract warehouse  │
│    location if mentioned")       │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│   Complete Instructions Sent    │
│   to A79 API                     │
└─────────────────────────────────┘
```

---

## Tier 1: Baseline Instructions (Hybrid Approach)

### Comprehensive Field Coverage

#### Parties
- **shipper**: { name, address: { street, city, state, postal_code, country }, contact: { phone, email } }
- **consignee**: { name, address: { street, city, state, postal_code, country }, contact: { phone, email } }
- **seller**: { name, address, tax_id }
- **buyer**: { name, address, tax_id }

#### Routing
- **port_of_loading**: Port where goods are loaded
- **port_of_discharge**: Port where goods are unloaded
- **place_of_delivery**: Final delivery location
- **carrier**: Shipping company name
- **vessel_flight**: Vessel or flight number
- **bill_of_lading**: B/L number
- **container_numbers**: Array of container IDs

#### Financials
- **invoice_number**: Invoice identifier
- **invoice_date**: Date in format "Month Day, Year" (e.g., "November 19, 2025")
- **payment_terms**: Terms of payment (e.g., "Net 30", "FOB")
- **currency**: Currency code (USD, EUR, etc.)
- **exchange_rate**: If applicable
- **bank_information**: { bank_name, account_number, swift_code }
- **totals**: {
    - subtotal: String WITH currency symbol (e.g., "$476.00")
    - tax: String WITH currency symbol
    - freight: String WITH currency symbol
    - insurance: String WITH currency symbol
    - gross_invoice_value: String WITH currency symbol (e.g., "$526.00")
  }

### Laser-Focused Line Items

**CRITICAL: EXTRACT EVERY SINGLE LINE ITEM FROM ALL PAGES**
- DO NOT STOP after a few items
- If invoice has 50 items, extract all 50
- Process ALL text from ALL pages
- Sequential numbering must be continuous (1, 2, 3...)

#### Line Item Fields (All as STRINGS)

- **item_number**: String (e.g., "1", "2", "3")
- **sku**: String - ONLY use ACTUAL part numbers (e.g., "COMP001", "214N53")
  - **CRITICAL: If no part number exists, leave SKU EMPTY (empty string "")**
  - **NEVER use sequential numbers like "1", "2", "Item 1" as SKU**
  - **DO NOT generate "ITEM-1", "ITEM-2" or any placeholder**
- **description**: Complete product description
- **hts_code**: String preserving leading zeros (e.g., "0123.45.6789")
- **country_of_origin**: 2-letter ISO code (use intelligent inference)
- **quantity**: String (e.g., "100") - REMOVE currency symbols and units
- **unit_price**: String (e.g., "45.20") - REMOVE currency symbols
- **value**: String WITH currency symbol (e.g., "$226.00") - PRESERVE currency
- **net_weight**: Number in kg (recognize "Kilos Netos"/"Peso Neto")
- **gross_weight**: Number in kg (recognize "Kilos Brutos"/"Peso Bruto")
- **unit_of_measure**: String (default "EA")

### Currency Symbol Rules

**REMOVE currency symbols from:**
- quantity: "100" not "100 PCS"
- unit_price: "45.20" not "$45.20"

**PRESERVE currency symbols in:**
- value: "$226.00" ✅
- subtotal: "$476.00" ✅
- gross_invoice_value: "$541.00" ✅
- All totals fields ✅

### Data Types: All Strings

All numeric fields must be strings to preserve:
- Leading zeros in HTS codes: "0123.45.6789" not 123456789
- Exact formatting: "1" not 1, "45.20" not 45.2

**Exception**: Weight fields (net_weight, gross_weight) are numbers for calculation purposes.

### Country of Origin Inference

**Priority order:**
1. Explicit COO on line item (highest priority)
2. Global COO statement ("Country of Origin: Germany" → apply to all)
3. Infer from shipper/seller address ("Guadalupe, N.L., Mexico" → "MX")
4. "N/A" only as last resort

### SKU Detection Rules

**✅ USE (actual part numbers):**
- "COMP001", "214N53", "ABC-12345", "PART-789", "SKU-456"
- Must contain letters OR be complex alphanumeric
- Look for headers: Part No., P/N, SKU, Article No., Material No., Product Code

**❌ NEVER USE:**
- "1", "2", "3" (pure numbers - these are row counters)
- "Item 1", "Item 2" (row labels)
- "001", "002" (sequential numbering)
- If no part number exists, use empty string ""

### Multi-Language Support

Recognize column headers in:
- **Spanish**: "Descripción", "Cantidad", "Kilos Brutos", "Kilos Netos"
- **Portuguese**: "Descripción", "Quantidade", "Peso Bruto", "Peso Líquido"
- **German**: "Beschreibung", "Menge", "Bruttogewicht", "Nettogewicht"
- **French**: "Description", "Quantité", "Poids Brut", "Poids Net"
- **Chinese**: Recognize common invoice terms

### Fuzzy Matching

Recognize synonyms automatically:
- Part Number = P/N = SKU = Material # = Product Code = Article No.
- Quantity = Qty = QTY = Shipped Qty = No. of units = Cantidad
- Unit Price = U/P = Price/Unit = Rate = Unit Cost = Precio Unitario
- Description = Desc = Product Description = Item Description = Descripción

---

## Tier 2: Customer Instructions

Customer-specific instructions are loaded from JSON configuration files located in `backend/config/customers/`.

### Customer Configuration Structure

```json
{
  "customer_number": "TARGET001",
  "name": "Target Corporation",
  "additional_fields": [
    "target_po",
    "vendor_number",
    "dc_number"
  ],
  "special_rules": [
    "Extract Target PO number separately from other PO fields",
    "Vendor ID should be mapped to Vendor Number field"
  ],
  "field_mappings": {
    "vendor_id": "vendor_number",
    "po_number": "target_po"
  },
  "notes": "Optional notes about this customer"
}
```

### Available Customers

#### TARGET001 (Target Corporation)
- Additional fields: Target PO, Vendor Number, DC Number, Store Number
- Special rules: Extract Target PO separately, map Vendor ID to Vendor Number
- Field mappings: vendor_id → vendor_number, po_number → target_po

#### BASF001 (BASF Corporation)
- Additional fields: Material Number, UN Number, Batch/Lot, CAS Number, Hazard Class
- Special rules: Chemical safety requirements, traceability data
- Field mappings: material_no → material_number, lot_number → batch_lot

### Adding New Customers

1. Create JSON file: `backend/config/customers/CUST001.json`
2. Define customer configuration (see structure above)
3. Customer instructions will automatically be applied when `customer_number` is specified

---

## Tier 3: Custom Instructions

Custom instructions are user-provided, one-off requirements passed via the API.

### Usage

```bash
POST /api/extract
{
  "file": "invoice.pdf",
  "customer_number": "TARGET001",
  "custom_instructions": "Also extract warehouse location if mentioned in the document"
}
```

### Best Practices

- Use for one-time requirements
- Be specific and clear
- If pattern repeats, add to customer config instead
- Examples:
  - "Extract warehouse code from header"
  - "This is a 5-page invoice with 30 items total"
  - "Also extract batch number from description field"

---

## Instruction Building Process

1. **Start with Baseline**: Load hybrid baseline instructions
2. **Add Customer Instructions** (if customer_number provided):
   - Load customer config from `backend/config/customers/{customer_number}.json`
   - Append additional fields, special rules, and field mappings
3. **Add Custom Instructions** (if provided):
   - Append user-provided custom instructions
4. **Add Extract Fields** (if provided):
   - Append any additional fields to extract
5. **Send to A79 API**: Complete instruction string sent as `custom_instructions`

---

## Implementation

The instruction builder is implemented in `backend/services/instructionBuilder.js`:

```javascript
import { buildInstructions } from './services/instructionBuilder.js'

const instructions = buildInstructions({
  customer_number: 'TARGET001',
  custom_instructions: 'Extract warehouse code',
  extract_fields: ['warehouse_code', 'lot_number']
})
```

---

## Related Files

- **Baseline Instructions**: `backend/config/baselineInstructions.js`
- **Instruction Builder**: `backend/services/instructionBuilder.js`
- **Customer Configs**: `backend/config/customers/*.json`
- **A79 System Prompt**: `A79_SYSTEM_PROMPT.md`

---

**Version:** 2.0 (Hybrid Baseline)  
**Last Updated:** November 2024

