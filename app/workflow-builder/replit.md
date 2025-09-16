# Overview

Flow Viber is an intelligent visual workflow designer for n8n automation. The application provides a conversational AI interface that helps users design and deploy n8n workflows through natural language interactions. Users can describe their automation needs, and the AI guides them through requirements gathering, workflow design, and generates deployable n8n workflow JSON.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
Built on **Next.js 15** with React Server Components (RSC) and TypeScript. The application uses:
- **Component Structure**: Modular React components with shadcn/ui design system
- **State Management**: React hooks for local state, with workflow data managed through a storage service
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **UI Components**: Comprehensive shadcn/ui component library with Radix UI primitives
- **Icons**: Lucide React for consistent iconography
- **Error Handling**: Custom ErrorBoundary component with client-side error logging

## AI Conversation System
The core feature is the AI-powered conversation builder that:
- **Enhanced n8n Agent**: Uses comprehensive n8n knowledge base with real node data and validated operations
- **Smart Recipe Suggestions**: Automatically suggests relevant workflow templates based on user queries
- **Multi-Phase Conversations**: Guides users through discovery, validation, and generation phases
- **Requirements Tracking**: Monitors conversation completeness and workflow readiness
- **AI Provider Abstraction**: Supports multiple AI providers (OpenAI, Claude) with automatic fallback
- **Context Management**: Maintains conversation state and workflow requirements throughout the session
- **Single Source of Truth Architecture**: All AI instructions consolidated in `lib/prompt.ts` for maintainability
- **Mandatory Confirmation Flow**: AI always asks for user confirmation before generating/regenerating workflows

## Data Storage Architecture
**Database**: Direct PostgreSQL connections with custom connection pooling
- **Connection Pool**: Managed PostgreSQL connection pool for efficient database operations
- **Workflow Storage**: Stores workflow metadata, chat history, and generated JSON
- **API Key Management**: Encrypted storage of user API keys for external services
- **Version Control**: Optimistic concurrency control with version tracking

## Authentication & Security
**Simplified Authentication**: Uses a default user system (no complex auth implemented)
- **API Key Encryption**: Secure storage of third-party API keys
- **Server-Side Security**: Database operations restricted to server-side only
- **CSP Considerations**: Content Security Policy warnings indicate external service integrations

## API Integration Layer
**n8n Integration**: Direct API communication with n8n instances
- **Workflow Deployment**: Automated deployment of generated workflows to n8n
- **Status Synchronization**: Bi-directional sync of workflow status
- **Error Handling**: Comprehensive error handling with user-friendly notifications

## Notification System
**Custom Dialog System**: Elegant notification dialogs replacing traditional toasts
- **Type-Based Styling**: Success, error, warning, and info notification types
- **Auto-Close Logic**: Configurable auto-close behavior with queueing
- **Context Provider**: React context for global notification management

# Recent Changes

## September 5, 2025 - CRITICAL: Context-Aware Auto-Debugger Fix
**EMBARRASSING HARDCODED PROMPT BUG FIXED**: Auto-debugger was applying generic "padel court customer service" prompts to ALL workflows regardless of context

### Root Cause & Fix
- **Problem**: WorkflowFixer.fixAIAgentPrompt() method had hardcoded padel court prompt for ALL workflows, including "Twitter Joke Bot"
- **Root Cause**: No workflow context analysis - completely ignored workflow name, purpose, and connected nodes
- **Solution**: Replaced hardcoded prompt with intelligent context analysis and dynamic prompt generation

### Context-Aware Intelligence Implementation
- **Smart Workflow Analysis**: Analyzes workflow name, connected nodes, and purpose to determine appropriate prompt type
- **Multiple Prompt Templates**: Specialized prompts for jokes/comedy, social media, customer service, email, content creation, and generic workflows  
- **Node-Aware Generation**: Considers connected nodes (Twitter, scheduler, etc.) to customize prompts further
- **Workflow-Specific Solutions**: "Twitter Joke Bot" now gets comedy-focused prompts, not customer service prompts

### Quality Assurance Results
✅ **Always Works™ Context-Aware Reality Check PASSED**
- ✅ Workflow name analysis: "Twitter Joke Bot" → comedy/joke prompt template
- ✅ Node analysis: Twitter nodes → social media optimization
- ✅ Dynamic prompt generation based on actual workflow purpose
- ✅ No more hardcoded solutions - all prompts contextually appropriate
- ✅ Professional explanations matching actual workflow purpose

**Result**: Auto-debugger now generates intelligent, context-aware solutions based on actual workflow analysis instead of hardcoded templates.

## September 4, 2025 - CRITICAL: Always Works™ Workflow Generation Fix
**EMBARRASSING BUG FIXED**: AI was generating workflows with non-existent nodes and HTTP Request hacks instead of proper n8n nodes

### Root Cause & Fix
- **Problem**: AI generated "Send WhatsApp Message" nodes using generic HTTP Request instead of actual `whatsappBusinessCloud` node from knowledge base
- **Root Cause**: Workflow generation lacked strict validation against available nodes
- **Solution**: Added mandatory validation rules and real-time node checking

### Always Works™ Implementation 
- **Enhanced Prompt System**: Added 🚨 MANDATORY rules forbidding custom nodes, requiring exact node types from knowledge base
- **Runtime Validation**: Added `validateWorkflowJSON()` function that checks every generated node against available nodes
- **Specific Anti-Hack Rules**: Explicitly prevents HTTP Request nodes for WhatsApp/Slack/Telegram when dedicated nodes exist
- **Tested & Verified**: Generated workflows now use `n8n-nodes-base.whatsappBusinessCloud` and `n8n-nodes-base.slack` correctly

### Quality Assurance Results
✅ **Always Works™ 30-Second Reality Check PASSED**
- ✅ Ran actual workflow generation API calls  
- ✅ Triggered exact feature (WhatsApp & Slack workflows)
- ✅ Verified correct node types generated (`whatsappBusinessCloud`, `slack`)
- ✅ No validation errors - clean JSON output
- ✅ Would bet $100 this works - proven with testing

**Result**: No more embarrassing invalid workflows - all generated workflows now use validated n8n nodes only.

### Second Generation Issue Fixed (September 4, 2025)
**ADDITIONAL CRITICAL FIX**: AI was still generating workflows without proper AI components for "AI WhatsApp customer service"

#### Enhanced Fixes Applied
- **JSON Format Issue**: Fixed AI generating ```json markdown instead of pure JSON
- **Missing AI Component**: Added mandatory OpenAI node requirements for AI-powered workflows
- **Better Validation**: Enhanced prompt to require specific components based on workflow type
- **Google Services**: Clarified to use HTTP Request nodes for Google Calendar (no dedicated node exists)

#### Final Testing Results
✅ **Always Works™ 30-Second Reality Check PASSED AGAIN**
- ✅ Clean JSON generation without markdown formatting
- ✅ AI WhatsApp workflows now include OpenAI nodes with proper system prompts
- ✅ All node types validated against knowledge base
- ✅ Comprehensive workflow components for customer service use cases
- ✅ Runtime validation catches any remaining invalid node attempts

**Final Result**: AI now generates complete, functional AI WhatsApp customer service workflows with natural conversation capabilities.

## September 4, 2025 - Major AI Conversation Enhancement
**CRITICAL IMPROVEMENTS COMPLETED**: 

### Single Question Flow Fixed
- Fixed AI asking multiple questions in bullet points
- Removed ALL bullet points from prompt system ("do as I say, not as I do" fix)
- Added explicit 🚨 MANDATORY rules forbidding multiple questions
- **Verified with testing**: AI now asks exactly ONE question per response

### Enhanced Business Intelligence 
- **Made AI smarter than the user**: Now understands business context deeply and guides users through comprehensive requirements they haven't considered
- **Systematic STRIDE exploration**: AI must thoroughly cover Scope → Triggers → Resources → Inputs → Destinations → Error Handling before workflow generation
- **Industry expertise**: For padel clubs, AI now understands court booking, membership management, equipment rental, tournaments, lessons, staff scheduling, maintenance, payments, etc.
- **Comprehensive questioning**: AI explores FAQ data sources, escalation procedures, business hours, privacy compliance, error handling, rate limiting, API failures
- **Production-ready focus**: Emphasis that asking many thorough questions is the VALUE of this app

### Enhanced Confirmation Flow with STRIDE Summary
- Before generation, AI provides complete STRIDE summary covering all operational aspects
- Mandatory exploration of error handling, escalation, and edge cases
- No rushing to completion - systematic business requirements gathering

**Result**: AI conversations are now comprehensive, business-intelligent, and produce production-ready workflows through thorough requirements gathering.

# External Dependencies

## AI Services
- **OpenAI API**: Primary AI provider for conversation and workflow generation
- **Anthropic Claude**: Secondary AI provider with automatic fallback capability
- **API Key Validation**: Real-time validation of AI service credentials

## n8n Integration
- **n8n REST API**: Direct integration with n8n instances for workflow management
- **Workflow Deployment**: Automated deployment and status tracking
- **Node Type Support**: Comprehensive support for n8n node types and connections

## Database
- **PostgreSQL**: Primary database for all application data
- **Connection Pooling**: Efficient connection management with pg library
- **Schema Management**: Structured storage for workflows, chat history, and API keys

## UI Framework
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first styling framework
- **shadcn/ui**: Modern component library with consistent design language
- **Lucide React**: Icon library for UI elements

## Development Tools
- **TypeScript**: Full type safety throughout the application
- **Next.js**: React framework with SSR and API routes
- **Class Variance Authority**: Type-safe variant management for components