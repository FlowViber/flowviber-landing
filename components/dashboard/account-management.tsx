"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PasswordSetup } from './password-setup'
import { 
  User, 
  Mail, 
  Shield, 
  Link as LinkIcon, 
  Trash2, 
  Edit3,
  Github,
  Chrome,
  Check,
  X,
  Key
} from 'lucide-react'

interface ConnectedAccount {
  provider: string
  email: string
  connectedAt: string
  icon: React.ElementType
}

export function AccountManagement() {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [profileName, setProfileName] = useState(session?.user?.name || '')
  const [hasPassword, setHasPassword] = useState(false)
  const [checkingPassword, setCheckingPassword] = useState(true)
  const [showPasswordSection, setShowPasswordSection] = useState(false)

  // Mock connected accounts data - in real app, fetch from database
  const connectedAccounts: ConnectedAccount[] = [
    {
      provider: 'Google',
      email: session?.user?.email || '',
      connectedAt: 'Connected today',
      icon: Chrome
    }
  ]

  const handleSaveProfile = async () => {
    if (!profileName.trim()) return
    
    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profileName.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      // Force session refresh by reloading the page
      // This ensures the name change is reflected throughout the platform
      window.location.reload()
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile. Please try again.')
    } finally {
      setIsEditing(false)
    }
  }

  const handleDisconnectAccount = (provider: string) => {
    // TODO: Implement account disconnection
    console.log('Disconnecting:', provider)
  }

  const checkPasswordStatus = async () => {
    try {
      const response = await fetch('/api/auth/check-password')
      const data = await response.json()
      setHasPassword(data.hasPassword)
    } catch (error) {
      console.error('Error checking password status:', error)
    } finally {
      setCheckingPassword(false)
    }
  }

  const handlePasswordSet = () => {
    setHasPassword(true)
  }

  useEffect(() => {
    if (session?.user) {
      checkPasswordStatus()
    }
  }, [session])

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <User className="w-5 h-5" />
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                    placeholder="Your name"
                  />
                  <div className="flex space-x-2">
                    <Button size="sm" onClick={handleSaveProfile} className="bg-green-600 hover:bg-green-700">
                      <Check className="w-4 h-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{session?.user?.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400">{session?.user?.email}</p>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                    className="mt-2"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit Profile
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Setup */}
      {!checkingPassword && (
        <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle 
              className="flex items-center justify-between cursor-pointer text-gray-900 dark:text-white"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>{hasPassword ? 'Change Password' : 'Set Up Password'}</span>
              </div>
              <Button variant="ghost" size="sm">
                {showPasswordSection ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Edit3 className="w-4 h-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          {showPasswordSection && (
            <CardContent>
              <PasswordSetup hasPassword={hasPassword} onPasswordSet={handlePasswordSet} />
            </CardContent>
          )}
        </Card>
      )}

      {/* Connected Accounts */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <LinkIcon className="w-5 h-5" />
            <span>Connected Accounts</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectedAccounts.map((account, index) => {
            const IconComponent = account.icon
            return (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{account.provider}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{account.email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">{account.connectedAt}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                    Connected
                  </Badge>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDisconnectAccount(account.provider)}
                    className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            )
          })}
          
          {/* Add GitHub Connection */}
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg border-dashed">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                <Github className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">GitHub</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Connect your GitHub account</p>
              </div>
            </div>
            <Button size="sm" className="bg-gray-900 hover:bg-gray-800 text-white">
              <LinkIcon className="w-4 h-4 mr-1" />
              Connect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Shield className="w-5 h-5" />
            <span>Security & Privacy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
            </div>
            <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
              Not enabled
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Login Activity</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Review recent login activity</p>
            </div>
            <Button size="sm" variant="outline">
              View Activity
            </Button>
          </div>
          
          <div className="border-t border-gray-200 dark:border-slate-600 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-700 dark:text-red-400">Delete Account</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Permanently delete your account and all data</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}