# Confidence Score Guide for Commercial Invoice Extraction

## Overview

This guide explains how confidence scores work in the A79 commercial invoice extraction system, how to interpret them, and best practices for using confidence scores to ensure data quality.

---

## What Are Confidence Scores?

Confidence scores indicate how certain the AI model is about the accuracy of extracted data. They typically range from 0.0 (low confidence) to 1.0 (high confidence) or 0-100%.

### Types of Confidence Scores

1. **Overall Confidence**: Overall confidence in the entire extraction
2. **Field-Level Confidence**: Confidence for each extracted field (SKU, description, HTS code, etc.)
3. **Line Item Confidence**: Confidence for each line item as a whole

---

## Current Implementation Status

### ⚠️ Not Yet Implemented

Confidence score extraction and validation are **not currently implemented** in the codebase. This guide documents:

1. **How confidence scores should work** (when implemented)
2. **How to interpret them** (when available from A79 API)
3. **Best practices** for using confidence scores

### Planned Implementation

When confidence scores are available from A79 API, they should be:

- ✅ Extracted from A79 response
- ✅ Stored in normalized data structure
- ✅ Validated against thresholds
- ✅ Displayed in frontend
- ✅ Included in validation reports

---

## Confidence Score Structure

### Expected Format from A79 API

```json
{
  "line_items": [
    {
      "sku": "COMP001",
      "description": "Computer Processor",
      "confidence_score": 0.95,
      "field_confidence": {
        "sku": 0.98,
        "description": 0.95,
        "hts_code": 0.92,
        "country_of_origin": 0.88,
        "quantity": 0.99,
        "unit_price": 0.97
      }
    }
  ],
  "overall_confidence": 0.94
}
```

### Normalized Structure (After Processing)

```json
{
  "line_items": [
    {
      "sku": "COMP001",
      "description": "Computer Processor",
      "confidence_score": 0.95,
      "field_confidence": {
        "sku": 0.98,
        "description": 0.95,
        "hts_code": 0.92,
        "country_of_origin": 0.88,
        "quantity": 0.99,
        "unit_price": 0.97,
        "value": 0.96
      },
      "validation_status": "high_confidence"
    }
  ],
  "metadata": {
    "overall_confidence": 0.94,
    "low_confidence_items": 0,
    "medium_confidence_items": 2,
    "high_confidence_items": 8
  }
}
```

---

## Confidence Score Thresholds

### Recommended Thresholds

| Confidence Level | Score Range | Action Required |
|-----------------|-------------|----------------|
| **High** | 0.90 - 1.00 | ✅ Accept - No review needed |
| **Medium** | 0.70 - 0.89 | ⚠️ Review - Verify accuracy |
| **Low** | 0.50 - 0.69 | 🔍 Manual Review - High priority |
| **Very Low** | 0.00 - 0.49 | ❌ Reject - Re-extract or manual entry |

### Field-Specific Thresholds

Some fields may have different thresholds:

| Field | High | Medium | Low |
|-------|------|--------|-----|
| **SKU** | ≥ 0.95 | 0.80-0.94 | < 0.80 |
| **Description** | ≥ 0.90 | 0.75-0.89 | < 0.75 |
| **HTS Code** | ≥ 0.92 | 0.70-0.91 | < 0.70 |
| **Country of Origin** | ≥ 0.85 | 0.65-0.84 | < 0.65 |
| **Quantity** | ≥ 0.98 | 0.90-0.97 | < 0.90 |
| **Unit Price** | ≥ 0.95 | 0.85-0.94 | < 0.85 |
| **Value** | ≥ 0.93 | 0.80-0.92 | < 0.80 |

---

## Interpreting Confidence Scores

### High Confidence (0.90-1.00)

**What it means:**
- AI is very certain about the extracted value
- Data likely matches the source document
- Minimal risk of errors

**Action:**
- ✅ Accept without review
- ✅ Use for automated processing
- ✅ Include in batch exports

**Example:**
```json
{
  "sku": "COMP001",
  "confidence_score": 0.98,
  "field_confidence": {
    "sku": 0.98,
    "description": 0.95
  }
}
```
→ **Action**: Accept - High confidence in SKU and description

### Medium Confidence (0.70-0.89)

**What it means:**
- AI is reasonably certain but some uncertainty exists
- Data likely correct but may need verification
- Moderate risk of errors

**Action:**
- ⚠️ Review against source document
- ⚠️ Verify critical fields manually
- ⚠️ Flag for quality check

**Example:**
```json
{
  "hts_code": "8471.30.0100",
  "field_confidence": {
    "hts_code": 0.78
  }
}
```
→ **Action**: Review - Verify HTS code matches document

### Low Confidence (0.50-0.69)

**What it means:**
- AI is uncertain about the extracted value
- Data may be incorrect or incomplete
- High risk of errors

**Action:**
- 🔍 Manual review required
- 🔍 Compare with source document
- 🔍 Consider re-extraction

**Example:**
```json
{
  "country_of_origin": "MX",
  "field_confidence": {
    "country_of_origin": 0.62
  }
}
```
→ **Action**: Manual Review - Verify COO inference is correct

### Very Low Confidence (< 0.50)

**What it means:**
- AI is very uncertain
- Data likely incorrect or missing
- Very high risk of errors

**Action:**
- ❌ Reject extraction
- ❌ Re-extract with different parameters
- ❌ Manual entry required

**Example:**
```json
{
  "sku": "",
  "field_confidence": {
    "sku": 0.15
  }
}
```
→ **Action**: Reject - SKU extraction failed, manual entry needed

---

## Using Confidence Scores for Quality Control

### Automated Quality Checks

```javascript
function validateConfidence(item) {
  const issues = []
  
  // Overall confidence check
  if (item.confidence_score < 0.70) {
    issues.push({
      type: 'low_overall_confidence',
      score: item.confidence_score,
      severity: 'high'
    })
  }
  
  // Critical field checks
  const criticalFields = ['sku', 'description', 'hts_code', 'quantity', 'unit_price']
  criticalFields.forEach(field => {
    const fieldConf = item.field_confidence?.[field]
    if (fieldConf && fieldConf < 0.80) {
      issues.push({
        type: 'low_field_confidence',
        field: field,
        score: fieldConf,
        severity: field === 'quantity' || field === 'unit_price' ? 'high' : 'medium'
      })
    }
  })
  
  return {
    passed: issues.length === 0,
    issues: issues,
    requires_review: issues.some(i => i.severity === 'high')
  }
}
```

### Quality Metrics

Track these metrics over time:

- **Average Confidence**: Mean confidence across all extractions
- **Low Confidence Rate**: Percentage of items with confidence < 0.70
- **Field-Level Accuracy**: Confidence vs. actual accuracy for each field
- **Review Rate**: Percentage of items requiring manual review

---

## Best Practices

### 1. Set Appropriate Thresholds

- **Production**: Use stricter thresholds (≥ 0.90 for auto-accept)
- **Development/Testing**: Use lower thresholds (≥ 0.70) to see more data
- **Critical Fields**: Use higher thresholds for SKU, HTS codes, values

### 2. Review Low Confidence Items

- Always review items with confidence < 0.70
- Focus on critical fields (SKU, HTS, values)
- Compare with source document
- Document corrections for model improvement

### 3. Monitor Trends

- Track confidence scores over time
- Identify patterns (e.g., certain invoice formats have lower confidence)
- Adjust thresholds based on actual accuracy
- Use feedback to improve extraction

### 4. Handle Edge Cases

- **Missing Confidence Scores**: Treat as medium confidence (0.75)
- **Inconsistent Scores**: Use lowest field confidence as overall
- **Very High Scores**: Still spot-check occasionally (overconfidence)

### 5. User Feedback Loop

- Collect user corrections
- Compare corrections with confidence scores
- Identify fields where confidence doesn't match accuracy
- Adjust thresholds based on real-world performance

---

## Implementation Checklist

When implementing confidence score support:

- [ ] **Extract from A79 Response**
  - Check if A79 API returns confidence scores
  - Extract overall and field-level confidence
  - Handle missing confidence scores gracefully

- [ ] **Store in Data Structure**
  - Add `confidence_score` to line items
  - Add `field_confidence` object to line items
  - Add `overall_confidence` to metadata

- [ ] **Validate Against Thresholds**
  - Implement threshold checking
  - Flag low-confidence items
  - Generate validation reports

- [ ] **Display in Frontend**
  - Show confidence scores in results table
  - Color-code by confidence level
  - Highlight items requiring review

- [ ] **Generate Reports**
  - Confidence distribution charts
  - Low-confidence item lists
  - Quality metrics dashboard

- [ ] **Add to Validation**
  - Include confidence checks in validation pipeline
  - Add confidence validation to `VALIDATION_CHECKS.md`
  - Update validation scripts

---

## Example Validation with Confidence

```javascript
function validateWithConfidence(extractionResult) {
  const validation = {
    passed: true,
    warnings: [],
    errors: [],
    confidence_summary: {
      high: 0,
      medium: 0,
      low: 0,
      very_low: 0
    }
  }
  
  extractionResult.line_items.forEach((item, index) => {
    const conf = item.confidence_score || 0.75 // Default if missing
    
    // Categorize confidence
    if (conf >= 0.90) {
      validation.confidence_summary.high++
    } else if (conf >= 0.70) {
      validation.confidence_summary.medium++
      validation.warnings.push(`Item ${index + 1}: Medium confidence (${conf})`)
    } else if (conf >= 0.50) {
      validation.confidence_summary.low++
      validation.errors.push(`Item ${index + 1}: Low confidence (${conf}) - Review required`)
      validation.passed = false
    } else {
      validation.confidence_summary.very_low++
      validation.errors.push(`Item ${index + 1}: Very low confidence (${conf}) - Reject`)
      validation.passed = false
    }
    
    // Check critical fields
    const criticalFields = ['sku', 'description', 'hts_code']
    criticalFields.forEach(field => {
      const fieldConf = item.field_confidence?.[field]
      if (fieldConf && fieldConf < 0.80) {
        validation.warnings.push(`Item ${index + 1}: Low ${field} confidence (${fieldConf})`)
      }
    })
  })
  
  return validation
}
```

---

## Related Files

- **Validation Checks**: `VALIDATION_CHECKS.md`
- **Instructions**: `INSTRUCTIONS.md`
- **A79 System Prompt**: `A79_SYSTEM_PROMPT.md`
- **Validation Service**: `backend/services/a79Service.js` (validateResponse)

---

## Next Steps

1. **Check A79 API**: Verify if A79 returns confidence scores
2. **Implement Extraction**: Add confidence score extraction to `validateResponse()`
3. **Add Validation**: Implement threshold checking
4. **Update Frontend**: Display confidence scores in UI
5. **Monitor Quality**: Track confidence metrics over time

---

**Version:** 1.0  
**Last Updated:** November 2024  
**Status:** Planning/Implementation Guide

