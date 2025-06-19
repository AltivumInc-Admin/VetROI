# Step Function RedactDocument Fix

## Issue
The Step Function was failing at the `RedactDocument` state with error:
```
The JSONPath '$.processedData.extractedText' specified for the field 'extractedText' 
could not be found in the input
```

## Root Cause
- The `ProcessTextractResults` step returns `extractedFields` (structured data)
- But the `RedactDocument` step was looking for `extractedText` (raw text)
- The raw text is actually saved to DynamoDB by the processor as `extracted_text`

## Solution Applied
1. **Updated Step Function Definition**
   - Removed the `extractedText.$` parameter from RedactDocument state
   - The Lambda will now get the text from DynamoDB or S3

   Before:
   ```json
   "Parameters": {
     "operation": "redact",
     "documentId.$": "$.documentId",
     "findings.$": "$.macieFindings.findings",
     "extractedText.$": "$.processedData.extractedText"  // This field doesn't exist
   }
   ```

   After:
   ```json
   "Parameters": {
     "operation": "redact",
     "documentId.$": "$.documentId",
     "findings.$": "$.macieFindings.findings"
   }
   ```

2. **Lambda Function Behavior**
   - The `VetROI_DD214_Macie` Lambda already has fallback logic
   - It will get extracted text from:
     1. DynamoDB (stored by ProcessTextractResults)
     2. S3 full text file
     3. S3 extraction summary
     4. S3 full results (parsing blocks)

## Verification
The Step Function has been updated and should now proceed past the RedactDocument state successfully.

## No Code Changes Required
The Lambda function already handles missing extractedText parameter gracefully, so no Lambda updates were needed.

---

*Fixed: June 19, 2025*