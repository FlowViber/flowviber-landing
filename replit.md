# Overview
Flow Viber is an intelligent visual workflow designer for n8n automation. It provides a conversational AI interface that enables users to design and deploy n8n workflows using natural language. The application guides users through requirements gathering, workflow design, and generates deployable n8n workflow JSON, aiming to be a platform-agnostic workflow builder with specialized AI agents for various business domains.

# Recent Changes
**October 2, 2025**:
- **Landing Page Enhancement**: Replaced static hero workflow diagram with interactive carousel slider
  * Added 10 high-impact n8n workflow examples with embedded live previews
  * Workflows include: Lead Qualification, CRM Sync, AI Lead Scoring, Social Media Automation, Customer Feedback, Invoice OCR, Financial Reporting, Expense Approval, IT Incident Management, WhatsApp/Instagram Chatbot
  * Each slide shows workflow title, description, business impact metrics, and embedded n8n workflow iframe
  * Implemented Embla Carousel with navigation arrows and dot indicators
  * Workflows selected based on real ROI data and business value (saves 15-200 hours/month per workflow)

**September 15, 2025**:
- **MAJOR FIX**: Implemented comprehensive n8n node validation using real GitHub data
  * Created `lib/github-nodes.ts` with authoritative list of all n8n nodes from official repository
  * Fixed WhatsApp trigger validation (it DOES exist as `n8n-nodes-base.whatsappTrigger`)
  * Eliminated generation of non-existent nodes like "Send Confirmation" and "Suggest Alternatives"
  * Added smart node suggestions for invalid node names
- **Connection Fix**: Enhanced workflow connection generation
  * Fixed critical bug where all connections had empty arrays
  * Added explicit validation rules to ensure all nodes are properly connected
  * Improved connection instructions with real examples for linear and branching flows
- **Dynamic Validation**: Replaced static hardcoded node lists with GitHub-sourced data
  * System now validates against 400+ real n8n nodes
  * Proper categorization of triggers vs action nodes
  * Prevents messaging nodes from being used as triggers

**September 14, 2025**: 
- Fixed workflow builder header buttons (Sync, Push, Retrieve Errors) that were returning 404 errors. Resolved by copying API routes from workflow-builder sub-app to main app API directory. All three buttons now function correctly with verified 200 status responses.
- Enhanced UX with visual loading spinners (Loader2 icon) for all workflow operation buttons (Deploy, Sync, Push, Retrieve Errors)
- Fixed regenerate button timing issue - now appears immediately when users request workflow regeneration in conversation builder
- Completed comprehensive testing of entire Flow Viber workflow builder functionality with real n8n instance
- Fixed critical JSON truncation bug by implementing smart token allocation: workflow generation now uses 8000 tokens, regular conversation uses 4000 tokens
- Enhanced workflow generation prompt with enterprise-grade patterns from advanced n8n architecture document:
  * Added n8n expression patterns for dynamic values
  * Implemented dual-path error architecture guidance
  * Included visual organization standards with sticky notes
  * Added switch node logic patterns for conditional workflows
  * Integrated memory patterns for conversational agents
  * Added performance optimization patterns for long operations
  * Enhanced user experience standards with progress notifications
  * Included file management, authentication, and queue processing patterns
  * Updated validation checklist with comprehensive quality assurance

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
Built on Next.js 15 with React Server Components (RSC) and TypeScript, using a modular component structure with shadcn/ui. Styling is handled by Tailwind CSS with custom CSS variables, and state management utilizes React hooks. Error handling is managed by a custom ErrorBoundary component.

## AI Conversation System
The core feature is an AI-powered conversation builder that uses a comprehensive n8n knowledge base. It offers smart recipe suggestions, guides users through multi-phase conversations (discovery, validation, generation), and tracks requirements. The system supports multiple AI providers (OpenAI, Claude) with fallback, manages conversation context, and consolidates all AI instructions in `lib/prompt.ts`. It includes a mandatory confirmation flow before workflow generation. The AI is designed to be business-intelligent, guiding users through comprehensive requirements (STRIDE exploration: Scope, Triggers, Resources, Inputs, Destinations, Error Handling) and providing a STRIDE summary before workflow generation.

## Data Storage Architecture
Uses direct PostgreSQL connections with custom connection pooling. It stores workflow metadata, chat history, and generated JSON, along with encrypted user API keys. Version control is implemented with optimistic concurrency.

## Authentication & Security
Features a comprehensive multi-provider authentication system including OAuth (GitHub, Google) and email verification via Resend. It uses a PostgreSQL adapter for persistent user sessions and securely stores API keys. All database operations are restricted to the server side, with secrets managed via Replit environment variables.

## API Integration Layer
Directly integrates with n8n instances for workflow deployment and status synchronization. It provides comprehensive error handling with user-friendly notifications.

## Notification System
A custom dialog system replaces traditional toasts, offering type-based styling (success, error, warning, info) with configurable auto-close logic and queueing, managed via a React context.

## UI/UX Decisions
The application features a dark theme with gradients and animations, providing a professional and responsive layout. It includes a multi-platform landing page for non-authenticated users, showcasing universal workflow automation across n8n, Make.com, Pabbly, and specialized AI agents for various business domains.

## Technical Implementations
- **AI Workflow Generation**: Generates valid n8n workflows with strict validation against available nodes, preventing the use of non-existent or generic nodes where dedicated ones exist. Includes AI components (e.g., OpenAI node) for AI-powered workflows.
- **Context-Aware Auto-Debugger**: Dynamically generates prompts based on workflow context (name, connected nodes, purpose) instead of hardcoded templates.
- **Single Question Flow**: Ensures the AI asks only one question per response, avoiding bulleted lists.

# External Dependencies

## AI Services
- **OpenAI API**: Primary AI provider.
- **Anthropic Claude**: Secondary AI provider with automatic fallback.

## n8n Integration
- **n8n REST API**: For workflow management, deployment, and status tracking.

## Database
- **PostgreSQL**: Primary database.

## UI Framework
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first styling.
- **shadcn/ui**: Modern component library.
- **Lucide React**: Icon library.

## Development Tools
- **TypeScript**: For type safety.
- **Next.js**: React framework.
- **Class Variance Authority**: For type-safe variant management.

## Email Service
- **Resend**: For reliable email delivery in the authentication system.