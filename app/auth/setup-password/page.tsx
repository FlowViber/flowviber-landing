"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PasswordSetup } from '@/components/dashboard/password-setup'

export default function SetupPasswordPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [hasPassword, setHasPassword] = useState(false)
  const [checkingPassword, setCheckingPassword] = useState(true)

  const checkPasswordStatus = async () => {
    try {
      const response = await fetch('/api/auth/check-password')
      const data = await response.json()
      
      if (data.hasPassword) {
        // User already has password, redirect to dashboard
        router.push('/dashboard')
        return
      } else {
        setHasPassword(false)
        setCheckingPassword(false)
      }
    } catch (error) {
      console.error('Error checking password status:', error)
      setCheckingPassword(false)
    }
  }

  const handlePasswordSet = () => {
    // Redirect to dashboard after password is set
    router.push('/dashboard')
  }

  useEffect(() => {
    if (status === 'loading') return // Still loading
    
    if (status === 'unauthenticated') {
      // Not authenticated, redirect to sign in
      router.push('/auth/signin')
      return
    }

    if (session?.user) {
      checkPasswordStatus()
    }
  }, [session, status, router])

  if (status === 'loading' || checkingPassword) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Complete Your Setup</CardTitle>
            <CardDescription>
              Please set up a password to secure your account and speed up future sign-ins.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PasswordSetup hasPassword={hasPassword} onPasswordSet={handlePasswordSet} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}