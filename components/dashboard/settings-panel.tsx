"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, 
  Palette, 
  Bell, 
  Mail, 
  Shield, 
  Key,
  Download,
  Upload,
  Zap,
  Globe,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { ThemeToggle } from '@/components/shared/theme-toggle'

export function SettingsPanel() {
  const [notifications, setNotifications] = useState({
    workflowComplete: true,
    workflowFailed: true,
    dailyDigest: false,
    marketing: false
  })

  const [apiKeys, setApiKeys] = useState([
    {
      name: 'n8n Instance #1',
      url: 'https://n8n.example.com',
      lastUsed: '2 hours ago',
      status: 'active'
    }
  ])

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Palette className="w-5 h-5" />
            <span>Appearance</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Theme</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Choose your preferred color scheme</p>
            </div>
            <ThemeToggle />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
              <Sun className="w-6 h-6 text-yellow-500 mb-2" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Light</span>
            </div>
            <div className="flex flex-col items-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
              <Moon className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-sm text-gray-700 dark:text-gray-300">Dark</span>
            </div>
            <div className="flex flex-col items-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700">
              <Monitor className="w-6 h-6 text-gray-500 mb-2" />
              <span className="text-sm text-gray-700 dark:text-gray-300">System</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Bell className="w-5 h-5" />
            <span>Notifications</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(notifications).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {key === 'workflowComplete' && 'Workflow Completed'}
                  {key === 'workflowFailed' && 'Workflow Failed'}
                  {key === 'dailyDigest' && 'Daily Digest'}
                  {key === 'marketing' && 'Marketing Updates'}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {key === 'workflowComplete' && 'Get notified when workflows complete successfully'}
                  {key === 'workflowFailed' && 'Get alerted when workflows encounter errors'}
                  {key === 'dailyDigest' && 'Receive daily summary of workflow activity'}
                  {key === 'marketing' && 'Receive product updates and feature announcements'}
                </p>
              </div>
              <button
                onClick={() => handleNotificationChange(key as keyof typeof notifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  enabled 
                    ? 'bg-blue-600' 
                    : 'bg-gray-200 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* API Keys Management */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Key className="w-5 h-5" />
            <span>API Keys & Integrations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeys.map((apiKey, index) => (
            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">{apiKey.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{apiKey.url}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">Last used {apiKey.lastUsed}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                  {apiKey.status}
                </Badge>
                <Button size="sm" variant="outline">
                  Configure
                </Button>
              </div>
            </div>
          ))}
          
          <Button className="w-full border-dashed border-2 border-gray-300 dark:border-slate-600 bg-transparent hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-gray-400">
            <Key className="w-4 h-4 mr-2" />
            Add New Integration
          </Button>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Globe className="w-5 h-5" />
            <span>Data Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Export Data</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Download all your workflows and data</p>
            </div>
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">Import Workflows</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">Upload workflows from other platforms</p>
            </div>
            <Button size="sm" variant="outline">
              <Upload className="w-4 h-4 mr-1" />
              Import
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}