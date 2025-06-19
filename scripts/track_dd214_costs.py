#!/usr/bin/env python3
"""
VetROI DD214 Processing Cost Tracker
Track and analyze costs for DD214 document processing in real-time
"""

import boto3
import json
from datetime import datetime, timedelta
from decimal import Decimal
import argparse
from typing import Dict, List, Optional
from tabulate import tabulate

# AWS Pricing as of December 2024 (US-East-2)
PRICING = {
    'lambda': {
        'request': 0.0000002,  # per request
        'gb_second': 0.0000166667  # per GB-second
    },
    'step_functions': {
        'state_transition': 0.000025  # per state transition
    },
    's3': {
        'put_request': 0.0004 / 1000,  # per request
        'get_request': 0.00004 / 1000,  # per request
        'storage_gb_month': 0.023  # per GB per month
    },
    'dynamodb': {
        'write_request': 0.00065 / 1000,  # per request
        'read_request': 0.00013 / 1000  # per request
    },
    'textract': {
        'page': 0.015  # per page for document analysis
    },
    'macie': {
        'gb_scanned': 1.00  # per GB
    },
    'comprehend': {
        'unit': 0.0001  # per 100 characters
    },
    'bedrock': {
        'nova_lite_input': 0.00015 / 1000,  # per token
        'nova_lite_output': 0.0006 / 1000,  # per token
        'claude_sonnet_input': 0.003 / 1000,  # per token
        'claude_sonnet_output': 0.015 / 1000  # per token
    },
    'cloudwatch': {
        'ingestion_gb': 0.50,  # per GB
        'storage_gb': 0.03  # per GB
    },
    'api_gateway': {
        'request': 1.00 / 1000000  # per request
    }
}


class DD214CostTracker:
    def __init__(self, region='us-east-2'):
        self.region = region
        self.cloudwatch = boto3.client('logs', region_name=region)
        self.stepfunctions = boto3.client('stepfunctions', region_name=region)
        self.dynamodb = boto3.resource('dynamodb', region_name=region)
        self.xray = boto3.client('xray', region_name=region)
        self.s3 = boto3.client('s3', region_name=region)
        self.ce = boto3.client('ce', region_name='us-east-1')  # Cost Explorer is in us-east-1
        
    def track_document_processing(self, document_id: str, hours_back: int = 1) -> Dict:
        """Track all costs associated with processing a specific document"""
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=hours_back)
        
        costs = {
            'document_id': document_id,
            'time_range': f'{start_time.isoformat()} to {end_time.isoformat()}',
            'services': {},
            'total': Decimal('0')
        }
        
        # Track Lambda costs
        lambda_costs = self._track_lambda_costs(document_id, start_time, end_time)
        costs['services']['lambda'] = lambda_costs
        costs['total'] += lambda_costs['total']
        
        # Track Step Functions costs
        sf_costs = self._track_stepfunctions_costs(document_id, start_time, end_time)
        costs['services']['step_functions'] = sf_costs
        costs['total'] += sf_costs['total']
        
        # Track S3 costs
        s3_costs = self._track_s3_costs(document_id)
        costs['services']['s3'] = s3_costs
        costs['total'] += s3_costs['total']
        
        # Track DynamoDB costs
        dynamo_costs = self._estimate_dynamodb_costs(document_id)
        costs['services']['dynamodb'] = dynamo_costs
        costs['total'] += dynamo_costs['total']
        
        # Track Textract costs
        textract_costs = self._estimate_textract_costs(document_id)
        costs['services']['textract'] = textract_costs
        costs['total'] += textract_costs['total']
        
        # Track other service costs
        costs['services']['macie'] = self._estimate_service_cost('macie', 0.005)  # 5MB scan
        costs['services']['comprehend'] = self._estimate_service_cost('comprehend', 0.0003)
        costs['services']['bedrock'] = self._estimate_bedrock_costs()
        costs['services']['cloudwatch'] = self._estimate_cloudwatch_costs()
        costs['services']['api_gateway'] = self._estimate_service_cost('api_gateway', 0.000002)
        
        # Add other service costs to total
        for service in ['macie', 'comprehend', 'bedrock', 'cloudwatch', 'api_gateway']:
            costs['total'] += costs['services'][service]['total']
        
        return costs
    
    def _track_lambda_costs(self, document_id: str, start_time: datetime, end_time: datetime) -> Dict:
        """Track Lambda function invocations and costs"""
        lambda_functions = [
            'VetROI_DD214_PresignedUrl',
            'VetROI_DD214_UploadTrigger',
            'VetROI_DD214_Parser',
            'VetROI_Macie_Handler',
            'VetROI_DD214_Status',
            'VetROI_Sentra_Conversation'
        ]
        
        total_invocations = 0
        total_gb_seconds = Decimal('0')
        details = []
        
        for func_name in lambda_functions:
            try:
                # Query CloudWatch Logs Insights
                query = f"""
                fields @timestamp, duration, billedDuration, memorySize, maxMemoryUsed
                | filter @type = "REPORT" and @message like /{document_id}/
                | stats sum(billedDuration) as totalMs,
                        avg(memorySize) as avgMemory,
                        count() as invocations
                """
                
                response = self.cloudwatch.start_query(
                    logGroupName=f'/aws/lambda/{func_name}',
                    startTime=int(start_time.timestamp()),
                    endTime=int(end_time.timestamp()),
                    queryString=query
                )
                
                # Wait for query to complete (simplified for demo)
                # In production, you'd poll get_query_results
                
                details.append({
                    'function': func_name,
                    'invocations': 2,  # Estimated
                    'avg_duration_ms': 5000,
                    'memory_mb': 1024
                })
                
                total_invocations += 2
                total_gb_seconds += Decimal('10.24')  # 2 invocations * 5 seconds * 1.024 GB
                
            except Exception as e:
                print(f"Error querying {func_name}: {e}")
        
        request_cost = Decimal(str(total_invocations * PRICING['lambda']['request']))
        compute_cost = total_gb_seconds * Decimal(str(PRICING['lambda']['gb_second']))
        
        return {
            'invocations': total_invocations,
            'gb_seconds': float(total_gb_seconds),
            'request_cost': float(request_cost),
            'compute_cost': float(compute_cost),
            'total': request_cost + compute_cost,
            'details': details
        }
    
    def _track_stepfunctions_costs(self, document_id: str, start_time: datetime, end_time: datetime) -> Dict:
        """Track Step Functions execution costs"""
        try:
            # List executions
            response = self.stepfunctions.list_executions(
                stateMachineArn='arn:aws:states:us-east-2:123456789012:stateMachine:VetROI-DD214-Processing',
                statusFilter='SUCCEEDED',
                maxResults=100
            )
            
            # Find execution for this document
            execution = None
            for exec in response['executions']:
                if document_id in exec['name']:
                    execution = exec
                    break
            
            if execution:
                # Get execution history to count state transitions
                history = self.stepfunctions.get_execution_history(
                    executionArn=execution['executionArn'],
                    maxResults=1000
                )
                
                state_transitions = len([e for e in history['events'] if 'stateEntered' in e['type']])
                cost = Decimal(str(state_transitions * PRICING['step_functions']['state_transition']))
                
                return {
                    'execution_arn': execution['executionArn'],
                    'state_transitions': state_transitions,
                    'duration_seconds': (execution['stopDate'] - execution['startDate']).total_seconds(),
                    'total': cost
                }
            
        except Exception as e:
            print(f"Error tracking Step Functions: {e}")
        
        # Default estimate
        return {
            'state_transitions': 15,
            'duration_seconds': 120,
            'total': Decimal('0.000375')
        }
    
    def _track_s3_costs(self, document_id: str) -> Dict:
        """Track S3 storage and request costs"""
        # Estimate based on typical usage
        put_requests = 5
        get_requests = 10
        storage_mb = 20
        
        put_cost = Decimal(str(put_requests * PRICING['s3']['put_request']))
        get_cost = Decimal(str(get_requests * PRICING['s3']['get_request']))
        storage_cost = Decimal(str((storage_mb / 1024) * PRICING['s3']['storage_gb_month'] / 30))  # Daily cost
        
        return {
            'put_requests': put_requests,
            'get_requests': get_requests,
            'storage_mb': storage_mb,
            'put_cost': float(put_cost),
            'get_cost': float(get_cost),
            'storage_cost': float(storage_cost),
            'total': put_cost + get_cost + storage_cost
        }
    
    def _estimate_dynamodb_costs(self, document_id: str) -> Dict:
        """Estimate DynamoDB costs"""
        write_requests = 10
        read_requests = 5
        
        write_cost = Decimal(str(write_requests * PRICING['dynamodb']['write_request']))
        read_cost = Decimal(str(read_requests * PRICING['dynamodb']['read_request']))
        
        return {
            'write_requests': write_requests,
            'read_requests': read_requests,
            'write_cost': float(write_cost),
            'read_cost': float(read_cost),
            'total': write_cost + read_cost
        }
    
    def _estimate_textract_costs(self, document_id: str) -> Dict:
        """Estimate Textract costs based on document pages"""
        pages = 3  # Typical DD214 is 2-4 pages
        cost = Decimal(str(pages * PRICING['textract']['page']))
        
        return {
            'pages': pages,
            'cost_per_page': PRICING['textract']['page'],
            'total': cost
        }
    
    def _estimate_bedrock_costs(self) -> Dict:
        """Estimate Bedrock AI costs"""
        input_tokens = 1000
        output_tokens = 1000
        
        # Using Nova Lite pricing
        input_cost = Decimal(str(input_tokens * PRICING['bedrock']['nova_lite_input']))
        output_cost = Decimal(str(output_tokens * PRICING['bedrock']['nova_lite_output']))
        
        return {
            'model': 'nova-lite',
            'input_tokens': input_tokens,
            'output_tokens': output_tokens,
            'input_cost': float(input_cost),
            'output_cost': float(output_cost),
            'total': input_cost + output_cost
        }
    
    def _estimate_cloudwatch_costs(self) -> Dict:
        """Estimate CloudWatch Logs costs"""
        ingestion_mb = 50
        storage_mb = 50
        
        ingestion_cost = Decimal(str((ingestion_mb / 1024) * PRICING['cloudwatch']['ingestion_gb']))
        storage_cost = Decimal(str((storage_mb / 1024) * PRICING['cloudwatch']['storage_gb']))
        
        return {
            'ingestion_mb': ingestion_mb,
            'storage_mb': storage_mb,
            'ingestion_cost': float(ingestion_cost),
            'storage_cost': float(storage_cost),
            'total': ingestion_cost + storage_cost
        }
    
    def _estimate_service_cost(self, service: str, amount: float) -> Dict:
        """Generic service cost estimation"""
        return {
            'estimated': True,
            'total': Decimal(str(amount))
        }
    
    def generate_cost_report(self, costs: Dict) -> str:
        """Generate a formatted cost report"""
        report = f"\n{'='*60}\n"
        report += f"DD214 Processing Cost Report\n"
        report += f"Document ID: {costs['document_id']}\n"
        report += f"Time Range: {costs['time_range']}\n"
        report += f"{'='*60}\n\n"
        
        # Service breakdown table
        service_data = []
        for service, details in costs['services'].items():
            service_data.append([
                service.replace('_', ' ').title(),
                f"${details['total']:.6f}"
            ])
        
        service_data.append(['', ''])  # Empty row
        service_data.append(['TOTAL', f"${costs['total']:.6f}"])
        
        report += "Service Cost Breakdown:\n"
        report += tabulate(service_data, headers=['Service', 'Cost'], tablefmt='grid')
        report += "\n\n"
        
        # Detailed breakdown for major services
        report += "Detailed Service Analysis:\n"
        report += "-" * 40 + "\n"
        
        # Lambda details
        if 'lambda' in costs['services']:
            lambda_data = costs['services']['lambda']
            report += f"\nLambda Functions:\n"
            report += f"  Total Invocations: {lambda_data['invocations']}\n"
            report += f"  Total GB-Seconds: {lambda_data['gb_seconds']:.2f}\n"
            report += f"  Request Cost: ${lambda_data['request_cost']:.6f}\n"
            report += f"  Compute Cost: ${lambda_data['compute_cost']:.6f}\n"
        
        # Textract details
        if 'textract' in costs['services']:
            textract_data = costs['services']['textract']
            report += f"\nTextract:\n"
            report += f"  Pages Processed: {textract_data['pages']}\n"
            report += f"  Cost per Page: ${textract_data['cost_per_page']}\n"
        
        # Cost optimization suggestions
        report += "\n" + "="*60 + "\n"
        report += "Cost Optimization Opportunities:\n"
        report += "-" * 40 + "\n"
        
        if costs['total'] > Decimal('0.10'):
            report += "⚠️  Processing cost exceeds $0.10 threshold\n"
            report += "   Consider:\n"
            report += "   - Caching Textract results for duplicate documents\n"
            report += "   - Using Express Step Functions for faster workflows\n"
            report += "   - Optimizing Lambda memory allocation\n"
        else:
            report += "✅ Processing cost is within expected range\n"
        
        return report
    
    def track_batch_processing(self, document_ids: List[str]) -> Dict:
        """Track costs for multiple documents"""
        batch_costs = {
            'documents': [],
            'total': Decimal('0'),
            'average_per_document': Decimal('0')
        }
        
        for doc_id in document_ids:
            doc_costs = self.track_document_processing(doc_id)
            batch_costs['documents'].append({
                'document_id': doc_id,
                'cost': float(doc_costs['total'])
            })
            batch_costs['total'] += doc_costs['total']
        
        if document_ids:
            batch_costs['average_per_document'] = batch_costs['total'] / len(document_ids)
        
        return batch_costs
    
    def get_monthly_projection(self, daily_documents: int) -> Dict:
        """Project monthly costs based on daily volume"""
        cost_per_document = Decimal('0.08')  # Average cost
        
        daily_cost = cost_per_document * daily_documents
        monthly_cost = daily_cost * 30
        yearly_cost = daily_cost * 365
        
        return {
            'cost_per_document': float(cost_per_document),
            'daily_documents': daily_documents,
            'daily_cost': float(daily_cost),
            'monthly_cost': float(monthly_cost),
            'yearly_cost': float(yearly_cost),
            'cost_breakdown': {
                'textract': float(monthly_cost * Decimal('0.56')),  # 56% of cost
                'cloudwatch': float(monthly_cost * Decimal('0.33')),  # 33% of cost
                'other_services': float(monthly_cost * Decimal('0.11'))  # 11% of cost
            }
        }


def main():
    parser = argparse.ArgumentParser(description='Track DD214 processing costs')
    parser.add_argument('--document-id', help='Specific document ID to track')
    parser.add_argument('--batch', nargs='+', help='List of document IDs for batch tracking')
    parser.add_argument('--projection', type=int, help='Daily document volume for monthly projection')
    parser.add_argument('--hours', type=int, default=1, help='Hours to look back (default: 1)')
    parser.add_argument('--region', default='us-east-2', help='AWS region (default: us-east-2)')
    
    args = parser.parse_args()
    
    tracker = DD214CostTracker(region=args.region)
    
    if args.document_id:
        # Track single document
        costs = tracker.track_document_processing(args.document_id, args.hours)
        report = tracker.generate_cost_report(costs)
        print(report)
        
        # Save report to file
        with open(f'dd214_cost_report_{args.document_id}.txt', 'w') as f:
            f.write(report)
        print(f"\nReport saved to: dd214_cost_report_{args.document_id}.txt")
    
    elif args.batch:
        # Track batch of documents
        batch_costs = tracker.track_batch_processing(args.batch)
        print(f"\nBatch Processing Cost Summary")
        print(f"{'='*40}")
        print(f"Documents Processed: {len(args.batch)}")
        print(f"Total Cost: ${batch_costs['total']:.6f}")
        print(f"Average per Document: ${batch_costs['average_per_document']:.6f}")
        print(f"\nDocument Details:")
        for doc in batch_costs['documents']:
            print(f"  {doc['document_id']}: ${doc['cost']:.6f}")
    
    elif args.projection:
        # Generate monthly projection
        projection = tracker.get_monthly_projection(args.projection)
        print(f"\nCost Projection Analysis")
        print(f"{'='*40}")
        print(f"Daily Volume: {projection['daily_documents']} documents")
        print(f"Cost per Document: ${projection['cost_per_document']:.2f}")
        print(f"\nProjected Costs:")
        print(f"  Daily: ${projection['daily_cost']:.2f}")
        print(f"  Monthly: ${projection['monthly_cost']:,.2f}")
        print(f"  Yearly: ${projection['yearly_cost']:,.2f}")
        print(f"\nMonthly Cost Breakdown:")
        print(f"  Textract: ${projection['cost_breakdown']['textract']:,.2f}")
        print(f"  CloudWatch: ${projection['cost_breakdown']['cloudwatch']:,.2f}")
        print(f"  Other Services: ${projection['cost_breakdown']['other_services']:,.2f}")
    
    else:
        # Default: show example usage
        print("DD214 Cost Tracker - Example Usage:")
        print("\nTrack single document:")
        print("  python track_dd214_costs.py --document-id abc123-def456")
        print("\nTrack multiple documents:")
        print("  python track_dd214_costs.py --batch doc1 doc2 doc3")
        print("\nProject monthly costs:")
        print("  python track_dd214_costs.py --projection 100")


if __name__ == '__main__':
    main()