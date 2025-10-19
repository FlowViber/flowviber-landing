# Overview
FlowViber is a professional AI automation service that builds custom business automations, focusing on delivering measurable ROI. The landing page showcases real business case studies, features a contact form with email notifications via Resend, Calendly booking integration, and transparent pricing tiers. The primary goal is to sell business outcomes and ROI.

# Recent Changes
**October 19, 2025** (Mobile Responsiveness & Testimonials Removal):
- **Testimonials Section Removed**:
  * Removed "Wat onze klanten zeggen" section per user request
  * Landing page now flows: Hero → Stats → Process Flow → Case Studies → Contact → Footer
- **Complete Mobile Responsiveness**:
  * All sections now fully responsive with mobile-first breakpoints
  * Hero section: Responsive text sizes (text-4xl sm:text-5xl md:text-7xl)
  * Stats section: 1 column on mobile, 2 on tablet, 3 on desktop
  * Process flow: 1 column on mobile, 2 on tablet, 4 on desktop
  * Contact form: Stacked inputs on mobile, 2 columns on desktop
  * Header: Smaller logo and text on mobile, tagline hidden on small screens
  * Footer: Single column on mobile, 2 on tablet, 3 on desktop
  * All padding and spacing adjusted for mobile (sm:, md: breakpoints)
- **CSS Fix for "Onze Methode" Banner**:
  * Fixed white text color issue by modifying global CSS
  * Updated h3 selector to exclude inline styles: `h3:not([style*="color"])`
  * Banner now displays white text correctly on dark slate background

**October 19, 2025** (Complete Contrast Optimization & Slate Color System):
- **Color System Migration**:
  * Removed ALL pure black (#000000, gray-900) from entire website
  * Replaced with warm slate-700/800 colors throughout
  * Improved WCAG accessibility with better contrast ratios
  * Consistent professional appearance with warmer tones
- **Contrast Enhancements**:
  * Hero "Geen verplichtingen" badge: White background with border and bold text
  * All buttons converted to slate-800 with improved shadows
  * "Onze Methode" section: 90% dark overlay with text-shadows for maximum legibility
  * Footer buttons and headings: Consistent slate-800 styling
  * Language toggle: Slate borders and text for better visibility
  * Cookie consent: Slate-800 background for better contrast
- **Typography Improvements**:
  * Increased font weights for better readability (semibold/bold)
  * Added drop shadows where needed for text on images
  * Larger text sizes in key sections for accessibility

**October 18, 2025** (Complete Light/Minimal Theme Redesign - Duna-Inspired):
- **Full Design System Overhaul**:
  * Complete conversion to light/minimal theme (removed all dark mode)
  * Clean white/gray/slate color palette
  * Removed all gradient backgrounds and replaced with solid colors
  * Simplified borders using border-gray-200 throughout
  * Professional stock images integrated (business, tech, landscape, headshots)
- **New Hero Section**:
  * Large background image with overlay
  * New headline: "Minder ruis, meer resultaat — dankzij AI"
  * Minimal layout with full-height hero
  * Clean CTA button with trust badge
- **New Sections Added**:
  * Stats Section: 3 metric cards (50% reduction, < 2 weeks, measurable results)
  * Process Flow Section: Visual diagram showing Intake → Proposals → Execution → Monitor
  * Testimonials Section: Expandable cards with client photos and quotes
- **Layout Reorganization**:
  * Order: Hero → Stats → Process Flow → Testimonials → Case Studies → Contact → Footer
  * Removed theme toggle (full light theme only)
  * Simplified header with logo and language toggle
- **Content Updates**:
  * All translations updated for new sections (NL/EN)
  * New testimonial content with realistic business results
  * Process flow descriptions aligned with actual workflow

**October 17, 2025** (Bilingual Dutch/English Support & SEO):
- **Complete bilingual system with language toggle** - Dutch as default, English as secondary
- **Enhanced SEO for "AI voor bedrijven" and "AI for businesses"** - Optimized meta tags, keywords, and LLM-friendly content
- **Cookie consent banner** - Bilingual with localStorage persistence

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