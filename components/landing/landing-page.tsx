"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import useEmblaCarousel from 'embla-carousel-react'
import { 
  Check,
  Star,
  Moon,
  Sun,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

// Theme Toggle Component
function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
    const theme = localStorage.getItem('theme') || 'light'
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
      className="h-10 px-4 bg-black/10 hover:bg-black/20 text-gray-700 border border-black/20 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/25 backdrop-blur-sm transition-colors"
      aria-label="Toggle theme"
      aria-pressed={isDark}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  )
}

// AI Automation Results Slider Component
function WorkflowSlider() {
  const automationResults = [
    {
      id: 1,
      company: "E-commerce Retailer",
      challenge: "Customer support overwhelmed with 500+ daily messages across WhatsApp, Instagram, and Facebook",
      solution: "AI chatbot handling common inquiries with conversation memory",
      results: [
        "50% reduction in support tickets",
        "24/7 customer support availability",
        "Saved $8,000/month in support costs"
      ]
    },
    {
      id: 2,
      company: "B2B Sales Agency",
      challenge: "Sales team spending 20 hours/week manually researching and qualifying leads",
      solution: "AI-powered lead qualification with automatic personalized outreach",
      results: [
        "80% faster lead research",
        "3x higher email response rates",
        "20 hours/week saved per sales rep"
      ]
    },
    {
      id: 3,
      company: "SaaS Startup",
      challenge: "Manual data entry across CRM, spreadsheets, and billing systems causing errors",
      solution: "Automated data sync with AI validation and duplicate detection",
      results: [
        "99% reduction in data entry errors",
        "15 hours/week saved",
        "Real-time data across all platforms"
      ]
    },
    {
      id: 4,
      company: "Marketing Agency",
      challenge: "Managing social media for 30+ clients manually consuming entire team",
      solution: "AI content generation and cross-platform posting automation",
      results: [
        "70% reduction in content costs",
        "15 hours/week saved per client",
        "2x increase in client capacity"
      ]
    },
    {
      id: 5,
      company: "Professional Services",
      challenge: "Hot leads slipping through cracks with manual qualification process",
      solution: "AI lead scoring with instant routing to sales calendar",
      results: [
        "40% higher conversion rates",
        "Instant routing to sales team",
        "$50K+ additional monthly revenue"
      ]
    },
    {
      id: 6,
      company: "Online Retailer",
      challenge: "Customer feedback scattered across platforms with no insights",
      solution: "AI sentiment analysis with automatic categorization and alerts",
      results: [
        "Prevented 25% customer churn",
        "Instant product issue detection",
        "90% faster feedback response"
      ]
    }
  ]

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  React.useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    return () => {
      emblaApi.off('select', onSelect)
    }
  }, [emblaApi, onSelect])

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {automationResults.map((result) => (
            <div key={result.id} className="flex-[0_0_100%] min-w-0">
              <div className="px-4">
                <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                  <CardContent className="p-8">
                    <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-3">
                      {result.company}
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">The Challenge</h4>
                      <p className="text-gray-700 dark:text-slate-300">{result.challenge}</p>
                    </div>
                    
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-2">AI Automation Solution</h4>
                      <p className="text-gray-700 dark:text-slate-300">{result.solution}</p>
                    </div>
                    
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                      <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-3">Results Achieved</h4>
                      <ul className="space-y-2">
                        {result.results.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Check className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 dark:text-slate-300">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollPrev}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors z-10"
        aria-label="Previous result"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={scrollNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-800 p-3 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors z-10"
        aria-label="Next result"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="flex justify-center gap-2 mt-6">
        {automationResults.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === selectedIndex 
                ? 'bg-blue-600 w-8' 
                : 'bg-gray-300 dark:bg-slate-600'
            }`}
            aria-label={`Go to result ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

// Contact Form Component
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: '',
    budget: '$2K'
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        const error = await response.json()
        alert('Failed to submit form: ' + (error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Form submission error:', error)
      alert('Failed to submit form. Please try again.')
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center max-w-2xl mx-auto">
        <Check className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">Thank You!</h3>
        <p className="text-green-600 dark:text-green-400">We'll get back to you within 24 hours to discuss your workflow needs.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Name</label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
        />
      </div>
      
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Email</label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
          className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
        />
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Describe your automation need</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
          rows={5}
          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-white"
        />
      </div>
      
      <div>
        <label htmlFor="budget" className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">Budget Range</label>
        <select
          id="budget"
          value={formData.budget}
          onChange={(e) => setFormData({...formData, budget: e.target.value})}
          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-white"
        >
          <option value="$2K">$2,000</option>
          <option value="$5K">$5,000</option>
          <option value="$10K+">$10,000+</option>
        </select>
      </div>
      
      <Button 
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold py-3 text-lg"
      >
        Submit Request
      </Button>
    </form>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-white">
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-6 md:right-8 z-50">
        <ThemeToggle />
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="container mx-auto px-6 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img 
                src="/flow-viber-logo.png" 
                alt="FlowViber"
                className="h-12 w-auto dark:hidden"
              />
              <img 
                src="/flow-viber-white-logo.png" 
                alt="FlowViber"
                className="h-12 w-auto hidden dark:block"
              />
              <div>
                <h1 className="text-2xl font-bold">FlowViber</h1>
                <p className="text-sm text-gray-600 dark:text-slate-300">AI Automation That Delivers Real Results</p>
              </div>
            </div>
            <Button 
              asChild
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold"
            >
              <a href="https://calendly.com/contact-flowviber/30min" target="_blank" rel="noopener noreferrer" className="!text-white">
                Get AI Automation Built
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              AI Automation That Transforms Your Business
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 mb-12">
              Stop wasting time on repetitive tasks. We build custom AI automations that deliver measurable ROI in weeks, not months.
            </p>
            
            {/* AI Automation Results Slider */}
            <div className="mb-12">
              <h3 className="text-2xl font-bold mb-6">Real Results From Real Businesses</h3>
              <WorkflowSlider />
            </div>
            
            <Button 
              asChild
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold text-lg px-8 py-6"
            >
              <a href="https://calendly.com/contact-flowviber/30min" target="_blank" rel="noopener noreferrer" className="!text-white">
                Book Free Consultation
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-6 text-center">
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  Team drowning in repetitive manual tasks
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-6 text-center">
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  Missing revenue from slow response times
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-6 text-center">
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  Can't scale without hiring more people
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-4xl font-bold text-center mb-12">Our AI Automation Delivers:</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-semibold mb-2">Immediate ROI (2-4 weeks)</h4>
                  <p className="text-gray-600 dark:text-slate-300">See measurable time savings and cost reduction within the first month</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-semibold mb-2">24/7 operation with zero downtime</h4>
                  <p className="text-gray-600 dark:text-slate-300">AI works around the clock, handling tasks instantly without human intervention</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-semibold mb-2">Seamless integration with your tools</h4>
                  <p className="text-gray-600 dark:text-slate-300">Works with your existing CRM, email, chat platforms, and business software</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-semibold mb-2">Ongoing optimization and support</h4>
                  <p className="text-gray-600 dark:text-slate-300">We stand by our work with a full month of post-deployment support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI for Companies Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-4xl font-bold text-center mb-6">AI for Companies: How Workflows + AI Agents Transform Business Operations</h3>
            <p className="text-xl text-gray-600 dark:text-slate-300 text-center mb-12">
              Discover how businesses are using AI automation to eliminate repetitive work and scale operations without hiring
            </p>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">What is AI for Companies?</h4>
                <p className="text-lg text-gray-700 dark:text-slate-300 leading-relaxed">
                  AI for companies means integrating artificial intelligence into everyday business processes through automated workflows. Instead of hiring more staff to handle growing workloads, companies use AI-powered workflows to process data, qualify leads, respond to customers, and manage operations 24/7. This approach reduces costs by 50-70% while dramatically improving response times and accuracy.
                </p>
              </div>

              <div>
                <h4 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">How AI Agents Work in Business Workflows</h4>
                <p className="text-lg text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                  AI agents are intelligent assistants embedded directly into your business workflows. Here's how they transform operations:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                    <CardContent className="p-6">
                      <h5 className="font-bold text-lg mb-2">Lead Qualification AI</h5>
                      <p className="text-gray-600 dark:text-slate-300">
                        AI agents analyze LinkedIn profiles, company data, and email responses to instantly qualify leads using BANT criteria. They route hot leads to your calendar, mid-tier to WhatsApp, and cold leads to nurture sequences—all automatically.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                    <CardContent className="p-6">
                      <h5 className="font-bold text-lg mb-2">Customer Support AI</h5>
                      <p className="text-gray-600 dark:text-slate-300">
                        AI chatbots on WhatsApp, Instagram, and Facebook handle common questions 24/7 with conversation memory. They escalate complex issues to human agents with full context, reducing support tickets by 50% while improving satisfaction.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                    <CardContent className="p-6">
                      <h5 className="font-bold text-lg mb-2">Content Generation AI</h5>
                      <p className="text-gray-600 dark:text-slate-300">
                        AI agents create personalized email sequences, social media posts, and follow-up messages based on customer data and behavior patterns. What used to take 20 hours/week now runs automatically with better personalization.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                    <CardContent className="p-6">
                      <h5 className="font-bold text-lg mb-2">Data Analysis AI</h5>
                      <p className="text-gray-600 dark:text-slate-300">
                        AI agents analyze customer feedback sentiment, categorize support tickets, extract invoice data from PDFs, and generate business insights—transforming unstructured data into actionable intelligence without manual review.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <h4 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">Why Workflows + AI Agents Are Essential for Modern Companies</h4>
                <p className="text-lg text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                  Traditional AI tools exist in isolation. Workflow automation connects AI agents to your entire business ecosystem:
                </p>
                <ul className="space-y-3 text-lg text-gray-700 dark:text-slate-300">
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    <span><strong>Cross-platform integration:</strong> AI agents pull data from LinkedIn, enrich it with Apollo.io, analyze it with GPT-4, and push qualified leads to your CRM—all in one automated flow</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    <span><strong>Intelligent decision-making:</strong> Workflows route data to different AI agents based on conditions (hot leads get personal emails, cold leads get nurture campaigns)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    <span><strong>24/7 operations:</strong> AI workflows run continuously, processing leads, answering customers, and syncing data while your team sleeps</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                    <span><strong>Scalability without hiring:</strong> Handle 10x more leads, customers, or transactions without adding headcount—workflows scale instantly</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8">
                <h4 className="text-2xl font-bold mb-4 text-center">Real ROI from AI Workflow Automation</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">50-70%</p>
                    <p className="text-gray-700 dark:text-slate-300">Cost reduction vs. hiring</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">15-200hrs</p>
                    <p className="text-gray-700 dark:text-slate-300">Saved per month per workflow</p>
                  </div>
                  <div>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">24/7</p>
                    <p className="text-gray-700 dark:text-slate-300">Uninterrupted operations</p>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-xl text-gray-700 dark:text-slate-300 mb-6">
                  Ready to implement AI for your company? We build production-ready AI automation that integrates with your existing tools and scales with your business.
                </p>
                <Button 
                  asChild
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold text-lg px-8 py-6"
                >
                  <a href="https://calendly.com/contact-flowviber/30min" target="_blank" rel="noopener noreferrer" className="!text-white">
                    Schedule AI Automation Consultation
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
            <Card className="bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600">
              <CardContent className="p-8">
                <h4 className="text-2xl font-bold mb-2">Starter Automation</h4>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">$2,000</p>
                <p className="text-gray-600 dark:text-slate-300 mb-6">1-2 weeks delivery</p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Single AI automation task</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Integration with 1-2 platforms</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Production-ready deployment</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>30-day support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-300 dark:border-blue-700 shadow-xl">
              <CardContent className="p-8">
                <h4 className="text-2xl font-bold mb-2">Enterprise Automation</h4>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">$5,000+</p>
                <p className="text-gray-600 dark:text-slate-300 mb-6">2-4 weeks delivery</p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Multi-step AI automation</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Advanced AI logic & decision-making</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Custom integrations & APIs</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Enterprise-grade scalability</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Dedicated support</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <p className="text-center text-xl text-gray-600 dark:text-slate-300">
            Free 30-minute consultation to scope your needs
          </p>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl font-bold text-center mb-12">Our Process</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 !text-white">1</div>
              <h4 className="text-lg font-semibold mb-2">30-min consultation call</h4>
              <p className="text-gray-600 dark:text-slate-300">Understand your needs and scope the project</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 !text-white">2</div>
              <h4 className="text-lg font-semibold mb-2">We build your AI automation</h4>
              <p className="text-gray-600 dark:text-slate-300">Expert development with production-ready AI</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 !text-white">3</div>
              <h4 className="text-lg font-semibold mb-2">Test and optimize performance</h4>
              <p className="text-gray-600 dark:text-slate-300">Validate results with your real business data</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 !text-white">4</div>
              <h4 className="text-lg font-semibold mb-2">Deploy + 30 days support</h4>
              <p className="text-gray-600 dark:text-slate-300">Smooth deployment and ongoing assistance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl font-bold text-center mb-12">What Our Clients Say</h3>
          
          <div className="max-w-2xl mx-auto">
            <Card className="bg-gray-50 dark:bg-slate-700">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-slate-300 mb-4 italic">
                  "The Flow Viber guys really saved my day. After days of trying to get the workflow to work myself, they fixed it within a day."
                </p>
                <p className="font-semibold">Luca F.</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">Ring Logic AI, BD</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl font-bold text-center mb-4">Get Started Today</h3>
          <p className="text-xl text-center text-gray-600 dark:text-slate-300 mb-12">
            Tell us about your automation needs
          </p>
          
          <ContactForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-8">
              <a href="mailto:contact@flowviber.com" className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                <Mail className="w-5 h-5" />
                contact@flowviber.com
              </a>
              
              <a href="tel:+31644089354" className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                <Phone className="w-5 h-5" />
                +31 6 4408 9354
              </a>
              
              <a href="#" className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                <Calendar className="w-5 h-5" />
                Book on Calendly
              </a>
            </div>
            
            <p className="text-gray-600 dark:text-slate-300">
              © 2025 FlowViber. AI Automation That Delivers Results.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
