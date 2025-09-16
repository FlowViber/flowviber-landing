"use client"

import { useSession, signIn, getProviders, signOut } from "next-auth/react"
import { ReactNode, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Chrome, Mail, Sparkles, Database, Zap, User } from "lucide-react"

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const [providers, setProviders] = useState<any>(null)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    const setAuthProviders = async () => {
      try {
        const res = await getProviders()
        setProviders(res)
      } catch (error) {
        console.error('[AuthGuard] Failed to load providers:', error)
        setProviders({})
      }
    }
    setAuthProviders()
  }, [])

  // Listen for storage events to handle signout across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nextauth.message' && e.newValue?.includes('signout')) {
        setIsSigningOut(true)
        window.location.reload()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Handle signout state properly
  useEffect(() => {
    if (status === 'unauthenticated' && session === null && !isSigningOut) {
      // Clear any cached data
      setIsSigningOut(false)
    }
  }, [status, session, isSigningOut])

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'github':
        return <Github className="w-4 h-4" />
      case 'google':
        return <Chrome className="w-4 h-4" />
      case 'email':
        return <Mail className="w-4 h-4" />
      case 'demo':
        return <User className="w-4 h-4" />
      default:
        return null
    }
  }

  const getProviderName = (providerId: string) => {
    switch (providerId) {
      case 'github':
        return 'GitHub'
      case 'google':
        return 'Google'
      case 'email':
        return 'Email'
      case 'demo':
        return 'Demo Login'
      default:
        return providerId
    }
  }

  if (status === "loading" || isSigningOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            {isSigningOut ? 'Signing out...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-bold mb-2">
              Welcome to Flow Viber
            </CardTitle>
            <CardDescription className="text-lg">
              NL powered workflow builder, integrated with n8n. Our powerful workflow AI has been RAG trained on 1000's of templates and documents, empowering the most complex workflows to be generated with ease.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                  <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold mb-1">Natural Language</h3>
                <p className="text-sm text-muted-foreground">
                  Describe your automation in plain English
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                  <Database className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold mb-1">n8n Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Deploy directly to your n8n instance
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                  <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="font-semibold mb-1">RAG-Trained AI</h3>
                <p className="text-sm text-muted-foreground">
                  Trained on 1000's of templates for complex workflows
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Sign in to start building your automated workflows
              </p>
              <div className="space-y-3">
                {providers && Object.keys(providers).length > 0 ?
                  Object.values(providers).map((provider: any) => (
                    <Button
                      key={provider.name}
                      variant="outline"
                      className="w-full"
                      onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
                    >
                      <div className="flex items-center gap-2">
                        {getProviderIcon(provider.id)}
                        Continue with {getProviderName(provider.id)}
                      </div>
                    </Button>
                  )) : (
                  // Development demo login when no OAuth providers are configured
                  <div className="space-y-3">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        Development Mode - Demo Authentication
                      </p>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={async () => {
                          const email = prompt('Enter any email for demo login:') || 'demo@flowviber.local'
                          const response = await fetch('/api/auth/demo-signin', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email })
                          })
                          if (response.ok) {
                            window.location.reload()
                          } else {
                            alert('Demo login failed')
                          }
                        }}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Demo Login
                      </Button>
                    </div>
                  </div>
                )}
                
                {!providers && (
                  <div className="text-center text-muted-foreground">
                    Loading authentication options...
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}