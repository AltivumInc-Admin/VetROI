# Implementation Notes

## DD214 Upload Component Dependencies

To implement the DD214 upload feature, you'll need to install:

```bash
cd frontend
npm install react-dropzone
```

This provides the drag-and-drop file upload functionality.

## Environment Variables Needed

For the DD214 processing pipeline:

```bash
# Lambda Environment Variables
DD214_BUCKET=vetroi-dd214-uploads
PROFILE_TABLE=VetROI_Profiles
STATE_MACHINE_ARN=arn:aws:states:us-east-1:XXX:stateMachine:DD214Processing

# Textract Configuration
TEXTRACT_ROLE_ARN=arn:aws:iam::XXX:role/TextractRole

# Notification Topic
NOTIFICATION_TOPIC_ARN=arn:aws:sns:us-east-1:XXX:DD214ProcessingNotifications
```

## Deployment Order

1. Create S3 bucket with event notifications
2. Deploy Lambda function with proper IAM roles
3. Deploy Step Functions state machine
4. Configure Macie jobs for PII scanning
5. Set up DynamoDB table with TTL
6. Update frontend with upload component

## Security Considerations

- Enable S3 bucket encryption with KMS
- Configure bucket policies to restrict access
- Enable CloudTrail logging for audit trail
- Set up Macie for continuous PII monitoring
- Implement request signing for pre-signed URLs

## Testing

Test files are available in the O*NET sample data. For DD214 testing, use redacted samples only.