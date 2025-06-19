# VetROI Lex Bot Configuration

## Existing SentraCareerBot

**Bot Details:**
- **Bot ID**: IV2NSREVFS
- **Bot Name**: SentraCareerBot
- **Region**: us-east-1 (Lex is only available here)
- **Status**: Available
- **Latest Version**: 2
- **Purpose**: Provide veterans transition help and career guidance

## Integration Architecture

```
Frontend (us-east-2)
    ↓
Amazon Lex (us-east-1)
    ↓
Lambda Function (us-east-2)
    ↓
Bedrock/DynamoDB (us-east-2)
```

## Cross-Region Setup

Since Lex is in us-east-1 but your other resources are in us-east-2:

1. **Lex Bot** (us-east-1)
   - Receives user messages
   - Performs NLU/intent recognition
   - Calls Lambda in us-east-2

2. **Lambda Functions** (us-east-2)
   - Process Lex requests
   - Access DynamoDB, S3, Bedrock
   - Return responses to Lex

## Current Configuration

### Get Bot Details
```bash
# Get bot configuration
aws lexv2-models describe-bot --bot-id IV2NSREVFS --region us-east-1

# List bot versions
aws lexv2-models list-bot-versions --bot-id IV2NSREVFS --region us-east-1

# Get bot alias (for production use)
aws lexv2-models list-bot-aliases --bot-id IV2NSREVFS --region us-east-1
```

### Check Bot Intents
```bash
# List intents
aws lexv2-models list-intents --bot-id IV2NSREVFS --bot-version 2 --locale-id en_US --region us-east-1
```

## CloudFormation Limitations

Amazon Lex V2 has limited CloudFormation support. The `AWS::Lex::Bot` resource type only supports basic bot creation, not full configuration with intents, slots, and utterances.

## Recommended Approach

1. **Keep Lex Bot Manual**
   - Maintain in us-east-1
   - Use AWS Console for updates
   - Document configuration

2. **Infrastructure as Code for Supporting Resources**
   - Lambda functions (already in CF)
   - IAM roles and permissions
   - CloudWatch logs
   - Cross-region permissions

3. **Add to CloudFormation**
   ```yaml
   # Document the Lex bot as a parameter/output
   LexBotId:
     Type: String
     Default: IV2NSREVFS
     Description: Existing Lex bot ID in us-east-1
   ```

## Integration Code

### Frontend Integration
```javascript
// Configure Lex client for us-east-1
const lexClient = new LexRuntimeV2Client({
  region: 'us-east-1',
  credentials: // user credentials
});

// Send message to bot
const command = new RecognizeTextCommand({
  botId: 'IV2NSREVFS',
  botAliasId: 'PRODUCTION_ALIAS', // Get from bot config
  localeId: 'en_US',
  sessionId: userId,
  text: userMessage
});

const response = await lexClient.send(command);
```

### Lambda Fulfillment
Your Lambda functions in us-east-2 can handle Lex requests:
- Parse intent and slots
- Process business logic
- Access DynamoDB/Bedrock
- Return formatted response

## Next Steps

1. **Document Current Bot Configuration**
   - Export intents and utterances
   - Save slot types
   - Document fulfillment Lambda mappings

2. **Set Up Monitoring**
   - CloudWatch metrics for Lex
   - Conversation logs
   - Intent recognition accuracy

3. **Create Backup Strategy**
   - Regular configuration exports
   - Version control for intent definitions
   - Test environment in addition to production