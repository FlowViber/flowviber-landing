
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/shared/theme-provider"
import { NotificationProvider } from "@/components/shared/notification-dialog"
import { ErrorBoundary } from "@/components/shared/error-boundary"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Flow Viber - Build Interoperable Workflows Across n8n, Make, and Finance Apps",
  description: "Create hybrid automations 3x faster with AI-guided natural language prompts. Connect n8n, Make, Pabbly, and Stripe in one chatbox - no setup hassle.",
  keywords: ["n8n workflows", "Make automation", "Stripe integration", "QuickBooks sync", "workflow builder", "automation platform", "AI workflow designer"],
  authors: [{ name: "Flow Viber" }],
  creator: "Flow Viber",
  publisher: "Flow Viber",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://flow-viber.replit.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Flow Viber - Build Interoperable Workflows Across n8n, Make, and Finance Apps",
    description: "Create hybrid automations 3x faster with AI-guided natural language prompts. Connect n8n, Make, Pabbly, and Stripe in one chatbox - no setup hassle.",
    url: '/',
    siteName: 'Flow Viber',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/flow-viber-logo.png',
        width: 400,
        height: 400,
        alt: 'Flow Viber - AI Workflow Builder for n8n, Make, and Finance Apps',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Flow Viber - Build Interoperable Workflows Across n8n, Make, and Finance Apps",
    description: "Create hybrid automations 3x faster with AI-guided natural language prompts. Connect n8n, Make, Pabbly, and Stripe in one chatbox.",
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
