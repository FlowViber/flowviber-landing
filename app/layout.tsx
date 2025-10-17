
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { NotificationProvider } from "@/components/shared/notification-dialog"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "FlowViber - AI Automation Services That Deliver Real ROI",
  description: "Stop wasting time on manual tasks. We build custom AI automation that delivers measurable results in weeks. From lead qualification to customer support - automate it all.",
  keywords: ["AI automation", "business automation", "AI for companies", "workflow automation", "AI chatbot", "lead qualification AI", "customer support automation", "AI integration"],
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
    title: "FlowViber - AI Automation Services That Deliver Real ROI",
    description: "Stop wasting time on manual tasks. We build custom AI automation that delivers measurable results in weeks. From lead qualification to customer support - automate it all.",
    url: '/',
    siteName: 'FlowViber',
    locale: 'en_US',
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
    title: "FlowViber - AI Automation Services That Deliver Real ROI",
    description: "Stop wasting time on manual tasks. We build custom AI automation that delivers measurable results in weeks. 50-70% cost reduction, 24/7 operations.",
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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <ErrorBoundary>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </ErrorBoundary>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
