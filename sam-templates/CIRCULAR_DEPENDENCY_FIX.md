# SAM Template Circular Dependency Fix

## Problem
The SAM template had a circular dependency issue where the DD214UploadBucket was trying to reference DD214ParserFunction in its notification configuration before the function existed.

## Solution
1. **Added Missing Resources**: Added the DD214ParserFunction and ONetRefreshFunction that were missing from the production template.

2. **Custom Resource for S3 Notifications**: Instead of configuring S3 bucket notifications directly on the bucket (which would create a circular dependency), we created a custom resource that configures the notifications after both the bucket and Lambda function are created.

3. **Key Components Added**:
   - `DD214ParserFunction`: Lambda function to parse DD-214 documents
   - `DD214ParserS3Permission`: Permission for S3 to invoke the Lambda function
   - `S3NotificationConfigFunction`: Custom resource Lambda to configure S3 notifications
   - `S3BucketNotificationCustomResource`: Custom resource that sets up the S3 notification after both resources exist
   - `ONetCacheBucket`: S3 bucket for O*NET data caching
   - `ONetRefreshFunction`: Lambda function to refresh O*NET data
   - `ONetRefreshStateMachine`: Step Function for scheduled O*NET refresh
   - CloudWatch Log Groups for all Lambda functions
   - CloudWatch Alarms for production monitoring

## How It Works
1. CloudFormation creates the DD214UploadBucket and DD214ParserFunction independently
2. The S3NotificationConfigFunction is created as a Lambda function
3. The S3BucketNotificationCustomResource is then created, which:
   - Calls the S3NotificationConfigFunction
   - Sets up the S3 bucket notification to trigger DD214ParserFunction on .pdf file uploads
   - This happens after both the bucket and function exist, avoiding the circular dependency

## Additional Improvements
- Added KMS encryption to CloudWatch Log Groups
- Added proper error alarms for all Lambda functions
- Added versioning to the O*NET cache bucket
- Added reserved concurrent executions for Lambda functions based on environment
- Added proper KMS permissions for all services

## Deployment
The template is now ready for deployment without circular dependency issues:
```bash
sam deploy --template-file sam-templates/template-production.yaml --stack-name vetroi-prod --parameter-overrides Environment=prod
```