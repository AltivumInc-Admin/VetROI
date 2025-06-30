# VetROI™ - Veteran Return on Investment
## AWS Lambda Hackathon 2025 Submission

> **Transforming military service records into civilian career success using serverless AI**

![VetROI Architecture](https://img.shields.io/badge/AWS-Lambda-orange) ![Serverless](https://img.shields.io/badge/Serverless-100%25-brightgreen) ![Status](https://img.shields.io/badge/Status-Production--Ready-blue)

> **⚠️ IMPORTANT**: This application requires API credentials (both free) to function:
> - **O*NET API**: Register at https://services.onetcenter.org/developer/signup
> - **USAJOBS API**: Request access at https://developer.usajobs.gov/apirequest/
> 
> See [DEPLOYMENT.md](DEPLOYMENT.md) for setup instructions.

_This project is released under the Business Source License 1.1 (BUSL-1.1). See [LICENSE](LICENSE) and [LICENSE_USAGE.md](LICENSE_USAGE.md) for details._

## The Problem

Every year, over 200,000 veterans transition from military to civilian careers. And every 
year, the vast majority of that talent is misaligned, misunderstood, or outright missed 
by the job market.

At the core is a communication failure: **civilian employers don’t understand military 
experience—and veterans struggle to translate it**.

The result is a systemic business inefficiency. High-performing individuals—many with 
leadership, technical, medical, or security backgrounds—are routinely placed into roles 
far below their capability. This isn’t just a personal loss for the veteran. It’s a 
missed opportunity for the workforce.

Traditional approaches fail to address this at scale:
- **Manual DD214 reviews** can take 2+ weeks and are rarely comprehensive
- **Generic career counseling** often overlooks nuanced, specialized skills
- **Elite veterans** (surgeons, pilots, special forces) are told "you’ll be fine"—and 
  then left without support
- **Employers lack tools** to interpret military roles, ranks, and MOS codes into 
  business-relevant qualifications

This is not just a human capital challenge—it’s a **strategic labor market failure**.

VetROI™ solves this by providing instant, AI-powered career intelligence that **translates 
military service into civilian opportunity with precision, security, and narrative depth**. 
It replaces weeks of vague advice with actionable, personalized insight—in under three 
minutes. Whether you're an airborne infantryman seeking your first job or a retiring colonel targeting a boardroom, the system 
provides tailored, data-rich intelligence that elevates your unique military experience into 
actionable civilian opportunity.

## 💡 Our Serverless Solution

VetROI uses AWS Lambda and a fully serverless architecture to transform a veteran’s DD214—
the official record of military service—into actionable career intelligence in under 
three minutes. This automation replaces weeks of slow, manual counseling with instant, 
personalized insight.

Once uploaded, the DD214 is scanned for sensitive information using Amazon Macie, parsed 
into structured data via Amazon Textract, and enriched through a coordinated series of 
Lambda functions, Step Functions, and Amazon Bedrock AI-powered analysis. Each component 
is designed to scale securely and cost-effectively—making the system accessible whether 
you're an E-1 separating after a single enlistment or an O-6 retiring after 25 years.

By eliminating the bottlenecks of traditional career transition systems, VetROI ensures that:
- **Junior enlisted veterans** aren’t left guessing which careers match their skills
- **Senior NCOs and officers** aren’t pushed into generic roles below their potential
- **Specialized professionals** like military physicians, pilots, or cyber operators receive 
  targeted guidance based on their real qualifications—not generic assumptions

In short, VetROI doesn't offer one-size-fits-all advice. It delivers **real-time, rank-agnostic, 
and role-specific guidance**—making military experience legible, valuable, and strategically 
positioned in the civilian workforce.

## 📢 Update - June 28, 2025

We are pleased to announce that VetROI has integrated with the USAJOBS API, expanding our capabilities to provide veterans with direct access to federal employment opportunities. This enhancement builds upon our existing career translation services by connecting veterans to live job postings that match their military experience and career interests.

### New Capabilities:
- **Direct Job Search Integration**: Veterans can now search for federal positions based on their selected career paths and geographic preferences
- **Real-time Federal Job Listings**: Access to current openings across all federal agencies through the official USAJOBS database
- **Seamless Application Process**: Direct links to job applications, allowing veterans to transition from career discovery to job application within the same platform
- **Location-based Matching**: Job searches automatically filter by the veteran's home state or desired relocation area

This integration represents a significant advancement in our mission to bridge the gap between military service and civilian employment. Veterans no longer need to navigate multiple platforms—they can discover their career potential, receive AI-powered insights, and apply for relevant positions all within VetROI.

### Watch Our Demo
[Watch Demo Video](https://youtu.be/2nCDpAr1IFE?si=cRuW_nhiUQi9QliV) - See VetROI process a real DD214 and generate career insights

## ⚖️ For the Judges
### 🗺️ Navigating VetROI™

When you land on the Welcome page, you’ll have the option to sign in or continue as a guest.  
For full access, I’ve created a dedicated judge account for your use:

- **Email**: judges@altivum.io  
- **Password**: AWS_Lambda2025

Upon signing in, you’ll be prompted to select:
- Your branch of service  
- Military occupation code (MOS, AFSC, NEC, etc.)  
- State of residence  
- Highest education level

A pre-filled list of valid military occupation codes is included, but feel free to Google any valid code from any branch. The selected code will be sent to the O*NET Web Services API, which will return all matching **Standard Occupational Classification (SOC) codes** as defined by the U.S. Department of Labor.

> You can view the full O*NET API response in real time by clicking the tab on the right side of the screen labeled **"O*NET DATA"**.

**Example military occupation codes you can use for testing:**

- **Army**:  
  - `11B` – Infantryman  
  - `68W` – Combat Medic Specialist  
  - `12B` – Combat Engineer  
  - `35F` – Intelligence Analyst  
  - `25B` – IT Specialist   

- **Marine Corps**:  
  - `0311` – Rifleman  
  - `0321` – Reconnaissance Marine  
  - `0681` – Cybersecurity Technician  
  - `0231` – Intelligence Specialist  
  - `1371` – Combat Engineer  

You’ll then confirm your input before proceeding.

Next, you’ll have the opportunity to upload a DD214 for processing.  
For convenience, I’ve included a sample DD214 (with SSN and other PII redacted). Additional sensitive information will be automatically flagged and redacted by **Amazon Macie**.

- Please download and upload the sample to initiate full system processing.

The full analysis pipeline (Step Functions + Lambda + Bedrock) averages **2 minutes and 45 seconds**.  
While you wait, I’ve enabled a preview carousel showcasing other supporting features and technical artifacts.

On the DD214 upload page, you’ll also find an option to **view a real, pre-processed DD214**.  
This is available in case you’ve already gone through the processing flow and simply want to revisit the final results, or if you’re short on time and need to bypass the 2–3 minute processing window. It also serves as a fallback in case of any unexpected technical issues during live document analysis.

Once processing is complete, you’ll be prompted to select **1–4 civilian career options** from the list provided by O*NET. These options are tailored to your selected military code.

A second API call will then be made to retrieve full labor market intelligence for each chosen SOC code.  
This data will be:
- Rendered in a clean, side-by-side comparative format  
- Visualized for better alignment analysis  
- Backed by the original JSON API payload (accessible under the **"Career Data"** tab)

After reviewing your matches, you can interact with **Sentra**, our beta-phase career counselor chatbot powered by **Amazon Lex**.  
Click **"Meet with Sentra, our state-of-the-art career counselor"** and then click **"What is my next mission?"** inside the chat window.  
This will activate Lex’s `GetNextMission` intent, which will return contextual guidance for your transition journey.

Finally, to access the full DD214 career report, click the yellow button labeled **"Get your DD214 Insight"** in the bottom-right corner.  
There, you’ll find:
- A leadership profile  
- Civilian career translations  
- A 30-60-90 day roadmap  
- Regional salary data  
- Geo-intelligence overlays

> Our experimental 3D career intelligence module is also available in this section. It’s designed to help visualize veteran talent distribution across sectors, states, and skill domains—making it easier to connect veterans with mission-aligned employers.

Thank you for exploring VetROI™. I look forward to your evaluation.

## The Origin Story

VetROI™ was created by a former Green Beret who experienced firsthand the challenges of translating military service into civilian opportunity. What began as a personal struggle has become a mission to build smarter, more human transition tools for veterans
everywhere. Learn more about the story and solution [on Devpost](https://devpost.com/software/vetroi).

## 🧭 Repository Navigation

📍 **New to the project?** Start with our [Repository Guide](REPOSITORY_GUIDE.md) for a complete map of the codebase, key files, and where to find everything.

## 🏗️ Architecture & AWS Services

### Updated VetROI Architecture includes USAJOBS API Integration.
This addition transforms VetROI from a career acquisition enhancement tool to a career acquisition enablement tool.

![Upgraded VetROI Architecture](https://github.com/user-attachments/assets/30b32e33-0864-4721-933f-ddbd523270e0)

### VetROI Step Function Workflow
The heart of our DD214 processing pipeline - orchestrating document analysis, PII redaction, and AI insights generation.

![VetROI Step Function](VetROI%20Step%20Function.png)

### Evolution of VetROI Architecture

The VetROI architecture has evolved significantly since its initial release. Historical architecture diagrams showing the pre-USAJOBS integration design and detailed Lambda function flows can be found in the [Evolution of VetROI](docs/Evolution%20of%20VetROI/) folder.

### Core Lambda Functions (10 Total)
1. **Career Recommendation Engine** (`VetROI_Recommend`)
   - Handles POST /recommend and GET /career/{soc} endpoints
   - O*NET API integration for military code translation
   - Amazon Lex proxy for "Next Mission" feature
   - Real-time career data (no caching)

2. **DD214 Upload Handler** (`VetROI_DD214_GenerateUploadURL`)
   - Generates presigned S3 URLs
   - Validates authentication via Cognito

3. **Document Processor** (`VetROI_DD214_Processor`)
   - Uses AWS Textract for OCR
   - Extracts structured data from DD214
   - Handles multiple document formats

4. **PII Redaction** (`VetROI_DD214_Macie`)
   - Amazon Macie integration for PII detection
   - Removes SSN, addresses, DoD ID numbers
   - Creates safe version for AI processing

5. **AI Insights Generation** (`VetROI_DD214_Insights`)
   - Amazon Bedrock (Nova Lite) integration
   - Analyzes full DD214 text
   - Generates personalized career recommendations
   - Creates resume bullets & interview prep

6. **S3 Event Trigger** (`VetROI_S3_DD214_Trigger`)
   - Triggered by S3 upload events
   - Starts Step Function workflow

7. **Status Checker** (`VetROI_DD214_GetStatus`)
   - Returns processing status

8. **Insights Retrieval** (`VetROI_DD214_GetInsights`)
   - Fetches AI-generated career insights

9. **Redacted Document Access** (`VetROI_DD214_GetRedacted`)
   - Provides access to PII-removed documents

10. **USAJOBS Personalized Jobs Provisioning** (`vetROI-usajobs-search`)
   - Provides the user with real-time job listings that meet their interests.

### Serverless Orchestration
```yaml
Step Functions State Machine:
├── Document Upload
├── Text Extraction (Textract)
├── PII Detection (Macie)
├── Redaction Processing
├── AI Analysis (Bedrock)
└── Results Storage (DynamoDB)
```

### AWS Services Used
- **AWS Lambda** - 10 serverless functions handling all compute
- **Step Functions** - DD214 processing workflow orchestration
- **Amazon Bedrock** - AI insights generation (Nova Lite model)
- **Amazon Lex** - Conversational AI for career guidance (us-east-1)
- **Amazon Macie** - PII detection & compliance
- **Amazon Textract** - Document OCR processing
- **DynamoDB** - 5 tables for sessions, processing status, insights
- **S3** - Secure document storage (encrypted & redacted buckets)
- **API Gateway** - HTTP & REST API endpoints
- **Cognito** - User authentication & authorization
- **CloudFront** - Custom domain (vetroi.altivum.ai)
- **Amplify** - Frontend hosting with CI/CD
- **Secrets Manager** - O*NET API credentials & USAJOBS API credentials (registration required)
- **CloudWatch** - Monitoring & alerts

## 🔧 Local Development & Testing

```bash
# Clone the repository
git clone https://github.com/AltivumInc-Admin/VetROI.git
cd VetROI

# Install dependencies
cd frontend && npm install
cd ../lambda && pip install -r requirements.txt

# Set up AWS credentials
export AWS_PROFILE=your-profile
export AWS_REGION=us-east-2

# Deploy SAM template
sam build && sam deploy

# IMPORTANT: Register for O*NET API credentials
# https://services.onetcenter.org/developer/signup
# Update credentials in AWS Secrets Manager after deployment

# Run frontend locally
cd frontend && npm run dev
```

### Environment Variables
```
VITE_API_URL=https://your-api-gateway-url
TABLE_NAME=VetROI_Sessions
INSIGHTS_TABLE=VetROI_CareerInsights
MODEL_ID=us.amazon.nova-lite-v1:0
REDACTED_BUCKET=vetroi-dd214-redacted
```

## 📝 Code Structure

```
VetROI/
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── api.ts        # API integration
│   │   └── App.tsx       # Main application
├── lambda/                # Lambda functions
│   ├── dd214_upload/     # Upload handler
│   ├── dd214_parser/     # Text extraction
│   ├── dd214_macie/      # PII redaction
│   ├── dd214_insights/   # AI analysis
│   └── recommend/        # Career matching
├── sam-templates/        # SAM/CloudFormation
│   ├── template.yaml     # Main template
│   └── statemachine/     # Step Functions
└── infrastructure/       # Additional AWS config
```


## 📄 License

Business Source License 1.1 (BUSL-1.1) - enabling source-available transparency while protecting commercial integrity. Automatically converts to GPL v2.0 or later on June 28, 2029.

## 🤝 Acknowledgments

- AWS for the Lambda platform enabling this serverless architecture
- O*NET for providing comprehensive career data
- USAJOBS for providing real-time federal job availability data
- The veteran community for invaluable feedback
- My wife and my son for their continuous support of my endeavors.

---

**VetROI™**

*Trademark: Serial Number 99211176 | Owner: Altivum Inc.*
