# Commercial Invoice PDF Extractor - A79 API Integration

This version of the tool uses your A79 API for extraction instead of direct AI processing.

## Quick Setup

1. **Open the Settings panel** by clicking the ⚙️ Settings button
2. **Enter your A79 API endpoint URL**
3. **Upload your PDF and extract**

## A79 API Configuration

### Required Configuration

The tool needs to know your A79 API endpoint. Update this in the settings:

```
A79 API Endpoint: https://your-a79-api.com/api/extract-invoice
```

### API Request Format

The tool sends this payload to your A79 API:

```json
{
  "document": "base64_encoded_pdf_data",
  "document_type": "commercial_invoice",
  "extract_fields": [
    "line_items",
    "sku",
    "description",
    "hts_code",
    "country_of_origin",
    "quantity",
    "unit_price",
    "total_value",
    "weight",
    "unit_of_measure"
  ],
  "format": "line_items"
}
```

### Expected A79 Response Format

The A79 API should return JSON in one of these formats:

**Option 1: Simple Array**
```json
[
  {
    "sku": "COMP001",
    "description": "Computer Processor",
    "hts_code": "8471.30.0100",
    "country_of_origin": "US",
    "quantity": 50,
    "unit_price": 850.00,
    "total_value": 42500.00,
    "net_weight": 25.5,
    "gross_weight": 25.5,
    "unit_of_measure": "EA"
  }
]
```

**Option 2: Wrapped Response**
```json
{
  "line_items": [
    {
      "sku": "COMP001",
      "description": "Computer Processor",
      ...
    }
  ]
}
```

**Option 3: Nested Data**
```json
{
  "data": {
    "line_items": [
      {
        "sku": "COMP001",
        ...
      }
    ]
  }
}
```

### Field Mapping

The tool automatically maps A79 fields to the required CSV format:

| CSV Column | A79 Fields (tries in order) |
|------------|------------------------------|
| SKU | `sku`, `part_number`, `SKU` |
| DESCRIPTION | `description`, `DESCRIPTION` |
| HTS | `hts_code`, `hts`, `HTS` |
| COUNTRY OF ORIGIN | `country_of_origin`, `origin_country`, `COUNTRY_OF_ORIGIN` |
| NO. OF PACKAGE | `package_count`, `packages`, `NO_OF_PACKAGE` |
| QUANTITY | `quantity`, `qty`, `QUANTITY` |
| NET WEIGHT | `net_weight`, `weight`, `NET_WEIGHT` |
| GROSS WEIGHT | `gross_weight`, `weight`, `GROSS_WEIGHT` |
| UNIT PRICE | `unit_price`, `price`, `UNIT_PRICE` |
| VALUE | `total_value`, `value`, `VALUE` |
| QTY UNIT | `unit_of_measure`, `uom`, `QTY_UNIT` |

## Customizing for Your A79 API

If your A79 API uses different field names or structure, you can easily modify the code:

### 1. Update the Request Payload

Find this section in the HTML file:

```javascript
body: JSON.stringify({
    document: base64Data,
    document_type: "commercial_invoice",
    // Customize this to match your A79 API expectations
    extract_fields: [...]
})
```

### 2. Update the Response Parsing

Find this section:

```javascript
// Parse A79 response
let items;
if (data.line_items) {
    items = data.line_items;
} else if (data.data && data.data.line_items) {
    items = data.data.line_items;
}
// Add your custom parsing logic here
```

### 3. Update Field Mapping

Find the `normalizedItems` mapping:

```javascript
const normalizedItems = items.map((item, index) => ({
    SKU: item.sku || item.part_number || item.SKU || `ITEM-${index + 1}`,
    // Update these to match your A79 field names
    ...
}));
```

## Authentication

If your A79 API requires authentication:

### Option 1: API Key in Header

Update the `A79_CONFIG` at the top of the file:

```javascript
const A79_CONFIG = {
    endpoint: 'https://your-a79-api.com/api/extract-invoice',
    apiKey: 'your-actual-api-key-here',
    timeout: 60000
};
```

### Option 2: Custom Headers

Modify the fetch request:

```javascript
headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer YOUR_TOKEN",
    "X-API-Key": "YOUR_API_KEY",
    // Add any custom headers your A79 API needs
}
```

## Testing Your A79 Integration

1. **Test with a sample invoice**
   - Use a known invoice with line items
   - Verify all fields are extracted correctly

2. **Check field mapping**
   - Review the extracted data table
   - Ensure all columns have correct data

3. **Verify CSV output**
   - Download the CSV
   - Open in Excel/Sheets
   - Confirm format matches requirements

## Troubleshooting

### "A79 API request failed: 401"
- Check your API key is correct
- Verify authentication headers

### "A79 API request failed: 404"
- Verify the endpoint URL is correct
- Check if the API is accessible

### "Unable to parse A79 response format"
- Your A79 API returns a different format
- Update the response parsing logic (see customization section)

### "No line items found in A79 response"
- A79 couldn't extract data from the PDF
- Check if PDF is readable/not encrypted
- Verify A79 service is working correctly

### Processing takes too long
- A79 API might be slow or timing out
- Check network connectivity
- Verify A79 service health

## Example Integration with Common A79 Setups

### Setup 1: REST API with Bearer Token

```javascript
const A79_CONFIG = {
    endpoint: 'https://api.a79.yourcompany.com/v1/extract',
    apiKey: 'sk-a79-xxxxxxxxxxxx',
    timeout: 60000
};
```

### Setup 2: Internal Service

```javascript
const A79_CONFIG = {
    endpoint: 'http://internal-a79-service.local:8080/extract',
    apiKey: 'internal-service-key',
    timeout: 30000
};
```

### Setup 3: Proxy Through Your Backend

```javascript
const A79_CONFIG = {
    endpoint: 'https://yourbackend.com/api/proxy-a79',
    apiKey: '', // Handled by your backend
    timeout: 60000
};
```

## Benefits of A79 Integration

✅ **Consistent Processing** - Use your existing A79 infrastructure
✅ **Custom Logic** - A79 can apply your business rules
✅ **Security** - Keep documents within your network
✅ **Compliance** - Meet your data handling requirements
✅ **Cost Control** - Use your existing A79 service

## Support

For A79 API issues:
- Check your A79 API documentation
- Verify service health/status
- Review API logs for errors
- Contact your A79 service administrator

For tool issues:
- Check browser console for errors
- Verify PDF is valid and not corrupted
- Test with a simple invoice first

---

**Version:** 1.0 with A79 Integration  
**Last Updated:** 2025-01-16  
**For:** KlearNow Customs Processing
