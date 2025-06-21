#!/usr/bin/env python3
"""Generate VetROI AWS Architecture Diagram for Hackathon Submission"""

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda, LambdaFunction
from diagrams.aws.storage import S3
from diagrams.aws.database import Dynamodb
from diagrams.aws.network import APIGateway, CloudFront
from diagrams.aws.security import Cognito, SecretsManager, IAM
from diagrams.aws.analytics import Glue
from diagrams.aws.ml import SagemakerModel
from diagrams.aws.integration import StepFunctions, Eventbridge
from diagrams.aws.management import Cloudwatch, Cloudformation
from diagrams.aws.general import General
from diagrams.aws.engagement import SimpleEmailServiceSes
from diagrams.onprem.client import Users
from diagrams.programming.framework import React
from diagrams.generic.database import SQL

# Custom colors for different service types
lambda_color = "#FF9900"
storage_color = "#569A31"
ml_color = "#8C4FFF"
api_color = "#FF4B00"

with Diagram("VetROI - AWS Lambda Hackathon Architecture", 
             filename="vetroi_architecture", 
             show=False,
             direction="TB",
             graph_attr={"fontsize": "24", "bgcolor": "white", "pad": "0.5", "nodesep": "1.0", "ranksep": "1.5"}):
    
    # Frontend
    users = Users("Veterans")
    
    with Cluster("Frontend (Amplify)"):
        frontend = React("React App\n(TypeScript)")
        cloudfront = CloudFront("vetroi.altivum.ai")
    
    # Authentication
    with Cluster("Authentication"):
        cognito = Cognito("User Pool\n& Identity Pool")
    
    # API Layer
    api = APIGateway("HTTP API\n(/prod)")
    
    # Core Lambda Functions
    with Cluster("Career Discovery Lambda Functions", graph_attr={"bgcolor": "#FFF4E6"}):
        recommend = Lambda("VetROI_Recommend\n• /recommend endpoint\n• /career/{soc} endpoint\n• O*NET Integration")
        
    # DD214 Processing Pipeline
    with Cluster("DD214 Processing Pipeline", graph_attr={"bgcolor": "#E6F3FF"}):
        with Cluster("Lambda Functions"):
            upload = Lambda("DD214_Upload\n• Pre-signed URLs")
            processor = Lambda("DD214_Processor\n• Textract OCR")
            macie = Lambda("DD214_Macie\n• PII Redaction")
            insights = Lambda("DD214_Insights\n• AI Analysis")
            status = Lambda("DD214_Status")
            get_insights = Lambda("DD214_GetInsights")
            get_redacted = Lambda("DD214_GetRedacted")
        
        # Step Function
        workflow = StepFunctions("DD214 Processing\nWorkflow")
        
        # S3 Trigger
        trigger = Lambda("S3_Trigger")
    
    # Storage
    with Cluster("Storage", graph_attr={"bgcolor": "#E6FFE6"}):
        with Cluster("S3 Buckets"):
            secure_bucket = S3("DD214 Secure\n(Encrypted)")
            redacted_bucket = S3("DD214 Redacted\n(PII Removed)")
        
        with Cluster("DynamoDB Tables"):
            sessions = Dynamodb("Sessions")
            processing = Dynamodb("DD214_Processing")
            career_insights = Dynamodb("CareerInsights")
            conversations = Dynamodb("Conversations")
    
    # External Services
    with Cluster("AI/ML Services", graph_attr={"bgcolor": "#F0E6FF"}):
        bedrock = SagemakerModel("Amazon Bedrock\n(Nova Lite)")
        textract = General("Amazon Textract")
        macie_service = General("Amazon Macie")
    
    # Lex in us-east-1
    with Cluster("us-east-1", graph_attr={"bgcolor": "#FFE6E6"}):
        lex = General("Amazon Lex\nSentraCareerBot")
    
    # O*NET Integration
    onet = SQL("O*NET API\n• Military Crosswalk\n• Career Reports")
    secrets = SecretsManager("O*NET Credentials")
    
    # Monitoring
    with Cluster("Monitoring & Alerts"):
        cloudwatch = Cloudwatch("Dashboards\n& Alarms")
        sns = SimpleEmailServiceSes("Email Alerts")
    
    # Infrastructure as Code
    cfn = Cloudformation("CloudFormation\nTemplates")
    
    # Data Flow
    users >> cloudfront >> frontend
    frontend >> Edge(label="Auth") >> cognito
    frontend >> Edge(label="API Calls") >> api
    
    # Career Discovery Flow
    api >> Edge(label="POST /recommend\nGET /career/{soc}", color=lambda_color) >> recommend
    recommend >> Edge(label="Credentials") >> secrets
    recommend >> Edge(label="API Calls") >> onet
    recommend >> Edge(label="Store Session") >> sessions
    
    # DD214 Upload Flow
    api >> Edge(label="POST /dd214/upload-url", color=lambda_color) >> upload
    upload >> Edge(label="Pre-signed URL") >> secure_bucket
    
    # DD214 Processing Flow
    secure_bucket >> Edge(label="S3 Event") >> trigger
    trigger >> Edge(label="Start Execution") >> workflow
    
    workflow >> Edge(label="1. Extract Text") >> processor
    processor >> textract
    processor >> processing
    
    workflow >> Edge(label="2. Redact PII") >> macie
    macie >> macie_service
    macie >> redacted_bucket
    
    workflow >> Edge(label="3. Generate Insights") >> insights
    insights >> bedrock
    insights >> career_insights
    
    # Status & Results
    api >> Edge(label="GET /dd214/status", color=lambda_color) >> status >> processing
    api >> Edge(label="GET /dd214/insights", color=lambda_color) >> get_insights >> career_insights
    api >> Edge(label="GET /dd214/redacted", color=lambda_color) >> get_redacted >> redacted_bucket
    
    # Lex Integration
    api >> Edge(label="POST /recommend\n(lexMission)", color=lambda_color) >> recommend
    recommend >> Edge(label="Cross-region", style="dashed", color="red") >> lex
    
    # Monitoring
    [recommend, upload, processor, macie, insights] >> Edge(style="dotted") >> cloudwatch
    cloudwatch >> Edge(label="Alerts") >> sns
    
    # CloudFormation manages all resources
    cfn >> Edge(style="dotted", label="Manages") >> [api, workflow, cloudwatch]

print("Architecture diagram generated: vetroi_architecture.png")