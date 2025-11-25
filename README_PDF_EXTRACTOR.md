# Commercial Invoice PDF Line Item Extractor

A simplified, single-file tool for extracting line items from commercial invoice PDFs and generating CSV files.

## What This Tool Does

This tool takes a commercial invoice PDF and automatically:
1. Extracts ALL line items from the PDF using AI
2. Structures the data into the standard format
3. Generates a downloadable CSV with these columns:
   - SKU
   - DESCRIPTION
   - HTS
   - COUNTRY OF ORIGIN
   - NO. OF PACKAGE
   - QUANTITY
   - NET WEIGHT
   - GROSS WEIGHT
   - UNIT PRICE
   - VALUE
   - QTY UNIT

## Key Differences from Original Tool

**Original Tool:**
- Required both PDF AND text file
- Complex file matching logic
- Regex-based text parsing
- Multiple processing modes

**New Simplified Tool:**
- Only needs the PDF file
- No text file or matching required
- AI-powered extraction (more accurate)
- Single, straightforward workflow

## How to Use

1. **Open the HTML file** in your browser:
   - Just double-click `ci_pdf_extractor.html`
   - Works in Chrome, Firefox, Safari, Edge

2. **Upload your commercial invoice PDF:**
   - Click "Choose File"
   - Select your commercial invoice PDF

3. **Extract the data:**
   - Click "Extract Line Items"
   - Wait while AI processes the document (usually 5-15 seconds)

4. **Review the results:**
   - View extracted line items in the table
   - Check the summary statistics

5. **Download the CSV:**
   - Click "Download CSV File"
   - Save to your desired location

## Technical Details

### AI-Powered Extraction
The tool uses Claude AI to intelligently extract line items from PDFs. This means:
- No need to match specific formats
- Works with various invoice layouts
- Handles complex tables and nested data
- More accurate than regex parsing

### Data Fields
For each line item extracted:
- **SKU**: Part number (or auto-generated ITEM-1, ITEM-2, etc. if not present)
- **DESCRIPTION**: Product description
- **HTS**: Harmonized Tariff Schedule code (if available)
- **COUNTRY OF ORIGIN**: Country code
- **NO. OF PACKAGE**: Number of packages (if available)
- **QUANTITY**: Quantity ordered
- **NET WEIGHT**: Net weight in kg
- **GROSS WEIGHT**: Gross weight in kg
- **UNIT PRICE**: Price per unit
- **VALUE**: Total line value (Quantity × Unit Price)
- **QTY UNIT**: Unit of measure (EA, PCS, KG, etc.)

### Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection (for AI processing)
- PDF file of commercial invoice

### File Size Limits
- Maximum PDF size: Approximately 10MB
- Most commercial invoices are well under this limit

## Troubleshooting

### "Please select a valid PDF file"
- Make sure you're uploading a PDF file, not a different format
- Check that the file isn't corrupted

### "No line items found"
- The PDF might not contain a standard invoice structure
- Try a different PDF or check if it's an image-based PDF

### Processing takes too long
- Large PDFs (many pages) take longer to process
- Wait up to 30 seconds for complex documents
- Check your internet connection

### CSV doesn't download
- Check your browser's download settings
- Make sure pop-ups aren't blocked
- Try a different browser

## Example Use Cases

### Customs Clearance
Process commercial invoices quickly to prepare customs documentation with accurate line-item details.

### Import Documentation
Extract detailed product information for import compliance and record-keeping.

### Data Entry Automation
Eliminate manual data entry from PDF invoices into your systems.

### Audit and Verification
Quickly extract and review invoice line items for audit purposes.

## Privacy & Security

- All processing happens in your browser
- PDF files are converted to base64 and sent to Claude AI for processing
- No files are stored on any server
- No data is saved or logged

## Support

For issues or questions:
- Verify you're using a modern browser
- Check that the PDF is readable (not a scanned image without OCR)
- Ensure you have an active internet connection

## Version History

**v1.0** (2025-01-16)
- Initial release
- Single-file React application
- AI-powered PDF extraction
- CSV export functionality
- Summary statistics
- Responsive design

---

**Built for KlearNow** - Simplified customs documentation processing
