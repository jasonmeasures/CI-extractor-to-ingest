/**
 * Enhanced A79 Custom Instructions
 * Based on A79_SYSTEM_PROMPT.md v2.0
 * 
 * These instructions are sent as custom_instructions to A79 API
 * The full system prompt should be configured in A79 API settings
 */

export const ENHANCED_A79_INSTRUCTIONS = `Extract ALL line items from commercial invoice PDFs with enhanced intelligence:

REQUIREMENTS:
- Extract EVERY line item - do not skip or summarize
- Use intelligent COO detection (line item → global statement → shipper address → N/A)
- **CRITICAL: Only use ACTUAL part numbers for SKU - NEVER use sequential item numbers like "1", "2", "Item 1"**
- **CRITICAL: If no part number exists, leave SKU field EMPTY (empty string "") - do NOT generate "ITEM-N"**
- Recognize Spanish/Portuguese weight fields: "Kilos Brutos" = gross_weight, "Kilos Netos" = net_weight
- Support multi-language invoices (English, Spanish, Portuguese, German, French, Chinese)

OUTPUT FORMAT:
Return JSON with line_items array. Each item must have:
- sku (ONLY use real part number like "COMP001" or "214N53" - NEVER use "1", "2", "Item 1". If no part number exists, use empty string "")
- description (complete product description)
- hts_code (10-digit code or "N/A")
- country_of_origin (2-letter ISO code, use intelligent inference)
- quantity (number)
- net_weight (number in kg, recognize "Kilos Netos"/"Peso Neto")
- gross_weight (number in kg, recognize "Kilos Brutos"/"Peso Bruto")
- unit_price (number)
- total_value (number, calculate if needed)
- unit_of_measure (string, default "EA")

COO INFERENCE PRIORITY:
1. Explicit COO on line item (highest priority)
2. Global COO statement ("Country of Origin: Germany" → apply to all)
3. Infer from shipper/seller address ("Guadalupe, N.L., Mexico" → "MX")
4. "N/A" only as last resort

SKU DETECTION - CRITICAL RULES:
**ONLY use ACTUAL part numbers for SKU. Leave SKU EMPTY if no part number exists.**

✅ USE (actual part numbers - MUST contain letters or be complex alphanumeric):
- "COMP001", "214N53", "ABC-12345", "PART-789", "SKU-456", "HTS-709931000"
- Any code that contains BOTH letters AND numbers (alphanumeric)
- Look for column headers: Part No., P/N, SKU, Article No., Material No., Product Code, Part Number
- Must be from a dedicated "Part Number" or "SKU" column, NOT from an "Item" or "Line" column

❌ NEVER USE (sequential numbers - these are row counters, NOT part numbers):
- "1", "2", "3" (pure numbers) - IGNORE these completely, they are row numbers
- "Item 1", "Item 2", "Line 1", "Line 2" - IGNORE these completely, they are row labels
- "001", "002", "003" (sequential numbering) - IGNORE these completely
- Any number from an "Item #" or "Line #" column - IGNORE completely
- Sequential numbers are row/item counters - they are NOT product identifiers

→ CRITICAL: If you see sequential numbers like "1", "2", "Item 1" - DO NOT use them as SKU
→ CRITICAL: If there is NO "Part Number" or "SKU" column in the document, leave SKU field EMPTY (empty string "")
→ CRITICAL: Do NOT generate "ITEM-1", "ITEM-2" or any placeholder - leave SKU blank when no part number exists
→ CRITICAL: Only populate SKU with actual part numbers from the document - if none exist, use empty string ""

LANGUAGE SUPPORT:
Recognize column headers in any language:
- Spanish: "Descripción", "Cantidad", "Kilos Brutos", "Kilos Netos"
- Portuguese: "Descrição", "Quantidade", "Peso Bruto", "Peso Líquido"
- German: "Beschreibung", "Menge", "Bruttogewicht", "Nettogewicht"
- And more...

Always return valid JSON with line_items array.`

export const getEnhancedInstructions = (extractFields = []) => {
  if (extractFields && extractFields.length > 0) {
    return `${ENHANCED_A79_INSTRUCTIONS}\n\nAdditional fields to extract: ${extractFields.join(', ')}`
  }
  return ENHANCED_A79_INSTRUCTIONS
}

