#!/bin/bash
# DD214 Processing Cost Dashboard
# Real-time cost tracking for VetROI DD214 processing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REGION="us-east-2"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
STATE_MACHINE_ARN="arn:aws:states:${REGION}:${ACCOUNT_ID}:stateMachine:VetROI-DD214-Processing"

# Function to display header
display_header() {
    clear
    echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║           VetROI DD214 Processing Cost Dashboard          ║${NC}"
    echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo -e "Region: ${REGION} | Account: ${ACCOUNT_ID}"
    echo -e "Last Updated: $(date)"
    echo ""
}

# Function to get recent executions
get_recent_executions() {
    echo -e "${YELLOW}Recent DD214 Processing (Last 10)${NC}"
    echo "─────────────────────────────────────────────────────"
    
    aws stepfunctions list-executions \
        --state-machine-arn "${STATE_MACHINE_ARN}" \
        --max-results 10 \
        --query 'executions[*].[name,status,startDate,stopDate]' \
        --output table
}

# Function to calculate Lambda costs
calculate_lambda_costs() {
    echo -e "\n${YELLOW}Lambda Function Costs (Last Hour)${NC}"
    echo "─────────────────────────────────────────────────────"
    
    # Lambda functions to check
    FUNCTIONS=(
        "VetROI_DD214_PresignedUrl"
        "VetROI_DD214_UploadTrigger"
        "VetROI_DD214_Parser"
        "VetROI_Macie_Handler"
        "VetROI_DD214_Status"
    )
    
    TOTAL_INVOCATIONS=0
    TOTAL_DURATION=0
    TOTAL_COST=0
    
    for func in "${FUNCTIONS[@]}"; do
        # Get function metrics
        INVOCATIONS=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/Lambda \
            --metric-name Invocations \
            --dimensions Name=FunctionName,Value=$func \
            --statistics Sum \
            --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
            --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
            --period 3600 \
            --query 'Datapoints[0].Sum' \
            --output text 2>/dev/null || echo "0")
        
        DURATION=$(aws cloudwatch get-metric-statistics \
            --namespace AWS/Lambda \
            --metric-name Duration \
            --dimensions Name=FunctionName,Value=$func \
            --statistics Average \
            --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
            --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
            --period 3600 \
            --query 'Datapoints[0].Average' \
            --output text 2>/dev/null || echo "0")
        
        if [ "$INVOCATIONS" != "None" ] && [ "$INVOCATIONS" != "0" ]; then
            # Calculate cost (simplified)
            # Request cost: $0.20 per 1M requests
            # Compute cost: $0.0000166667 per GB-second
            REQUEST_COST=$(echo "scale=6; $INVOCATIONS * 0.0000002" | bc)
            COMPUTE_COST=$(echo "scale=6; ($INVOCATIONS * $DURATION * 1024 / 1000 / 1000) * 0.0000166667" | bc)
            FUNC_TOTAL=$(echo "scale=6; $REQUEST_COST + $COMPUTE_COST" | bc)
            
            printf "%-30s %6s invocations  %8.2f ms avg  \$%.6f\n" \
                "$func" "$INVOCATIONS" "$DURATION" "$FUNC_TOTAL"
            
            TOTAL_INVOCATIONS=$((TOTAL_INVOCATIONS + ${INVOCATIONS%.*}))
            TOTAL_COST=$(echo "scale=6; $TOTAL_COST + $FUNC_TOTAL" | bc)
        fi
    done
    
    echo "─────────────────────────────────────────────────────"
    printf "%-30s %6s invocations         \$%.6f\n" "TOTAL" "$TOTAL_INVOCATIONS" "$TOTAL_COST"
}

# Function to estimate service costs
estimate_service_costs() {
    echo -e "\n${YELLOW}Estimated Service Costs (Per Document)${NC}"
    echo "─────────────────────────────────────────────────────"
    
    # Cost breakdown
    cat << EOF
Service             Usage                   Cost
─────────────────────────────────────────────────────
Lambda              ~12 invocations         \$0.001000
Step Functions      ~15 state transitions   \$0.000375
S3 Storage          ~20 MB                  \$0.000462
DynamoDB            ~15 operations          \$0.000007
Textract            ~3 pages                \$0.045000
Macie               ~5 MB scan              \$0.005000
Comprehend          ~3 API calls            \$0.000300
Bedrock (Nova)      ~2000 tokens            \$0.000750
CloudWatch Logs     ~50 MB                  \$0.026500
API Gateway         ~2 requests             \$0.000002
─────────────────────────────────────────────────────
${GREEN}TOTAL ESTIMATED COST PER DOCUMENT:      \$0.079396${NC}
EOF
}

# Function to get cost by tags
get_tagged_costs() {
    echo -e "\n${YELLOW}Cost by Tags (Last 7 Days)${NC}"
    echo "─────────────────────────────────────────────────────"
    
    # This requires Cost Explorer API and proper tags
    aws ce get-cost-and-usage \
        --time-period Start=$(date -u -d '7 days ago' +%Y-%m-%d),End=$(date -u +%Y-%m-%d) \
        --granularity DAILY \
        --metrics UnblendedCost \
        --filter '{
            "Tags": {
                "Key": "Feature",
                "Values": ["DD214Processing"]
            }
        }' \
        --group-by Type=DIMENSION,Key=SERVICE \
        --query 'ResultsByTime[*].Groups[*].[Keys[0],Metrics.UnblendedCost.Amount]' \
        --output table 2>/dev/null || echo "Cost allocation tags not configured or no data available"
}

# Function to show cost optimization tips
show_optimization_tips() {
    echo -e "\n${YELLOW}Cost Optimization Recommendations${NC}"
    echo "─────────────────────────────────────────────────────"
    
    cat << EOF
1. ${GREEN}Textract Optimization (56% of costs):${NC}
   - Cache results for duplicate documents
   - Use StartDocumentTextDetection for text-only extraction
   - Consider batch processing during off-peak hours

2. ${GREEN}CloudWatch Logs Optimization (33% of costs):${NC}
   - Reduce log retention period to 7 days
   - Filter unnecessary log entries
   - Compress logs before storage

3. ${GREEN}Lambda Optimization:${NC}
   - Use ARM-based Graviton2 (20% cheaper)
   - Right-size memory allocation
   - Enable SnapStart for faster cold starts

4. ${GREEN}S3 Optimization:${NC}
   - Enable Intelligent-Tiering
   - Set lifecycle policies for old documents
   - Compress JSON files

5. ${GREEN}General Tips:${NC}
   - Tag all resources for better cost tracking
   - Set up budget alerts at \$100/month
   - Review Cost Anomaly Detection weekly
EOF
}

# Function to create cost alert
create_cost_alert() {
    echo -e "\n${YELLOW}Setting Up Cost Alert${NC}"
    echo "─────────────────────────────────────────────────────"
    
    read -p "Enter monthly budget limit (USD): " BUDGET_LIMIT
    read -p "Enter email for alerts: " ALERT_EMAIL
    
    cat > /tmp/dd214-budget.json << EOF
{
    "BudgetName": "DD214-Processing-Monthly",
    "BudgetLimit": {
        "Amount": "${BUDGET_LIMIT}",
        "Unit": "USD"
    },
    "TimeUnit": "MONTHLY",
    "CostFilters": {
        "TagKeyValue": ["Feature\$DD214Processing"]
    },
    "CostTypes": {
        "IncludeTax": true,
        "IncludeSubscription": true,
        "UseBlended": false
    },
    "NotificationsWithSubscribers": [{
        "Notification": {
            "NotificationType": "ACTUAL",
            "ComparisonOperator": "GREATER_THAN",
            "Threshold": 80.0,
            "ThresholdType": "PERCENTAGE"
        },
        "Subscribers": [{
            "SubscriptionType": "EMAIL",
            "Address": "${ALERT_EMAIL}"
        }]
    }]
}
EOF

    aws budgets create-budget \
        --account-id ${ACCOUNT_ID} \
        --budget file:///tmp/dd214-budget.json \
        && echo -e "${GREEN}✓ Budget alert created successfully${NC}" \
        || echo -e "${RED}✗ Failed to create budget alert${NC}"
    
    rm -f /tmp/dd214-budget.json
}

# Main menu
main_menu() {
    while true; do
        display_header
        
        echo "Select an option:"
        echo "1. View Recent Executions"
        echo "2. Calculate Lambda Costs"
        echo "3. View Service Cost Breakdown"
        echo "4. View Tagged Costs (requires setup)"
        echo "5. Show Optimization Tips"
        echo "6. Create Cost Alert"
        echo "7. Export Cost Report"
        echo "8. Live Monitor Mode"
        echo "9. Exit"
        echo ""
        
        read -p "Enter choice [1-9]: " choice
        
        case $choice in
            1)
                display_header
                get_recent_executions
                ;;
            2)
                display_header
                calculate_lambda_costs
                ;;
            3)
                display_header
                estimate_service_costs
                ;;
            4)
                display_header
                get_tagged_costs
                ;;
            5)
                display_header
                show_optimization_tips
                ;;
            6)
                display_header
                create_cost_alert
                ;;
            7)
                display_header
                export_cost_report
                ;;
            8)
                live_monitor
                ;;
            9)
                echo -e "${GREEN}Exiting...${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid option${NC}"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Function to export cost report
export_cost_report() {
    echo -e "\n${YELLOW}Exporting Cost Report${NC}"
    echo "─────────────────────────────────────────────────────"
    
    REPORT_FILE="dd214_cost_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "VetROI DD214 Processing Cost Report"
        echo "Generated: $(date)"
        echo "=================================="
        echo ""
        
        echo "Recent Executions:"
        aws stepfunctions list-executions \
            --state-machine-arn "${STATE_MACHINE_ARN}" \
            --max-results 10 \
            --output table
        
        echo ""
        echo "Service Cost Breakdown:"
        estimate_service_costs
        
        echo ""
        echo "Optimization Recommendations:"
        show_optimization_tips
    } > "$REPORT_FILE"
    
    echo -e "${GREEN}✓ Report exported to: $REPORT_FILE${NC}"
}

# Function for live monitoring
live_monitor() {
    echo -e "${YELLOW}Live Monitoring Mode (Press Ctrl+C to exit)${NC}"
    
    while true; do
        display_header
        
        # Show current executions
        echo -e "${YELLOW}Active Executions:${NC}"
        aws stepfunctions list-executions \
            --state-machine-arn "${STATE_MACHINE_ARN}" \
            --status-filter RUNNING \
            --query 'executions[*].[name,startDate]' \
            --output table
        
        # Show recent Lambda invocations
        echo -e "\n${YELLOW}Lambda Activity (Last 5 minutes):${NC}"
        for func in "VetROI_DD214_Parser" "VetROI_Macie_Handler"; do
            INVOCATIONS=$(aws cloudwatch get-metric-statistics \
                --namespace AWS/Lambda \
                --metric-name Invocations \
                --dimensions Name=FunctionName,Value=$func \
                --statistics Sum \
                --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
                --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
                --period 300 \
                --query 'Datapoints[0].Sum' \
                --output text 2>/dev/null || echo "0")
            
            if [ "$INVOCATIONS" != "None" ] && [ "$INVOCATIONS" != "0" ]; then
                echo "$func: $INVOCATIONS invocations"
            fi
        done
        
        # Estimated real-time cost
        echo -e "\n${YELLOW}Estimated Cost (Last Hour):${NC}"
        # Simplified calculation based on typical usage
        HOURLY_DOCS=$(aws stepfunctions list-executions \
            --state-machine-arn "${STATE_MACHINE_ARN}" \
            --status-filter SUCCEEDED \
            --max-results 100 \
            --query "length(executions[?startDate >= '$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)'])" \
            --output text)
        
        HOURLY_COST=$(echo "scale=2; $HOURLY_DOCS * 0.08" | bc)
        echo -e "Documents Processed: $HOURLY_DOCS"
        echo -e "Estimated Cost: ${GREEN}\$$HOURLY_COST${NC}"
        
        sleep 10
    done
}

# Check AWS CLI availability
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI not found. Please install AWS CLI.${NC}"
    exit 1
fi

# Check if user is authenticated
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: Not authenticated with AWS. Please run 'aws configure'.${NC}"
    exit 1
fi

# Start the dashboard
main_menu