# VetROI™ Deployment Guide

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured
3. SAM CLI installed (v1.100.0+)
4. O*NET API credentials from https://www.onetcenter.org/developers/

## Quick Start

```bash
# Clone the repository
git clone https://github.com/AltivumInc-Admin/VetROI.git
cd VetROI

# Deploy the application
cd sam-templates
sam build
sam deploy --guided
```

When prompted during `sam deploy --guided`:
- Stack Name: `vetroi-demo` (or any unique name)
- AWS Region: `us-east-2`
- Parameter BedrockModelId: (press Enter to accept default)
- Parameter ONetApiUrl: (press Enter to accept default)
- Confirm changes before deploy: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Disable rollback: `N`
- Save parameters to samconfig.toml: `Y`

## O*NET API Setup (Required)

The application requires O*NET API credentials to function. After deployment:

1. **Get O*NET Credentials** (if you don't have them):
   - Visit https://services.onetcenter.org/developer/signup
   - Fill out the registration form:
     - Organization information
     - Technical contact details
     - Project description (e.g., "VetROI - Veteran career matching platform")
     - Accept Terms of Service and Data License
   - Check your email for credentials (ensure updates@services.onetcenter.org is allowed)
   - You'll receive a username and password

2. **Update the Secret in AWS**:
   ```bash
   # Option 1: Use AWS CLI
   aws secretsmanager update-secret \
     --secret-id VetROI/ONet/ApiCredentials \
     --secret-string '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}' \
     --region us-east-2
   
   # Option 2: Use AWS Console
   # 1. Go to AWS Secrets Manager in us-east-2
   # 2. Find "VetROI/ONet/ApiCredentials"
   # 3. Click "Retrieve secret value" then "Edit"
   # 4. Replace REPLACE_WITH_USERNAME and REPLACE_WITH_PASSWORD
   ```

## Testing

The application is live at https://vetroi.us

To test with your own deployment:
1. Note the API URL from the stack outputs
2. Update `frontend/src/aws-config.ts` with your API URL
3. Run the frontend locally or deploy to Amplify

## What Gets Deployed

The stack creates:
- 11 Lambda functions for various features
- API Gateway REST API
- 2 DynamoDB tables (Sessions and Conversations)
- 2 S3 buckets (DD214 uploads and O*NET cache)
- Step Functions for DD214 processing and O*NET refresh
- CloudWatch Log Groups
- IAM roles and policies
- Secrets Manager secret for O*NET credentials

## Deployment Notes

- **First deployment takes ~5-10 minutes**
- **The application won't function until O*NET credentials are configured**
- **All resources use fixed names for consistency**
- **Deployment will fail if resources already exist** (unlikely in clean accounts)

## Clean Up

```bash
sam delete --stack-name vetroi-demo
```

Note: This will delete all resources except S3 buckets (which must be emptied first).

## Support

Issues: https://github.com/AltivumInc-Admin/VetROI/issues