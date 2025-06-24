# Security Exceptions Register

## Purpose
This document tracks security exceptions where standard controls cannot be implemented, along with compensating controls and review dates.

## Active Exceptions

### EXC-001: O*NET API Credential Rotation
- **Standard**: Credentials should be rotated every 90 days
- **Exception Reason**: O*NET Web Services API does not support credential rotation
- **Risk**: Potential credential compromise over extended time period
- **Compensating Controls**:
  - Credentials stored in AWS Secrets Manager with encryption
  - Access limited to specific Lambda function ARNs
  - CloudTrail logging for all access attempts
  - Quarterly manual review of access patterns
- **Approved By**: [Your Name]
- **Approval Date**: 2025-06-23
- **Next Review**: 2025-09-23

### EXC-002: Frontend API Key Exposure
- **Standard**: API keys should not be exposed in client-side code
- **Exception Reason**: AWS API Gateway requires API key for public endpoint rate limiting
- **Risk**: API key visible in browser, potential for abuse
- **Compensating Controls**:
  - API Gateway usage plans with rate limiting (1000 requests/day)
  - CloudWatch alarms for usage spikes
  - API key rotation quarterly
  - WAF rules for abuse prevention
- **Approved By**: [Your Name]
- **Approval Date**: 2025-06-23
- **Next Review**: 2025-09-23

## Exception Review Process

1. **Quarterly Review**:
   - Verify exception still necessary
   - Check if vendor has added capability
   - Review effectiveness of compensating controls
   - Update risk assessment

2. **Annual Review**:
   - Full risk reassessment
   - Research alternative solutions
   - Cost-benefit analysis of alternatives

## Retired Exceptions

| ID | Description | Retirement Date | Resolution |
|----|-------------|-----------------|------------|
| - | - | - | - |

## Review Log

| Date | Reviewer | Exceptions Reviewed | Changes Made |
|------|----------|-------------------|--------------|
| 2025-06-23 | [Your Name] | Initial documentation | Created exception register |