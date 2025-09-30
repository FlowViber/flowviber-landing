"use client"

import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  ArrowRight, 
  Bot, 
  Zap, 
  Shield, 
  Globe, 
  Users, 
  ChevronRight, 
  Sparkles, 
  Network, 
  GitBranch,
  ShoppingCart,
  TrendingUp,
  Database,
  Headphones,
  Code,
  Check,
  Star,
  User,
  DollarSign,
  Clock,
  Lock,
  PlayCircle,
  Send,
  MessageSquare,
  FileText,
  Layers,
  Workflow,
  Moon,
  Sun,
  Settings,
  PieChart,
  ExternalLink,
  Link as LinkIcon
} from "lucide-react"
import Link from "next/link"

// Theme Toggle Component
function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Check system preference or localStorage
    const theme = localStorage.getItem('theme') || 
                 (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    setIsDark(theme === 'dark')
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [])

  const toggleTheme = () => {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  return (
    <Button
      onClick={toggleTheme}
      className="h-10 px-4 bg-flow-cta hover:bg-flow-cta/90 text-white border-0"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

// Interactive Chat Demo Component (300x400px as specified)
function InteractiveChatDemo() {
  const [userInput, setUserInput] = useState("")
  const [messages, setMessages] = useState<Array<{type: string, text: string}>>([])
  const [isTyping, setIsTyping] = useState(false)
  const [demoStarted, setDemoStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const simulatedResponses: Record<string, string> = {
    "Build a n8n CRM sync + Make email flow": `Created n8n trigger + Make action! Here's your hybrid workflow:

**n8n CRM Integration:**
• Webhook trigger for new contacts
• Data validation & transformation
• Customer segmentation logic

**Make Email Campaign:**
• Dynamic email personalization
• Multi-channel delivery (email/SMS)
• Engagement tracking

**Cross-Platform Sync:**
• Real-time contact updates
• Unified analytics dashboard
• Error handling & retry logic

Export JSON workflow file?`,
    
    "Set up Stripe invoice automation": `Added Stripe payment node successfully!

**Automated Invoice Flow:**
• Recurring billing schedules
• Custom invoice templates
• Payment reminder sequences
• Tax calculation integration

**Smart Features:**
• Failed payment recovery
• Currency auto-conversion
• Compliance reporting
• QuickBooks sync ready

Enter your Stripe API key to activate?`,
    
    "Combine n8n + QuickBooks sync": `Hybrid flow initiated! Here's your setup:

**n8n Processing:**
• Real-time transaction monitoring
• Data validation & cleanup
• Custom business rules

**QuickBooks Integration:**
• Automated journal entries
• Invoice-to-payment tracking
• Tax category mapping
• Multi-entity support

**Sync Features:**
• Bi-directional updates
• Conflict resolution
• Audit trail logging

Configure QuickBooks OAuth authentication?`,

    "default": `I can help you build that! Try one of these popular workflows:

• "Build a n8n CRM sync + Make email flow"
• "Set up Stripe invoice automation"  
• "Combine n8n + QuickBooks sync"

Or describe your specific automation need and I'll create a custom workflow for you!`
  }

  const handleSendMessage = (message?: string) => {
    const messageToSend = message || userInput
    if (!messageToSend.trim()) return

    const userMessage = messageToSend
    setMessages(prev => [...prev, { type: "user", text: userMessage }])
    setUserInput("")
    setIsTyping(true)
    setDemoStarted(true)

    setTimeout(() => {
      const response = simulatedResponses[userMessage] || simulatedResponses["default"]
      setMessages(prev => [...prev, { type: "ai", text: response }])
      setIsTyping(false)
    }, 1500)
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="w-full h-[300px] md:w-[900px] md:h-[600px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg">
      {/* Header */}
      <div className="bg-flow-cta p-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-white text-sm">Flow Viber AI</h3>
            <p className="text-white/80 text-xs">Interactive Demo</p>
          </div>
        </div>
      </div>
      
      {/* Messages Area - Fixed height for 300x400px spec */}
      <div className="p-3 h-[200px] md:h-[490px] overflow-auto bg-white dark:bg-gray-800">
        {!demoStarted ? (
          <div className="text-center py-4">
            <Bot className="w-8 h-8 text-flow-cta mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-flow-text-light dark:text-flow-text-dark mb-2">
              Try Interactive Demo
            </h4>
            <p className="text-xs text-flow-gray-600 dark:text-flow-gray-300 mb-3">
              Click examples:
            </p>
            <div className="space-y-1">
              {Object.keys(simulatedResponses).filter(key => key !== 'default').map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUserInput(example)
                    handleSendMessage(example)
                  }}
                  className="block w-full text-left px-2 py-1.5 bg-blue-50 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-gray-600 rounded text-flow-link text-xs transition-colors"
                  aria-label={`Try example: ${example}`}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 !text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-lg p-4 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white ml-auto !text-white'
                        : 'bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 border border-gray-200 dark:border-slate-700 shadow-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  </div>
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-600 p-2 bg-gray-50 dark:bg-gray-700">
        <div className="flex gap-1">
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type workflow request..."
            className="flex-1 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-xs h-8"
            aria-label="Chat input for workflow request"
          />
          <Button 
            onClick={() => handleSendMessage()}
            size="sm"
            className="bg-flow-cta hover:bg-flow-cta/90 text-white h-8 px-2"
            aria-label="Send message"
          >
            <Send className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Waitlist Signup Form
function WaitlistForm() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) {
      setSubmitted(true)
      // In production, send to your backend
      console.log("Waitlist signup:", email)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
        <Check className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
        <p className="text-green-700 dark:text-green-300 font-medium">You're on the list!</p>
        <p className="text-green-600 dark:text-green-400 text-sm">We'll notify you when beta spots open.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email for early access"
        required
        className="flex-1 bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
        aria-label="Email for waitlist"
      />
      <Button 
        type="submit"
        className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold px-6"
      >
        Join Waitlist
      </Button>
    </form>
  )
}

// Testimonial Card Component
function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="w-80 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
      <div className="flex mb-2">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-flow-text-light dark:text-flow-text-dark text-sm mb-3">"{quote}"</p>
      <p className="text-flow-gray-600 dark:text-flow-gray-300 text-xs">
        <span className="font-medium">{author}</span>, {role}
      </p>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-flow-bg-light dark:bg-flow-bg-dark text-flow-text-light dark:text-flow-text-dark">
      {/* // Contrast checked with WebAIM, meets 4.5:1 */}
        
        {/* Theme Toggle - Teal, top-right */}
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-700 pt-24 pb-16">
        
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              {/* Logo */}
              <div className="flex justify-center mb-6">
                <div className="h-16 md:h-20 flex items-center justify-center">
                  <img 
                    src="/flow-viber-logo.png" 
                    alt="Flow Viber - AI Workflow Builder"
                    className="h-full w-auto object-contain dark:hidden"
                  />
                  <img 
                    src="/flow-viber-white-logo.png" 
                    alt="Flow Viber - AI Workflow Builder"
                    className="h-full w-auto object-contain hidden dark:block"
                  />
                </div>
              </div>

              {/* Hero Headline - specific text as required */}
              <h1 className="text-4xl font-bold mb-4 text-flow-text-light dark:text-flow-text-dark">
                Build Interoperable Workflows Across n8n, Make, and Finance Apps—Just Chat
              </h1>
              
              {/* Subheadline */}
              <p className="text-lg text-flow-gray-600 dark:text-flow-gray-300 mb-4">
                Create hybrid automations <span className="font-semibold text-flow-cta">3x faster</span> with guided natural language prompts, no setup hassle.
              </p>

              {/* Differentiator */}
              <p className="text-sm text-flow-gray-500 dark:text-flow-gray-400 mb-8">
                Unlike n8n's single-platform builder, Flow Viber orchestrates n8n, Make, Pabbly, and Stripe in one chatbox.
              </p>

              {/* Waitlist Form */}
              <div className="mb-8">
                <p className="text-sm text-flow-gray-600 dark:text-flow-gray-300 mb-4 text-center">
                  Join the beta waitlist for early access:
                </p>
                <WaitlistForm />
              </div>
            </div>
            
            {/* Chat Demo - much wider for desktop */}
            <div id="demo" className="flex justify-center mb-16">
              <div className="w-[200px] h-[300px] md:w-[900px] md:h-[600px]">
                <InteractiveChatDemo />
              </div>
            </div>
          </div>
        </section>

        {/* Why Flow Viber Section */}
        <section className="py-16 text-center">
          <div className="container mx-auto px-6">
            <h2 className="text-2xl font-bold text-flow-text-light dark:text-flow-text-dark mb-4">
              Why Flow Viber?
            </h2>
            <p className="text-xl text-flow-text-light dark:text-flow-text-dark mb-8">
              Simplicity Meets Power—One Chatbox for All Your Tools.
            </p>
          </div>
        </section>

        {/* Specialized Agents Section - 3-column grid as specified */}
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-flow-text-light dark:text-flow-text-dark mb-4">
                Specialized AI Agents
              </h2>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* E-commerce Expert */}
              <Card className="bg-white dark:bg-gray-800 p-4">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center mb-4">
                    <Bot className="w-6 h-6 !text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-flow-text-light dark:text-flow-text-dark">E-commerce Expert</h3>
                  <p className="text-sm text-flow-gray-600 dark:text-flow-gray-300">
                    Handles Shopify via n8n + payments via Stripe, all in one chat.
                  </p>
                </CardContent>
              </Card>

              {/* Marketing Automation */}
              <Card className="bg-white dark:bg-gray-800 p-4">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="w-6 h-6 !text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-flow-text-light dark:text-flow-text-dark">Marketing Automation</h3>
                  <p className="text-sm text-flow-gray-600 dark:text-flow-gray-300">
                    Orchestrates email campaigns via Make + analytics via n8n + payment tracking via Stripe.
                  </p>
                </CardContent>
              </Card>

              {/* Finance Pro */}
              <Card className="bg-white dark:bg-gray-800 p-4">
                <CardContent className="p-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-800 rounded-lg flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 !text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-flow-text-light dark:text-flow-text-dark">Finance Pro</h3>
                  <p className="text-sm text-flow-gray-600 dark:text-flow-gray-300">
                    Automates QuickBooks + Stripe invoices via NL.
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Testimonial Cards */}
            <div className="mt-16">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center">
                <TestimonialCard 
                  quote="Flow Viber made my e-commerce automation effortless—saved hours!"
                  author="Jane Doe"
                  role="E-commerce Dev"
                />
                <TestimonialCard 
                  quote="Finally, I can connect multiple platforms without coding expertise."
                  author="Mike Smith"
                  role="Marketing Manager"
                />
                <TestimonialCard 
                  quote="The AI creates better workflows than I imagined possible."
                  author="Sarah Johnson"
                  role="Operations Lead"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-bold text-flow-text-light dark:text-flow-text-dark mb-4">
                Platform Integrations
              </h2>
            </div>

            {/* Horizontal flex layout */}
            <div className="flex flex-wrap justify-center items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-lg">
              {/* n8n - Live */}
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                  <Workflow className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-flow-text-light dark:text-flow-text-dark text-sm">n8n</p>
                  <p className="text-xs text-green-600 dark:text-green-400">Live: JSON export</p>
                </div>
              </div>

              {/* Make - Beta */}
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                  <GitBranch className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-flow-text-light dark:text-flow-text-dark text-sm">Make</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Beta: Coming Oct 28</p>
                </div>
              </div>

              {/* Pabbly - Beta */}
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <div className="w-8 h-8 bg-purple-500 rounded flex items-center justify-center">
                  <Network className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-flow-text-light dark:text-flow-text-dark text-sm">Pabbly</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Beta: Coming Oct 28</p>
                </div>
              </div>

              {/* Stripe - Beta */}
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-flow-text-light dark:text-flow-text-dark text-sm">Stripe</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Beta: Coming Oct 28</p>
                </div>
              </div>
              
              {/* QuickBooks - Beta */}
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-flow-text-light dark:text-flow-text-dark text-sm">QuickBooks</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">Beta: Coming Oct 28</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      {/* New Section: Why Flow Viber */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-gray-900 dark:text-white">Why Flow Viber? </span>
              <span className="block mt-2 bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
                Simplicity Meets Power—One Chatbox for All Your Tools
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Clock className="w-10 h-10 !text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">3x Faster Setup</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Build complex workflows in minutes, not hours. No learning curve, no documentation diving.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Network className="w-10 h-10 !text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">True Interoperability</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Mix and match platforms. Use n8n triggers with Make actions and Stripe payments seamlessly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <MessageSquare className="w-10 h-10 !text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Natural Language</h3>
              <p className="text-gray-600 dark:text-slate-300">
                Just describe what you want. Our AI handles the technical complexity behind the scenes.
              </p>
            </div>
          </div>

          <div className="mt-16 bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 max-w-4xl mx-auto shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-white">
              <div>
                <h4 className="text-2xl font-bold mb-4 !text-white">For Developers</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-white" />
                    <span className="!text-white">Export clean, validated JSON ready for production</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-white" />
                    <span className="!text-white">Built-in error handling and retry logic</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-white" />
                    <span className="!text-white">Version control and rollback support</span>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-2xl font-bold mb-4 !text-white">For Business Users</h4>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-white" />
                    <span className="!text-white">No coding required, ever</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-white" />
                    <span className="!text-white">AI guides you through each step</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0 text-white" />
                    <span className="!text-white">Test workflows before deploying</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Company</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* Product */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Product</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/features" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/integrations" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Integrations
                  </Link>
                </li>
                <li>
                  <Link href="/roadmap" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Roadmap
                  </Link>
                </li>
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Resources</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/docs" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/tutorials" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Tutorials
                  </Link>
                </li>
                <li>
                  <Link href="/api" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    API Reference
                  </Link>
                </li>
                <li>
                  <Link href="/community" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Community
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/privacy" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/security" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="/gdpr" className="text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                    GDPR
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-600 dark:text-slate-300 mb-4 md:mb-0">
                © 2025 Flow Viber. All rights reserved.
              </p>
              <div className="flex gap-4">
                <Lock className="w-5 h-5 text-gray-600 dark:text-slate-300" aria-label="Secure platform" />
                <Shield className="w-5 h-5 text-gray-600 dark:text-slate-300" aria-label="Enterprise security" />
                <Globe className="w-5 h-5 text-gray-600 dark:text-slate-300" aria-label="Global availability" />
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}