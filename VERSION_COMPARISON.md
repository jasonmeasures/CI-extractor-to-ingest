# Commercial Invoice PDF Extractor - Version Comparison

You now have **two versions** of the PDF line item extractor tool. Choose the one that fits your needs.

## 📦 What You Have

### Version 1: Direct AI Extraction
**File:** `ci_pdf_extractor.html`

Uses Claude AI directly from the browser to extract line items from PDFs.

**Pros:**
- ✅ Works immediately - no configuration needed
- ✅ Highly accurate AI extraction
- ✅ Handles various invoice formats
- ✅ Simple setup - just open and use

**Cons:**
- ⚠️ Requires internet connection
- ⚠️ Data sent to Anthropic's API (Claude)
- ⚠️ May have usage costs if high volume

**Best for:**
- Quick testing and prototyping
- Low volume processing
- When you don't have A79 API access yet

---

### Version 2: A79 API Integration
**File:** `ci_pdf_extractor_a79.html`

Uses your internal A79 API service for extraction.

**Pros:**
- ✅ Uses your existing A79 infrastructure
- ✅ Data stays within your network
- ✅ Complies with your security requirements
- ✅ Cost controlled by your A79 service
- ✅ Can apply custom business logic

**Cons:**
- ⚠️ Requires A79 API configuration
- ⚠️ Needs valid A79 endpoint URL
- ⚠️ Dependent on A79 service availability

**Best for:**
- Production use at KlearNow
- High volume processing
- When data must stay internal
- Integration with existing systems

---

## 🚀 Quick Start Guide

### Using Version 1 (Direct AI)
1. Double-click `ci_pdf_extractor.html`
2. Select your PDF
3. Click "Extract Line Items"
4. Download CSV

**That's it!** No configuration needed.

### Using Version 2 (A79 API)
1. Double-click `ci_pdf_extractor_a79.html`
2. Click "⚙️ Settings"
3. Enter your A79 API endpoint URL
4. Select your PDF
5. Click "Extract Line Items via A79"
6. Download CSV

**See:** `README_A79_INTEGRATION.md` for detailed setup

---

## 📊 Both Versions Generate the Same CSV Format

The output CSV has these columns (matching your original tool):

- **SKU** - Part number or SKU
- **DESCRIPTION** - Product description
- **HTS** - Harmonized Tariff Schedule code
- **COUNTRY OF ORIGIN** - Country code
- **NO. OF PACKAGE** - Number of packages
- **QUANTITY** - Quantity ordered
- **NET WEIGHT** - Net weight in kg
- **GROSS WEIGHT** - Gross weight in kg
- **UNIT PRICE** - Price per unit
- **VALUE** - Total line value
- **QTY UNIT** - Unit of measure

---

## 🔄 Comparison with Your Original Tool

### Original Tool (app.py)
- Required PDF + TXT file
- Complex file matching logic
- Regex-based text parsing
- Flask backend server needed
- Multiple processing modes

### New Tools (Both Versions)
- ✅ Only needs PDF
- ✅ No text file required
- ✅ AI-powered extraction (more accurate)
- ✅ Single HTML file (no server needed)
- ✅ Simple, streamlined workflow
- ✅ Visual preview of data
- ✅ Summary statistics

---

## 💡 Recommended Workflow

### For Development/Testing
Use **Version 1** (ci_pdf_extractor.html)
- Fast iteration
- No setup required
- Test different invoice formats

### For Production at KlearNow
Use **Version 2** (ci_pdf_extractor_a79.html)
- Configure with your A79 API
- Meets security requirements
- Integrates with existing systems
- Scalable for high volume

---

## 🛠️ Customization

Both tools are single HTML files that you can easily customize:

### Change Colors/Branding
Edit the Tailwind CSS classes in the HTML

### Modify Field Mapping
Update the `normalizedItems` mapping in the JavaScript

### Add Custom Fields
Extend the CSV headers and data extraction logic

### Integration
Embed in your existing web application or SharePoint site

---

## 📁 File Summary

| File | Size | Description |
|------|------|-------------|
| ci_pdf_extractor.html | 19KB | Direct AI version |
| ci_pdf_extractor_a79.html | 22KB | A79 API version |
| README_PDF_EXTRACTOR.md | 4.2KB | Guide for direct AI version |
| README_A79_INTEGRATION.md | 6.2KB | A79 configuration guide |

---

## ✅ Next Steps

1. **Test Version 1** with a sample invoice to see it work immediately
2. **Configure Version 2** with your A79 API endpoint
3. **Compare results** from both versions
4. **Choose the version** that fits your production needs
5. **Deploy** to your team (just share the HTML file!)

---

## 🤝 Support

For questions about:
- **Direct AI version** → See README_PDF_EXTRACTOR.md
- **A79 integration** → See README_A79_INTEGRATION.md
- **A79 API issues** → Contact your A79 service administrator
- **Feature requests** → Let me know what else you need!

---

**Built for KlearNow Customs Processing**  
**Version:** 1.0  
**Date:** January 16, 2025
