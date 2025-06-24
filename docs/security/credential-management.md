# Credential Management Policy

## Overview
This document outlines VetROI's credential management policies, rotation schedules, and exception handling procedures.

## Credential Inventory

### Rotatable Credentials

| Credential | Location | Rotation Frequency | Last Rotated | Next Rotation |
|------------|----------|-------------------|--------------|---------------|
| API Gateway Keys | API Gateway | Quarterly | 2025-04-25 | 2025-07-25 |
| IAM User Access Keys | N/A - Using roles | N/A | N/A | N/A |
| Cognito App Client | Cognito | Annual | 2025-06-16 | 2026-06-16 |

### Non-Rotatable Credentials (Exceptions)

| Credential | Location | Reason | Compensating Controls |
|------------|----------|--------|----------------------|
| O*NET API Credentials | Secrets Manager | Third-party API doesn't support rotation | 1. Stored in AWS Secrets Manager<br>2. Access restricted to Lambda functions<br>3. CloudTrail logging enabled<br>4. Quarterly access review |

## Rotation Procedures

### API Gateway Keys
```bash
# 1. Create new API key
aws apigateway create-api-key --name "VetROI-Key-$(date +%Y%m%d)"

# 2. Update frontend configuration
# 3. Deploy new frontend version
# 4. Monitor for errors (24 hours)
# 5. Disable old key
```

### Secrets Manager (When Supported)
```bash
# Enable automatic rotation
aws secretsmanager put-rotation-configuration \
  --secret-id [SECRET_NAME] \
  --rotation-lambda-arn [LAMBDA_ARN] \
  --rotation-interval 90
```

## Monitoring

### CloudWatch Alarms
- Alert on failed authentication attempts
- Alert on credential access from new IPs
- Alert on secrets access outside Lambda

### Quarterly Review Checklist
- [ ] Review all credential last-used dates
- [ ] Check for unused credentials
- [ ] Verify exception justifications still valid
- [ ] Update this document with changes

## Exception Process

1. Document why rotation isn't possible
2. Implement compensating controls
3. Review exception quarterly
4. Check vendor for rotation support updates

## Compliance Notes

- **SOC2**: Credential rotation required (exceptions documented)
- **NIST 800-53**: IA-5(1) Password-based Authentication
- **AWS Security Best Practices**: Rotate credentials regularly