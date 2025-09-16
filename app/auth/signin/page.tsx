"use client"

import { signIn, getProviders } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Github, Mail, Chrome, Send, Eye, EyeOff } from "lucide-react"

export default function SignIn() {
  const [providers, setProviders] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [emailSent, setEmailSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [usePassword, setUsePassword] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginError, setLoginError] = useState("")

  useEffect(() => {
    const setAuthProviders = async () => {
      const res = await getProviders()
      setProviders(res)
    }
    setAuthProviders()
  }, [])

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'github':
        return <Github className="w-4 h-4" />
      case 'google':
        return <Chrome className="w-4 h-4" />
      case 'email':
        return <Mail className="w-4 h-4" />
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
      default:
        return providerId
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setLoginError("")
    
    try {
      if (usePassword) {
        // Password-based sign in
        if (!password) {
          setLoginError("Password is required")
          setIsLoading(false)
          return
        }

        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl: '/dashboard'
        })
        
        if (result?.error) {
          setLoginError("Invalid email or password")
        } else if (result?.ok) {
          // Success - redirect to dashboard
          window.location.href = '/dashboard'
        }
      } else {
        // Magic link sign in
        const result = await signIn('email', {
          email,
          redirect: false,
          callbackUrl: '/dashboard'
        })
        
        if (result && !result.error) {
          setEmailSent(true)
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setLoginError("An error occurred during sign in")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoAuth = async () => {
    // For development - create demo user and redirect to OAuth
    if (process.env.NODE_ENV === 'development') {
      try {
        await fetch('/api/auth/demo', { method: 'POST' })
        // Use GitHub as demo OAuth flow
        signIn('github', { callbackUrl: '/' })
      } catch (error) {
        console.error('Demo auth failed:', error)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {isRegisterMode ? "Create Your Account" : "Welcome Back"}
          </CardTitle>
          <CardDescription>
            {isRegisterMode 
              ? "Join Flow Viber and start building powerful n8n workflows"
              : "Sign in to your account to continue building workflows"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {emailSent ? (
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <Send className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">Check your email</h3>
              <p className="text-sm text-muted-foreground">
                We've sent a {isRegisterMode ? "confirmation" : "verification"} link to <strong>{email}</strong>
              </p>
              {isRegisterMode && (
                <p className="text-xs text-muted-foreground">
                  Click the link to create your account and sign in automatically
                </p>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setEmailSent(false)
                  setEmail("")
                  setIsRegisterMode(false)
                }}
              >
                Try another email
              </Button>
            </div>
          ) : (
            <>
              {/* Email Authentication Form */}
              {providers && Object.values(providers).some((p: any) => p.id === 'email') && (
                <form onSubmit={handleEmailSignIn} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  {usePassword && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 transform -translate-y-1/2"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  {usePassword && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => window.location.href = `/auth/forgot-password?email=${encodeURIComponent(email)}`}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {loginError && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <p className="text-red-700 dark:text-red-400 text-sm">{loginError}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                    {isLoading ? (
                      "Signing in..."
                    ) : (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {usePassword ? "Sign In with Password" : (isRegisterMode ? "Create Account with Email" : "Continue with Email")}
                      </div>
                    )}
                  </Button>

                  {!isRegisterMode && (
                    <div className="text-center text-sm">
                      <button
                        type="button"
                        onClick={() => setUsePassword(!usePassword)}
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {usePassword ? "Use magic link instead" : "Sign in with password"}
                      </button>
                    </div>
                  )}
                </form>
              )}

              {/* Register/Sign In Toggle */}
              {providers && Object.values(providers).some((p: any) => p.id === 'email') && (
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">
                    {isRegisterMode ? "Already have an account?" : "New to Flow Viber?"}
                  </span>
                  {" "}
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(!isRegisterMode)}
                    className="text-primary hover:underline font-medium"
                  >
                    {isRegisterMode ? "Sign in" : "Create an account"}
                  </button>
                </div>
              )}

              {/* Info about email registration */}
              {isRegisterMode && providers && Object.values(providers).some((p: any) => p.id === 'email') && (
                <div className="text-xs text-muted-foreground text-center p-3 bg-muted/30 rounded-lg">
                  <p>
                    ✨ We'll send you a secure confirmation link to create your account. 
                    No password needed!
                  </p>
                </div>
              )}

              {/* OAuth Providers */}
              {providers && Object.values(providers).filter((p: any) => p.type === 'oauth').length > 0 && (
                <>
                  {Object.values(providers).some((p: any) => p.id === 'email') && (
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or continue with
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {Object.values(providers)
                    .filter((provider: any) => provider.type === 'oauth')
                    .map((provider: any) => (
                      <Button
                        key={provider.name}
                        variant="outline"
                        className="w-full"
                        onClick={() => signIn(provider.id, { callbackUrl: '/' })}
                      >
                        <div className="flex items-center gap-2">
                          {getProviderIcon(provider.id)}
                          Continue with {getProviderName(provider.id)}
                        </div>
                      </Button>
                    ))}
                </>
              )}
            </>
          )}
          
          {!providers && (
            <div className="text-center text-muted-foreground">
              Loading authentication options...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}