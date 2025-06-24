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

When prompted:
- Stack Name: `vetroi-demo` (or any unique name)
- AWS Region: `us-east-2`
- Confirm changes: `Y`
- Allow SAM to create roles: `Y`

## O*NET API Setup

After deployment, update the O*NET credentials:
1. Go to AWS Secrets Manager
2. Find the secret created by your stack
3. Update with your O*NET username and password

## Testing

The application is live at https://vetroi.us

To test with your own deployment:
1. Note the API URL from the stack outputs
2. Update `frontend/src/aws-config.ts` with your API URL
3. Run the frontend locally or deploy to Amplify

## Clean Up

```bash
sam delete --stack-name vetroi-demo
```

## Support

Issues: https://github.com/AltivumInc-Admin/VetROI/issues