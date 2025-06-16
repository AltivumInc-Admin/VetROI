#!/usr/bin/env python3
"""
Setup Amazon Macie custom identifiers for VetROI™
"""
import boto3
import json
import sys

def setup_macie_identifiers():
    """Create custom Macie identifiers for military-specific PII"""
    
    macie = boto3.client('macie2', region_name='us-east-2')
    
    # Define custom identifiers
    identifiers = [
        {
            'name': 'VetROI-ServiceNumber',
            'description': 'Military service number pattern',
            'regex': r'\b[A-Z]{2}\d{7,8}\b',
            'keywords': ['service number', 'service no', 'svc number']
        },
        {
            'name': 'VetROI-VAFileNumber', 
            'description': 'VA file number pattern',
            'regex': r'\bC\d{8}\b',
            'keywords': ['va file number', 'va file no', 'c-number']
        },
        {
            'name': 'VetROI-DoDID',
            'description': 'Department of Defense ID number',
            'regex': r'\b\d{10}\b',
            'keywords': ['dod id', 'dodid', 'edipi']
        }
    ]
    
    for identifier in identifiers:
        try:
            response = macie.create_custom_data_identifier(
                description=identifier['description'],
                keywords=identifier.get('keywords', []),
                maximumMatchDistance=50,
                name=identifier['name'],
                regex=identifier['regex']
            )
            print(f"✓ Created identifier: {identifier['name']}")
        except macie.exceptions.ConflictException:
            print(f"⚠ Identifier already exists: {identifier['name']}")
        except Exception as e:
            print(f"✗ Failed to create {identifier['name']}: {str(e)}")
            
    # Create Macie job for DD214 bucket
    try:
        # Get DD214 bucket name from CloudFormation stack
        cf = boto3.client('cloudformation', region_name='us-east-2')
        stack_outputs = cf.describe_stacks(StackName='vetroi-production')['Stacks'][0]['Outputs']
        dd214_bucket = next(o['OutputValue'] for o in stack_outputs if o['OutputKey'] == 'DD214BucketName')
        
        # Create classification job
        response = macie.create_classification_job(
            description='VetROI DD214 document scanning',
            initialRun=True,
            jobType='SCHEDULED',
            name='VetROI-DD214-Scanner',
            s3JobDefinition={
                'bucketDefinitions': [{
                    'accountId': '205930636302',
                    'buckets': [dd214_bucket]
                }]
            },
            scheduleFrequency={
                'dailySchedule': {}
            },
            customDataIdentifierIds=[f"VetROI-{name}" for name in ['ServiceNumber', 'VAFileNumber', 'DoDID']]
        )
        print(f"✓ Created Macie classification job for {dd214_bucket}")
    except Exception as e:
        print(f"⚠ Could not create Macie job (stack may not be deployed yet): {str(e)}")

if __name__ == '__main__':
    setup_macie_identifiers()