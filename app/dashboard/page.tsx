"use client"

import React, { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Workflow, 
  FileText, 
  BarChart3, 
  Settings, 
  Clock, 
  Activity,
  ChevronRight,
  User,
  LogOut,
  Home,
  UserCircle,
  Zap
} from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { AccountManagement } from '@/components/dashboard/account-management'
import { SettingsPanel } from '@/components/dashboard/settings-panel'
import { AppNavigation } from '@/components/dashboard/app-navigation'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState('overview')
  const [passwordCheckLoading, setPasswordCheckLoading] = useState(true)
  const [hasPassword, setHasPassword] = useState(false)

  // Mandatory password check
  useEffect(() => {
    const checkPassword = async () => {
      if (session?.user?.email) {
        try {
          const response = await fetch('/api/auth/check-password')
          if (response.ok) {
            const data = await response.json()
            if (!data.hasPassword) {
              // MANDATORY: Redirect to password setup if no password exists
              window.location.href = '/auth/setup-password'
              return
            }
            setHasPassword(true)
          }
        } catch (error) {
          console.error('Password check failed:', error)
          // If password check fails, assume no password and redirect
          window.location.href = '/auth/setup-password'
          return
        }
      }
      setPasswordCheckLoading(false)
    }

    if (session && status === 'authenticated') {
      checkPassword()
    }
  }, [session, status])

  if (status === 'loading' || passwordCheckLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect to sign in if not authenticated
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dashboard')
  }

  // Block access if no password (extra safety check)
  if (!hasPassword) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Redirecting to password setup...</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'app', label: 'Workflows', icon: Zap },
    { id: 'workflow-builder', label: 'Workflow Builder', icon: Settings, isLink: true, href: '/app' },
    { id: 'account', label: 'Account', icon: UserCircle },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Links to Home */}
            <div className="flex items-center">
              <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <div className="h-12 flex items-center">
                  <img 
                    src="/flow-viber-logo.png" 
                    alt="Flow Viber" 
                    className="h-full w-auto object-contain dark:hidden"
                  />
                  <img 
                    src="/flow-viber-white-logo.png" 
                    alt="Flow Viber" 
                    className="h-full w-auto object-contain hidden dark:block"
                  />
                </div>
              </a>
            </div>

            {/* Navigation & User Menu */}
            <div className="flex items-center space-x-4">
              <a href="/app">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Zap className="w-4 h-4 mr-2" />
                  Launch App
                </Button>
              </a>
              <ThemeToggle />
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-slate-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {session.user?.name || session.user?.email}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon
              
              // Handle navigation links differently
              if (tab.isLink) {
                return (
                  <a
                    key={tab.id}
                    href={tab.href}
                    className="flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <IconComponent className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </a>
                )
              }
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <>
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {session.user?.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's what's happening with your workflows today.
              </p>
            </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Overview</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Workflows</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">My Workflows</CardTitle>
              <Workflow className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Executions Today</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Templates</CardTitle>
              <FileText className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">0%</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Success Rate</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Analytics</CardTitle>
              <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">Free</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Current Plan</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">Upgrade for more features</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Get started with common tasks</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
              onClick={() => window.location.href = '/app'}
            >
              <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Create Workflow</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Browse Templates</span>
            </Button>

            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
            >
              <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-900 dark:text-white">Manage Integrations</span>
            </Button>
          </div>
        </div>

        {/* Recent Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Workflows */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Recent Workflows</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your latest workflow activities</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <Workflow className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No workflows yet</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  Create your first workflow to get started
                </p>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => window.location.href = '/app'}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Executions */}
          <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Recent Executions</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Latest execution history</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No executions yet</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                  Workflow executions will appear here
                </p>
                <Button variant="outline" className="border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300">
                  <Activity className="w-4 h-4 mr-2" />
                  View All Executions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
          </>
        )}

        {activeTab === 'app' && <AppNavigation />}
        {activeTab === 'account' && <AccountManagement />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  )
}