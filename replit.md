# Overview
FlowViber is a professional AI automation service that builds custom business automations, focusing on delivering measurable ROI. The landing page showcases real business case studies, features a contact form with email notifications via Resend, Calendly booking integration, and transparent pricing tiers. The primary goal is to sell business outcomes and ROI.

# User Preferences
Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
Built on Next.js 15 with React Server Components (RSC) and TypeScript, utilizing a modular component structure with shadcn/ui and Tailwind CSS. State management uses React hooks, and error handling is via a custom ErrorBoundary component. The application features a dark theme with gradients and animations, providing a professional and responsive layout. It includes a multi-platform landing page showcasing universal workflow automation and specialized AI agents.

## AI Conversation System
The core feature is an AI-powered conversation builder using an n8n knowledge base. It offers smart recipe suggestions, guides users through multi-phase conversations (discovery, validation, generation), and tracks requirements. It supports multiple AI providers (OpenAI, Claude) with fallback, manages conversation context, and consolidates all AI instructions in `lib/prompt.ts`. A mandatory confirmation flow precedes workflow generation. The AI is business-intelligent, guiding users through comprehensive requirements (STRIDE exploration: Scope, Triggers, Resources, Inputs, Destinations, Error Handling) and providing a STRIDE summary. The AI is designed to ask only one question per response.

## Data Storage
Uses direct PostgreSQL connections with custom connection pooling, storing workflow metadata, chat history, generated JSON, and encrypted user API keys. Version control is implemented with optimistic concurrency.

## Authentication & Security
Features a multi-provider authentication system including OAuth (GitHub, Google) and email verification via Resend. It uses a PostgreSQL adapter for persistent user sessions and securely stores API keys. All database operations are restricted to the server side, with secrets managed via Replit environment variables.

## API Integration Layer
Directly integrates with n8n instances for workflow deployment and status synchronization, providing comprehensive error handling with user-friendly notifications.

## Notification System
A custom dialog system replaces traditional toasts, offering type-based styling (success, error, warning, info) with configurable auto-close logic and queueing, managed via a React context.

## Technical Implementations
- **AI Workflow Generation**: Generates valid n8n workflows with strict validation against available nodes. It includes AI components (e.g., OpenAI node) for AI-powered workflows.
- **Context-Aware Auto-Debugger**: Dynamically generates prompts based on workflow context instead of hardcoded templates.

# External Dependencies

## AI Services
- **OpenAI API**
- **Anthropic Claude**

## n8n Integration
- **n8n REST API**

## Database
- **PostgreSQL**

## UI Framework
- **Radix UI**
- **Tailwind CSS**
- **shadcn/ui**
- **Lucide React**

## Email Service
- **Resend**