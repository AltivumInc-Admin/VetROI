#!/bin/bash

# Fix CostCenter tags - remove from resources NOT in DD214 pipeline

echo "🔧 Fixing CostCenter tags to only include DD214 processing resources..."

# Remove CostCenter tag from S3 buckets NOT in DD214 pipeline
echo "🪣 Removing CostCenter tag from non-DD214 S3 buckets..."

# These buckets are NOT part of DD214 processing
NON_DD214_BUCKETS=(
    "altroi-data"                          # O*NET reference data
    "vetroi-lambda-artifacts-205930636302" # Deployment artifacts
    "vetroi-sam-deployments-205930636302"  # SAM deployments
)

for bucket in "${NON_DD214_BUCKETS[@]}"; do
    echo "  → Updating tags for bucket: $bucket"
    # Get current tags, remove CostCenter, keep others
    aws s3api put-bucket-tagging \
        --bucket "$bucket" \
        --tagging '{
            "TagSet": [
                {"Key": "Project", "Value": "VetROI"},
                {"Key": "Environment", "Value": "Production"},
                {"Key": "Owner", "Value": "ChristianPerez"},
                {"Key": "Purpose", "Value": "VeteranCareerIntelligence"}
            ]
        }' 2>/dev/null && echo "    ✓ Removed CostCenter tag"
done

echo ""
echo "✅ Tag cleanup complete!"
echo ""
echo "📊 Resources tagged with CostCenter=DD214Processing:"
echo "  • Lambda: DD214_* functions"
echo "  • S3: vetroi-dd214-uploads, vetroi-dd214-redacted"
echo "  • DynamoDB: VetROI_Sessions, VetROI_DD214_Processing, VetROI_CareerInsights"
echo "  • Step Functions: VetROI-DD214-Processing"
echo ""
echo "📈 Now your cost tracking will be accurate for DD214 processing only!"