# VetROI™ Deployment Guide

## Prerequisites

1. AWS Account with appropriate permissions
2. AWS CLI configured
3. SAM CLI installed (v1.100.0+)
4. O*NET API credentials from https://www.onetcenter.org/developers/
5. USAJOBS API key from https://developer.usajobs.gov/

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

## USAJOBS API Setup (Required)

The application now integrates with USAJOBS to provide federal job search capabilities:

1. **Request USAJOBS API Access**:
   - Visit https://developer.usajobs.gov/apirequest/
   - Fill out the API access request form with:
     - First Name
     - Last Name
     - Email Address
     - Contact Phone Number
     - Company or Agency
     - Description of how you'll use the API (e.g., "VetROI platform helps veterans transition to civilian careers by matching their military experience with federal job opportunities")
   - Accept the USAJOBS Terms of Service
   - Submit the request

2. **After Receiving API Credentials**:
   - You'll receive an email with:
     - Your API Key
     - Instructions for using the API
     - Your email will serve as the User-Agent string
   
3. **Configure USAJOBS API in Lambda**:
   ```bash
   # Update the Lambda function environment variables
   aws lambda update-function-configuration \
     --function-name VetROI_USAJobs_Search \
     --environment "Variables={USAJOBS_API_KEY=YOUR_API_KEY,USAJOBS_USER_AGENT=YOUR_EMAIL}" \
     --region us-east-2
   ```

4. **Important Notes**:
   - Only public job information is available through the API
   - All API requests must include your email as the User-Agent header
   - The API key must be included in the Authorization header
   - Free access with reasonable rate limits

## Testing

The application is live at https://vetroi.us

To test with your own deployment:
1. Note the API URL from the stack outputs
2. Update `frontend/src/aws-config.ts` with your API URL
3. Run the frontend locally or deploy to Amplify

## What Gets Deployed

The stack creates:
- 11 Lambda functions for various features (including USAJOBS integration)
- API Gateway REST API
- 2 DynamoDB tables (Sessions and Conversations)
- 2 S3 buckets (DD214 uploads and O*NET cache)
- Step Functions for DD214 processing and O*NET refresh
- CloudWatch Log Groups
- IAM roles and policies
- Secrets Manager secret for O*NET credentials
- Lambda function for USAJOBS API integration

## Deployment Notes

- **First deployment takes ~5-10 minutes**
- **The application requires both O*NET and USAJOBS API credentials to function fully**
- **Core features work with just O*NET, but job search requires USAJOBS API**
- **All resources use fixed names for consistency**
- **Deployment will fail if resources already exist** (unlikely in clean accounts)

## Clean Up

```bash
sam delete --stack-name vetroi-demo
```

Note: This will delete all resources except S3 buckets (which must be emptied first).

## Support

Issues: https://github.com/AltivumInc-Admin/VetROI/issues