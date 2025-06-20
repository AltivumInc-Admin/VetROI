#!/usr/bin/env python3
"""Generate VetROI Lambda-Focused Architecture Diagram"""

from diagrams import Diagram, Cluster, Edge
from diagrams.aws.compute import Lambda
from diagrams.aws.storage import S3
from diagrams.aws.database import Dynamodb
from diagrams.aws.network import APIGateway
from diagrams.aws.integration import StepFunctions, Eventbridge
from diagrams.aws.ml import SagemakerModel
from diagrams.aws.analytics import Glue
from diagrams.aws.general import General
from diagrams.onprem.client import Users
from diagrams.generic.database import SQL

# Custom attributes for Lambda functions
lambda_attr = {"fontsize": "11", "shape": "box", "style": "rounded,filled", "fillcolor": "#FF9900", "fontcolor": "white"}

with Diagram("VetROI - Lambda-Powered Serverless Architecture", 
             filename="vetroi_lambda_focus", 
             show=False,
             direction="LR",
             graph_attr={"fontsize": "20", "bgcolor": "white", "pad": "0.5"}):
    
    # User Entry Point
    users = Users("Veterans")
    api = APIGateway("API Gateway")
    
    # Lambda Functions with their triggers
    with Cluster("Lambda Functions", graph_attr={"bgcolor": "#FFF4E6"}):
        
        # Career Discovery Lambda
        with Cluster("Career Discovery & Lex Proxy"):
            recommend = Lambda("VetROI_Recommend\n━━━━━━━━━━━\nTrigger: API Gateway\n• POST /recommend\n• GET /career/{soc}\n• Lex proxy (lexMission)\nO*NET + Lex Integration", **lambda_attr)
        
        # DD214 Processing Lambdas
        with Cluster("DD214 Processing Pipeline"):
            upload = Lambda("DD214_Upload\n━━━━━━━━━━━\nTrigger: API Gateway\nGenerates S3 URLs", **lambda_attr)
            s3_trigger = Lambda("S3_Trigger\n━━━━━━━━━━━\nTrigger: S3 Events\nStarts Step Function", **lambda_attr)
            processor = Lambda("DD214_Processor\n━━━━━━━━━━━\nTrigger: Step Function\nTextract OCR", **lambda_attr)
            macie = Lambda("DD214_Macie\n━━━━━━━━━━━\nTrigger: Step Function\nPII Redaction", **lambda_attr)
            insights = Lambda("DD214_Insights\n━━━━━━━━━━━\nTrigger: Step Function\nAI Analysis", **lambda_attr)
        
        # Result Access Lambdas
        with Cluster("Result Access"):
            status = Lambda("DD214_Status\n━━━━━━━━━━━\nTrigger: API Gateway\nGET /dd214/status", **lambda_attr)
            get_insights = Lambda("DD214_GetInsights\n━━━━━━━━━━━\nTrigger: API Gateway\nGET /dd214/insights", **lambda_attr)
            get_redacted = Lambda("DD214_GetRedacted\n━━━━━━━━━━━\nTrigger: API Gateway\nGET /dd214/redacted", **lambda_attr)
    
    # External Services
    onet = SQL("O*NET API")
    bedrock = SagemakerModel("Bedrock AI")
    
    # Lex in us-east-1
    with Cluster("us-east-1 Region"):
        lex = General("Amazon Lex\nSentraCareerBot")
    
    # Storage
    s3 = S3("S3 Buckets")
    dynamodb = Dynamodb("DynamoDB")
    
    # Step Functions
    stepfn = StepFunctions("Step Functions\nOrchestration")
    
    # Event Flow
    users >> api
    api >> Edge(label="HTTP") >> recommend
    api >> Edge(label="HTTP") >> upload
    api >> Edge(label="HTTP") >> [status, get_insights, get_redacted]
    
    s3 >> Edge(label="S3 Event", color="red") >> s3_trigger
    s3_trigger >> stepfn
    
    stepfn >> Edge(label="Invoke", color="orange") >> [processor, macie, insights]
    
    # Lambda to Services
    recommend >> onet
    recommend >> Edge(label="Cross-region", color="red", style="dashed") >> lex
    processor >> bedrock
    macie >> bedrock
    insights >> bedrock
    
    # All Lambdas use storage
    for lambda_fn in [recommend, upload, processor, macie, insights, status, get_insights, get_redacted, s3_trigger]:
        lambda_fn >> s3
        lambda_fn >> dynamodb
    

print("Lambda-focused diagram generated: vetroi_lambda_focus.png")