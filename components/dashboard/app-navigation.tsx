"use client"

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowRight,
  Plus,
  Workflow,
  FileText,
  Zap,
  BarChart3,
  Book,
  MessageCircle,
  ExternalLink,
  Clock,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Star
} from 'lucide-react'

export function AppNavigation() {
  // Mock data for recent workflows
  const recentWorkflows = [
    {
      id: 1,
      name: "Customer Onboarding Flow",
      status: "running",
      lastRun: "2 minutes ago",
      executions: 45,
      success: true
    },
    {
      id: 2,
      name: "Daily Sales Report",
      status: "paused",
      lastRun: "1 hour ago", 
      executions: 12,
      success: true
    },
    {
      id: 3,
      name: "Lead Qualification",
      status: "failed",
      lastRun: "3 hours ago",
      executions: 8,
      success: false
    }
  ]

  const templates = [
    {
      name: "Slack Notifications",
      description: "Send automated Slack messages for important events",
      category: "Communication",
      popularity: 4.8,
      uses: 1200
    },
    {
      name: "Email Marketing Automation", 
      description: "Automated email sequences based on user behavior",
      category: "Marketing",
      popularity: 4.9,
      uses: 890
    },
    {
      name: "Data Backup to Google Drive",
      description: "Automated daily backups of important data",
      category: "Utilities",
      popularity: 4.7,
      uses: 650
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-green-500" />
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
      case 'paused':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Zap className="w-5 h-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <a href="/app">
              <Button className="h-24 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-6 h-6" />
                <span className="text-sm font-medium">New Workflow</span>
              </Button>
            </a>
            
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Browse Templates</span>
            </Button>
            
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Analytics</span>
            </Button>
            
            <Button variant="outline" className="h-24 flex flex-col items-center justify-center space-y-2 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700">
              <Book className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Documentation</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Workflows */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Workflow className="w-5 h-5" />
            <span>Recent Workflows</span>
          </CardTitle>
          <Button size="sm" variant="outline" className="text-blue-600 dark:text-blue-400">
            View All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentWorkflows.map((workflow) => (
              <div key={workflow.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(workflow.status)}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{workflow.name}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>Last run {workflow.lastRun}</span>
                      <span>•</span>
                      <span>{workflow.executions} executions</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className={getStatusColor(workflow.status)}>
                    {workflow.status}
                  </Badge>
                  <Button size="sm" variant="ghost">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Popular Templates */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Star className="w-5 h-5" />
            <span>Popular Templates</span>
          </CardTitle>
          <Button size="sm" variant="outline" className="text-blue-600 dark:text-blue-400">
            Browse All
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{template.name}</h4>
                  <div className="flex items-center space-x-1 text-xs text-yellow-600 dark:text-yellow-400">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{template.popularity}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{template.description}</p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {template.category}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-500">{template.uses} uses</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help & Support */}
      <Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <MessageCircle className="w-5 h-5" />
            <span>Help & Support</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1">
              <Book className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm">Documentation</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1">
              <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm">Community</span>
            </Button>
            
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center space-y-1">
              <ExternalLink className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span className="text-sm">Contact Support</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}