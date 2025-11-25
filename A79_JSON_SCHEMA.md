# A79 API Response JSON Schema

## JSON Schema for Commercial Invoice Line Items

Use this schema to validate A79 API responses or configure API contracts.

### JSON Schema (Draft 7)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://klearnow.com/schemas/commercial-invoice-line-items.json",
  "title": "Commercial Invoice Line Items",
  "description": "Schema for commercial invoice line item extraction response",
  "type": "object",
  "required": ["line_items"],
  "properties": {
    "line_items": {
      "type": "array",
      "description": "Array of line items extracted from the commercial invoice",
      "minItems": 0,
      "items": {
        "$ref": "#/definitions/LineItem"
      }
    },
    "metadata": {
      "$ref": "#/definitions/Metadata"
    },
    "error": {
      "type": "string",
      "description": "Error message if extraction failed"
    }
  },
  "definitions": {
    "LineItem": {
      "type": "object",
      "required": [
        "sku",
        "description",
        "quantity",
        "unit_price",
        "total_value",
        "unit_of_measure"
      ],
      "properties": {
        "sku": {
          "type": "string",
          "description": "Part number, SKU, or item code (use ITEM-N if not available)",
          "minLength": 1,
          "examples": ["COMP001", "MEM002", "ITEM-1"]
        },
        "description": {
          "type": "string",
          "description": "Product description",
          "minLength": 1,
          "examples": ["Computer Processor Intel Core i7", "Memory Module DDR4 16GB"]
        },
        "hts_code": {
          "type": "string",
          "description": "HTS/HS tariff code (10 digits or N/A)",
          "pattern": "^(\\d{10}|N/A)$",
          "default": "N/A",
          "examples": ["8471.30.0100", "8471.30.0150", "N/A"]
        },
        "country_of_origin": {
          "type": "string",
          "description": "Country of origin (2-letter ISO code or N/A)",
          "pattern": "^([A-Z]{2}|N/A)$",
          "default": "N/A",
          "examples": ["US", "MX", "CN", "CA", "N/A"]
        },
        "package_count": {
          "type": "string",
          "description": "Number of packages (can be empty)",
          "default": "",
          "examples": ["1", "5", "10", ""]
        },
        "quantity": {
          "type": "number",
          "description": "Quantity of items",
          "minimum": 0,
          "exclusiveMinimum": true,
          "examples": [1, 50, 100, 250]
        },
        "net_weight": {
          "type": "number",
          "description": "Net weight in kilograms",
          "minimum": 0,
          "default": 0,
          "examples": [0, 25.5, 8.2, 100.0]
        },
        "gross_weight": {
          "type": "number",
          "description": "Gross weight in kilograms",
          "minimum": 0,
          "default": 0,
          "examples": [0, 28.0, 9.5, 105.0]
        },
        "unit_price": {
          "type": "number",
          "description": "Price per unit",
          "minimum": 0,
          "examples": [0, 850.00, 125.00, 2500.00]
        },
        "total_value": {
          "type": "number",
          "description": "Total value (quantity × unit_price)",
          "minimum": 0,
          "examples": [0, 42500.00, 12500.00, 50000.00]
        },
        "unit_of_measure": {
          "type": "string",
          "description": "Unit of measurement",
          "enum": ["EA", "PCS", "KG", "LB", "UNIT", "BOX", "CTN", "SET", "PR", "DZ"],
          "default": "EA",
          "examples": ["EA", "PCS", "KG", "UNIT"]
        }
      }
    },
    "Metadata": {
      "type": "object",
      "description": "Additional invoice metadata",
      "properties": {
        "total_items": {
          "type": "integer",
          "description": "Total number of line items",
          "minimum": 0,
          "examples": [0, 5, 10, 25]
        },
        "invoice_number": {
          "type": "string",
          "description": "Invoice number from document",
          "examples": ["INV-2024-001", "074M-22005749"]
        },
        "invoice_date": {
          "type": "string",
          "description": "Invoice date (ISO 8601 or various formats)",
          "examples": ["2024-01-15", "21Oct/2025", "01/15/2024"]
        },
        "currency": {
          "type": "string",
          "description": "Currency code (ISO 4217)",
          "pattern": "^[A-Z]{3}$",
          "examples": ["USD", "EUR", "CAD", "MXN"]
        },
        "total_invoice_value": {
          "type": "number",
          "description": "Total invoice value",
          "minimum": 0
        }
      }
    }
  }
}
```

---

## Example Valid Responses

### Full Response Example

```json
{
  "line_items": [
    {
      "sku": "COMP001",
      "description": "Computer Processor Intel Core i7",
      "hts_code": "8471.30.0100",
      "country_of_origin": "US",
      "package_count": "2",
      "quantity": 50,
      "net_weight": 25.5,
      "gross_weight": 28.0,
      "unit_price": 850.00,
      "total_value": 42500.00,
      "unit_of_measure": "EA"
    },
    {
      "sku": "MEM002",
      "description": "Memory Module DDR4 16GB",
      "hts_code": "8471.30.0150",
      "country_of_origin": "US",
      "package_count": "5",
      "quantity": 100,
      "net_weight": 8.2,
      "gross_weight": 9.5,
      "unit_price": 125.00,
      "total_value": 12500.00,
      "unit_of_measure": "EA"
    }
  ],
  "metadata": {
    "total_items": 2,
    "invoice_number": "INV-2024-001",
    "invoice_date": "2024-01-15",
    "currency": "USD",
    "total_invoice_value": 55000.00
  }
}
```

### Minimal Response Example

```json
{
  "line_items": [
    {
      "sku": "ITEM-1",
      "description": "Electronic Components",
      "hts_code": "N/A",
      "country_of_origin": "N/A",
      "package_count": "",
      "quantity": 1,
      "net_weight": 0,
      "gross_weight": 0,
      "unit_price": 5000.00,
      "total_value": 5000.00,
      "unit_of_measure": "EA"
    }
  ]
}
```

### Error Response Example

```json
{
  "line_items": [],
  "error": "Document does not appear to be a commercial invoice"
}
```

---

## TypeScript Interface

For TypeScript projects, use this interface:

```typescript
interface CommercialInvoiceResponse {
  line_items: LineItem[];
  metadata?: Metadata;
  error?: string;
}

interface LineItem {
  sku: string;
  description: string;
  hts_code: string;
  country_of_origin: string;
  package_count: string;
  quantity: number;
  net_weight: number;
  gross_weight: number;
  unit_price: number;
  total_value: number;
  unit_of_measure: UnitOfMeasure;
}

type UnitOfMeasure = 
  | "EA"   // Each
  | "PCS"  // Pieces
  | "KG"   // Kilograms
  | "LB"   // Pounds
  | "UNIT" // Unit
  | "BOX"  // Box
  | "CTN"  // Carton
  | "SET"  // Set
  | "PR"   // Pair
  | "DZ";  // Dozen

interface Metadata {
  total_items?: number;
  invoice_number?: string;
  invoice_date?: string;
  currency?: string;
  total_invoice_value?: number;
}
```

---

## Python Pydantic Model

For Python projects using Pydantic:

```python
from typing import List, Optional, Literal
from pydantic import BaseModel, Field, validator

class LineItem(BaseModel):
    sku: str = Field(..., min_length=1, description="Part number or SKU")
    description: str = Field(..., min_length=1, description="Product description")
    hts_code: str = Field(default="N/A", pattern=r"^(\d{10}|N/A)$")
    country_of_origin: str = Field(default="N/A", pattern=r"^([A-Z]{2}|N/A)$")
    package_count: str = Field(default="", description="Number of packages")
    quantity: float = Field(..., gt=0, description="Quantity of items")
    net_weight: float = Field(default=0, ge=0, description="Net weight in kg")
    gross_weight: float = Field(default=0, ge=0, description="Gross weight in kg")
    unit_price: float = Field(..., ge=0, description="Price per unit")
    total_value: float = Field(..., ge=0, description="Total value")
    unit_of_measure: Literal["EA", "PCS", "KG", "LB", "UNIT", "BOX", "CTN", "SET", "PR", "DZ"] = "EA"
    
    @validator('total_value')
    def validate_total(cls, v, values):
        """Validate that total_value matches quantity × unit_price"""
        if 'quantity' in values and 'unit_price' in values:
            expected = values['quantity'] * values['unit_price']
            # Allow small rounding differences
            if abs(v - expected) > 0.01:
                raise ValueError(f"total_value {v} doesn't match quantity × unit_price {expected}")
        return v

class Metadata(BaseModel):
    total_items: Optional[int] = Field(None, ge=0)
    invoice_number: Optional[str] = None
    invoice_date: Optional[str] = None
    currency: Optional[str] = Field(None, pattern=r"^[A-Z]{3}$")
    total_invoice_value: Optional[float] = Field(None, ge=0)

class CommercialInvoiceResponse(BaseModel):
    line_items: List[LineItem]
    metadata: Optional[Metadata] = None
    error: Optional[str] = None
```

---

## Validation Rules

### Required Validations

1. **SKU Uniqueness**: All SKUs must be unique within the same response
2. **Quantity > 0**: Quantity must be a positive number
3. **Total Value Calculation**: `total_value` should equal `quantity × unit_price` (within 0.01 tolerance)
4. **Country Code Format**: Must be 2 uppercase letters or "N/A"
5. **HTS Code Format**: Must be 10 digits or "N/A"
6. **Unit of Measure**: Must be from approved enum list
7. **No Nulls**: Use default values instead of null/undefined

### Data Type Validations

- All numeric fields must be actual numbers, not strings
- All string fields must be trimmed (no leading/trailing whitespace)
- Empty strings are only allowed for `package_count`
- Arrays must not contain null elements

---

## Integration Testing

### Test Case 1: Valid Response
```json
{
  "line_items": [
    {
      "sku": "TEST001",
      "description": "Test Product",
      "hts_code": "1234567890",
      "country_of_origin": "US",
      "package_count": "1",
      "quantity": 10,
      "net_weight": 5.0,
      "gross_weight": 5.5,
      "unit_price": 100.00,
      "total_value": 1000.00,
      "unit_of_measure": "EA"
    }
  ]
}
```
**Expected**: ✅ Valid

### Test Case 2: Missing Required Field
```json
{
  "line_items": [
    {
      "sku": "TEST001",
      "description": "Test Product",
      "quantity": 10,
      "unit_price": 100.00
    }
  ]
}
```
**Expected**: ❌ Invalid - missing `total_value` and `unit_of_measure`

### Test Case 3: Invalid Data Type
```json
{
  "line_items": [
    {
      "sku": "TEST001",
      "description": "Test Product",
      "quantity": "10",
      "unit_price": "100.00",
      "total_value": "1000.00",
      "unit_of_measure": "EA"
    }
  ]
}
```
**Expected**: ❌ Invalid - numeric fields are strings

### Test Case 4: Calculation Error
```json
{
  "line_items": [
    {
      "sku": "TEST001",
      "description": "Test Product",
      "quantity": 10,
      "unit_price": 100.00,
      "total_value": 500.00,
      "unit_of_measure": "EA"
    }
  ]
}
```
**Expected**: ❌ Invalid - total_value should be 1000.00

---

## OpenAPI Specification

```yaml
openapi: 3.0.0
info:
  title: A79 Commercial Invoice API
  version: 1.0.0
  description: API for extracting line items from commercial invoices

paths:
  /api/extract-invoice:
    post:
      summary: Extract line items from commercial invoice PDF
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - document
              properties:
                document:
                  type: string
                  format: byte
                  description: Base64 encoded PDF document
                document_type:
                  type: string
                  enum: [commercial_invoice]
                extract_fields:
                  type: array
                  items:
                    type: string
      responses:
        '200':
          description: Successful extraction
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CommercialInvoiceResponse'
        '400':
          description: Invalid request
        '500':
          description: Server error

components:
  schemas:
    CommercialInvoiceResponse:
      type: object
      required:
        - line_items
      properties:
        line_items:
          type: array
          items:
            $ref: '#/components/schemas/LineItem'
        metadata:
          $ref: '#/components/schemas/Metadata'
        error:
          type: string
    
    LineItem:
      type: object
      required:
        - sku
        - description
        - quantity
        - unit_price
        - total_value
        - unit_of_measure
      properties:
        sku:
          type: string
        description:
          type: string
        hts_code:
          type: string
          default: "N/A"
        country_of_origin:
          type: string
          default: "N/A"
        package_count:
          type: string
          default: ""
        quantity:
          type: number
          minimum: 0
          exclusiveMinimum: true
        net_weight:
          type: number
          minimum: 0
          default: 0
        gross_weight:
          type: number
          minimum: 0
          default: 0
        unit_price:
          type: number
          minimum: 0
        total_value:
          type: number
          minimum: 0
        unit_of_measure:
          type: string
          enum: [EA, PCS, KG, LB, UNIT, BOX, CTN, SET, PR, DZ]
    
    Metadata:
      type: object
      properties:
        total_items:
          type: integer
        invoice_number:
          type: string
        invoice_date:
          type: string
        currency:
          type: string
        total_invoice_value:
          type: number
```

---

This schema ensures consistent, validated responses from your A79 API service.
