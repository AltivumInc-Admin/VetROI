# Sentra AI Career Counselor - Implementation Guide

## Overview
Sentra is VetROI's AI-powered career counselor that provides personalized guidance to military veterans transitioning to civilian careers. The system has two primary functions: **Passive Prompt Building** and **Active Conversation**.

## Core Concept
As users progress through the VetROI application, they can observe a transparent, progressive prompt being constructed that will eventually be sent to the AI. This creates trust through transparency and helps users understand how AI counseling works.

## 1. Passive Function - Progressive Prompt Building

### Visual Implementation
- **Location**: Right side of the screen (persistent sidebar or panel)
- **Behavior**: Updates in real-time as users complete sections
- **Design**: Shows the actual prompt being constructed with smooth animations

### Prompt Building Stages

#### Stage 1: Profile Section
When user completes veteran profile:
```
"You're a military career counselor. I am a veteran that served in the [BRANCH] as a [MOS_CODE]..."
```
Additional context added:
- Location: "currently located in [STATE]"
- Relocation: "willing/not willing to relocate"
- Education: "with a [DEGREE_LEVEL] degree"

#### Stage 2: Confirmation
When user confirms their information:
- Base prompt is locked in
- Visual indicator shows this section is complete

#### Stage 3: O*NET Data Integration
When O*NET career matches load:
```
"I have attached pertinent information regarding my MOS here [ATTACHMENT]"
```
- Large O*NET data shown in collapsible bracket format (like Claude Code)
- Includes:
  - MOS to SOC code mappings
  - Career match percentages
  - Skill translations
  - Salary data

#### Stage 4: Career Selection
When user selects careers of interest:
```
"I am interested in the following civilian careers: [CAREER_1], [CAREER_2], [CAREER_3]..."
```

#### Stage 5: Final Request (Low-Cost Tier)
Automatically appended request:
```
"Please provide me with a phased and detailed plan of how I can:
1. Translate my military skills clearly for civilian employers
2. Structure my resume for these specific roles
3. Prepare for 3 common interview questions in these fields"
```

### Visual Features
- **Live Updates**: Smooth animations when new text is added
- **Highlighting**: New additions briefly glow or highlight
- **Collapsible Sections**: Large data blocks can be expanded/collapsed
- **Progress Indicator**: Shows which sections have contributed to the prompt
- **Token Counter**: Display approximate token usage

## 2. Active Function - Conversational Interface

### Core Capabilities
- **Back-and-forth dialogue** after initial prompt submission
- **Context-aware responses** based on veteran profile and career data
- **Deep-dive discussions** on specific careers or concerns
- **Follow-up questions** and clarifications

### Conversation Topics
- Detailed career path exploration
- Skills gap analysis and training recommendations
- Resume refinement and tailoring
- Interview preparation and practice
- Salary negotiation strategies
- Geographic job market insights
- Education ROI analysis
- Career pivot alternatives

### Technical Considerations

#### Token Management
- Track conversation token usage
- Implement sliding window for long conversations
- Summarize older messages when approaching limits
- Display token usage to user (transparency)

#### Context Preservation
- Maintain core context (veteran profile + O*NET data) separately
- Don't resend static context with every message
- Use reference system for large data blocks

#### Guardrails
- Scope: Career counseling only
- Restrictions: No medical, legal, or financial advice
- Tone: Professional, supportive, veteran-friendly
- Privacy: No storage of sensitive personal information

#### Cost Management
- **Free Tier**: Initial consultation + 5 follow-up messages
- **Premium Tier**: Unlimited conversation within session
- **Session Limits**: 1-hour active sessions
- **Token Budgets**: Max tokens per user per month

#### Session Management
- Save conversation history
- Allow users to return to previous sessions
- Export conversation as PDF/document
- Clear session data after inactivity

## 3. Implementation Architecture

### Backend Options

#### Option A: AWS Bedrock
- **LLM Service**: AWS Bedrock (Claude, Llama, or similar)
- **API Gateway**: WebSocket for real-time chat
- **Lambda Functions**: Message processing and context management
- **DynamoDB**: Conversation history and session storage
- **S3**: Large context data storage (O*NET datasets)

#### Option B: IBM watsonx.ai (Recommended for Partnership)
- **LLM Service**: IBM watsonx.ai foundation models
  - Granite models for career counseling
  - Llama models for conversational AI
  - Custom fine-tuned models for veteran-specific context
- **API Integration**: watsonx.ai REST APIs or SDK
- **Advantages**:
  - Enterprise-grade security and compliance
  - Built-in governance and responsible AI features
  - Model customization and fine-tuning capabilities
  - Prompt engineering studio for optimization
  - Integration with Watson Assistant for enhanced conversation management
- **Infrastructure**:
  - IBM Cloud Functions for serverless processing
  - Cloudant/PostgreSQL for conversation storage
  - IBM Cloud Object Storage for large datasets
  - Watson Assistant for conversation orchestration

### Frontend Integration
- **React Components**: 
  - `SentraPromptBuilder`: Visual prompt construction
  - `SentraChat`: Active conversation interface
  - `SentraContext`: Context management wrapper
- **State Management**: 
  - Track prompt building across sections
  - Maintain conversation history
  - Handle connection states

### Data Flow
1. User completes section → Updates prompt builder
2. User confirms readiness → Send initial prompt
3. Receive AI response → Display in chat interface
4. User sends follow-up → Append to conversation
5. Manage context window → Compress if needed
6. End session → Save conversation history

## 4. User Experience Flow

### First-Time User
1. Sees empty prompt builder panel
2. Completes profile → Watches prompt form
3. Gets excited seeing their story build
4. Reviews O*NET matches → Sees data integration
5. Selects careers → Finalizes prompt
6. Clicks "Start Consultation" → Enters chat mode

### Returning User
1. Can review previous consultation
2. Update profile triggers new consultation option
3. Can start fresh or continue previous thread

## 5. Security & Privacy

### Data Handling
- No PII in prompts (use codes/references)
- Encrypt conversation history at rest
- Clear sessions after 30 days of inactivity
- Allow users to delete their data

### Compliance
- Clear terms of service for AI interaction
- Disclaimer about AI limitations
- Opt-in for conversation storage
- GDPR/CCPA compliance for data handling

## 6. Success Metrics

### Engagement
- Prompt builder view time
- Consultation completion rate
- Average conversation length
- Return user rate

### Quality
- User satisfaction ratings
- Career outcome tracking
- Resume improvement metrics
- Interview success rates

## 7. Future Enhancements

### Advanced Features
- Voice interaction capability
- Resume upload and analysis
- Mock interview simulations
- Peer mentor matching
- Employer connection system

### Premium Services
- Unlimited consultations
- Priority response times
- Human counselor escalation
- Personalized job alerts
- Application tracking

## Development Priorities

### Phase 1 (MVP)
- [ ] Prompt builder UI component
- [ ] Basic LLM integration (IBM watsonx.ai or AWS Bedrock)
- [ ] Simple chat interface
- [ ] Session management

### Phase 2
- [ ] Token management system
- [ ] Conversation history
- [ ] Context compression
- [ ] Cost tracking
- [ ] Watson Assistant integration (if using IBM)

### Phase 3
- [ ] Premium tier features
- [ ] Advanced analytics
- [ ] Export capabilities
- [ ] Mobile optimization
- [ ] Custom model fine-tuning for veteran-specific language

---

*This document serves as the primary reference for Sentra AI implementation. Update as features are developed and requirements evolve.*