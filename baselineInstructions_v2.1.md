# Commercial Invoice Baseline Instructions - V2.1 EMERGENCY UPDATE
## Includes Multi-Page Extraction Fix

---

# 🚨 CRITICAL MULTI-PAGE EXTRACTION PROTOCOL 🚨
## READ THIS FIRST - BEFORE EXTRACTING ANY DATA

### MANDATORY PRE-EXTRACTION CHECKLIST

**Step 0: Document Analysis**
1. Count total pages in PDF
2. Scan ALL pages for line item tables
3. Find totals section (usually last page)
4. Look for "Total cartons/pieces/value"
5. Estimate expected line item count

**Step 1: Set Mental Expectations**
Before extracting a single item, answer:
- How many pages does this document have?
- Where do line item tables appear? (which pages?)
- What's the total cartons/pieces shown?
- Approximately how many line items should I find?

**Step 2: Page-by-Page Processing**
- Extract page 1 items → verify count
- Extract page 2 items → verify count  
- Extract page 3 items → verify count
- Continue until all pages processed
- Track progress: "Page 1: Items 1-5, Page 2: Items 6-35"

**Step 3: Pre-Output Verification**
Before outputting JSON, verify:
- ✓ All pages processed?
- ✓ Item count matches estimate?
- ✓ Sequential numbering (1,2,3...N)?
- ✓ Totals match invoice footer?

**Step 4: Only Then Output JSON**

---

## ⚠️ ABSOLUTE FAILURE MODES TO AVOID

### ❌ NEVER DO THESE:
1. **STOP after page 1** if document has multiple pages
2. **OUTPUT JSON** before processing all pages
3. **SKIP pages** even if they look different
4. **ASSUME "done"** without checking totals
5. **IGNORE plain-text items** (items without table borders)
6. **TRUST first impression** - verify against totals

### ✅ ALWAYS DO THESE:
1. **PROCESS every page** completely
2. **VERIFY counts** against totals
3. **CHECK continuations** across pages
4. **SCAN entire text** for patterns (tables may not have borders)
5. **COUNT extracted items** before outputting
6. **COMPARE to expectations** set in Step 1

---

## 📋 TABLE CONTINUATION RECOGNITION

Commercial invoice tables often span multiple pages with NO visual continuation markers.

**Signs of continuation:**
- Page 1 table ends mid-page or at bottom
- No "TOTAL" or "END" marker on page
- Page 2 starts with similar data structure
- Item numbers increase sequentially (5 → 6 → 7)

**Line items can appear as:**
1. Formatted tables with borders
2. Plain text with spacing
3. Compressed text: `FlooringLVTVietnam3918.10.901011`
4. Tab or comma-separated values

**Don't require table borders!** Look for data patterns:
- Description + Country + HTS Code + Quantity + Price + Weight

---

## COMPREHENSIVE FIELD COVERAGE

### Parties (Structured Objects with Nested Components)

#### shipper
```json
"shipper": {
  "name": "ACME Manufacturing Inc.",
  "address": {
    "street": "209 South Easterling St.",
    "city": "Dalton",
    "state": "GA",
    "postal_code": "30721",
    "country": "USA"
  },
  "contact": {
    "phone": "+1-512-555-0100",
    "email": "info@acme.com"
  }
}
```

#### consignee / ship_to
```json
"consignee": {
  "name": "Next Floor Inc.",
  "address": {
    "street": "130 Imperial Drive",
    "city": "Kitchener",
    "state": "Ontario",
    "postal_code": "N2M 1C4",
    "country": "Canada"
  },
  "contact": {
    "phone": "",
    "email": ""
  }
}
```

#### seller
```json
"seller": {
  "name": "Company Name",
  "address": {
    "street": "",
    "city": "",
    "state": "",
    "postal_code": "",
    "country": ""
  },
  "tax_id": "",
  "contact": {
    "phone": "",
    "email": ""
  }
}
```

#### buyer / importer_of_record
```json
"buyer": {
  "name": "Wholesale Solutions",
  "address": {
    "street": "1857 Sawmill Road",
    "city": "Conestogo",
    "state": "Ont.",
    "postal_code": "N0B 1N0",
    "country": "Canada"
  },
  "tax_id": ""
}
```

#### notify_party
```json
"notify_party": {
  "name": "KlearNow Corp.",
  "address": {
    "street": "3945 Freedom Circle, Suite 400",
    "city": "Santa Clara",
    "state": "CA",
    "postal_code": "95054",
    "country": "USA"
  },
  "contact": {
    "phone": "415-360-5177",
    "email": "wholesalesolutions@klearnow.net, support@klearnow.com, pars@klearnow.net"
  }
}
```

**Party Recognition Rules:**
- **Shipper** = "Ship From", "Shipped By", "Exporter"
- **Consignee** = "Ship To", "Deliver To", "Destination"
- **Seller** = "Seller", "Vendor", "Supplier", "Sold By"
- **Buyer** = "Buyer", "Sold To", "Bill To", "Customer"
- **Importer of Record** = "Importer of Record", "IOR"
- **Notify Party** = "Notify Party", "Notify", "Contact"

---

### Routing & Shipping

```json
"shipping": {
  "port_of_loading": "Houston, TX",
  "port_of_discharge": "Vancouver, BC",
  "place_of_delivery": "Toronto, ON",
  "carrier": "Maersk",
  "vessel_flight": "MSC-12345",
  "bill_of_lading": "MAEU123456789",
  "container_numbers": ["MSCU1234567", "MSCU7654321"]
}
```

---

### Invoice Identifiers

```json
"invoice_number": "792050416",
"invoice_date": "December 2, 2025",
"b3_number": "12345678",
"incoterms": "FCA",
"currency": "USD",
"payment_terms": "Net 30"
```

**Date formats accepted:**
- "December 2, 2025"
- "Dec 2, 2025"  
- "12/2/2025"
- "2025-12-02"

---

### Financials

```json
"totals": {
  "subtotal": "$18,533.33",
  "tax": "$0.00",
  "freight": "$0.00",
  "insurance": "$0.00",
  "gross_invoice_value": "$18,533.33",
  "net_invoice_value": "$18,533.33",
  "total_weight_kg": "17789",
  "total_cartons": "1020"
}
```

```json
"bank_information": {
  "bank_name": "Chase Bank",
  "account_number": "123456789",
  "swift_code": "CHASUS33",
  "routing_number": "021000021"
}
```

---

## LINE ITEMS STRUCTURE (ARRAY)

```json
"line_items": [
  {
    "item_number": "1",
    "sku": "",
    "description": "Flooring - LVT - Groundwork",
    "hts_code": "3918.10.9010",
    "country_of_origin": "VN",
    "quantity": "5",
    "unit_of_measure": "EA",
    "unit_price": "15.31",
    "value": "$76.55",
    "purchase_order": "",
    "net_weight": 91,
    "gross_weight": 91,
    "number_of_packages": "5",
    "additional_data": {}
  }
]
```

### Line Item Field Rules (CRITICAL)

**All fields are STRINGS except weights:**

#### sku (String)
- **ONLY use ACTUAL part numbers**: "COMP001", "214N53", "T15-B28450"
- **NEVER use sequential numbers**: "1", "2", "3"
- **NEVER generate placeholders**: "ITEM-1", "SKU-001"
- **If no part number exists**: Use empty string `""`

**SKU Detection Keywords:**
- Part Number, P/N, Part No., Part #
- SKU, Item Number, Article Number
- Material Number, Material #, Product Code

**✅ VALID SKUs:**
- "T15-B28450"
- "COMP-001-A"
- "214N53"
- "WDG-501"

**❌ INVALID (use "" instead):**
- "1", "2", "3"
- "Item 1", "Item 2"
- "001", "002", "003"

#### quantity (String)
- Extract number only
- Remove units: "100" not "100 PCS"
- Remove currency: "5" not "$5"

#### unit_price (String)
- Extract number only
- Remove currency symbol: "15.31" not "$15.31"
- Preserve decimals: "15.31" not "15"

#### value (String)
- **PRESERVE currency symbol**: "$76.55" ✅
- This is the ONLY field that keeps currency symbol

#### hts_code (String)
- Preserve dots: "3918.10.9010"
- Preserve leading zeros: "0123.45.6789"
- Store as string to prevent data loss

#### country_of_origin (String)
- 2-letter ISO code when possible: "VN", "CN", "US", "MY"
- **Inference priority:**
  1. Explicit COO on line item
  2. Global COO statement ("Country of Origin: Vietnam")
  3. Infer from shipper address
  4. "N/A" only as last resort

**Common country mappings:**
- Vietnam → "VN"
- China → "CN"
- United States/USA → "US"
- Malaysia → "MY"
- Canada → "CA"

#### net_weight / gross_weight (NUMBER)
- **Only fields that are NUMBERS, not strings**
- Always in kilograms (kg)
- Convert if needed: 1 LB = 0.453592 kg
- Reason: Enable automatic calculations

**Weight recognition:**
- "Net Weight", "Net Kgs", "Net Weight(kg)", "Kilos Netos"
- "Gross Weight", "Gross Kgs", "Gross Weight(kg)", "Kilos Brutos"

#### unit_of_measure (String)
- Common values: "EA", "PCS", "SET", "BOX", "KG", "LBS"
- Default if missing: "EA"

#### number_of_packages (String)
- Also called: "Cartons", "Pieces", "Packages", "Ctns"
- Extract from "Cartons/Pieces" column

---

## MULTI-LANGUAGE COLUMN RECOGNITION

Recognize headers in multiple languages:

### Spanish
- Descripción → description
- Cantidad → quantity
- Kilos Brutos → gross_weight
- Kilos Netos → net_weight
- Precio Unitario → unit_price

### Portuguese
- Quantidade → quantity
- Peso Bruto → gross_weight
- Peso Líquido → net_weight
- Preço → unit_price

### German
- Beschreibung → description
- Menge → quantity
- Bruttogewicht → gross_weight
- Nettogewicht → net_weight

### French
- Description → description
- Quantité → quantity
- Poids Brut → gross_weight
- Poids Net → net_weight

### Chinese
- Recognize common invoice characters for standard fields

---

## FUZZY MATCHING (Synonyms)

Don't require exact matches. These are equivalent:

**Part Number:**
Part Number = Part # = P/N = SKU = Item = Item Number = Customer Part Number = Material # = Material Number = Product Code = Article Number

**Description:**
Description = Descr = DESCRIPTION = Description of goods = Item Description = Product Description

**Quantity:**
Quantity = Qty = QTY = Shipped Qty = Shipped QTY = No. of units = Manifest Quantity = Cantidad

**Unit Price:**
Unit Price = U/P = U/P(USD) = Price/Unit = unit price = Price = Unit Value = Rate = Unit Cost = Precio Unitario

**Value:**
Value = Amount = Total = Extended Price = Net amount = Total Value = Line Total = Amount (USD)

**HTS Code:**
HTS = HTS Code = HS Code = Tariff Code = Tariff No = HTS Schedule B = Harmonized Tariff = HSN No. = HTS-US = Commodity Code = HS Code

**Country of Origin:**
Country of Origin = COO = CoO = Origin = Country = Product of = Country/Terr. of MFR = Country of shipment = Made in

**Purchase Order:**
PO = PO# = PO Number = Transfer Order = Purchase Order = Customer PO = Order Number

---

## EXTRACTION WORKFLOW (STEP-BY-STEP)

### Phase 1: Document Assessment (2 minutes)
1. Open PDF, count pages: ___ pages
2. Scan each page for tables
3. Find totals section: Total cartons = ___, Total value = ___
4. Estimate line items: ___ items expected

### Phase 2: Extract Invoice-Level Data
1. Invoice number, date, B3 number
2. Shipper (Ship From)
3. Consignee (Ship To)
4. Seller, Buyer, Importer of Record
5. Notify Party
6. Shipping details
7. Payment terms, currency

### Phase 3: Extract Line Items (PAGE BY PAGE)
1. **Page 1:**
   - Identify table start
   - Extract all items on this page
   - Note last item number
   - Count: ___ items from page 1

2. **Page 2:**
   - Look for table continuation (may not have header)
   - Item numbers should continue from page 1
   - Extract all items
   - Count: ___ items from page 2

3. **Page 3+:**
   - Continue pattern
   - Extract all remaining items
   - Count: ___ items from page 3

4. **Running total**: Items extracted so far = ___

### Phase 4: Extract Totals
1. Gross invoice value
2. Net invoice value
3. Total cartons/packages
4. Total weight
5. Subtotal, tax, freight, insurance (if present)

### Phase 5: Verification (MANDATORY)
1. Count line items extracted: ___
2. Compare to estimate from Phase 1: ___ expected
3. Check sequential numbering: 1,2,3...N (no gaps?)
4. Sum quantities: Does it match total cartons?
5. Sum values: Does it match gross invoice value?

### Phase 6: Output JSON
Only after verification passes.

---

## OUTPUT JSON STRUCTURE

```json
{
  "invoice_number": "792050416",
  "invoice_date": "December 2, 2025",
  "b3_number": "",
  "incoterms": "",
  "currency": "USD",
  "payment_terms": "",
  
  "shipper": {
    "name": "Next Floor Inc.",
    "address": {
      "street": "209 South Easterling St.",
      "city": "Dalton",
      "state": "GA",
      "postal_code": "30721",
      "country": "USA"
    },
    "contact": {
      "phone": "",
      "email": ""
    }
  },
  
  "consignee": {
    "name": "Next Floor Inc.",
    "address": {
      "street": "130 Imperial Drive",
      "city": "Kitchener",
      "state": "Ontario",
      "postal_code": "N2M 1C4",
      "country": "Canada"
    },
    "contact": {
      "phone": "",
      "email": ""
    }
  },
  
  "buyer": {
    "name": "Wholesale Solutions",
    "address": {
      "street": "1857 Sawmill Road",
      "city": "Conestogo",
      "state": "Ont.",
      "postal_code": "N0B 1N0",
      "country": "Canada"
    },
    "tax_id": ""
  },
  
  "notify_party": {
    "name": "KlearNow Corp.",
    "address": {
      "street": "3945 Freedom Circle, Suite 400",
      "city": "Santa Clara",
      "state": "CA",
      "postal_code": "95054",
      "country": "USA"
    },
    "contact": {
      "phone": "415-360-5177",
      "email": "wholesalesolutions@klearnow.net"
    }
  },
  
  "shipping": {
    "port_of_loading": "",
    "port_of_discharge": "",
    "carrier": "",
    "vessel_flight": "",
    "bill_of_lading": "",
    "container_numbers": []
  },
  
  "line_items": [
    {
      "item_number": "1",
      "sku": "",
      "description": "Flooring - LVT - Groundwork",
      "hts_code": "3918.10.9010",
      "country_of_origin": "VN",
      "quantity": "5",
      "unit_of_measure": "EA",
      "unit_price": "15.31",
      "value": "$76.55",
      "purchase_order": "",
      "net_weight": 91,
      "gross_weight": 91,
      "number_of_packages": "5",
      "additional_data": {}
    }
    // ... continue for ALL items
  ],
  
  "totals": {
    "subtotal": "$18,533.33",
    "tax": "$0.00",
    "freight": "$0.00",
    "insurance": "$0.00",
    "gross_invoice_value": "$18,533.33",
    "net_invoice_value": "$18,533.33",
    "total_weight_kg": "17789",
    "total_cartons": "1020"
  },
  
  "extraction_metadata": {
    "total_pages_processed": 3,
    "pages_with_line_items": [1, 2, 3],
    "total_items_extracted": 65,
    "expected_items_estimate": 65,
    "completeness_score": 1.0,
    "sequential_check_passed": true,
    "totals_verified": true
  }
}
```

---

## QUALITY CHECKLIST (Before Outputting JSON)

### Structure ✓
- [ ] All party objects properly nested
- [ ] Addresses have street, city, state, postal_code, country
- [ ] Contact has phone and email fields
- [ ] line_items is an ARRAY (not object)
- [ ] Each line item has all required fields

### Completeness ✓
- [ ] ALL pages processed
- [ ] ALL line items extracted (not just first few)
- [ ] Sequential numbering (1,2,3...N, no gaps)
- [ ] Item count matches estimate
- [ ] Totals section complete

### Data Types ✓
- [ ] All fields are STRINGS except net_weight and gross_weight
- [ ] HTS codes preserved as strings (dots and leading zeros intact)
- [ ] Weights are NUMBERS (not strings)

### Currency Symbols ✓
- [ ] quantity: NO currency → "100"
- [ ] unit_price: NO currency → "15.31"
- [ ] value: PRESERVE currency → "$76.55"
- [ ] totals: PRESERVE currency → "$18,533.33"

### Field Content ✓
- [ ] SKUs are actual part numbers (or empty string)
- [ ] No generated SKUs like "ITEM-1"
- [ ] Multi-line descriptions concatenated
- [ ] Country codes normalized (2-letter when possible)
- [ ] Missing fields use empty string "" (not null, not omitted)

### Verification ✓
- [ ] Sum of line item values ≈ gross_invoice_value
- [ ] Sum of packages ≈ total_cartons
- [ ] Last item_number matches expected count
- [ ] All pages accounted for in extraction_metadata

---

## FINAL REMINDERS

### 🚨 CRITICAL - NEVER FORGET

1. **EXTRACT EVERY LINE ITEM** - Scan entire document, all pages
2. **PROCESS ALL PAGES** - Don't stop after page 1
3. **VERIFY COUNTS** - Compare extracted vs. expected
4. **SEQUENTIAL KEYS** - 1,2,3...N with no gaps
5. **PRESERVE CURRENCY** - Only in value and totals fields
6. **STRING TYPES** - All fields except weights
7. **NO FABRICATION** - Empty string if missing, never guess
8. **SKU RULES** - Actual part numbers only, never sequential numbers

### Example: Next Floor Invoice Success Case

**Document:** 792050416
- **Pages:** 3
- **Total cartons:** 1,020
- **Expected items:** 65+

**Correct extraction:**
- Page 1: Items 1-5
- Page 2: Items 6-35
- Page 3: Items 36-65
- **Total: 65 items ✓**

**Verification:**
- Sequential: 1-65 ✓
- Total cartons: 1,020 ✓
- Total value: $18,533.33 ✓
- All pages processed ✓

---

**END OF BASELINE INSTRUCTIONS**

**Version:** 2.1 EMERGENCY UPDATE  
**Date:** December 5, 2024  
**Changes:** Added multi-page extraction protocol, verification steps, extraction metadata
