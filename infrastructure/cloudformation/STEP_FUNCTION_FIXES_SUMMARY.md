# Step Function Fixes Summary

## Issues Fixed

### 1. RedactDocument Step (Fixed Earlier)
**Error**: `The JSONPath '$.processedData.extractedText' could not be found`
**Fix**: Removed the `extractedText` parameter from RedactDocument step
**Status**: ✅ Fixed and working

### 2. GenerateInsights Step (Just Fixed)
**Error**: `The JSONPath '$.processedData.extractedText' could not be found`
**Fix**: Removed the `extractedText` parameter from GenerateInsights step
**Status**: ✅ Fixed - ready to test

## Root Cause
The ProcessTextractResults Lambda returns:
- `extractedFields` - Structured DD214 data (name, branch, dates, etc.)
- NOT `extractedText` - This is saved to DynamoDB but not returned in the response

## Fixes Applied

### Production Step Function
Both fixes have been applied to the production Step Function:
1. RedactDocument - Gets text from DynamoDB
2. GenerateInsights - Uses extractedFields only

### CloudFormation Template
Updated `phase3-2-stepfunctions-dd214.yaml` to include both fixes, ensuring new deployments won't have these issues.

## Updated Step Parameters

**RedactDocument**:
```json
{
  "operation": "redact",
  "documentId.$": "$.documentId",
  "findings.$": "$.macieFindings.findings"
}
```

**GenerateInsights**:
```json
{
  "documentId.$": "$.documentId",
  "extractedData.$": "$.processedData.extractedFields"
}
```

## Lambda Behavior
Both Lambda functions handle missing data gracefully:
- **VetROI_DD214_Macie** - Gets extracted text from DynamoDB
- **VetROI_DD214_Insights** - Gets extracted data from event or DynamoDB

## Testing
The Step Function should now complete successfully through all steps:
1. Textract ✅
2. Process Results ✅
3. Macie Scan ✅
4. Redact Document ✅
5. Generate Insights ✅ (should work now)
6. Update DynamoDB ✅

---

*Updated: June 19, 2025*