#!/bin/bash
set -e

# Configuration
STACK_NAME="vetroi-production-v2"
REGION="us-east-2"
TEMPLATE_FILE="vetroi-production-stack.yaml"
IMPORT_FILE="import-resources.json"
CHANGE_SET_NAME="import-changeset-$(date +%s)"

echo "======================================"
echo "Creating Import Change Set (DRY RUN)"
echo "======================================"
echo
echo "Stack Name: $STACK_NAME"
echo "Change Set: $CHANGE_SET_NAME"
echo

# Get the actual secret ARN
SECRET_ARN=$(aws secretsmanager describe-secret --secret-id ONET --region $REGION --query 'ARN' --output text)

echo "Creating change set..."
aws cloudformation create-change-set \
    --stack-name $STACK_NAME \
    --change-set-name $CHANGE_SET_NAME \
    --template-body file://$TEMPLATE_FILE \
    --parameters \
        ParameterKey=Environment,ParameterValue=production \
        ParameterKey=ONetSecretArn,ParameterValue="$SECRET_ARN" \
        ParameterKey=ExistingUserPoolId,ParameterValue="us-east-2_zVjrLf0jA" \
        ParameterKey=ExistingIdentityPoolId,ParameterValue="us-east-2:10f0038f-acb9-44c2-a433-c9aa12185217" \
        ParameterKey=ExistingApiGatewayId,ParameterValue="jg5fae61lj" \
        ParameterKey=ExistingRestApiId,ParameterValue="wzj49zuaaa" \
    --capabilities CAPABILITY_NAMED_IAM CAPABILITY_AUTO_EXPAND \
    --change-set-type IMPORT \
    --resources-to-import file://$IMPORT_FILE \
    --region $REGION

echo "Waiting for change set creation..."
aws cloudformation wait change-set-create-complete \
    --stack-name $STACK_NAME \
    --change-set-name $CHANGE_SET_NAME \
    --region $REGION

echo
echo "======================================"
echo "Change Set Analysis"
echo "======================================"

# Get detailed changes
aws cloudformation describe-change-set \
    --stack-name $STACK_NAME \
    --change-set-name $CHANGE_SET_NAME \
    --region $REGION \
    --query 'Changes[*].[Type,ResourceChange.{Action:Action,LogicalId:LogicalResourceId,Type:ResourceType,Replacement:Replacement}]' \
    --output json > changeset-analysis.json

# Show summary
echo
echo "Summary of Changes:"
echo "=================="
aws cloudformation describe-change-set \
    --stack-name $STACK_NAME \
    --change-set-name $CHANGE_SET_NAME \
    --region $REGION \
    --query 'Changes[*].[ResourceChange.Action,ResourceChange.LogicalResourceId,ResourceChange.ResourceType]' \
    --output table

# Count by action type
echo
echo "Actions Summary:"
IMPORTS=$(jq '[.[] | select(.[1].Action == "Import")] | length' changeset-analysis.json)
CREATES=$(jq '[.[] | select(.[1].Action == "Add")] | length' changeset-analysis.json)
MODIFIES=$(jq '[.[] | select(.[1].Action == "Modify")] | length' changeset-analysis.json)

echo "- Imports: $IMPORTS resources"
echo "- Creates: $CREATES new resources"
echo "- Modifies: $MODIFIES resources"

# Check for replacements
REPLACEMENTS=$(jq '[.[] | select(.[1].Replacement != null and .[1].Replacement != "False")] | length' changeset-analysis.json)
if [ $REPLACEMENTS -gt 0 ]; then
    echo
    echo "⚠️  WARNING: $REPLACEMENTS resources will be REPLACED!"
    jq -r '.[] | select(.[1].Replacement != null and .[1].Replacement != "False") | "- " + .[1].LogicalId + " (" + .[1].Type + ")"' changeset-analysis.json
fi

echo
echo "Change set created but NOT executed."
echo "To view full details: aws cloudformation describe-change-set --stack-name $STACK_NAME --change-set-name $CHANGE_SET_NAME --region $REGION"
echo
echo "To EXECUTE this change set (this will modify resources):"
echo "aws cloudformation execute-change-set --stack-name $STACK_NAME --change-set-name $CHANGE_SET_NAME --region $REGION"
echo
echo "To DELETE this change set (cancel):"
echo "aws cloudformation delete-change-set --stack-name $STACK_NAME --change-set-name $CHANGE_SET_NAME --region $REGION"