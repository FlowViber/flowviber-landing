"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Check,
  Star,
  Moon,
  Sun,
  Phone,
  Mail,
  Calendar
} from "lucide-react"

// Theme Toggle Component
function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false)

  React.useEffect(() => {
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
      className="h-10 px-4 bg-black/10 hover:bg-black/20 text-gray-900 border border-black/20 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/25 backdrop-blur-sm transition-colors"
      aria-label="Toggle theme"
      aria-pressed={isDark}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
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
        <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Name</label>
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
        <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Email</label>
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
        <label htmlFor="description" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Describe your automation need</label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
          rows={5}
          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
        />
      </div>
      
      <div>
        <label htmlFor="budget" className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Budget Range</label>
        <select
          id="budget"
          value={formData.budget}
          onChange={(e) => setFormData({...formData, budget: e.target.value})}
          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white">
      
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
                <p className="text-sm text-gray-600 dark:text-slate-300">Production-Ready n8n Workflows That Actually Work</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-semibold">
              Get Your Workflow Built - $2000
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-slate-800 dark:to-slate-900">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              Stop Debugging. Start Deploying.
            </h2>
            <p className="text-xl text-gray-600 dark:text-slate-300 mb-8">
              We build n8n workflows that handle 500+ concurrent users, not just 5 test cases.
            </p>
            
            {/* Workflow Diagram */}
            <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 mb-8 shadow-lg">
              <img 
                src="/workflow-diagram.png" 
                alt="n8n Workflow Diagram Example"
                className="w-full h-auto rounded"
              />
            </div>
            
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white font-bold text-lg px-8 py-6">
              Book Free Consultation
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
                  Tutorial workflows break in production
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-6 text-center">
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  Spending nights debugging data mapping errors
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <CardContent className="p-6 text-center">
                <p className="text-lg font-semibold text-red-700 dark:text-red-300">
                  Workflows fail at scale with real data
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
            <h3 className="text-4xl font-bold text-center mb-12">We build production-tested workflows with:</h3>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-semibold mb-2">Proper error handling</h4>
                  <p className="text-gray-600 dark:text-slate-300">Every workflow includes comprehensive error catching and retry logic</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-semibold mb-2">Scale testing (100+ concurrent executions)</h4>
                  <p className="text-gray-600 dark:text-slate-300">We stress test your workflows with real-world load before delivery</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-semibold mb-2">Data validation and mapping</h4>
                  <p className="text-gray-600 dark:text-slate-300">Robust data transformation that handles edge cases and malformed data</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <Check className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="text-xl font-semibold mb-2">30-day support included</h4>
                  <p className="text-gray-600 dark:text-slate-300">We stand by our work with a full month of post-deployment support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <h3 className="text-4xl font-bold text-center mb-12">Simple, Transparent Pricing</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-8">
            <Card className="bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600">
              <CardContent className="p-8">
                <h4 className="text-2xl font-bold mb-2">Simple Workflow</h4>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">$2,000</p>
                <p className="text-gray-600 dark:text-slate-300 mb-6">5-7 days delivery</p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Single integration workflow</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Error handling & validation</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Scale tested</span>
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
                <h4 className="text-2xl font-bold mb-2">Complex Workflow</h4>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">$5,000</p>
                <p className="text-gray-600 dark:text-slate-300 mb-6">10-14 days delivery</p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Multiple integrations</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Advanced error handling</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Custom logic & transformations</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>Scale tested (500+ concurrent)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                    <span>30-day support</span>
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
              <h4 className="text-lg font-semibold mb-2">We build your workflow</h4>
              <p className="text-gray-600 dark:text-slate-300">Expert development with best practices</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 !text-white">3</div>
              <h4 className="text-lg font-semibold mb-2">Test with real data at scale</h4>
              <p className="text-gray-600 dark:text-slate-300">Stress testing with production-like conditions</p>
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="bg-gray-50 dark:bg-slate-700">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-slate-300 mb-4 italic">
                  "Placeholder for testimonial. Add your real client testimonial here."
                </p>
                <p className="font-semibold">Client Name</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">Company, Role</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-50 dark:bg-slate-700">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-slate-300 mb-4 italic">
                  "Placeholder for testimonial. Add your real client testimonial here."
                </p>
                <p className="font-semibold">Client Name</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">Company, Role</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-50 dark:bg-slate-700">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-slate-300 mb-4 italic">
                  "Placeholder for testimonial. Add your real client testimonial here."
                </p>
                <p className="font-semibold">Client Name</p>
                <p className="text-sm text-gray-600 dark:text-slate-400">Company, Role</p>
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
              
              <a href="tel:+1234567890" className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                <Phone className="w-5 h-5" />
                Schedule Call
              </a>
              
              <a href="#" className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400">
                <Calendar className="w-5 h-5" />
                Book on Calendly
              </a>
            </div>
            
            <p className="text-gray-600 dark:text-slate-300">
              © 2025 FlowViber. Production-Ready n8n Workflows.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
