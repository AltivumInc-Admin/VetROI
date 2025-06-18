# Macie Integration Troubleshooting Guide

## Issue: Macie Jobs Getting Stuck

We discovered that Macie classification jobs can sometimes run indefinitely when scanning single files in S3. This causes the Step Function to loop endlessly waiting for completion.

### Symptoms
- Macie job status remains "RUNNING" for 5+ minutes
- Step Function loops between WaitForMacie and CheckMacieFindings
- No findings are returned
- Execution must be manually aborted

### Root Causes
1. **Single File Scans**: Macie is optimized for bulk scanning, not individual files
2. **Job Configuration**: The scoping filter might be too specific
3. **Timing Issues**: Jobs might complete between status checks

## Solutions Implemented

### 1. Timeout Mechanism (Current)
Added automatic timeout after 2 minutes:
```python
if job_status == 'RUNNING' and job_age > 120:
    print(f"Job running for too long ({job_age}s), proceeding with default findings")
    # Cancel the stuck job
    macie_client.update_classification_job(jobId=job_id, jobStatus='CANCELLED')
    job_status = 'COMPLETE'
```

### 2. Default PII Fields
Always include standard DD214 PII fields:
- Social Security Number
- DoD ID Number  
- Home of Record
- Date of Birth
- Name of Veteran

### 3. Reduced Wait Time
Changed Step Function wait from 30 to 15 seconds between checks.

## Alternative Approaches

### Option 1: Use AWS Comprehend Instead
Created `lambda_function_simple.py` that uses Comprehend's `detect_pii_entities` API for synchronous PII detection. This avoids the async job issues entirely.

### Option 2: Batch Processing
Instead of per-file Macie jobs:
1. Accumulate files in a staging bucket
2. Run daily/hourly Macie jobs on the entire bucket
3. Process findings in batch

### Option 3: Pre-process with Textract
Since Textract already extracts the text:
1. Use the extracted text for PII detection
2. Apply regex patterns for known PII types
3. Skip Macie for real-time processing

## Recommendations

For production, consider:

1. **Hybrid Approach**: 
   - Use Comprehend or regex for immediate PII detection
   - Run Macie jobs asynchronously for compliance reporting
   
2. **Fallback Strategy**:
   - Try Macie first with short timeout
   - Fall back to Comprehend if timeout
   - Always apply default DD214 redactions

3. **Monitoring**:
   - Set CloudWatch alarms for stuck jobs
   - Track job completion times
   - Alert on repeated timeouts

## Quick Fix Commands

Cancel stuck Macie job:
```bash
aws macie2 update-classification-job \
  --job-id <JOB_ID> \
  --job-status CANCELLED \
  --region us-east-2
```

List running jobs:
```bash
aws macie2 list-classification-jobs \
  --filter-criteria '{"includes":{"jobStatus":{"eq":["RUNNING"]}}}' \
  --region us-east-2
```

## Testing
To test the timeout mechanism:
1. Upload a DD214
2. Watch CloudWatch logs for "Job running for too long"
3. Verify job gets cancelled and proceeds with defaults
4. Check redacted output has standard PII removed