"use client"

import React, { useState, useEffect } from "react"
import { AlertTriangle, Clock, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

interface WorkflowError {
  id: string
  workflowId: string
  status: string
  startedAt: string
  stoppedAt?: string
  error: string
}

interface WorkflowErrorPopupProps {
  workflowId?: string
  isOpen: boolean
  onClose: () => void
}

export function WorkflowErrorPopup({ workflowId, isOpen, onClose }: WorkflowErrorPopupProps) {
  const [errors, setErrors] = useState<WorkflowError[]>([])
  const [loading, setLoading] = useState(false)
  const [hasConfiguration, setHasConfiguration] = useState(false)

  const fetchErrors = async () => {
    if (!isOpen) return
    
    setLoading(true)
    try {
      const url = workflowId 
        ? `/api/n8n/errors?workflowId=${workflowId}`
        : "/api/n8n/errors"
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setErrors(data.errors || [])
        setHasConfiguration(data.hasConfiguration !== false)
      } else {
        console.error("Failed to fetch errors:", data.error)
        setErrors([])
        setHasConfiguration(false)
      }
    } catch (error) {
      console.error("Error fetching workflow errors:", error)
      setErrors([])
      setHasConfiguration(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchErrors()
  }, [isOpen, workflowId])

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return dateString
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Workflow Errors
            {workflowId && (
              <Badge variant="outline" className="ml-2">
                {workflowId}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {workflowId 
              ? "Recent errors for this specific workflow"
              : "Recent errors across all workflows"
            }
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading errors...</div>
            </div>
          ) : !hasConfiguration ? (
            <div className="text-center py-12 space-y-6">
              <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">N8N Not Configured</h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
                  To view workflow errors, you need to configure your N8N connection first.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
                  <p className="text-xs text-blue-800 font-medium mb-1">Quick Setup:</p>
                  <p className="text-xs text-blue-700">
                    Go to the Advanced Settings tab (right panel) and add your N8N API key and instance URL.
                  </p>
                </div>
              </div>
            </div>
          ) : errors.length === 0 ? (
            <div className="text-center py-12 space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <div className="text-2xl text-green-600">✓</div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-green-700">All Clear!</h3>
                <p className="text-sm text-gray-600">
                  {workflowId 
                    ? "This workflow has no recent execution errors"
                    : "No recent errors found across your workflows"
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  Your workflows are running smoothly.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {errors.map((error) => (
                <div
                  key={error.id}
                  className="border rounded-lg p-4 space-y-3 bg-gradient-to-r from-red-50/80 to-orange-50/60 border-red-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div className="text-sm font-medium text-red-700">
                        Execution Failed
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        {error.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      #{error.id.slice(-8)}
                    </div>
                  </div>

                  <div className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200 font-mono text-xs leading-relaxed">
                    {error.error}
                  </div>

                  <div className="flex items-center gap-6 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span className="font-medium">Started:</span> {formatDate(error.startedAt)}
                    </div>
                    {error.stoppedAt && (
                      <div className="flex items-center gap-1">
                        <X className="h-3 w-3" />
                        <span className="font-medium">Stopped:</span> {formatDate(error.stoppedAt)}
                      </div>
                    )}
                  </div>

                  {error.workflowId && !workflowId && (
                    <div className="text-xs flex items-center gap-2">
                      <span className="text-muted-foreground font-medium">Workflow:</span>
                      <Badge variant="outline" className="text-xs font-mono">
                        {error.workflowId}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="flex justify-between items-center pt-4">
          <Button variant="outline" size="sm" onClick={fetchErrors} disabled={loading}>
            Refresh
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}