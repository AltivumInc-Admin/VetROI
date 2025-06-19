#!/bin/bash
set -e

echo "=========================================="
echo "VetROI Phase 2: Lambda & IAM Deployment"
echo "=========================================="

STACK_NAME="vetroi-production"
TEMPLATE_FILE="phase2-lambda-iam.yaml"
REGION="us-east-2"

# First, validate the template
echo ""
echo "Validating CloudFormation template..."
aws cloudformation validate-template \
    --template-body file://$TEMPLATE_FILE \
    --region $REGION

# Update the stack with Lambda resources
echo ""
echo "Updating stack with Lambda functions and IAM roles..."
aws cloudformation update-stack \
    --stack-name $STACK_NAME \
    --template-body file://$TEMPLATE_FILE \
    --capabilities CAPABILITY_NAMED_IAM \
    --region $REGION \
    --parameters \
        ParameterKey=Environment,ParameterValue=production \
        ParameterKey=DeploymentBucket,ParameterValue=vetroi-cloudformation-deploys-20250619

echo ""
echo "Update initiated. Monitoring progress..."
echo "You can also view progress in the AWS Console."

# Wait for update to complete
aws cloudformation wait stack-update-complete \
    --stack-name $STACK_NAME \
    --region $REGION

# Show the results
echo ""
echo "=========================================="
echo "Phase 2 Update Complete!"
echo "=========================================="

# List the Lambda functions
echo ""
echo "Lambda Functions:"
aws lambda list-functions --region $REGION \
    --query "Functions[?starts_with(FunctionName, 'VetROI_')].FunctionName" \
    --output table

# Show stack outputs
echo ""
echo "Stack Outputs:"
aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --region $REGION \
    --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" \
    --output table

echo ""
echo "Phase 2 deployment successful!"
echo "Next step: Phase 3 - API Gateway and Event integrations"