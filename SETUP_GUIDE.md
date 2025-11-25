# A79 Integration - Complete Setup Guide

## 📦 What You Have

You now have everything needed to set up commercial invoice PDF line item extraction with A79.

## 🗂️ File Overview

### 1. Frontend Tool (Pick One)
- **ci_pdf_extractor_a79.html** - Production tool using A79 API
- **ci_pdf_extractor.html** - Fallback tool using direct AI (for testing)

### 2. A79 Configuration Files
- **A79_SYSTEM_PROMPT.md** - System prompt to configure your A79 API
- **A79_JSON_SCHEMA.md** - JSON schema specification for A79 responses

### 3. Documentation
- **README_A79_INTEGRATION.md** - Integration setup guide
- **VERSION_COMPARISON.md** - Which version to use and why

---

## 🚀 Setup Checklist

### Step 1: Configure Your A79 API

Use **A79_SYSTEM_PROMPT.md** to configure your A79 service:

```
1. Open your A79 API configuration
2. Copy the system prompt from A79_SYSTEM_PROMPT.md
3. Set it as the extraction prompt for commercial invoices
4. Test with a sample invoice
```

**What this does:**
- Tells A79 exactly how to format its JSON response
- Ensures all required fields are included
- Sets default values for missing data
- Validates data before returning

### Step 2: Validate A79 Output

Use **A79_JSON_SCHEMA.md** to validate responses:

```
1. Send a test invoice to your A79 API
2. Check the response against the JSON schema
3. Verify all fields match the specification
4. Confirm calculations are correct (quantity × unit_price = total_value)
```

**What to check:**
- ✅ All line items have required fields
- ✅ Numbers are actual numbers (not strings)
- ✅ Country codes are 2 letters or "N/A"
- ✅ HTS codes are 10 digits or "N/A"
- ✅ Total value calculations are correct

### Step 3: Configure Frontend Tool

Open **ci_pdf_extractor_a79.html**:

```
1. Click ⚙️ Settings button
2. Enter your A79 API endpoint URL
3. Save the configuration
4. Test with a sample PDF
```

### Step 4: Test End-to-End

```
1. Select a commercial invoice PDF
2. Click "Extract Line Items via A79"
3. Review the extracted data in the table
4. Verify summary statistics are correct
5. Download the CSV
6. Open in Excel/Sheets to verify format
```

---

## 📋 A79 API Response Format

### Your A79 API Should Return:

```json
{
  "line_items": [
    {
      "sku": "COMP001",
      "description": "Computer Processor",
      "hts_code": "8471.30.0100",
      "country_of_origin": "US",
      "package_count": "2",
      "quantity": 50,
      "net_weight": 25.5,
      "gross_weight": 28.0,
      "unit_price": 850.00,
      "total_value": 42500.00,
      "unit_of_measure": "EA"
    }
  ],
  "metadata": {
    "total_items": 1,
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-01-15",
    "currency": "USD"
  }
}
```

### The Frontend Tool Converts This To CSV:

```
SKU,DESCRIPTION,HTS,COUNTRY OF ORIGIN,NO. OF PACKAGE,QUANTITY,NET WEIGHT,GROSS WEIGHT,UNIT PRICE,VALUE,QTY UNIT
COMP001,Computer Processor,8471.30.0100,US,2,50,25.5,28.0,850.00,42500.00,EA
```

---

## 🔧 Customization Points

### If Your A79 Uses Different Field Names

Edit the frontend tool's field mapping:

```javascript
// Find this section in ci_pdf_extractor_a79.html
const normalizedItems = items.map((item, index) => ({
    SKU: item.sku || item.part_number || item.SKU || `ITEM-${index + 1}`,
    // Add your custom field mappings here
}));
```

### If Your A79 Returns Different Structure

Edit the response parsing:

```javascript
// Find this section in ci_pdf_extractor_a79.html
let items;
if (data.line_items) {
    items = data.line_items;
} else if (data.results && data.results.items) {
    items = data.results.items; // Add your structure here
}
```

### If You Need Authentication

Update the API request headers:

```javascript
// Find this section in ci_pdf_extractor_a79.html
headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN",
    "X-API-Key": "YOUR_KEY"
}
```

---

## 🎯 Common Use Cases

### Use Case 1: Internal A79 Service
```
A79 Endpoint: http://internal-a79.klearnow.local:8080/extract
Auth: None (internal network)
Timeout: 30 seconds
```

### Use Case 2: Cloud A79 Service
```
A79 Endpoint: https://api.a79.klearnow.com/v1/extract-invoice
Auth: Bearer token
Timeout: 60 seconds
```

### Use Case 3: Proxy Through Backend
```
A79 Endpoint: https://backend.klearnow.com/api/a79-proxy
Auth: Session cookie (handled by backend)
Timeout: 60 seconds
```

---

## 🐛 Troubleshooting

### "A79 API request failed: 401"
**Problem:** Authentication failed  
**Solution:** Check API key/token in configuration

### "Unable to parse A79 response format"
**Problem:** A79 returns different JSON structure  
**Solution:** Update response parsing in frontend (see Customization section)

### "No line items found in A79 response"
**Problem:** A79 returned empty array  
**Solution:** 
- Check A79 logs for errors
- Verify PDF is readable
- Confirm system prompt is configured

### "total_value doesn't match quantity × unit_price"
**Problem:** Calculation error in A79 response  
**Solution:** Update A79 system prompt to ensure correct calculations

---

## 📊 Data Flow

```
1. User uploads PDF → Frontend Tool
                       ↓
2. PDF converted to base64
                       ↓
3. Sent to A79 API with extraction instructions
                       ↓
4. A79 extracts line items (using system prompt)
                       ↓
5. A79 returns JSON (validated against schema)
                       ↓
6. Frontend maps fields to CSV format
                       ↓
7. User sees table preview
                       ↓
8. User downloads CSV file
```

---

## ✅ Testing Checklist

- [ ] A79 API is accessible from frontend
- [ ] A79 system prompt is configured
- [ ] Sample invoice extracts correctly
- [ ] All required fields are present
- [ ] Numbers are actual numbers (not strings)
- [ ] Calculations are correct
- [ ] Country codes are 2 letters or "N/A"
- [ ] HTS codes are 10 digits or "N/A"
- [ ] CSV downloads successfully
- [ ] CSV opens correctly in Excel
- [ ] All 11 columns are present
- [ ] Data matches original PDF

---

## 📞 Support Resources

### For A79 Configuration Issues
- See: **A79_SYSTEM_PROMPT.md**
- Check A79 service logs
- Contact A79 administrator

### For JSON Format Issues
- See: **A79_JSON_SCHEMA.md**
- Use online JSON validator
- Compare with example responses

### For Frontend Integration Issues
- See: **README_A79_INTEGRATION.md**
- Check browser console for errors
- Test with curl/Postman first

### For General Questions
- See: **VERSION_COMPARISON.md**
- Review this quick reference guide

---

## 🎉 Quick Wins

Once configured, you can:

✅ **Upload a PDF** → Get CSV in 5-10 seconds  
✅ **No text files needed** → Just the PDF  
✅ **Visual preview** → See data before downloading  
✅ **Accurate extraction** → AI-powered via A79  
✅ **Standard format** → Same 11 columns every time  
✅ **Batch processing** → Upload multiple PDFs (future enhancement)

---

## 📈 Next Steps

1. **Deploy to team** → Share the HTML file
2. **Set up monitoring** → Track A79 API usage
3. **Gather feedback** → Improve extraction rules
4. **Add features** → Batch upload, history, etc.

---

**Built for KlearNow** - Streamlined customs documentation  
**Version:** 1.0 with A79 Integration  
**Last Updated:** January 16, 2025
