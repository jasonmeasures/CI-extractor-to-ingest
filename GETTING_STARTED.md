# A79 Invoice Extractor - Quick Start Guide

## 🎯 What You Have

A production-ready web application for extracting structured data from commercial invoices using A79's API with a **hybrid baseline** that combines:

- ✅ **Comprehensive field coverage** (parties, routing, financials)
- ✅ **Laser-focused line items** with production-tested precision
- ✅ **Smart currency handling** (remove from inputs, preserve in outputs)
- ✅ **String data types** (preserves HTS leading zeros)
- ✅ **Completeness enforcement** (extracts ALL items from ALL pages)
- ✅ **Three-tier instruction system** (baseline + customer + custom)

---

## 🚀 Quick Setup (5 Minutes)

### 1. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (in new terminal)
cd frontend
npm install
```

### 2. Add Your A79 API Key

```bash
# Edit the environment file or update backend/services/a79Service.js
# The API key is currently configured in backend/services/a79Service.js
# Or set environment variable:
export A79_API_KEY=your_actual_api_key_here
```

### 3. Start Backend

```bash
cd backend
npm run dev
```

**Backend running at:** http://localhost:7001

### 4. Start Frontend (New Terminal)

```bash
cd frontend
npm run dev
```

**Frontend opens at:** http://localhost:3001

---

## 📋 How to Use

### Basic Extraction

1. **Select Document Type**: Commercial Invoice
2. **Select Customer** (optional): TARGET001, BASF001, or none
3. **Upload PDF**: Your commercial invoice
4. **Add Custom Instructions** (optional): Any specific requirements
5. **Click "Extract Data"**

### Example Result

```json
{
  "invoice_number": "INV-2024-5678",
  "invoice_date": "November 19, 2025",
  
  "shipper": {
    "name": "ABC Manufacturing Ltd",
    "address": {
      "city": "Guangzhou",
      "country": "China"
    }
  },
  
  "line_items": [
    {
      "item_number": "1",
      "sku": "T15-B28450",
      "description": "VALVE ASSEMBLY PREMIUM GRADE",
      "hts_code": "8481.80.5090",
      "quantity": "5",
      "unit_price": "45.20",
      "value": "$226.00"
    }
  ],
  
  "totals": {
    "subtotal": "$476.00",
    "gross_invoice_value": "$526.00"
  }
}
```

---

## 🎨 The Hybrid Baseline

### What Makes It "Hybrid"?

**Comprehensive Coverage** (from generic baseline):
- Full shipper/consignee information
- Complete routing details
- Payment terms and bank info
- Financial breakdown

**+**

**Laser-Focused Precision** (from your production instructions):
- Completeness enforcement ("EXTRACT EVERY LINE ITEM")
- String data types (preserves HTS codes)
- Smart currency handling
- Fuzzy matching (10+ synonyms per field)
- Quality checklist

**=**

**One Extraction for All Use Cases**

---

## 💡 Three-Tier Instruction System

```
┌─────────────────────────────────┐
│   Baseline Instructions         │
│   (Hybrid: Comprehensive +      │
│    Precise line items)           │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│   Customer Instructions         │
│   (TARGET001: additional        │
│    fields, special rules)        │
└──────────┬──────────────────────┘
           │
           ▼
┌─────────────────────────────────┐
│   Custom Instructions           │
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

## 🎯 Use Cases Supported

### 1. Customs Clearance ✅
**What you get:**
- All line items with HTS codes
- Country of origin per item
- Quantities and values
- Shipper/consignee for CBP forms

### 2. Accounts Payable ✅
**What you get:**
- Invoice totals
- Payment terms
- Bank information
- Line item breakdown
- Vendor information

### 3. Logistics Coordination ✅
**What you get:**
- Routing information
- Weights and packages
- Port details
- Shipper/consignee addresses

### 4. Financial Analysis ✅
**What you get:**
- Cost breakdowns
- Freight and insurance
- Currency information
- Line item costs

---

## 📊 Key Features

### Currency Symbol Rules

| Field | Symbol Handling | Example |
|-------|----------------|---------|
| `quantity` | Remove | "100" not "100 PCS" |
| `unit_price` | Remove | "45.20" not "$45.20" |
| `value` | **Keep** | "$226.00" ✅ |
| `subtotal` | **Keep** | "$476.00" ✅ |
| `gross_invoice_value` | **Keep** | "$541.00" ✅ |

### Data Types: All Strings

```json
{
  "item_number": "1",           // String, not number
  "quantity": "100",            // String, not number
  "unit_price": "45.20",        // String, not number
  "hts_code": "0123.45.6789"   // Preserves leading zeros!
}
```

### Completeness Enforcement

```
⚠️ EXTRACT EVERY SINGLE LINE ITEM FROM ALL PAGES
- DO NOT STOP after a few items
- If invoice has 50 items, extract all 50
- Process ALL text from ALL pages
```

### Fuzzy Matching

Recognizes synonyms automatically:
- Part Number = P/N = SKU = Material # = Product Code
- Quantity = Qty = QTY = Shipped Qty = No. of units
- Unit Price = U/P = Price/Unit = Rate = Unit Cost

---

## 👥 Customer Management

### Existing Customers

**TARGET001** (Target Corporation):
- Additional fields: Target PO, Vendor Number, DC Number
- Special rules: Extract Target PO separately
- Field mappings: Vendor ID → Vendor Number

**BASF001** (BASF Corporation):
- Additional fields: Material Number, UN Number, Batch/Lot
- Special rules: Chemical safety requirements
- Focus: Hazmat and traceability data

### Adding New Customer

**Via JSON File:**
```json
{
  "customer_number": "CUST001",
  "name": "New Customer Corp",
  "additional_fields": [
    "Custom Field 1",
    "Custom Field 2"
  ],
  "special_rules": [
    "Always extract batch number",
    "Validate totals match line items"
  ],
  "field_mappings": {
    "Old Name": "New Name"
  },
  "notes": "Optional notes about this customer"
}
```

Save as: `backend/config/customers/CUST001.json`

---

## 🔄 API Endpoints

### Extract Document
```bash
POST /api/extract
```

**Parameters:**
- `file`: PDF file (multipart/form-data)
- `document`: Base64 encoded PDF (JSON)
- `document_type`: "commercial_invoice"
- `customer_number`: "TARGET001" (optional)
- `custom_instructions`: "Extract warehouse code" (optional)

**Example:**
```bash
curl -X POST http://localhost:7001/api/extract \
  -F "file=@invoice.pdf" \
  -F "document_type=commercial_invoice" \
  -F "customer_number=TARGET001" \
  -F "custom_instructions=Extract warehouse location"
```

### Get Customer Config
```bash
GET /api/customers/:customerNumber
```

**Example:**
```bash
curl http://localhost:7001/api/customers/TARGET001
```

### List All Customers
```bash
GET /api/customers
```

**Example:**
```bash
curl http://localhost:7001/api/customers
```

---

## 🧪 Testing

### Manual Testing Checklist

**Single-page invoice (5 items):**
- [ ] All 5 items extracted
- [ ] Shipper/consignee present
- [ ] Totals calculated
- [ ] Currency symbols correct

**Multi-page invoice (25+ items):**
- [ ] ALL items from ALL pages
- [ ] No early stopping
- [ ] Sequential numbering

**HTS codes:**
- [ ] Leading zeros preserved
- [ ] Dots preserved
- [ ] Stored as strings

**Currency handling:**
- [ ] unit_price has no $
- [ ] value has $
- [ ] All totals have $

---

## 🐛 Troubleshooting

### Problem: Missing line items

**Possible causes:**
- Multi-page table
- Non-standard formatting
- Early stopping

**Solutions:**
1. Check if all pages were processed
2. Add custom instruction: "This is a 5-page invoice with 30 items total"
3. Review extraction log for page boundaries

### Problem: HTS code losing leading zeros

**Check:**
```json
"hts_code": "0123.45.6789"  ✅ Correct (string)
"hts_code": 123456789        ❌ Wrong (number)
```

**Solution:** All fields should be strings in hybrid baseline

### Problem: Currency symbols missing

**Check field type:**
- Input fields (quantity, unit_price) should NOT have $
- Output fields (value, totals) SHOULD have $

### Problem: Customer config not working

**Common mistakes:**
1. Duplicate baseline fields in customer config
2. Customer number mismatch
3. JSON syntax error

**Check:**
```bash
# Validate JSON syntax
cat backend/config/customers/CUST001.json | node -e "console.log(JSON.stringify(JSON.parse(require('fs').readFileSync(0)), null, 2))"
```

---

## 🚀 Production Deployment

### Before Going Live

1. **Test with real invoices** (20+ samples)
2. **Validate data quality** (95%+ accuracy target)
3. **Create customer configs** (for top 5 customers)
4. **Set up monitoring** (extraction success rate, timing)
5. **Configure backups** (results directory)

### Environment Variables

```bash
# Required
A79_API_KEY=your_api_key

# Optional
A79_API_ENDPOINT=https://klearnow.prod.a79.ai/api/v1/public/workflow/run
A79_WORKFLOW_ID=your_workflow_id
A79_AGENT_NAME=Unified PDF Parser
PORT=7001
NODE_ENV=production
```

---

## 📚 Documentation Files

### Start Here
1. **This file** - Quick start guide
2. **QUICK_START.md** - Current setup guide
3. **README.md** - Comprehensive project documentation

### A79 Integration
4. **A79_SYSTEM_PROMPT.md** - A79 system prompt
5. **A79_ENDPOINTS.md** - Endpoint configuration
6. **README_A79_INTEGRATION.md** - Integration details

---

## 🎓 Common Workflows

### Workflow 1: Extract Invoice for Customs

```
1. Upload commercial invoice PDF
2. Select "Commercial Invoice" type
3. Select customer if applicable (e.g., TARGET001)
4. Click "Extract Data"
5. Review line items:
   ✓ All items present?
   ✓ HTS codes correct?
   ✓ Values match?
6. Use extracted data for CBP 7501 form
```

### Workflow 2: Add New Customer

```
1. Collect 3-5 sample invoices from customer
2. Extract with baseline only (no customer selected)
3. Review results - identify missing/unique fields
4. Create customer config JSON file:
   - Add customer number and name
   - List additional fields needed
   - Add special handling rules
   - Map field names if different
5. Save as backend/config/customers/CUST001.json
6. Test with sample invoices
7. Refine as needed
```

### Workflow 3: Handle Complex Invoice

```
1. Upload invoice
2. Extract with baseline + customer
3. Review results
4. If something missing:
   - Add custom instruction: "Also extract [field]"
   - Re-extract with custom instructions
5. If pattern repeats:
   - Add to customer config permanently
6. Export results
```

---

## ✅ Summary

You now have a **production-ready invoice extractor** with:

- ✅ Hybrid baseline (comprehensive + precise)
- ✅ Three-tier instruction system
- ✅ Customer configuration management
- ✅ Smart currency and data type handling
- ✅ Built-in quality assurance
- ✅ Modern React UI
- ✅ Complete API

**One extraction serves:**
- Customs clearance
- Accounts payable
- Logistics coordination
- Financial analysis

**Get started:** Upload an invoice and see the results!

---

**Built for KlearNow Operations Team**  
*Making customs document processing intelligent and scalable*

Version: 2.0 (Hybrid Baseline)  
Last Updated: November 2024




