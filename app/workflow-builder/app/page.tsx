"use client"

import React, { useState, useRef } from "react"
import Header from "../components/header"
import Sidebar from "../components/sidebar"
import CollapsibleSidebar from "../components/collapsible-sidebar"
import AIConversationBuilder from "../components/ai-conversation-builder"
import RightPanel from "../components/right-panel"
import type { WorkflowData } from "../lib/workflow-storage"
import WorkflowStorage from "../lib/workflow-storage"

type WorkflowStatus = "draft" | "generated" | "deployed" | "modifying"

export default function Home() {
  console.log("[v0] Home component rendering...")
  console.log("[v0] Window dimensions:", typeof window !== 'undefined' ? { width: window.innerWidth, height: window.innerHeight } : 'Server side')
  const [mounted, setMounted] = useState(false)
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowData | null>(null)
  const [generatedWorkflowJson, setGeneratedWorkflowJson] = useState<string | null>(null)
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatus>("draft")
  const sidebarRefreshRef = useRef<(() => void) | null>(null)
  const [isSyncInProgress, setIsSyncInProgress] = useState(false)
  const [isFromN8nSync, setIsFromN8nSync] = useState(false)
  // Add state for conversation builder
  const [conversationState, setConversationState] = useState<any>(null)
  const [selectedAiProvider, setSelectedAiProvider] = useState<string>("claude")
  const conversationBuilderRef = useRef<any>(null)
  
  // === Resizable Sidebar States ===
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(320)
  const [rightPanelWidth, setRightPanelWidth] = useState(400)
  const [isResizing, setIsResizing] = useState<string | null>(null)

  // Add error boundary for this component specifically
  React.useEffect(() => {
    console.log("[v0] Home component mounted successfully")
    setMounted(true)
    return () => console.log("[v0] Home component unmounting")
  }, [])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <div style={{ height: '100vh', backgroundColor: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ animation: 'spin 1s linear infinite', width: '32px', height: '32px', border: '2px solid #475569', borderTopColor: '#94a3b8', borderRadius: '50%' }}></div>
      </div>
    )
  }

  const handleWorkflowSelect = (workflow: WorkflowData) => {
    console.log("[v0] Main: Workflow selected:", workflow)
    setCurrentWorkflow(workflow)

    if (!isSyncInProgress) {
      const status = (workflow.status as WorkflowStatus) || "draft"
      setWorkflowStatus(status)
      console.log("[v0] Main: Workflow status set to:", status)
    } else {
      console.log("[v0] Main: Sync in progress, preserving current status:", workflowStatus)
    }

    if (workflow.workflow_json) {
      console.log("[v0] Main: Loading stored workflow JSON")
      setGeneratedWorkflowJson(JSON.stringify(workflow.workflow_json, null, 2))
    } else {
      console.log("[v0] Main: No stored workflow JSON found")
      setGeneratedWorkflowJson(null)
    }
  }

  const handleWorkflowCreated = (workflow: WorkflowData) => {
    console.log("[v0] Main: New workflow created, updating current workflow and triggering sidebar refresh")
    setCurrentWorkflow(workflow)
    setGeneratedWorkflowJson(null)
    setWorkflowStatus("draft")
    
    // Force an immediate sidebar refresh to ensure the new workflow appears
    if (sidebarRefreshRef.current) {
      console.log("[v0] Main: Triggering immediate sidebar refresh for new workflow")
      setTimeout(() => {
        sidebarRefreshRef.current?.()
      }, 100) // Small delay to ensure state is updated
    }
  }

  const handleWorkflowUpdated = () => {
    if (sidebarRefreshRef.current) {
      console.log("[v0] Main: Triggering sidebar refresh after workflow update")
      sidebarRefreshRef.current()
    }
  }

  const handleSidebarRefreshReady = (refreshFn: () => void) => {
    sidebarRefreshRef.current = refreshFn
  }

  const handleSidebarRefreshNeeded = async () => {
    if (sidebarRefreshRef.current) {
      console.log("[v0] Main: Sidebar refresh needed, triggering refresh")
      sidebarRefreshRef.current()
      
      // Also refresh the current workflow to update JSON display after sync
      if (currentWorkflow) {
        console.log("[v0] Main: Refreshing current workflow after sync")
        await handleWorkflowRefresh()
      }
    }
  }

  const handleWorkflowGenerated = (workflowJson: string, isRegeneration: boolean = false) => {
    console.log("[v0] Main: Received workflow JSON", { isRegeneration, currentStatus: workflowStatus })
    setIsFromN8nSync(false) // This is from AI generation, not n8n sync
    setGeneratedWorkflowJson(workflowJson)
    
    // Set proper status based on operation type and current workflow state
    if (isRegeneration || (currentWorkflow && workflowStatus === "deployed")) {
      console.log("[v0] Main: Setting status to 'modified' for regeneration")
      setWorkflowStatus("modifying")
    } else {
      console.log("[v0] Main: Setting status to 'generated' for new generation")
      setWorkflowStatus("generated")
    }
  }

  const handleStatusChangeFromRightPanel = (status: WorkflowStatus) => {
    console.log("[v0] Main: Status change from right panel:", status)
    setWorkflowStatus(status)
    
    // Trigger sidebar refresh to show the updated status
    if (sidebarRefreshRef.current) {
      console.log("[v0] Main: Triggering sidebar refresh after status change")
      sidebarRefreshRef.current()
    }
  }

  const handleStatusChange = async (newStatus: WorkflowStatus) => {
    if (!currentWorkflow) return

    console.log("[v0] Main: Updating workflow status to:", newStatus)
    setWorkflowStatus(newStatus)

    try {
      const workflowStorage = WorkflowStorage.getInstance()
      await workflowStorage.updateWorkflowStatus(currentWorkflow.id, newStatus as any)

      handleWorkflowUpdated()
    } catch (error) {
      console.error("[v0] Main: Failed to update workflow status:", error)
    }
  }

  const handleDeploymentSuccess = async (deploymentResult: { n8nWorkflowId: string; message: string }) => {
    if (!currentWorkflow) return

    console.log("[v0] Main: Deployment successful, updating status to deployed")

    // Immediately update local state
    setWorkflowStatus("deployed")

    // Update current workflow with n8n workflow ID
    setCurrentWorkflow((prev) =>
      prev
        ? {
            ...prev,
            n8n_workflow_id: deploymentResult.n8nWorkflowId,
            status: "deployed" as const,
          }
        : null,
    )

    // Show success message to user
    console.log("[v0] Main: " + deploymentResult.message)

    // Refresh workflow data after a short delay to ensure database update completed
    setTimeout(async () => {
      await handleWorkflowRefresh()
    }, 1000)

    handleWorkflowUpdated()
  }

  const handleWorkflowRefresh = async () => {
    if (!currentWorkflow) {
      console.log("[v0] Main: ❌ Cannot refresh - no current workflow")
      return
    }

    console.log("[v0] Main: 🔄 Starting workflow refresh for:", currentWorkflow.id)
    setIsSyncInProgress(true)
    setIsFromN8nSync(true) // Mark that this is from sync operation

    try {
      const workflowStorage = WorkflowStorage.getInstance()
      const refreshedWorkflow = await workflowStorage.getWorkflow(currentWorkflow.id)

      if (refreshedWorkflow) {
        console.log("[v0] Main: ✅ Workflow data retrieved successfully")
        console.log("[v0] Main: Workflow has JSON?", !!refreshedWorkflow.workflow_json)
        console.log("[v0] Main: JSON object type:", typeof refreshedWorkflow.workflow_json)
        
        const dbStatus = (refreshedWorkflow.status as WorkflowStatus) || "draft"
        console.log("[v0] Main: Database status:", dbStatus, "Local status:", workflowStatus)

        // Update workflow data first
        setCurrentWorkflow(refreshedWorkflow)
        setWorkflowStatus(dbStatus)

        // Force JSON update with a slight delay to ensure state is updated
        setTimeout(() => {
          if (refreshedWorkflow.workflow_json) {
            console.log("[v0] Main: 🎯 SYNC FIX - Processing JSON data")
            
            // Check if it's already a string or needs stringifying
            let formattedJson: string
            if (typeof refreshedWorkflow.workflow_json === 'string') {
              formattedJson = refreshedWorkflow.workflow_json
              console.log("[v0] Main: JSON is already a string")
            } else {
              formattedJson = JSON.stringify(refreshedWorkflow.workflow_json, null, 2)
              console.log("[v0] Main: JSON converted from object to string")
            }
            
            console.log("[v0] Main: 🎯 SYNC FIX - Setting new JSON:", {
              newJsonLength: formattedJson.length,
              currentJsonLength: generatedWorkflowJson?.length || 0,
              nodeCount: (refreshedWorkflow.workflow_json as any)?.nodes?.length || 0,
              isFromN8nSync: true
            })
            
            setGeneratedWorkflowJson(formattedJson)
            console.log("[v0] Main: ✅ JSON state updated - this should trigger RightPanel refresh")
          } else {
            console.log("[v0] Main: ❌ No workflow JSON found in refreshed workflow")
            setGeneratedWorkflowJson(null)
          }
          
          // Reset the sync flag after a longer delay to ensure RightPanel processes the change
          setTimeout(() => {
            console.log("[v0] Main: 🔄 Resetting isFromN8nSync flag")
            setIsFromN8nSync(false)
          }, 500)
        }, 100)

        handleWorkflowUpdated()
      } else {
        console.log("[v0] Main: ❌ No workflow data returned from database")
      }
    } catch (error) {
      console.error("[v0] Main: ❌ Failed to refresh workflow:", error)
    } finally {
      setTimeout(() => {
        setIsSyncInProgress(false)
        console.log("[v0] Main: ✅ Sync operation completed, status protection disabled")
      }, 500)
    }
  }

  const handleAIBuilderClick = () => {
    const element = document.querySelector("[data-ai-builder]")
    element?.scrollIntoView({ behavior: "smooth" })
  }

  const handleConversationStateChange = (state: any) => {
    setConversationState(state)

    // Handle generated workflow JSON from conversation builder
    if (state.generatedWorkflowJson) {
      const isRegeneration = state.isRegeneration || false
      console.log("[v0] Main: Conversation state changed with JSON", { isRegeneration })
      handleWorkflowGenerated(state.generatedWorkflowJson, isRegeneration)
    }
  }

  const handleManualErrorCheck = async () => {
    console.log("[v0] Main: Manual error check triggered")
    if (conversationBuilderRef.current?.checkForWorkflowErrors) {
      await conversationBuilderRef.current.checkForWorkflowErrors()
    } else {
      console.log("[v0] Main: No error check function available on conversation builder")
    }
  }

  // === Resize Handlers ===
  const handleResizeStart = (e: React.MouseEvent, side: 'left' | 'right') => {
    e.preventDefault()
    setIsResizing(side)
    
    const handleMouseMove = (e: MouseEvent) => {
      if (side === 'left') {
        const newWidth = Math.max(200, Math.min(500, e.clientX))
        setLeftSidebarWidth(newWidth)
      } else {
        const newWidth = Math.max(300, Math.min(800, window.innerWidth - e.clientX))
        setRightPanelWidth(newWidth)
      }
    }
    
    const handleMouseUp = () => {
      setIsResizing(null)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return (
    <div 
      className="h-screen bg-slate-900 text-white flex flex-col"
      style={{ 
        height: '100vh', 
        backgroundColor: '#0f172a', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        width: '100%'
      }}
    >
      <Header
        onAIBuilderClick={handleAIBuilderClick}
        hasWorkflow={!!generatedWorkflowJson}
        workflowJson={generatedWorkflowJson}
        workflowStatus={workflowStatus}
        onStatusChange={handleStatusChange}
        onWorkflowRefresh={handleWorkflowRefresh}
        onDeploymentSuccess={handleDeploymentSuccess} // Added deployment success callback
        workflowId={currentWorkflow?.id}
        workflowName={currentWorkflow?.name}
        n8nWorkflowId={currentWorkflow?.n8n_workflow_id}
        onManualErrorCheck={handleManualErrorCheck}
      />
      <div 
        className="flex flex-1 overflow-hidden"
        style={{ 
          display: 'flex', 
          flex: 1, 
          overflow: 'hidden',
          minHeight: 'calc(100vh - 60px)' 
        }}
      >
        <div className="flex flex-1 relative">
          {/* Collapsible Account Sidebar */}
          <CollapsibleSidebar />
          
          <div 
            className="flex-shrink-0 bg-slate-800 border-r border-slate-700"
            style={{ width: `${leftSidebarWidth}px`, minWidth: '200px', maxWidth: '500px' }}
          >
            <Sidebar
              onWorkflowSelect={handleWorkflowSelect}
              currentWorkflowId={currentWorkflow?.id}
              onWorkflowCreated={handleWorkflowCreated}
              onRefreshReady={handleSidebarRefreshReady}
            />
          </div>
          
          {/* Left resize handle */}
          <div 
            className="w-1 bg-slate-600 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />

          <div className="flex-1 min-w-0" data-ai-builder>
            <AIConversationBuilder
              ref={conversationBuilderRef}
              currentWorkflow={currentWorkflow}
              onWorkflowCreated={handleWorkflowCreated}
              onWorkflowUpdated={handleWorkflowUpdated}
              onSidebarRefreshNeeded={handleSidebarRefreshNeeded}
              onWorkflowGenerated={handleWorkflowGenerated}
              generatedWorkflowJson={generatedWorkflowJson} // Pass generatedWorkflowJson to AI conversation builder so it can display synced changes
              // Pass the handler for conversation state changes
              onConversationStateChange={handleConversationStateChange}
              selectedAiProvider={selectedAiProvider}
              onStatusChange={handleStatusChangeFromRightPanel}
            />
          </div>

          {/* Right resize handle */}
          <div 
            className="w-1 bg-slate-600 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />

          <div 
            className="flex-shrink-0 bg-slate-800 border-l border-slate-700"
            style={{ width: `${rightPanelWidth}px`, minWidth: '300px', maxWidth: '800px' }}
          >
            <RightPanel 
              generatedWorkflowJson={generatedWorkflowJson || undefined}
              conversationState={conversationState}
              onWorkflowGenerated={handleWorkflowGenerated}
              workflowId={currentWorkflow?.id}
              onStatusChange={handleStatusChangeFromRightPanel}
              isFromN8nSync={isFromN8nSync}
              selectedAiProvider={selectedAiProvider}
              onAiProviderChange={setSelectedAiProvider}
            />
          </div>
        </div>
      </div>
    </div>
  )
}