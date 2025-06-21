# VetROI™ Project Structure

> **Note**: This document has been superseded by the comprehensive [REPOSITORY_GUIDE.md](../../REPOSITORY_GUIDE.md) in the root directory, which contains the most up-to-date structure and navigation information.

# Original Project Structure (Historical Reference)

```
VetROI/
│
├── frontend/                    # React application
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── CareerDetailCard.tsx      # Detailed career analysis display
│   │   │   ├── CareerMatchCard.tsx       # Individual career card
│   │   │   ├── CareerMatchDisplay.tsx    # Career matches container
│   │   │   ├── ChatInterface.tsx         # AI chat interface
│   │   │   ├── ConfirmationStep.tsx      # MOS confirmation step
│   │   │   ├── DataPanel.tsx             # Developer data panel
│   │   │   ├── DetailedAnalysisView.tsx  # Detailed analysis container
│   │   │   ├── EducationBadge.tsx        # Education requirement display
│   │   │   ├── LocationQuotient.tsx      # Job market comparison
│   │   │   ├── MessageContent.tsx        # Chat message renderer
│   │   │   ├── SalaryGraph.tsx           # Salary visualization
│   │   │   └── VeteranForm.tsx           # Initial profile form
│   │   │
│   │   ├── styles/             # Component styles
│   │   ├── App.tsx             # Main application component
│   │   ├── api.ts              # API client
│   │   ├── types.ts            # TypeScript type definitions
│   │   └── main.tsx            # Application entry point
│   │
│   ├── public/                 # Static assets
│   │   ├── favicon.png         # VetROI™ favicon
│   │   └── onet-in-it.svg      # O*NET attribution logo
│   │
│   ├── package.json            # Frontend dependencies
│   ├── tsconfig.json           # TypeScript configuration
│   └── vite.config.js          # Vite build configuration
│
├── lambda/                     # AWS Lambda functions
│   ├── recommend/              # Main recommendation Lambda
│   │   ├── src/
│   │   │   ├── lambda_function.py  # Lambda handler
│   │   │   ├── bedrock_client.py   # Amazon Bedrock integration
│   │   │   ├── onet_client.py      # O*NET API client
│   │   │   └── models.py           # Data models
│   │   ├── tests/
│   │   │   └── test_handler.py     # Unit tests
│   │   └── requirements.txt    # Python dependencies
│   │
│   ├── dd214_parser/           # DD-214 parsing Lambda (future)
│   └── onet_refresh/           # O*NET data refresh Lambda (future)
│
├── sam-templates/              # AWS SAM templates
│   ├── template.yaml           # Main SAM template
│   └── statemachine/           # Step Functions definitions
│
├── docs/                       # Documentation
├── README.md                   # Project documentation
├── LICENSE                     # MIT License
├── DEVELOPMENT.md                   # Development instructions
├── PROJECT_STRUCTURE.md        # This file
└── .gitignore                  # Git ignore patterns
```

## Key Directories

### `/frontend`
The React application built with Vite and TypeScript. Uses a component-based architecture with separate style files for each component.

### `/lambda`
AWS Lambda functions written in Python 3.12. Each function has its own directory with source code, tests, and requirements.

### `/sam-templates`
AWS SAM (Serverless Application Model) templates for infrastructure as code deployment.

## Architecture Decisions

1. **Monorepo Structure**: Frontend and backend in the same repository for easier development and deployment coordination.

2. **Component Organization**: React components are flat in `/components` rather than nested, making imports cleaner.

3. **Style Separation**: Each component has a corresponding CSS file in `/styles` for maintainability.

4. **Lambda Structure**: Each Lambda function is self-contained with its own dependencies and tests.

5. **Documentation**: Multiple markdown files for different aspects (main README, development guide, UI vision).