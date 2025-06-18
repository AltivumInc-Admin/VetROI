# VetROI Project Cleanup Plan

## Overview
This document identifies files and directories that should be cleaned up in the VetROI project to improve security, reduce clutter, and maintain a clean codebase.

## CRITICAL - Sensitive Files (Remove Immediately)

### 1. AWS Infrastructure Outputs
**Risk Level: HIGH-RISK**
**Action: Delete and add to .gitignore**

These files contain AWS account IDs, ARNs, and infrastructure details:
- `/deployment-outputs.json` - Contains AWS account ID (205930636302), bucket names, Lambda ARNs
- `/infrastructure/cognito/authenticated-role-output.json` - Contains IAM role ARN and IDs
- `/infrastructure/cognito/identity-pool-output.json` - Contains Cognito identity pool IDs
- `/infrastructure/cognito/user-pool-client-output.json` - Contains Cognito client IDs
- `/infrastructure/cognito/user-pool-output.json` - Contains full user pool configuration

**Why**: These expose internal AWS infrastructure details that could be used for targeted attacks.

### 2. API Key in Frontend Config
**Risk Level: HIGH-RISK**
**Action: Move to environment variables**

The CLAUDE.md file mentions:
```
VITE_API_KEY=1du0W33OTS3NkLhXJY5R4FOY9LJq6ZB1h7Lrdwig
```

This API key should not be in documentation or committed to the repository.

## Development Artifacts (Safe to Remove)

### 3. Lambda Deployment Packages
**Risk Level: Safe**
**Action: Delete all .zip files**

In `/lambda/recommend/`:
- `deployment.zip`
- `deployment-simple-v2.zip`
- `lambda_function.zip`
- `lambda-deployment-full.zip`
- `lambda-deployment.zip`
- `deployment-full.zip`
- `lambda_update.zip`
- `deployed_lambda.zip`
- `deployment-simple.zip`

**Why**: These are build artifacts that shouldn't be in version control.

### 4. Test/Debug Files in Root
**Risk Level: Safe**
**Action: Delete**

- `/debug_api.html` - Debug tool with hardcoded API endpoints
- `/lambda/recommend/response.json` - Lambda test response output

**Why**: Development/debugging files that don't belong in production code.

## Duplicate/Redundant Files

### 5. Multiple Lambda Handler Versions
**Risk Level: Caution**
**Action: Consolidate to one main handler**

In `/lambda/recommend/`:
- `handler_simple.py`
- `lambda_function_clean.py`
- `lambda_function_minimal.py`
- `test_onet_format.py` (test file in main directory)

In `/lambda/recommend/src/`:
- `handler.py`
- `handler_minimal.py`

In `/lambda/dd214_macie/src/`:
- `lambda_function.py`
- `lambda_function_simple.py`

**Why**: Multiple versions create confusion about which is production code.

### 6. Python Dependencies in Lambda Directories
**Risk Level: Caution**
**Action: Use Lambda Layers instead**

The `/lambda/recommend/` directory contains full Python packages:
- Multiple dist-info directories
- Full boto3, pydantic, requests installations
- 72+ node_modules directories throughout the project

**Why**: Dependencies should be managed via Lambda Layers, not committed to repo.

### 7. Duplicate Package Directories
**Risk Level: Safe**
**Action: Remove `/lambda/recommend/package/` directory**

The `package/` subdirectory appears to be a duplicate of the parent directory's dependencies.

## Cache and Build Files

### 8. Python Cache
**Risk Level: Safe**
**Action: Delete all and add to .gitignore**

Multiple `__pycache__` directories found throughout:
- `/lambda/dd214_macie/__pycache__`
- And many subdirectories

### 9. Platform-Specific Binary Files
**Risk Level: Safe**
**Action: Remove .so files**

Files like:
- `_pydantic_core.cpython-310-darwin.so`
- `md.cpython-310-darwin.so`
- `_wrappers.cpython-310-darwin.so`

**Why**: Platform-specific binaries that won't work on Lambda (Linux).

## Documentation Cleanup

### 10. Sensitive Business Information
**Risk Level: Caution**
**Action: Review and sanitize**

Files that may contain internal strategy:
- Various implementation phase documents
- Internal deployment notes

## Recommended .gitignore Additions

```gitignore
# AWS Outputs
deployment-outputs.json
*-output.json
infrastructure/cognito/*-output.json

# Lambda packages
*.zip
lambda/*/package/
lambda/*/bin/
lambda/*/*.dist-info/
lambda/*/site-packages/

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so

# Test outputs
response.json
test-results/

# Debug files
debug_*.html

# Node
node_modules/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

## Implementation Priority

1. **Immediate (HIGH-RISK)**:
   - Remove all AWS infrastructure output JSON files
   - Remove API key from documentation
   - Add security-critical items to .gitignore

2. **Soon (Safe)**:
   - Clean up Lambda deployment zips
   - Remove debug/test files from root
   - Clean Python cache directories

3. **When Convenient (Caution)**:
   - Consolidate multiple handler versions
   - Move Lambda dependencies to layers
   - Review and clean documentation

## Safety Measures

Before deleting any files:
1. Ensure the application is working in production
2. Create a backup branch
3. Test thoroughly after cleanup
4. Update deployment scripts if they reference removed files

## Files Currently Used by Live App

These files are CRITICAL - DO NOT DELETE:
- `/lambda/recommend/lambda_function.py` (main handler)
- `/lambda/recommend/src/` (contains actual implementation)
- `/frontend/` (entire directory is production code)
- `/sam-templates/template-production.yaml` (deployment template)

## Summary

Total files/directories to clean: ~100+
Estimated space savings: >500MB
Security improvement: Significant (removes AWS account details)