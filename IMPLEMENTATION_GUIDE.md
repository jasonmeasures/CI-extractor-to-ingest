# Emergency Fix Implementation Guide
## Next Floor Invoice Extraction Failure - Immediate Action Plan

---

## Problem Summary

**Invoice:** 792050416-LK9B9G0ry1MyU7RYmnq7  
**Issue:** Extracted only 5 items from page 1, missed 60+ items from pages 2-3  
**Impact:** CRITICAL - 92% of data missing  
**Root Cause:** No enforcement of multi-page processing in A79 instructions

---

## Immediate Actions (Next 2 Hours)

### 1. Update baselineInstructions.js

**File location:** `backend/config/baselineInstructions.js`

**Action:** Replace current baseline with `baselineInstructions_v2.1.md`

**Key additions:**
```javascript
// At the very top of instructions
const MULTI_PAGE_PROTOCOL = `
🚨 CRITICAL MULTI-PAGE EXTRACTION PROTOCOL 🚨

Step 0: Document Analysis (MANDATORY)
1. Count total pages in PDF
2. Scan ALL pages for line item tables  
3. Find totals section (last page)
4. Estimate expected line item count

Step 1: Set Expectations
- "This document has [X] pages"
- "I expect [Y] line items"
- "I will process ALL pages"

Step 2: Page-by-Page Extraction
- Extract page 1 → verify
- Extract page 2 → verify
- Extract page 3 → verify

Step 3: Verification Before Output
- ✓ All pages processed?
- ✓ Item count matches?
- ✓ Sequential numbering?

Step 4: Only Then Output JSON

⚠️ STOPPING AFTER PAGE 1 = CRITICAL FAILURE ⚠️
`;

// Prepend to all instructions
const baselineInstructions = MULTI_PAGE_PROTOCOL + `
[rest of existing instructions]
`;
```

### 2. Update A79 API Call

**File location:** `backend/services/a79Service.js`

**Add metadata request:**
```javascript
const instructions = buildInstructions({
  customer_number: customerNumber,
  custom_instructions: customInstructions,
  extract_fields: extractFields
});

// Add metadata requirement
const enhancedInstructions = instructions + `

REQUIRED OUTPUT METADATA:
Include this at the end of your JSON:

"extraction_metadata": {
  "total_pages_processed": <number>,
  "pages_with_line_items": [<page numbers>],
  "total_items_extracted": <number>,
  "expected_items_estimate": <number>,
  "completeness_score": <extracted/expected>,
  "sequential_check_passed": <true/false>,
  "totals_verified": <true/false>
}
`;

// Send to A79
const response = await a79Client.extract({
  file: pdfBuffer,
  custom_instructions: enhancedInstructions
});
```

### 3. Add Validation Layer

**New file:** `backend/services/extractionValidator.js`

```javascript
export function validateExtraction(extractedData, pdfPageCount) {
  const issues = [];
  
  // Check page coverage
  if (!extractedData.extraction_metadata) {
    issues.push({
      severity: 'CRITICAL',
      message: 'Missing extraction_metadata - cannot verify completeness'
    });
  } else {
    const metadata = extractedData.extraction_metadata;
    
    // Pages processed
    if (metadata.total_pages_processed < pdfPageCount) {
      issues.push({
        severity: 'CRITICAL',
        message: `Only ${metadata.total_pages_processed}/${pdfPageCount} pages processed`
      });
    }
    
    // Completeness score
    if (metadata.completeness_score < 0.95) {
      issues.push({
        severity: 'HIGH',
        message: `Completeness score ${metadata.completeness_score} - may be missing items`
      });
    }
    
    // Sequential check
    if (!metadata.sequential_check_passed) {
      issues.push({
        severity: 'MEDIUM',
        message: 'Gaps in item numbering detected'
      });
    }
  }
  
  // Check line items count
  if (!extractedData.line_items || extractedData.line_items.length === 0) {
    issues.push({
      severity: 'CRITICAL',
      message: 'No line items extracted'
    });
  } else if (pdfPageCount > 1 && extractedData.line_items.length < 10) {
    issues.push({
      severity: 'HIGH',
      message: `Only ${extractedData.line_items.length} items from ${pdfPageCount}-page doc - likely incomplete`
    });
  }
  
  return {
    isValid: issues.filter(i => i.severity === 'CRITICAL').length === 0,
    issues,
    qualityScore: calculateQualityScore(extractedData, issues)
  };
}

function calculateQualityScore(data, issues) {
  let score = 100;
  
  issues.forEach(issue => {
    switch(issue.severity) {
      case 'CRITICAL': score -= 50; break;
      case 'HIGH': score -= 20; break;
      case 'MEDIUM': score -= 10; break;
      case 'LOW': score -= 5; break;
    }
  });
  
  return Math.max(0, score);
}
```

### 4. Update Extraction Endpoint

**File location:** `backend/routes/extractionRoutes.js`

```javascript
import { validateExtraction } from '../services/extractionValidator.js';

router.post('/api/extract', async (req, res) => {
  try {
    // Existing extraction logic
    const extractedData = await a79Service.extract(pdfBuffer, instructions);
    
    // NEW: Validate extraction
    const validation = validateExtraction(extractedData, pdfPageCount);
    
    if (!validation.isValid) {
      // Log critical failure
      logger.error('Extraction validation failed', {
        invoice: extractedData.invoice_number,
        issues: validation.issues
      });
      
      // Alert if severe
      if (validation.qualityScore < 50) {
        await alertService.send({
          type: 'EXTRACTION_FAILURE',
          message: `Critical extraction failure for ${extractedData.invoice_number}`,
          details: validation.issues
        });
      }
    }
    
    // Return with validation metadata
    res.json({
      success: true,
      data: extractedData,
      validation: {
        isValid: validation.isValid,
        qualityScore: validation.qualityScore,
        issues: validation.issues
      }
    });
    
  } catch (error) {
    // Error handling
  }
});
```

---

## Testing Protocol (Next 2 Hours)

### Test Case 1: Next Floor Invoice (The Failing Case)

**File:** 792050416-LK9B9G0ry1MyU7RYmnq7-organized-2025-12-02T131234190.pdf

**Expected Results:**
- ✓ 65 line items extracted (not 5)
- ✓ All 3 pages processed
- ✓ extraction_metadata.completeness_score = 1.0
- ✓ Total cartons = 1,020
- ✓ Gross invoice value = $18,533.33

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/extract \
  -F "file=@792050416.pdf" \
  -F "customer_number=NEXTFLOOR001"
```

**Validation:**
```javascript
// Check response
const response = JSON.parse(result);
assert(response.data.line_items.length === 65, 'Should have 65 items');
assert(response.data.extraction_metadata.total_pages_processed === 3);
assert(response.validation.qualityScore >= 95);
```

### Test Case 2: Single-Page Invoice

**Test:** Ensure single-page invoices still work correctly

**Expected Results:**
- No false positives about missing pages
- Quality score remains high
- No unnecessary warnings

### Test Case 3: Various Multi-Page Invoices

**Test with:**
- 2-page invoices (10-20 items)
- 3-page invoices (30-50 items)
- 4+ page invoices (100+ items)

**Monitor:**
- Extraction completeness
- Processing time (should not degrade significantly)
- Quality scores

---

## Monitoring Setup (Next 4 Hours)

### 1. Add Extraction Metrics

**File:** `backend/services/metricsService.js`

```javascript
export const extractionMetrics = {
  // Track completeness
  trackCompleteness: (invoice, metadata) => {
    metrics.gauge('extraction.completeness_score', metadata.completeness_score, {
      invoice: invoice.invoice_number,
      pages: metadata.total_pages_processed
    });
  },
  
  // Track quality
  trackQuality: (invoice, qualityScore) => {
    metrics.gauge('extraction.quality_score', qualityScore, {
      invoice: invoice.invoice_number
    });
  },
  
  // Track failures
  trackFailure: (invoice, reason) => {
    metrics.increment('extraction.failures', {
      invoice: invoice.invoice_number,
      reason: reason
    });
  }
};
```

### 2. Create Alert Rules

**Alert on:**
- Quality score < 80 (Warning)
- Quality score < 50 (Critical)
- Completeness score < 0.95 (Warning)
- Multi-page doc with < 10 items (Warning)

### 3. Dashboard Metrics

**Add to Grafana/DataDog:**
- Extraction completeness rate (target: >98%)
- Average quality score (target: >95)
- Multi-page extraction success rate
- Pages processed per invoice

---

## Rollback Plan

If the new instructions cause issues:

### 1. Immediate Rollback
```bash
# Revert to previous baseline
git checkout HEAD~1 backend/config/baselineInstructions.js

# Restart service
pm2 restart klearnow-extraction
```

### 2. Feature Flag
```javascript
// Add feature flag for gradual rollout
const USE_NEW_MULTI_PAGE_PROTOCOL = process.env.MULTI_PAGE_PROTOCOL_ENABLED === 'true';

const instructions = USE_NEW_MULTI_PAGE_PROTOCOL 
  ? baselineInstructionsV2_1 
  : baselineInstructionsV2_0;
```

### 3. A/B Testing
```javascript
// Test 20% of traffic initially
const useNewProtocol = Math.random() < 0.2;
```

---

## Success Criteria

### Immediate (Day 1)
- [ ] Next Floor invoice extracts all 65 items
- [ ] No regressions on single-page invoices
- [ ] Validation layer working correctly

### Short-term (Week 1)
- [ ] 95%+ completeness rate on multi-page invoices
- [ ] <5% false positive warnings
- [ ] Average quality score >90

### Long-term (Month 1)
- [ ] Zero critical extraction failures
- [ ] Customer satisfaction improvement
- [ ] Reduced manual correction time

---

## Communication Plan

### Internal Team
**Immediate email to:**
- Engineering team
- Operations team
- Product team

**Subject:** "CRITICAL FIX: Multi-page invoice extraction deployed"

**Content:**
```
Team,

We've identified and fixed a critical issue where multi-page 
commercial invoices were only partially extracted (page 1 only).

What changed:
- New multi-page processing protocol
- Validation layer added
- Quality scoring implemented

Impact:
- Next Floor invoice now extracts all 65 items (was 5)
- All multi-page invoices will be more complete
- New alerts for extraction quality issues

Please monitor for any issues and report immediately.

Testing: Next Floor invoice 792050416 now fully extracts.
```

### Customer (Next Floor)
**After successful testing:**

```
Hi [Contact],

We've resolved the extraction issue with your recent invoice 
(792050416). The system now correctly extracts all line items 
from multi-page invoices.

Your invoice had 65 items across 3 pages, and we now capture 
all of them accurately.

Please let us know if you notice any other issues.
```

---

## Follow-up Actions (Week 1)

1. **Review all recent extractions** - Check for other missed multi-page cases
2. **Batch re-process** - Re-extract any failed multi-page invoices
3. **Update documentation** - Add multi-page handling to customer docs
4. **Training** - Brief ops team on new validation metrics

---

## Files to Update

### Critical (Do Now)
- [ ] `backend/config/baselineInstructions.js` → Add multi-page protocol
- [ ] `backend/services/a79Service.js` → Add metadata requirement
- [ ] `backend/services/extractionValidator.js` → NEW FILE
- [ ] `backend/routes/extractionRoutes.js` → Add validation

### Important (Today)
- [ ] `backend/services/metricsService.js` → Add extraction metrics
- [ ] `backend/config/alerts.js` → Add quality alerts
- [ ] `.env` → Add `MULTI_PAGE_PROTOCOL_ENABLED=true`

### Documentation (This Week)
- [ ] `docs/EXTRACTION_GUIDE.md` → Update with multi-page info
- [ ] `docs/TROUBLESHOOTING.md` → Add validation section
- [ ] Customer-facing docs → Mention improved multi-page handling

---

## Lessons Learned

1. **LLMs need explicit multi-step instructions** - "Extract all items" isn't enough
2. **Validation is critical** - Can't trust extraction without verification
3. **Metadata is valuable** - Completeness scores catch failures early
4. **Page count matters** - Multi-page docs need special handling
5. **Testing with edge cases** - Single-page tests didn't catch this issue

---

## Related Issues to Check

Search codebase for similar patterns:
- [ ] Packing list extraction (also multi-page)
- [ ] Bill of lading extraction (also multi-page)
- [ ] Certificate extraction (already fixed in V7_3_1)

Apply same multi-page protocol to all document types.

---

**IMMEDIATE ACTION:** Deploy baselineInstructions_v2.1.md and test with Next Floor invoice

**Timeline:**
- 0-2h: Deploy and test
- 2-4h: Validate and monitor
- 4-8h: Review metrics
- Day 2: Full rollout if stable

**Status:** READY TO DEPLOY ✅
