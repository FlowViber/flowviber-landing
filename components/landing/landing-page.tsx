"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import useEmblaCarousel from 'embla-carousel-react'
import { 
  Check,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Mail,
  MapPin
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { translations } from "@/lib/translations"
import { LanguageToggle } from "./language-toggle"
import { CookieConsent } from "./cookie-consent"
import { HeroSection } from "./hero-section"
import { StatsSection } from "./stats-section"
import { ProcessFlowSection } from "./process-flow-section"
import { TestimonialsSection } from "./testimonials-section"

function WorkflowSlider() {
  const { language } = useLanguage();
  const t = translations[language];
  
  const automationResults = t.carousel.cases.map((item, index) => ({
    id: index + 1,
    ...item
  }));

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
                <Card className="bg-white border-gray-200 shadow-sm">
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <div className="inline-block bg-gray-100 text-gray-800 text-sm font-semibold px-3 py-1 rounded-full mb-3">
                            {result.company}
                          </div>
                          <h4 className="text-sm font-semibold text-gray-500 mb-1.5">{t.carousel.challenge}</h4>
                          <p className="text-base text-gray-700">{result.challenge}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-semibold text-gray-500 mb-1.5">{t.carousel.solution}</h4>
                          <p className="text-base text-gray-700">{result.solution}</p>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          {t.carousel.results}
                        </h4>
                        <ul className="space-y-2.5">
                          {result.results.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <Check className="w-4 h-4 text-gray-700 mt-0.5 flex-shrink-0" />
                              <span className="text-base font-medium text-gray-700">{item}</span>
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
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:shadow-lg border border-gray-200 transition-all z-10"
        aria-label="Previous result"
      >
        <ChevronLeft className="w-6 h-6 text-gray-700" />
      </button>

      <button
        onClick={scrollNext}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white p-3 rounded-full shadow-md hover:shadow-lg border border-gray-200 transition-all z-10"
        aria-label="Next result"
      >
        <ChevronRight className="w-6 h-6 text-gray-700" />
      </button>

      <div className="flex justify-center gap-2 mt-6">
        {automationResults.map((_, index) => (
          <button
            key={index}
            onClick={() => emblaApi?.scrollTo(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === selectedIndex 
                ? 'bg-gray-900 w-8' 
                : 'bg-gray-300'
            }`}
            aria-label={`Go to result ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

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
      <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center max-w-2xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{language === 'nl' ? 'Bedankt!' : 'Thank You!'}</h3>
        <p className="text-gray-600">
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
            <label htmlFor="name" className="block text-sm font-medium mb-2 text-gray-700">{t.contact.form.name}</label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
              className="bg-white border-gray-200 focus:border-gray-400 focus:ring-gray-400"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-700">{t.contact.form.email}</label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="bg-white border-gray-200 focus:border-gray-400 focus:ring-gray-400"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="company" className="block text-sm font-medium mb-2 text-gray-700">{t.contact.form.company}</label>
          <Input
            id="company"
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            className="bg-white border-gray-200 focus:border-gray-400 focus:ring-gray-400"
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2 text-gray-700">
            {language === 'nl' ? 'Bericht' : 'Message'}
          </label>
          <textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({...formData, message: e.target.value})}
            required
            rows={5}
            placeholder={t.contact.form.message}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-400 text-gray-700"
          />
        </div>
        
        <Button 
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-6 text-lg rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          {isSubmitting ? t.contact.form.sending : t.contact.form.submit}
        </Button>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">{t.contact.or}</p>
        <Button 
          asChild
          size="lg" 
          className="bg-white hover:bg-gray-50 text-gray-900 font-bold border-2 border-gray-300 hover:border-gray-400 rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <a href="https://calendly.com/contact-flowviber/30min" target="_blank" rel="noopener noreferrer">
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
    <div className="min-h-screen bg-white text-gray-900">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img 
                src="/flow-viber-logo.png" 
                alt="FlowViber"
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">FlowViber</h1>
                <p className="text-sm text-gray-600">{t.header.tagline}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Button 
                asChild
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold hidden md:flex rounded-lg shadow-sm hover:shadow-md transition-all"
              >
                <a href="https://calendly.com/contact-flowviber/30min" target="_blank" rel="noopener noreferrer">
                  {t.header.ctaButton}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <HeroSection />
      
      <StatsSection />
      
      <ProcessFlowSection />
      
      <TestimonialsSection />

      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              {t.carousel.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {language === 'nl' 
                ? 'Ontdek hoe bedrijven zoals de uwe succes behalen met onze AI-automatisering'
                : 'Discover how companies like yours achieve success with our AI automation'}
            </p>
          </div>
          <WorkflowSlider />
        </div>
      </section>

      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              {t.contact.title}
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t.contact.subtitle}
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img 
                  src="/flow-viber-logo.png" 
                  alt="FlowViber"
                  className="h-8 w-auto"
                />
                <h3 className="text-lg font-bold text-gray-900">FlowViber</h3>
              </div>
              <p className="text-gray-600">
                {language === 'nl' 
                  ? 'AI-automatisering die meetbare resultaten levert'
                  : 'AI automation that delivers measurable results'}
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-4">
                {language === 'nl' ? 'Contact' : 'Contact'}
              </h4>
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:contact@flowviber.com" className="hover:text-gray-900">
                    contact@flowviber.com
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>Amsterdam, Netherlands</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-4">
                {language === 'nl' ? 'Plan een gesprek' : 'Schedule a call'}
              </h4>
              <Button 
                asChild
                className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg w-full"
              >
                <a href="https://calendly.com/contact-flowviber/30min" target="_blank" rel="noopener noreferrer">
                  <Calendar className="w-4 h-4 mr-2" />
                  {language === 'nl' ? 'Boek nu' : 'Book now'}
                </a>
              </Button>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-8 text-center text-gray-600 text-sm">
            <p>© 2025 FlowViber. {language === 'nl' ? 'Alle rechten voorbehouden.' : 'All rights reserved.'}</p>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </div>
  )
}
