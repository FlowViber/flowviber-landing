"use client"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Database, GitBranch, Upload, Sparkles, Info, Loader2 } from "lucide-react"
import { useState } from "react"
import { useNotification } from '@/components/notification-dialog'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { WorkflowErrorPopup } from "@/components/workflow-error-popup"

type WorkflowStatus = "draft" | "generated" | "deployed" | "modifying"

interface HeaderProps {
  onAIBuilderClick?: () => void
  hasWorkflow?: boolean
  workflowJson?: string | null
  workflowStatus?: WorkflowStatus
  onStatusChange?: (status: WorkflowStatus) => void
  onWorkflowRefresh?: () => void // Added callback to trigger workflow refresh
  onDeploymentSuccess?: (result: { n8nWorkflowId: string; message: string }) => void // Added deployment success callback
  workflowId?: string
  workflowName?: string
  n8nWorkflowId?: string
  onManualErrorCheck?: () => Promise<void> // Added manual error check callback
}

export default function Header({
  onAIBuilderClick,
  hasWorkflow = false,
  workflowJson,
  workflowStatus = "draft",
  onStatusChange,
  onWorkflowRefresh, // Added workflow refresh callback
  onDeploymentSuccess, // Added deployment success callback prop
  workflowId,
  workflowName,
  n8nWorkflowId,
  onManualErrorCheck, // Added manual error check callback
}: HeaderProps) {
  const { showNotification } = useNotification()
  const [isDeploying, setIsDeploying] = useState(false)
  const [isRetrievingErrors, setIsRetrievingErrors] = useState(false)
  const [showErrorPopup, setShowErrorPopup] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [isPushing, setIsPushing] = useState(false)

  const verifyWorkflowStatus = async (workflowId: string, expectedStatus: WorkflowStatus) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`)
      const data = await response.json()

      if (data.workflow?.status !== expectedStatus) {
        console.warn(`[v0] Status mismatch detected. Expected: ${expectedStatus}, Got: ${data.workflow?.status}`)

        // Attempt to restore correct status if n8n_workflow_id exists
        if (data.workflow?.n8n_workflow_id && expectedStatus === "deployed") {
          console.log(`[v0] Attempting to restore deployed status for workflow ${workflowId}`)
          await fetch(`/api/workflows/${workflowId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "deployed" }),
          })
        }
      }

      return data.workflow?.status
    } catch (error) {
      console.error("[v0] Status verification failed:", error)
      return null
    }
  }

  const handleDeploy = async () => {
    if (!workflowJson || !workflowId || !workflowName) {
      showNotification({
        type: "warning",
        title: "Missing Information",
        description: "Workflow data is incomplete. Please generate a workflow first.",
      })
      return
    }

    setIsDeploying(true)
    try {
      console.log("[v0] Header: Deploying workflow to n8n:", workflowName)

      const response = await fetch("/api/n8n/deploy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId,
          workflowJson: JSON.parse(workflowJson),
          workflowName,
        }),
      })

      if (!response.ok) {
        let errorMessage = `Deployment failed (${response.status}): ${response.statusText}`
        try {
          const responseText = await response.text()
          try {
            const error = JSON.parse(responseText)
            errorMessage = error.error || errorMessage
          } catch (jsonError) {
            console.error("[v0] Header: Non-JSON error response:", responseText)
            errorMessage = `Server error (${response.status}): ${response.statusText}`
          }
        } catch (textError) {
          console.error("[v0] Header: Could not read response:", textError)
          errorMessage = `Server error (${response.status}): ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()

      console.log("[v0] Header: Deployment successful:", result)

      showNotification({
        title: "🎉 Deployment Successful!",
        description: `Workflow "${workflowName}" has been successfully deployed to n8n with ID: ${result.n8nWorkflowId}`,
        type: "success",
      })

      console.log(`[v0] 🎉 SUCCESS: Workflow "${workflowName}" deployed to n8n with ID: ${result.n8nWorkflowId}`)

      // Alert removed - notification dialog provides better UX

      if (onDeploymentSuccess) {
        console.log("[v0] Header: Calling onDeploymentSuccess callback")
        onDeploymentSuccess({
          n8nWorkflowId: result.n8nWorkflowId,
          message: result.message || `Workflow "${workflowName}" deployed successfully to n8n!`,
        })
      } else {
        console.log("[v0] Header: No onDeploymentSuccess callback, using fallback")
        // Fallback to old behavior if callback not provided
        onStatusChange?.("deployed")
        if (onWorkflowRefresh) {
          console.log("[v0] Header: Triggering workflow refresh after deployment")
          onWorkflowRefresh()
        }
      }
    } catch (error) {
      console.error("[v0] Header: Deployment error:", error)

      let errorTitle = "Deployment Failed"
      let errorDescription = "Failed to deploy workflow. Please check your n8n configuration."

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes("api key not configured") || errorMsg.includes("api key missing")) {
          errorTitle = "n8n Configuration Required"
          errorDescription =
            "Please configure your n8n API key and instance URL in the Advanced tab (right panel) before deploying."
        } else if (errorMsg.includes("base url") || errorMsg.includes("instance url")) {
          errorTitle = "n8n Instance URL Required"
          errorDescription =
            "Please configure your n8n instance URL in the Advanced tab (right panel) before deploying."
        } else {
          errorDescription = error.message
        }
      }

      showNotification({
        title: errorTitle,
        description: errorDescription,
        type: "error",
      })
    } finally {
      setIsDeploying(false)
    }
  }

  const handleRetrieveErrors = async () => {
    console.log("[v0] Header: Retrieving errors for workflow:", n8nWorkflowId || "all workflows")
    
    if (!n8nWorkflowId) {
      console.log("[v0] Header: No workflow ID available for error retrieval")
      showNotification({
        title: "Missing Workflow ID",
        description: "Cannot retrieve errors: No deployed workflow ID found. Please deploy your workflow to n8n first.",
        type: "warning"
      })
      return
    }

    setIsRetrievingErrors(true)
    
    try {
      // Trigger manual error check through conversation system
      if (onManualErrorCheck) {
        console.log("[v0] Header: Triggering manual error check through conversation system")
        await onManualErrorCheck()
      } else {
        console.log("[v0] Header: No manual error check function available, using fallback API")
        // Fallback to direct API call if callback not available
        const response = await fetch(`/api/auto-debug?workflowId=${n8nWorkflowId}`)
        
        if (!response.ok) {
          const errorText = await response.text()
          let errorMessage = `Error checking failed (${response.status}): ${response.statusText}`
          try {
            const errorJson = JSON.parse(errorText)
            errorMessage = errorJson.error || errorJson.details || errorMessage
          } catch {
            // Use the raw text if it's not JSON
            errorMessage = errorText || errorMessage
          }
          throw new Error(errorMessage)
        }
        
        const result = await response.json()
        console.log("[v0] Header: Auto-debug result:", result)
        
        // Show result to user
        if (result.success) {
          showNotification({
            title: "✅ Error Check Complete",
            description: result.message || "Workflow error check completed successfully.",
            type: "success"
          })
        } else {
          showNotification({
            title: "Error Check Results", 
            description: result.message || result.error || "Workflow analysis completed - check conversation for details.",
            type: "info"
          })
        }
      }
      
    } catch (error) {
      console.error("[v0] Header: Error retrieving workflow errors:", error)
      showNotification({
        title: "Error Retrieval Failed",
        description: error instanceof Error ? error.message : "Failed to retrieve workflow errors. Please check your n8n connection and try again.",
        type: "error"
      })
    } finally {
      setIsRetrievingErrors(false)
    }
  }

  const handleSync = async () => {
    console.log("[v0] Header: Sync button clicked", { n8nWorkflowId, workflowId, areManagementButtonsEnabled })

    if (!n8nWorkflowId || !workflowId) {
      console.log("[v0] Header: Sync blocked - missing IDs", { n8nWorkflowId, workflowId })
      showNotification({
        title: "Missing Information",
        description: "Cannot sync without workflow IDs.",
        type: "warning",
      })
      return
    }

    setIsSyncing(true)
    try {
      console.log("[v0] Header: Syncing workflow from n8n:", n8nWorkflowId)

      const response = await fetch("/api/n8n/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowId,
          n8nWorkflowId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to sync workflow")
      }

      const result = await response.json()
      console.log("[v0] Header: Sync successful:", result)

      showNotification({
        title: "✅ Sync Successful",
        description: `Workflow "${workflowName || "Unknown"}" has been synchronized from n8n. The latest version is now loaded.`,
        type: "success",
        duration: 6000, // Show for 6 seconds instead of default 2 seconds
      })

      // Alert removed - notification dialog provides better UX

      // Trigger immediate workflow refresh to show synced data
      if (onWorkflowRefresh) {
        console.log("[v0] Header: Triggering immediate workflow refresh after sync")
        // Force immediate refresh without delay to show synced JSON
        onWorkflowRefresh()
      }
    } catch (error) {
      console.error("[v0] Header: Sync error:", error)
      showNotification({
        title: "Sync Failed",
        description: error instanceof Error ? error.message : "Failed to sync workflow from n8n.",
        type: "error",
      })
    } finally {
      setIsSyncing(false)
    }
  }

  const handlePush = async () => {
    if (!n8nWorkflowId || !workflowJson || !workflowName) {
      showNotification({
        title: "Missing Information",
        description: "Cannot push without complete workflow data.",
        type: "warning",
      })
      return
    }

    setIsPushing(true)
    try {
      console.log("[v0] Header: Pushing workflow to n8n:", n8nWorkflowId)

      const response = await fetch("/api/n8n/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          n8nWorkflowId,
          workflowJson: JSON.parse(workflowJson),
          workflowName,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to push workflow")
      }

      const result = await response.json()
      console.log("[v0] Header: Push successful:", result)

      showNotification({
        title: "Push Successful",
        description: `Workflow "${workflowName}" has been updated in n8n.`,
        type: "success",
      })

      // Update status to deployed after successful push (modifying → deployed)
      if (onStatusChange) {
        console.log("[v0] Header: Setting status to deployed after successful push")
        onStatusChange("deployed")
      }

      // Trigger immediate workflow refresh after push
      if (onWorkflowRefresh) {
        console.log("[v0] Header: Triggering immediate workflow refresh after push")
        onWorkflowRefresh()
      }
    } catch (error) {
      console.error("[v0] Header: Push error:", error)

      let errorTitle = "Push Failed"
      let errorDescription = "Failed to push workflow to n8n."

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        if (errorMsg.includes("failed to execute 'json'") || errorMsg.includes("unexpected token")) {
          errorTitle = "Server Error"
          errorDescription = "The server encountered an error. Please try again in a moment."
        } else {
          errorDescription = error.message
        }
      }

      showNotification({
        title: errorTitle,
        description: errorDescription,
        type: "error",
      })

      // Alert removed - notification dialog provides better UX
    } finally {
      setIsPushing(false)
    }
  }

  const isDeployEnabled = workflowStatus === "generated" && hasWorkflow && workflowJson
  const areManagementButtonsEnabled = workflowStatus === "deployed" || workflowStatus === "modifying"

  const getButtonClasses = (enabled: boolean, baseClasses: string) => {
    return enabled ? baseClasses : `${baseClasses} opacity-50 cursor-not-allowed`
  }

  return (
    <TooltipProvider>
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="h-12 flex items-center">
              <img 
                src="/flow-viber-white-logo.png" 
                alt="Flow Viber" 
                className="h-full w-auto object-contain"
              />
            </div>
          </div>
          <span className="text-xs text-slate-400">n8n Workflow Builder</span>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className={getButtonClasses(
                  Boolean(isDeployEnabled),
                  "bg-green-600 hover:bg-green-700 text-white disabled:opacity-50",
                )}
                onClick={handleDeploy}
                disabled={!isDeployEnabled || isDeploying}
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-1" />
                    Deploy to n8n
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {workflowStatus === "draft"
                ? "Generate a workflow first before deploying"
                : workflowStatus === "generated"
                  ? "Deploy generated workflow to your n8n instance"
                  : "Workflow already deployed"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={getButtonClasses(
                  areManagementButtonsEnabled,
                  "border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white bg-transparent",
                )}
                onClick={handleRetrieveErrors}
                disabled={!areManagementButtonsEnabled || isRetrievingErrors}
              >
                {isRetrievingErrors ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Retrieving...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Retrieve Errors
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              View and debug workflow execution errors in conversation
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={getButtonClasses(
                  areManagementButtonsEnabled,
                  "border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white bg-transparent",
                )}
                onClick={handleSync}
                disabled={!areManagementButtonsEnabled || isSyncing}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <GitBranch className="w-4 h-4 mr-1" />
                    Sync from n8n
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {workflowStatus === "deployed"
                ? "Import existing workflows from your n8n instance"
                : workflowStatus === "modifying"
                  ? "Sync from n8n (will overwrite local changes)"
                  : "Deploy workflow first to access sync functionality"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className={getButtonClasses(
                  areManagementButtonsEnabled,
                  "border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white bg-transparent",
                )}
                onClick={() => areManagementButtonsEnabled && handlePush()}
                disabled={!areManagementButtonsEnabled || isPushing}
              >
                {isPushing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Pushing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1" />
                    Push to n8n
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {workflowStatus === "deployed"
                ? "Update existing workflow in your n8n instance"
                : workflowStatus === "modifying"
                  ? "Push your local changes to n8n instance"
                  : "Deploy workflow first to access push functionality"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={onAIBuilderClick}
              >
                <Sparkles className="w-4 h-4 mr-1" />
                AI Builder
                <Info className="w-3 h-3 ml-1" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open AI-powered workflow builder assistant</TooltipContent>
          </Tooltip>
        </div>
      </header>
      
      {/* Error Popup */}
      {/* Error popup removed - errors now shown in conversation */}
    </TooltipProvider>
  )
}