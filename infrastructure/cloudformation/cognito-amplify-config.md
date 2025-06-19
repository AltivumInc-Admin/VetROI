# VetROI Cognito & Amplify Configuration

## Cognito Setup (Manual - NOT in CloudFormation)

### User Pool
- **Pool ID**: us-east-2_zVjrLf0jA
- **Name**: VetROI-DD214-Users
- **Region**: us-east-2
- **Purpose**: User authentication for DD214 uploads

### Identity Pool
- **Pool ID**: us-east-2:10f0038f-acb9-44c2-a433-c9aa12185217
- **Name**: VetROI_DD214_IdentityPool
- **Region**: us-east-2
- **Purpose**: Temporary AWS credentials for S3 uploads

### Configuration Commands
```bash
# Get User Pool details
aws cognito-idp describe-user-pool --user-pool-id us-east-2_zVjrLf0jA --region us-east-2

# Get Identity Pool details
aws cognito-identity describe-identity-pool --identity-pool-id us-east-2:10f0038f-acb9-44c2-a433-c9aa12185217 --region us-east-2

# List app clients
aws cognito-idp list-user-pool-clients --user-pool-id us-east-2_zVjrLf0jA --region us-east-2
```

## Amplify Setup (Manual - NOT in CloudFormation)

### App Configuration
- **App ID**: d34razwlkdgpdv
- **Name**: VetROI
- **Repository**: https://github.com/AltivumInc-Admin/VetROI
- **Production URL**: https://vetroi.altivum.ai
- **Default Domain**: d34razwlkdgpdv.amplifyapp.com

### Environment Variables
```
VITE_API_URL=https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod
VITE_API_KEY=1du0W33OTS3NkLhXJY5R4FOY9LJq6ZB1h7Lrdwig
```

### Build Specification (amplify.yml)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

### Deployment
- **Branch**: main
- **Auto-deploy**: Enabled
- **Last Deploy**: June 19, 2025 at 1:25 PM

## Why Not in CloudFormation?

1. **Cognito User Pool**: Contains user data, risky to migrate
2. **Cognito Identity Pool**: Tightly coupled with User Pool
3. **Amplify**: Already has GitHub integration working perfectly

## Backup Strategy

### Cognito Backup
```bash
# Export user pool
aws cognito-idp describe-user-pool --user-pool-id us-east-2_zVjrLf0jA > cognito-user-pool-backup.json

# Export users (if needed)
aws cognito-idp list-users --user-pool-id us-east-2_zVjrLf0jA > cognito-users-backup.json
```

### Amplify Backup
```bash
# Get app details
aws amplify get-app --app-id d34razwlkdgpdv > amplify-app-backup.json

# Get branch details
aws amplify get-branch --app-id d34razwlkdgpdv --branch-name main > amplify-branch-backup.json
```

## Integration Points

### Frontend → Cognito
- Uses AWS Amplify SDK
- Handles sign-up, sign-in, sign-out
- Gets temporary credentials for S3 uploads

### Cognito → Backend
- JWT tokens validated by Lambda functions
- User attributes passed in API calls
- Identity pool allows S3 access

### GitHub → Amplify → CloudFront
- Push to main branch
- Amplify builds frontend
- Deploys to CloudFront
- Updates custom domain

## Monitoring

- **Cognito Metrics**: Sign-ins, sign-ups, failures
- **Amplify Console**: Build status, deployment history
- **CloudWatch**: Authentication errors, token refreshes