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
  ChevronRight,
  Sparkles,
  Zap,
  TrendingUp,
  Clock,
  Shield,
  Rocket,
  Lock,
  Server,
  MapPin,
  Database
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations } from "@/lib/translations"
import { LanguageToggle } from "./language-toggle"

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
  const { language } = useLanguage();
  const t = translations[language];
  
  const automationResults = t.carousel.cases.map((item, index) => ({
    id: index + 1,
    ...item
  }));
  
  const oldAutomationResults = [
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
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Left Column: Company & Challenge & Solution */}
                      <div className="space-y-4">
                        <div>
                          <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold px-3 py-1 rounded-full mb-3">
                            {result.company}
                          </div>
                          <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1.5">{t.carousel.challenge}</h4>
                          <p className="text-base text-gray-700 dark:text-slate-300">{result.challenge}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 dark:text-slate-400 mb-1.5">{t.carousel.solution}</h4>
                          <p className="text-base text-gray-700 dark:text-slate-300">{result.solution}</p>
                        </div>
                      </div>
                      
                      {/* Right Column: Results Achieved */}
                      <div className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
                        <h4 className="text-base font-bold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          {t.carousel.results}
                        </h4>
                        <ul className="space-y-2.5">
                          {result.results.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                              <span className="text-base font-medium text-gray-700 dark:text-slate-300">{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
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
  const { language } = useLanguage()
  const t = translations[language]
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
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
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center max-w-2xl mx-auto">
        <Check className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">{language === 'nl' ? 'Bedankt!' : 'Thank You!'}</h3>
        <p className="text-green-600 dark:text-green-400">
          {language === 'nl' 
            ? 'We nemen binnen 24 uur contact met u op om uw automatiseringsbehoeften te bespreken.' 
            : "We'll get back to you within 24 hours to discuss your automation needs."}
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">{t.contact.form.name}</label>
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
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">{t.contact.form.email}</label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="company" className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">{t.contact.form.company}</label>
          <Input
            id="company"
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            className="bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600"
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-700 dark:text-white">
            {language === 'nl' ? 'Bericht' : 'Message'}
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            required
            rows={5}
            placeholder={t.contact.form.message}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700 dark:text-white"
          />
        </div>
        
        <Button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold py-3 text-lg"
        >
          {isSubmitting ? t.contact.form.sending : t.contact.form.submit}
        </Button>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-gray-600 dark:text-slate-400 mb-4">{t.contact.or}</p>
        <Button 
          asChild
          size="lg" 
          className="bg-gradient-to-r from-green-600 to-green-800 hover:from-green-700 hover:to-green-900 text-white font-bold"
        >
          <a href="https://calendly.com/contact-flowviber/30min" target="_blank" rel="noopener noreferrer" className="!text-white">
            <Calendar className="w-5 h-5 mr-2" />
            {t.contact.calendly}
          </a>
        </Button>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { language } = useLanguage();
  const t = translations[language];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-white">

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
                <p className="text-base text-gray-600 dark:text-slate-300">{t.header.tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <ThemeToggle />
              <Button 
                asChild
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold hidden md:flex"
              >
                <a href="https://calendly.com/contact-flowviber/30min" target="_blank" rel="noopener noreferrer" className="!text-white">
                  {t.header.ctaButton}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-900/20 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            {/* Main headline with icon */}
            <div className="inline-flex items-center gap-3 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-6 py-3 rounded-full mb-8 border border-blue-200 dark:border-blue-800">
              <Sparkles className="w-5 h-5" />
              <span className="font-semibold text-base">{t.hero.badge}</span>
            </div>
            
            <h2 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              {t.hero.title}
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto">
              {t.hero.subtitle}
            </p>
            
            {/* Key benefits with icons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">{t.hero.benefits.fast.title}</p>
                  <p className="text-base text-gray-600 dark:text-slate-400">{t.hero.benefits.fast.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">{t.hero.benefits.operation.title}</p>
                  <p className="text-base text-gray-600 dark:text-slate-400">{t.hero.benefits.operation.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 dark:text-white">{t.hero.benefits.impact.title}</p>
                  <p className="text-base text-gray-600 dark:text-slate-400">{t.hero.benefits.impact.description}</p>
                </div>
              </div>
            </div>
            
            {/* AI Automation Results Slider */}
            <div className="mb-12">
              <h3 className="text-2xl md:text-3xl font-bold mb-6">{t.carousel.title}</h3>
              <WorkflowSlider />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                asChild
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all"
              >
                <a href="https://calendly.com/contact-flowviber/30min" target="_blank" rel="noopener noreferrer" className="!text-white flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  {t.hero.cta}
                </a>
              </Button>
              
              <div className="flex items-center gap-2 text-gray-600 dark:text-slate-400">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-base">{t.hero.trust}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {t.problems.items.map((problem, index) => (
              <Card key={index} className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <CardContent className="p-6 text-center">
                  <p className="text-xl font-semibold text-red-700 dark:text-red-300">
                    {problem}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-4xl font-bold text-center mb-12">{t.solutions.title}</h3>
            
            <div className="space-y-6">
              {t.solutions.items.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="text-xl font-semibold mb-2">{item.title}</h4>
                    <p className="text-lg text-gray-600 dark:text-slate-300">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* AI for Companies Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-4xl font-bold text-center mb-6">{t.aiSection.title}</h3>
            <p className="text-xl text-gray-600 dark:text-slate-300 text-center mb-12">
              {t.aiSection.subtitle}
            </p>
            
            <div className="space-y-8">
              <div>
                <h4 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">{t.aiSection.whatIs.title}</h4>
                <p className="text-xl text-gray-700 dark:text-slate-300 leading-relaxed">
                  {t.aiSection.whatIs.description}
                </p>
              </div>

              <div>
                <h4 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">{t.aiSection.howItWorks.title}</h4>
                <p className="text-xl text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                  {t.aiSection.howItWorks.description}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {t.aiSection.howItWorks.cases.map((caseItem, index) => (
                    <Card key={index} className="bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600">
                      <CardContent className="p-6">
                        <h5 className="font-bold text-lg mb-2">{caseItem.title}</h5>
                        <p className="text-base text-gray-600 dark:text-slate-300">
                          {caseItem.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-2xl font-bold mb-4 text-blue-600 dark:text-blue-400">{t.aiSection.whyEssential.title}</h4>
                <p className="text-xl text-gray-700 dark:text-slate-300 leading-relaxed mb-4">
                  {t.aiSection.whyEssential.description}
                </p>
                <ul className="space-y-3 text-xl text-gray-700 dark:text-slate-300">
                  {t.aiSection.whyEssential.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                      <span dangerouslySetInnerHTML={{ __html: benefit }} />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8">
                <h4 className="text-2xl font-bold mb-4 text-center">{t.aiSection.roi.title}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  {t.aiSection.roi.metrics.map((metric, index) => (
                    <div key={index}>
                      <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">{metric.value}</p>
                      <p className="text-lg text-gray-700 dark:text-slate-300">{metric.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <p className="text-xl text-gray-700 dark:text-slate-300 mb-6">
                  {t.aiSection.cta.description}
                </p>
                <Button 
                  asChild
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold text-lg px-8 py-6"
                >
                  <a href="https://calendly.com/contact-flowviber/30min" target="_blank" rel="noopener noreferrer" className="!text-white">
                    {t.aiSection.cta.button}
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Privacy & EU Compliance Section */}
      <section className="py-20 bg-gradient-to-b from-white to-green-50/30 dark:from-slate-800 dark:to-green-900/10">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-4 py-2 rounded-full mb-6 text-base font-medium">
                <Shield className="w-4 h-4" />
                <span>{t.privacy.badge}</span>
              </div>
              
              <h3 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">
                {t.privacy.title}
              </h3>
              <p className="text-xl text-gray-600 dark:text-slate-300 max-w-3xl mx-auto">
                {t.privacy.subtitle}
              </p>
            </div>

            {/* Main Content Card */}
            <div className="bg-white dark:bg-slate-800/50 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-slate-700">
                {/* Left Column */}
                <div className="p-8 md:p-10 space-y-6">
                  {t.privacy.features.slice(0, 2).map((feature, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 ${index === 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-blue-100 dark:bg-blue-900/30'} rounded-lg flex items-center justify-center`}>
                        {index === 0 ? <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" /> : <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">{feature.title}</h4>
                        <p className="text-gray-600 dark:text-slate-400 text-base leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="p-8 md:p-10 space-y-6">
                  {t.privacy.features.slice(2, 4).map((feature, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 ${index === 0 ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-orange-100 dark:bg-orange-900/30'} rounded-lg flex items-center justify-center`}>
                        {index === 0 ? <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" /> : <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg mb-1 text-gray-900 dark:text-white">{feature.title}</h4>
                        <p className="text-gray-600 dark:text-slate-400 text-base leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Banner */}
              <div className="bg-green-50 dark:bg-green-900/20 border-t border-green-100 dark:border-green-800/50 px-8 py-6">
                <div className="flex items-center justify-center gap-3 text-center">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 dark:bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-lg text-gray-700 dark:text-slate-300 font-medium">
                    {t.privacy.banner}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl font-bold text-center mb-12">{t.process.title}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {t.process.steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 !text-white">{index + 1}</div>
                <h4 className="text-xl font-semibold mb-2">{step.title}</h4>
                <p className="text-base text-gray-600 dark:text-slate-300">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl font-bold text-center mb-4">{t.contact.title}</h3>
          <p className="text-xl text-center text-gray-600 dark:text-slate-300 mb-12">
            {t.contact.subtitle}
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
              
              <a href="https://calendly.com/contact-flowviber/30min" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                <Calendar className="w-5 h-5" />
                {t.contact.calendly}
              </a>
            </div>
            
            <p className="text-gray-600 dark:text-slate-300">
              © 2025 FlowViber. {t.footer.tagline}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
