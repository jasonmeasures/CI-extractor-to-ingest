# Commercial Invoice A79 Extraction Instructions - Comparison Analysis

## Executive Summary

This document compares two instruction sets for commercial invoice extraction:
- **INSTRUCTIONS.md** (Jason's version) - Three-tier system with baseline + customer + custom instructions
- **Commercial_Invoice_1.md** (AI Team's version) - Comprehensive single-document approach

**Critical Findings:**
1. **Structural Incompatibility**: Different JSON schemas and data organization
2. **Field Definition Conflicts**: Currency handling, data types, and field locations differ
3. **Party Information Handling**: Major differences in approach
4. **Weight Field Data Types**: Conflicting specifications
5. **SKU Logic**: Aligned on core principles but different emphasis

---

## 1. JSON Schema Structure - CRITICAL DIFFERENCE

### Jason's Version (INSTRUCTIONS.md)
```json
{
  "shipper": {...},
  "consignee": {...},
  "seller": {...},
  "buyer": {...},
  "invoice_number": "...",
  "invoice_date": "...",
  "totals": {...},
  "line_items": [
    { "item_number": "1", ... },
    { "item_number": "2", ... }
  ]
}
```

**Key characteristics:**
- Flat structure with parties at root level
- Line items as an ARRAY
- Separate nested `totals` object
- Single invoice per response

### AI Team's Version (Commercial_Invoice_1.md)
```json
{
  "invoices_data": [
    {
      "invoice_number": "...",
      "invoice_date": "...",
      "seller": {...},
      "buyer": {...},
      "merchandise": {
        "1": {...},
        "2": {...}
      },
      "gross_invoice_value": "...",
      "net_invoice_value": "..."
    }
  ]
}
```

**Key characteristics:**
- Root-level array wrapper `invoices_data`
- Parties nested inside invoice object
- Line items as OBJECT with string keys
- Supports multiple invoices per document
- Invoice totals at invoice level (not nested)

**IMPACT:** ⚠️ **CRITICAL** - These are fundamentally incompatible structures. Backend code expecting one format will fail with the other.

---

## 2. Line Items Structure - CRITICAL DIFFERENCE

### Jason's Version
```json
"line_items": [
  {
    "item_number": "1",
    "sku": "COMP001",
    "quantity": "100",
    "unit_price": "45.20",
    "value": "$226.00"
  }
]
```
- Array structure
- Access by index: `line_items[0]`
- Order-dependent

### AI Team's Version
```json
"merchandise": {
  "1": {
    "item_number": "1",
    "sku": "COMP001",
    "quantity": "100",
    "unit_price": "45.20",
    "value": "$226.00"
  }
}
```
- Object structure with string keys
- Access by key: `merchandise["1"]`
- Key-based lookup

**IMPACT:** ⚠️ **CRITICAL** - Backend iteration logic differs significantly:
- Array: `for (let item of line_items)`
- Object: `for (let key in merchandise)`

---

## 3. Currency Symbol Handling - ALIGNED ✅

### Both Versions Agree:
- **REMOVE** currency symbols from:
  - `quantity`: "100" (not "100 PCS")
  - `unit_price`: "45.20" (not "$45.20")

- **PRESERVE** currency symbols in:
  - `value`: "$226.00" ✅
  - Invoice totals ✅

**IMPACT:** ✅ **ALIGNED** - This is consistent across both versions.

---

## 4. Data Types - PARTIAL CONFLICT

### Jason's Version
```
All fields: STRINGS (except net_weight, gross_weight which are NUMBERS)

"quantity": "100"          (string)
"unit_price": "45.20"      (string)
"net_weight": 12.5         (number)
"gross_weight": 13.0       (number)
```

**Rationale:** Preserve leading zeros in HTS codes, exact formatting

### AI Team's Version
```
ALL fields: STRINGS (including weights)

"quantity": "100"          (string)
"unit_price": "45.20"      (string)
"net_weight": "12 KG"      (string with units)
"gross_weight": "13 KG"    (string with units)
```

**IMPACT:** ⚠️ **MEDIUM** - Weight field conflicts:
- Jason: Numeric values in kg (for calculations)
- AI Team: String values with units (preserves original format)

**Recommendation:** Jason's approach better for automated calculations, AI Team's preserves source fidelity.

---

## 5. Weight Field Representation

### Jason's Version
```json
"net_weight": 12.5,       // Number in kg
"gross_weight": 13.0      // Number in kg
```
- Pure numeric values
- Normalized to kg
- Ready for calculations
- Must convert from source units

### AI Team's Version
```json
"net_weight": "12 KG",    // String with units
"gross_weight": "13 KG"   // String with units
```
- Preserves original units
- Includes unit identifiers
- Requires parsing for calculations
- Source-faithful

**IMPACT:** ⚠️ **MEDIUM** - Different downstream processing requirements

---

## 6. SKU/Part Number Logic - ALIGNED ✅

### Both Versions Share Core Principles:

**✅ EXTRACT (actual part numbers):**
- "COMP001", "214N53", "ABC-12345", "PART-789"
- Must contain letters OR be complex alphanumeric

**❌ NEVER USE:**
- "1", "2", "3" (pure sequential numbers)
- "Item 1", "Item 2" (row labels)
- Generated placeholders

**If no part number exists:**
- Jason: Empty string `""`
- AI Team: Empty string `""`

**IMPACT:** ✅ **ALIGNED** - Both versions handle SKU extraction identically.

---

## 7. Party Information - MAJOR DIFFERENCE

### Jason's Version
Extensive structured objects with nested address components:
```json
"shipper": {
  "name": "ACME Corp",
  "address": {
    "street": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "postal_code": "78701",
    "country": "USA"
  },
  "contact": {
    "phone": "+1-512-555-0100",
    "email": "info@acme.com"
  }
}
```
- Deep nesting
- Separate address components
- Phone/email in contact object

### AI Team's Version
Flat string-based addresses:
```json
"seller": {
  "name": "ACME Corp",
  "address": "123 Main St, Austin, TX 78701, USA",
  "country": "USA",
  "tax_id": "12-3456789",
  "contact": "John Smith, +1-512-555-0100"
}
```
- Minimal nesting
- Comma-separated address string
- Contact as single string

**IMPACT:** ⚠️ **HIGH** - Major structural difference requiring different parsing:
- Jason: Structured data ready for database fields
- AI Team: Unstructured strings requiring regex parsing

---

## 8. Invoice Date Format

### Jason's Version
```
"invoice_date": "November 19, 2025"  // "Month Day, Year"
```

### AI Team's Version
```
"invoice_date": "Nov 10, 2025"       // "Mon DD, YYYY"
OR
"invoice_date": "November 19, 2025"  // "Month Day, Year"
```

**IMPACT:** ✅ **MINOR** - AI Team more flexible, accepts both formats. Jason's is more prescriptive.

---

## 9. Additional/Custom Fields

### Jason's Version
- Not explicitly defined in baseline
- Handled via Tier 2 (Customer Instructions) and Tier 3 (Custom Instructions)
- `additional_data` not mentioned

### AI Team's Version
```json
"additional_data": {
  "ref1": "F0100",
  "type_code": "TYPE A"
}
```
- Explicit `additional_data` object for non-standard fields
- Clear guidance: standard fields NEVER go in additional_data
- PO, weights, quantities MUST use designated locations

**IMPACT:** ⚠️ **MEDIUM** - AI Team has explicit handling for edge cases, Jason relies on tiered system.

---

## 10. Country of Origin Inference - ALIGNED ✅

### Both Versions Use Same Priority:
1. Explicit COO on line item (highest priority)
2. Global COO statement
3. Infer from shipper/seller address
4. "N/A" or empty as last resort

**IMPACT:** ✅ **ALIGNED**

---

## 11. Multi-Language Support

### Jason's Version
**Explicitly lists:**
- Spanish: "Descripción", "Cantidad", "Kilos Brutos"
- Portuguese: "Quantidade", "Peso Bruto"
- German: "Beschreibung", "Menge"
- French: "Description", "Quantité"
- Chinese: "Recognize common invoice terms"

### AI Team's Version
**No explicit multi-language guidance**
- Fuzzy matching for English synonyms
- No mention of non-English languages

**IMPACT:** ⚠️ **MEDIUM** - Jason's version better for international invoices.

---

## 12. Fuzzy Matching - BOTH HAVE IT ✅

### Jason's Version
Lists specific synonyms:
- Part Number = P/N = SKU = Material # = Product Code
- Quantity = Qty = QTY = Shipped Qty = No. of units

### AI Team's Version
Extensive synonym lists (lines 1425-1478):
- 10+ categories of synonyms
- More comprehensive than Jason's
- Includes party/address synonyms

**IMPACT:** ✅ **ALIGNED** but AI Team's version is more exhaustive.

---

## 13. Completeness Requirements - ALIGNED ✅

### Both Versions Emphasize:
- ⚠️ **EXTRACT EVERY SINGLE LINE ITEM**
- Process ALL pages
- Sequential numbering (no gaps)
- Continue across page breaks
- If 50 items exist, extract all 50

**IMPACT:** ✅ **ALIGNED** - Both versions are emphatic about completeness.

---

## 14. Three-Tier System (Jason Only)

### Jason's Unique Feature:
```
Tier 1: Baseline Instructions (foundation)
    ↓
Tier 2: Customer Instructions (TARGET001, BASF001)
    ↓
Tier 3: Custom Instructions (one-off requirements)
```

**Customer-specific examples:**
- TARGET001: target_po, vendor_number, dc_number
- BASF001: material_number, un_number, batch_lot, cas_number

### AI Team's Approach:
- Single comprehensive instruction set
- No customer-specific logic
- No tiered system
- Additional_data field for extras

**IMPACT:** ⚠️ **HIGH** - Jason's system is more flexible and scalable for multiple customers.

---

## 15. Quality Checklist

### Jason's Version
- Minimal explicit checklist
- Focuses on data types and currency rules

### AI Team's Version
**Comprehensive checklist (lines 1360-1400):**
- Structure validation (8 items)
- Completeness validation (5 items)
- Data type validation (3 items)
- Currency symbol validation (5 items)
- Field content validation (7 items)

**IMPACT:** ✅ AI Team's checklist is more thorough and actionable.

---

## 16. Shipping/Routing Fields

### Jason's Version
```json
"port_of_loading": "...",
"port_of_discharge": "...",
"place_of_delivery": "...",
"carrier": "...",
"vessel_flight": "...",
"bill_of_lading": "...",
"container_numbers": [...]
```
- Extensive shipping/logistics fields
- Array for container numbers

### AI Team's Version
```json
"incoterms": "FCA"
```
- Only incoterms mentioned
- No explicit shipping fields

**IMPACT:** ⚠️ **HIGH** - Jason's version captures more logistics data needed for customs clearance.

---

## 17. Bank Information

### Jason's Version
```json
"bank_information": {
  "bank_name": "...",
  "account_number": "...",
  "swift_code": "..."
}
```

### AI Team's Version
- Not mentioned

**IMPACT:** ⚠️ **MEDIUM** - Jason's version supports payment tracking.

---

## 18. Number of Packages

### Jason's Version
- Not explicitly mentioned in baseline

### AI Team's Version
```json
"number_of_packages": "3"
```
- Explicit field per line item

**IMPACT:** ⚠️ **LOW** - AI Team captures package count which is useful for shipping.

---

## 19. Invoice Totals Structure

### Jason's Version
```json
"totals": {
  "subtotal": "$476.00",
  "tax": "$0.00",
  "freight": "$50.00",
  "insurance": "$0.00",
  "gross_invoice_value": "$526.00"
}
```
- Nested object
- Multiple total types
- Itemized breakdown

### AI Team's Version
```json
"gross_invoice_value": "$476.00",
"net_invoice_value": "$476.00"
```
- Flat structure
- Only gross and net totals
- No breakdown

**IMPACT:** ⚠️ **MEDIUM** - Jason's version provides more financial detail.

---

## 20. Unit of Measure Handling

### Jason's Version
```json
"unit_of_measure": "EA"  // String, default "EA"
```

### AI Team's Version
```json
"unit": "EA"             // String
```

**IMPACT:** ✅ **MINOR** - Different field names but same purpose.

---

## Critical Alignment Issues Summary

### 🔴 CRITICAL (Must Resolve):
1. **JSON Schema Structure** - Completely different root-level organization
2. **Line Items Array vs Object** - Incompatible data structures
3. **Party Information Structure** - Nested objects vs flat strings
4. **Weight Data Types** - Number vs String with units

### 🟡 MEDIUM (Should Align):
5. **Shipping/Routing Fields** - Jason has more, AI Team has minimal
6. **Additional Data Handling** - AI Team has explicit guidance
7. **Multi-Language Support** - Jason has it, AI Team doesn't
8. **Invoice Totals Structure** - Different nesting and detail level

### 🟢 MINOR (Good Alignment):
9. **Currency Symbol Rules** - Both aligned
10. **SKU Logic** - Both aligned
11. **Completeness Requirements** - Both aligned
12. **Country of Origin Inference** - Both aligned
13. **Fuzzy Matching** - Both have it (AI Team more comprehensive)

---

## Recommendations

### 1. **IMMEDIATE: Resolve Schema Incompatibility**
   - **Option A:** Adopt Jason's flat structure with line_items array
   - **Option B:** Adopt AI Team's invoices_data array wrapper
   - **Option C:** Create transformation layer to convert between formats
   - **Decision needed:** Which schema should be the standard?

### 2. **IMMEDIATE: Standardize Line Items Structure**
   - **Recommendation:** Array structure is more standard and easier to iterate
   - AI Team's object-with-keys approach is unusual
   - Backend code should expect arrays

### 3. **HIGH PRIORITY: Unify Party Information**
   - **Recommendation:** Use Jason's structured approach
   - Nested address components better for database normalization
   - Easier to validate and use programmatically
   - AI Team's flat strings require regex parsing

### 4. **HIGH PRIORITY: Resolve Weight Field Data Types**
   - **Recommendation:** Jason's numeric approach (numbers in kg)
   - Enables calculations without parsing
   - Standardize unit conversion logic in extraction
   - Document conversion rules clearly

### 5. **MEDIUM PRIORITY: Merge Best Practices**
   - Adopt AI Team's comprehensive quality checklist
   - Integrate Jason's three-tier customer system
   - Include Jason's multi-language support
   - Use AI Team's extensive fuzzy matching synonyms

### 6. **MEDIUM PRIORITY: Field Coverage**
   - Include Jason's shipping/routing fields
   - Include AI Team's number_of_packages
   - Include Jason's bank_information
   - Standardize on totals structure (recommend Jason's itemized approach)

### 7. **LOW PRIORITY: Field Naming**
   - Standardize: `unit_of_measure` vs `unit` (recommend full name)
   - Consistency improves maintainability

---

## Proposed Unified Schema

```json
{
  "invoices_data": [
    {
      "invoice_number": "INV-2024-5678",
      "invoice_date": "November 19, 2025",
      "incoterms": "FCA",
      "currency": "USD",
      
      "shipper": {
        "name": "ACME Corp",
        "address": {
          "street": "123 Main St",
          "city": "Austin",
          "state": "TX",
          "postal_code": "78701",
          "country": "USA"
        },
        "contact": {
          "phone": "+1-512-555-0100",
          "email": "info@acme.com"
        }
      },
      
      "consignee": {...},
      "seller": {...},
      "buyer": {...},
      
      "shipping": {
        "port_of_loading": "Houston",
        "port_of_discharge": "Singapore",
        "carrier": "Maersk",
        "vessel_flight": "MSC-123",
        "bill_of_lading": "MAEU123456",
        "container_numbers": ["MSCU1234567", "MSCU7654321"]
      },
      
      "line_items": [
        {
          "item_number": "1",
          "sku": "COMP001",
          "description": "VALVE ASSEMBLY PREMIUM GRADE",
          "hts_code": "8481.80.5090",
          "country_of_origin": "CN",
          "quantity": "100",
          "unit_of_measure": "EA",
          "unit_price": "45.20",
          "value": "$4,520.00",
          "purchase_order": "PO-2024-001",
          "net_weight": 12.5,
          "gross_weight": 13.0,
          "number_of_packages": "3",
          "additional_data": {
            "ref1": "F0100",
            "type_code": "TYPE A"
          }
        }
      ],
      
      "totals": {
        "subtotal": "$476.00",
        "tax": "$0.00",
        "freight": "$50.00",
        "insurance": "$0.00",
        "gross_invoice_value": "$526.00",
        "net_invoice_value": "$526.00"
      },
      
      "bank_information": {
        "bank_name": "Chase Bank",
        "account_number": "123456789",
        "swift_code": "CHASUS33"
      }
    }
  ]
}
```

**This schema combines:**
- AI Team's `invoices_data` array wrapper (supports multiple invoices)
- Jason's structured party information (nested address objects)
- Array-based `line_items` structure (standard practice)
- Jason's numeric weights (enables calculations)
- Jason's comprehensive shipping fields
- AI Team's `number_of_packages`
- Jason's itemized totals
- Jason's bank information
- AI Team's `additional_data` for non-standard fields

---

## Implementation Roadmap

### Phase 1: Critical Alignment (Week 1)
1. Choose schema standard (recommend Proposed Unified Schema above)
2. Update baseline instructions with unified schema
3. Update A79 API integration to match schema
4. Test with sample invoices

### Phase 2: Feature Integration (Week 2)
1. Integrate AI Team's quality checklist
2. Add multi-language support
3. Merge fuzzy matching synonym lists
4. Add comprehensive field coverage

### Phase 3: Customer System (Week 3)
1. Implement three-tier instruction system
2. Create customer configuration templates
3. Test with TARGET001 and BASF001 configs
4. Document customer onboarding process

### Phase 4: Validation & Testing (Week 4)
1. End-to-end testing with real invoices
2. Multi-page document testing
3. Multi-language testing
4. Customer-specific testing
5. Quality checklist validation

---

## Conclusion

Both instruction sets have valuable elements:

**Jason's Strengths:**
- Three-tier customer system (scalable)
- Structured party information (database-ready)
- Comprehensive shipping/logistics fields
- Multi-language support
- Numeric weights (calculation-ready)

**AI Team's Strengths:**
- Comprehensive quality checklist
- Extensive fuzzy matching synonyms
- Clear additional_data guidance
- Multi-invoice support via array wrapper
- Detailed field validation rules

**The unified approach above combines the best of both while resolving critical incompatibilities.**

**Next Steps:**
1. Review this analysis with both teams
2. Make final decisions on schema structure
3. Update instruction documents
4. Test with sample data
5. Roll out unified system

