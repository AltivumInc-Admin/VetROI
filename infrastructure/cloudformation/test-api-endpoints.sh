#!/bin/bash

echo "=========================================="
echo "VetROI API Endpoint Testing Script"
echo "=========================================="

# Configuration
PROD_API="https://jg5fae61lj.execute-api.us-east-2.amazonaws.com/prod"
TEST_API="${1:-https://YOUR_TEST_API.execute-api.us-east-2.amazonaws.com/test}"

if [ "$1" == "" ]; then
    echo "Usage: $0 <test-api-endpoint>"
    echo "Example: $0 https://abc123.execute-api.us-east-2.amazonaws.com/test"
    exit 1
fi

echo ""
echo "Production API: $PROD_API"
echo "Test API: $TEST_API"
echo ""

# Function to test endpoint
test_endpoint() {
    local method=$1
    local path=$2
    local data=$3
    local description=$4
    
    echo "=========================================="
    echo "Testing: $description"
    echo "Method: $method"
    echo "Path: $path"
    echo ""
    
    # Test production
    echo "Production Response:"
    if [ "$method" == "POST" ]; then
        curl -s -X POST "$PROD_API$path" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\nHTTP Status: %{http_code}\n" | head -20
    else
        curl -s -X $method "$PROD_API$path" \
            -w "\nHTTP Status: %{http_code}\n" | head -20
    fi
    
    echo ""
    echo "Test Response:"
    if [ "$method" == "POST" ]; then
        curl -s -X POST "$TEST_API$path" \
            -H "Content-Type: application/json" \
            -d "$data" \
            -w "\nHTTP Status: %{http_code}\n" | head -20
    else
        curl -s -X $method "$TEST_API$path" \
            -w "\nHTTP Status: %{http_code}\n" | head -20
    fi
    
    echo ""
    read -p "Press enter to continue..."
}

# Test 1: OPTIONS for CORS
test_endpoint "OPTIONS" "/recommend" "" "CORS Preflight for /recommend"

# Test 2: POST /recommend
test_endpoint "POST" "/recommend" \
    '{"branch":"army","code":"11B","homeState":"TX","relocate":false,"education":"bachelor"}' \
    "Recommend endpoint"

# Test 3: GET /career/{socCode}
test_endpoint "GET" "/career/11-1021.00" "" "Career detail endpoint"

# Test 4: POST /dd214/upload
test_endpoint "POST" "/dd214/upload" \
    '{"userId":"test-user","fileName":"test.pdf"}' \
    "DD214 Upload URL generation"

# Test 5: GET /dd214/status
test_endpoint "GET" "/dd214/status?userId=test-user&documentId=test-doc" "" "DD214 Status check"

# Test 6: POST /sentra/conversation
test_endpoint "POST" "/sentra/conversation" \
    '{"sessionId":"test-session","message":"Hello Sentra"}' \
    "Sentra conversation"

echo ""
echo "=========================================="
echo "Testing Complete!"
echo "=========================================="
echo ""
echo "Review the responses above to ensure:"
echo "1. HTTP status codes match"
echo "2. Response structures are similar"
echo "3. CORS headers are present"
echo "4. No errors in test environment"