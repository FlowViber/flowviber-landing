
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { NotificationProvider } from "@/components/shared/notification-dialog"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { Providers } from "./providers"
import { LanguageProvider } from "@/contexts/LanguageContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "FlowViber - AI Automatisering voor Bedrijven | AI Automation for Businesses",
  description: "AI automatisering die echte resultaten levert. Wij bouwen op maat gemaakte AI-automatiseringen voor bedrijven die meetbare ROI leveren in weken. AI for businesses that transforms operations.",
  keywords: ["AI voor bedrijven", "AI for businesses", "AI automatisering", "AI automation", "bedrijfsautomatisering", "business automation", "AI chatbot", "lead qualification AI", "customer support automation", "AI voor organisaties", "workflow automatisering"],
  authors: [{ name: "FlowViber" }],
  creator: "FlowViber",
  publisher: "FlowViber",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://flowviber.io'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "FlowViber - AI Automatisering voor Bedrijven | AI Automation for Businesses",
    description: "AI automatisering die echte resultaten levert. AI voor bedrijven - custom automation delivering measurable ROI in weeks. Transform your business operations with AI.",
    url: '/',
    siteName: 'FlowViber',
    locale: 'nl_NL',
    type: 'website',
    images: [
      {
        url: '/flow-viber-logo.png',
        width: 400,
        height: 400,
        alt: 'FlowViber - AI Automation That Delivers Real Results',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "FlowViber - AI Automatisering voor Bedrijven | AI for Businesses",
    description: "AI voor bedrijven - custom automation delivering measurable ROI. 50-70% kostenbesparing, 24/7 operaties. AI automatisering die uw bedrijf transformeert.",
    images: ['/flow-viber-logo.png'],
    creator: '@flowviber',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verification-token', // Add your Google Search Console verification token
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log("[v0] RootLayout rendering...")

  return (
    <html lang="nl" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <LanguageProvider>
              <ErrorBoundary>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </ErrorBoundary>
            </LanguageProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
