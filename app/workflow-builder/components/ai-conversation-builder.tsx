"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RefreshCw, Sparkles, Send, User, Bot, AlertCircle, Brain, X, Wand2 } from "lucide-react"
import { useNotification } from '@/components/notification-dialog'
import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react"
import { workflowStorage, type WorkflowData } from "@/lib/workflow-storage"
import WorkflowStorage from "@/lib/workflow-storage"
import { AutoDebugger, type AutoDebugResult } from "@/lib/auto-debugger"

// Remove direct import - use API routes instead

interface ConversationState {
  phase: string
  completeness: number
}

interface Message {
  id: string
  content: string
  sender: "user" | "ai" | "system"
  timestamp: Date
  isTyping?: boolean
  provider?: string
  error?: boolean
  reasoning?: string
  debugContext?: {
    type: 'error_detected' | 'auto_fixing' | 'fix_complete' | 'fix_failed' | 'credential_issue'
    errorAnalysis?: any
    fixResult?: AutoDebugResult
    requiresAction?: boolean
  }
}

interface AIConversationBuilderProps {
  currentWorkflow?: WorkflowData | null
  onWorkflowCreated?: (workflow: WorkflowData) => void
  onWorkflowUpdated?: () => void
  onSidebarRefreshNeeded?: () => void
  onWorkflowGenerated?: (workflowJson: string) => void
  onConversationStateChange?: (state: any) => void
  generatedWorkflowJson?: string | null
  selectedAiProvider?: string
  onStatusChange?: (status: "draft" | "generated" | "deployed" | "modifying") => void
}

const AIConversationBuilder = forwardRef<
  { checkForWorkflowErrors: () => Promise<void> },
  AIConversationBuilderProps
>(function AIConversationBuilder(
  {
    currentWorkflow,
    onWorkflowCreated,
    onWorkflowUpdated,
    onSidebarRefreshNeeded,
    onWorkflowGenerated,
    onConversationStateChange,
    generatedWorkflowJson,
    selectedAiProvider = "claude",
    onStatusChange,
  },
  ref
) {
  const { showNotification } = useNotification()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial",
      content:
        "Hi! I'm your n8n workflow expert. Tell me what you want to automate, and I'll help you build the perfect workflow. What process would you like to automate today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [currentProvider, setCurrentProvider] = useState<string>("")
  const [currentModel, setCurrentModel] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [conversationState, setConversationState] = useState<ConversationState | null>(null)
  const [currentReasoning, setCurrentReasoning] = useState<string>("")
  const [showReasoning, setShowReasoning] = useState(false)
  const [isAutoDebugging, setIsAutoDebugging] = useState(false)
  const [detectedErrors, setDetectedErrors] = useState<any[]>([])
  const [autoDebugEnabled, setAutoDebugEnabled] = useState(true)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [workflowName, setWorkflowName] = useState("")
  const [workflowDescription, setWorkflowDescription] = useState("")
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null)
  const [hasStartedTyping, setHasStartedTyping] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    type: "credits" | "overload" | "fallback" | "error" | "warning"
    title: string
    message: string
    errorCode?: string
  }>({
    show: false,
    type: "fallback",
    title: "",
    message: "",
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Function to manually check for workflow errors
  const checkForWorkflowErrors = useCallback(async () => {
    if (!currentWorkflow?.n8n_workflow_id) {
      console.log('[v0] ConversationBuilder: No workflow ID available for error checking')
      return
    }

    console.log('[v0] ConversationBuilder: Manual error check triggered for workflow:', currentWorkflow.n8n_workflow_id)
    
    try {
      // Remove any existing "checking" messages to prevent phantom messages
      setMessages(prev => prev.filter(msg => 
        !(msg.debugContext?.type === 'error_detected' && msg.content.includes('Checking for workflow errors'))
      ))
      
      // Add a system message showing we're checking for errors
      const checkingMessage: Message = {
        id: `error-check-${Date.now()}`,
        content: '🔍 **Checking for workflow errors...**\n\nAnalyzing your workflow for any issues or configuration problems.',
        sender: 'system',
        timestamp: new Date(),
        debugContext: {
          type: 'error_detected'
        }
      }
      
      setMessages(prev => [...prev, checkingMessage])
      
      // Call the auto-debug API
      const response = await fetch(`/api/auto-debug?workflowId=${currentWorkflow.n8n_workflow_id}`)
      const result = await response.json()
      
      console.log('[v0] ConversationBuilder: Auto-debug result:', result)
      
      // Show result message for both success and failure cases (but skip if no errors found)
      if (result.analysis || !result.success) {
        const resultMessage: Message = {
          id: `error-result-${Date.now()}`,
          content: result.message || (result.success ? 'Error analysis completed' : 'Error checking failed'),
          sender: 'system',
          timestamp: new Date(),
          debugContext: {
            type: result.success ? 'fix_complete' : 'fix_failed',
            errorAnalysis: result.analysis,
            fixResult: result
          }
        }
        setMessages(prev => [...prev, resultMessage])
      }
      
    } catch (error) {
      console.error('[v0] ConversationBuilder: Error checking failed:', error)
      
      const errorMessage: Message = {
        id: `error-failed-${Date.now()}`,
        content: '❌ **Error Check Failed**\n\nCould not check for workflow errors. Please try again.',
        sender: 'system',
        timestamp: new Date(),
        debugContext: {
          type: 'fix_failed'
        }
      }
      
      setMessages(prev => [...prev, errorMessage])
    }
  }, [currentWorkflow])
  
  // Expose the function via ref
  useImperativeHandle(ref, () => ({
    checkForWorkflowErrors
  }), [checkForWorkflowErrors])
  const messagesContainerRef = useRef<HTMLDivElement>(null) // Added ref for messages container
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedHashRef = useRef<string>("")
  const isTransitioningRef = useRef<boolean>(false)
  const lastGenerationAttempt = useRef<number>(0)
  const regenerateRequestPending = useRef<boolean>(false)
  const workflowStateRef = useRef<{ workflowId: string | null; messages: Message[] }>({
    workflowId: null,
    messages: [],
  })

  const [workflowGenerated, setWorkflowGenerated] = useState(false)
  const [showGenerateButton, setShowGenerateButton] = useState(false)
  const [showRegenerateButton, setShowRegenerateButton] = useState(false)
  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false)

  useEffect(() => {
    workflowStateRef.current = { workflowId: currentWorkflowId, messages }
  }, [currentWorkflowId, messages])

  const loadWorkflowData = useCallback((workflow: WorkflowData | null) => {
    console.log("[v0] ConversationBuilder: Loading workflow data:", {
      hasWorkflow: !!workflow,
      workflowId: workflow?.id,
      workflowName: workflow?.name,
      chat_history_length: workflow?.chat_history?.length || 0,
    })

    isTransitioningRef.current = true

    if (workflow) {
      const loadedMessages = workflow.chat_history.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }))

      const messagesToSet =
        loadedMessages.length > 0
          ? loadedMessages
          : [
              {
                id: "initial",
                content:
                  "Hi! I'm your n8n workflow expert. Tell me what you want to automate, and I'll help you build the perfect workflow. What process would you like to automate today?",
                sender: "ai" as const,
                timestamp: new Date(),
              },
            ]

      const messagesHash = JSON.stringify(messagesToSet.map((m) => m.id + m.content + m.sender))

      setCurrentWorkflowId(workflow.id)
      setMessages(messagesToSet)
      setHasStartedTyping(true)
      lastSavedHashRef.current = messagesHash

      // Set workflow generation state based on existing workflow data
      const hasWorkflowJson = workflow.workflow_json && Object.keys(workflow.workflow_json).length > 0
      const isDeployed = workflow.status === 'deployed' || workflow.status === 'generated'
      setWorkflowGenerated(hasWorkflowJson || isDeployed)
    } else {
      const initialMessage = {
        id: "initial-" + Date.now(),
        content:
          "Hi! I'm your n8n workflow expert. Tell me what you want to automate, and I'll help you build the perfect workflow. What process would you like to automate today?",
        sender: "ai" as const,
        timestamp: new Date(),
      }

      const messagesHash = JSON.stringify([initialMessage].map((m) => m.id + m.content + m.sender))

      setCurrentWorkflowId(null)
      setMessages([initialMessage])
      setHasStartedTyping(false)
      lastSavedHashRef.current = messagesHash
      setWorkflowGenerated(false)
    }

    setTimeout(() => {
      isTransitioningRef.current = false
      console.log("[v0] Workflow transition complete, auto-save re-enabled")
    }, 500)
  }, [])

  useEffect(() => {
    if (currentWorkflow !== undefined) {
      loadWorkflowData(currentWorkflow)
    }
  }, [currentWorkflow, loadWorkflowData])

  useEffect(() => {
    if (isTransitioningRef.current) {
      console.log("[v0] Auto-save skipped - workflow transition in progress")
      return
    }

    if (!currentWorkflowId || messages.length <= 1) {
      console.log("[v0] Auto-save skipped - no workflow or insufficient messages")
      return
    }

    const currentState = workflowStateRef.current
    if (currentState.workflowId !== currentWorkflowId) {
      console.log("[v0] Auto-save skipped - state inconsistency detected")
      return
    }

    const messagesHash = JSON.stringify(messages.map((m) => m.id + m.content + m.sender))

    if (messagesHash === lastSavedHashRef.current) {
      console.log("[v0] Auto-save skipped - messages unchanged since last save")
      return
    }

    console.log("[v0] Auto-save: Messages changed, scheduling save in 3000ms")

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const latestState = workflowStateRef.current
        if (latestState.workflowId !== currentWorkflowId || isTransitioningRef.current) {
          console.log("[v0] Auto-save cancelled - state changed during debounce")
          return
        }

        const currentHash = JSON.stringify(messages.map((m) => m.id + m.content + m.sender))
        if (currentHash !== messagesHash) {
          console.log("[v0] Auto-save cancelled - messages changed during debounce")
          return
        }

        console.log("[v0] Auto-save: Executing save for workflow:", currentWorkflowId)

        const chatHistory = messages.map((msg) => ({
          id: msg.id,
          content: msg.content,
          sender: msg.sender,
          timestamp: msg.timestamp.toISOString(),
          provider: msg.provider,
          error: msg.error,
        }))

        console.log("[v0] Auto-save: Saving", chatHistory.length, "messages")
        const success = await workflowStorage.updateWorkflowChatHistory(currentWorkflowId, chatHistory)

        if (success) {
          console.log("[v0] Auto-save: Successfully saved chat history")
          lastSavedHashRef.current = messagesHash
          if (onSidebarRefreshNeeded) {
            console.log("[v0] Auto-save: Triggering sidebar refresh")
            onSidebarRefreshNeeded()
          }
        } else {
          console.error("[v0] Auto-save: Failed to save chat history")
        }
      } catch (error) {
        console.error("[v0] Auto-save error:", error)
      }
    }, 3000)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [messages, currentWorkflowId, onSidebarRefreshNeeded])

  useEffect(() => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      const container = messagesContainerRef.current
      const element = messagesEndRef.current

      // Scroll within the container only
      container.scrollTo({
        top: element.offsetTop,
        behavior: "smooth",
      })
    }
  }, [messages, isTyping])

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }))
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [notification.show])

  useEffect(() => {
    if (generatedWorkflowJson) {
      console.log("[v0] Synced workflow JSON received:", generatedWorkflowJson)
      // Removed phantom notification - no longer show success message after JSON sync
      setWorkflowGenerated(true)
    }
  }, [generatedWorkflowJson])

  const handleInputChange = (value: string) => {
    setInputValue(value)

    if (!hasStartedTyping && !currentWorkflowId && value.trim().length > 0) {
      setShowNameDialog(true)
    }
  }

  // Removed auto-check for errors after deployment to prevent phantom notifications
  // Users can still manually check for errors using the debug button

  
  const performAutoDebug = async (error: any) => {
    if (isAutoDebugging) return
    
    setIsAutoDebugging(true)
    
    try {
      console.log('[v0] AutoDebug: Starting auto-debug process for error:', error)
      
      // Add "fixing" message
      const fixingMessage: Message = {
        id: `auto-fixing-${Date.now()}`,
        content: '🔧 Analyzing the error and applying automatic fixes...',
        sender: 'system',
        timestamp: new Date(),
        debugContext: {
          type: 'auto_fixing',
          requiresAction: false
        }
      }
      setMessages(prev => [...prev, fixingMessage])
      
      // Get current workflow JSON
      let workflowJson = null
      if (generatedWorkflowJson) {
        try {
          workflowJson = JSON.parse(generatedWorkflowJson)
        } catch (e) {
          console.error('[v0] AutoDebug: Failed to parse workflow JSON:', e)
        }
      }
      
      // Perform auto-debug
      const debugResult = await AutoDebugger.debugAndFix(
        error,
        workflowJson,
        '00000000-0000-0000-0000-000000000001', // Default user ID
        currentWorkflow?.n8n_workflow_id
      )
      
      console.log('[v0] AutoDebug: Debug result:', debugResult)
      
      if (debugResult.success) {
        // Detailed success message with fix summary
        const fixSummary = debugResult.fix ? 
          `\n\n🛠️ **Applied Fix**:\n${debugResult.fix.explanation}\n\n🔍 **Changes Made**:\n${debugResult.fix.changes.map(c => `- ${c.description}`).join('\n')}` : ''
        
        const successMessage: Message = {
          id: `fix-complete-${Date.now()}`,
          content: `✅ **Auto-Fix Complete!**\n\n${debugResult.message}${fixSummary}\n\n🎉 **Your workflow is now ready!** The AI Agent has been configured with a professional customer service prompt.`,
          sender: 'system',
          timestamp: new Date(),
          debugContext: {
            type: 'fix_complete',
            fixResult: debugResult,
            requiresAction: false
          }
        }
        setMessages(prev => [...prev, successMessage])
        
        // Refresh workflow data
        onWorkflowUpdated?.()
      } else if (debugResult.requiresUserAction) {
        // Credential or manual action required
        const actionMessage: Message = {
          id: `fix-failed-${Date.now()}`,
          content: `${debugResult.message}\n\n📋 **${debugResult.requiresUserAction.instructions}**\n\n${debugResult.requiresUserAction.setupGuide ? `🔗 Setup Guide: ${debugResult.requiresUserAction.setupGuide}` : ''}`,
          sender: 'system',
          timestamp: new Date(),
          debugContext: {
            type: debugResult.requiresUserAction.type === 'credential' ? 'credential_issue' : 'fix_failed',
            fixResult: debugResult,
            requiresAction: true
          }
        }
        setMessages(prev => [...prev, actionMessage])
      } else {
        // Failed to fix
        const failedMessage: Message = {
          id: `fix-failed-${Date.now()}`,
          content: `❌ ${debugResult.message}\n\nI wasn't able to automatically fix this error. You may need to manually check your workflow configuration.`,
          sender: 'system',
          timestamp: new Date(),
          debugContext: {
            type: 'fix_failed',
            fixResult: debugResult,
            requiresAction: true
          }
        }
        setMessages(prev => [...prev, failedMessage])
      }
      
    } catch (error) {
      console.error('[v0] AutoDebug: Auto-debug process failed:', error)
      
      const errorMessage: Message = {
        id: `debug-error-${Date.now()}`,
        content: `❌ Auto-debug process encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        sender: 'system',
        timestamp: new Date(),
        debugContext: {
          type: 'fix_failed',
          requiresAction: false
        }
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsAutoDebugging(false)
      setDetectedErrors([])
    }
  }

  const handleCreateWorkflow = async () => {
    if (!workflowName.trim()) return

    console.log("[v0] Creating workflow with name:", workflowName.trim())
    console.log("[v0] Description:", workflowDescription.trim() || "none")

    try {
      const workflow = await workflowStorage.createWorkflow(
        workflowName.trim(),
        workflowDescription.trim() || undefined,
      )
      console.log("[v0] Workflow creation result:", workflow)

      if (workflow) {
        console.log("[v0] Workflow created successfully with ID:", workflow.id)
        setCurrentWorkflowId(workflow.id)
        setHasStartedTyping(true)
        setShowNameDialog(false)
        setWorkflowName("")
        setWorkflowDescription("")
        onWorkflowCreated?.(workflow)
      } else {
        console.error("[v0] Workflow creation returned null")
        setError("Failed to create workflow. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Error in handleCreateWorkflow:", error)
      setError("Failed to create workflow. Please check the console for details.")
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)
    setIsTyping(true)
    setError("")

    // Check if user is asking for regeneration - do this immediately when message is sent
    const userText = userMessage.content.toLowerCase()
    const isRequestingRegeneration = (
      userText.includes('regenerate') ||
      userText.includes('recreate') ||
      userText.includes('rebuild') ||
      (userText.includes('please') && userText.includes('workflow')) ||
      userText.includes('make again') ||
      userText.includes('redo')
    )

    // Show regenerate button immediately if user requests it and a workflow exists
    console.log("[v0] DEBUG: Regeneration check", {
      userMessage: userText.substring(0, 50),
      isRequestingRegeneration,
      workflowGenerated,
      currentWorkflowId,
      condition: isRequestingRegeneration && workflowGenerated
    })
    
    if (isRequestingRegeneration && workflowGenerated) {
      console.log("[v0] User requesting regeneration - setting regenerate button visible")
      regenerateRequestPending.current = true
      setShowRegenerateButton(true)
    } else if (isRequestingRegeneration && !workflowGenerated) {
      console.log("[v0] User requesting regeneration but no workflow generated yet")
    }



    setShowReasoning(true)
    setCurrentReasoning("Analyzing your n8n workflow requirements...")

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }))

      const aiMessages = [
        ...conversationHistory,
        {
          role: "user" as const,
          content: userMessage.content,
        },
      ]

      setCurrentReasoning("Identifying n8n nodes and connections needed for your automation...")

      setTimeout(() => {
        setCurrentReasoning("Determining trigger type and data flow...")
      }, 1000)

      console.log("[v0] Sending messages to AI service:", aiMessages.length)
      // Use API route instead of direct service call
      const apiResponse = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: aiMessages, // Changed from inputMessage to messages
          conversationState: conversationState, // Pass conversationState
          isWorkflowGeneration: false, // Indicate this is not workflow generation
          provider: selectedAiProvider,
        }),
      })

      if (!apiResponse.ok) {
        let errorMessage = "I apologize, but I am having trouble connecting to the AI service right now."
        
        try {
          const errorData = await apiResponse.json();
          console.error('[v0] API response error:', errorData);
          
          // Handle specific error types with user-friendly messages
          if (errorData.error) {
            switch (errorData.error) {
              case 'NO_API_KEYS':
              case 'OPENAI_KEY_MISSING':
              case 'CLAUDE_KEY_MISSING':
                errorMessage = 'Please configure your AI API keys in the settings to use the conversation builder.'
                break
              case 'INVALID_API_KEY':
                errorMessage = 'Your AI API key appears to be invalid. Please check your API key configuration.'
                break
              case 'QUOTA_EXCEEDED':
                errorMessage = 'Your AI API usage limit has been reached. Please check your billing or try again later.'
                break
              case 'RATE_LIMITED':
                errorMessage = 'Too many requests have been made. Please wait a moment and try again.'
                break
              default:
                errorMessage = errorData.content || errorMessage
            }
          }
        } catch (parseError) {
          // If we can't parse the error response (likely HTML), show a generic friendly message
          console.error('[v0] Failed to parse error response:', parseError);
          if (apiResponse.status === 404) {
            errorMessage = 'The AI service is temporarily unavailable. Please try again in a moment.'
          } else if (apiResponse.status >= 500) {
            errorMessage = 'The AI service is experiencing technical difficulties. Please try again later.'
          }
        }
        
        throw new Error(errorMessage);
      }

      let data
      try {
        data = await apiResponse.json()
      } catch (parseError) {
        console.error('[v0] Failed to parse API response:', parseError);
        throw new Error('I received an unexpected response from the AI service. Please try again.')
      }

      if (data.fallback && data.errorCode && data.showNotification !== false && !data.silentFallback) {
        let notificationConfig: {
          show: boolean
          type: "credits" | "overload" | "fallback" | "error" | "warning"
          title: string
          message: string
          errorCode?: string
        } = {
          show: true,
          type: "fallback",
          title: "Claude Unavailable",
          message: "Claude AI is currently unavailable. Using OpenAI instead.",
          errorCode: data.errorCode,
        }

        // Enhanced Claude-specific error handling
        if (selectedAiProvider === "claude") {
          switch (data.errorCode) {
            case "CREDITS_LOW":
              notificationConfig = {
                show: true,
                type: "credits",
                title: "Claude Credits Exhausted",
                message: "Claude API credits have been exhausted. Automatically switched to OpenAI.",
                errorCode: data.errorCode,
              }
              break
            case "FALLBACK_USED":
              // Check if this is a model error
              if (data.fallbackReason && data.fallbackReason.includes("model")) {
                notificationConfig = {
                  show: true,
                  type: "error",
                  title: "Claude Model Error",
                  message: "Claude model is not available or configured incorrectly. Using OpenAI instead.",
                  errorCode: "MODEL_ERROR",
                }
              } else if (data.fallbackReason && data.fallbackReason.includes("API")) {
                notificationConfig = {
                  show: true,
                  type: "error", 
                  title: "Claude API Error",
                  message: "Claude API is currently experiencing issues. Automatically switched to OpenAI.",
                  errorCode: "API_ERROR",
                }
              } else {
                notificationConfig = {
                  show: true,
                  type: "warning",
                  title: "Claude Unavailable",
                  message: "Claude is temporarily unavailable. Your request was processed using OpenAI instead.",
                  errorCode: data.errorCode,
                }
              }
              break
            default:
              if (data.fallbackReason?.includes("overloaded")) {
                notificationConfig = {
                  show: true,
                  type: "overload",
                  title: "Claude Overloaded",
                  message: "Claude API is overloaded. Automatically switched to OpenAI.",
                  errorCode: data.errorCode,
                }
              }
          }
        } else {
          switch (data.errorCode) {
            case "RATE_LIMIT":
              notificationConfig = {
                show: true,
                type: "overload",
                title: "Rate Limited",
              message: "Primary API rate limit exceeded. Now using OpenAI for this session.",
              errorCode: data.errorCode,
            }
            break
          default:
            if (data.fallbackReason?.includes("overloaded")) {
              notificationConfig = {
                show: true,
                type: "overload",
                title: "Overloaded",
                message: "Primary API is overloaded. Now using OpenAI for this session.",
                errorCode: data.errorCode,
              }
            }
            break
          }
        }

        setNotification(notificationConfig)
      }

      setCurrentProvider(data.provider)
      
      // Handle provider display with fallback indication and user notification
      if (data.fallback && data.provider === "openai" && selectedAiProvider === "claude") {
        setCurrentModel("Claude → gpt-4o (fallback)")
        
        // Show clear notification about provider switch
        setNotification({
          show: true,
          type: 'warning',
          title: 'LLM Model Switched',
          message: 'Claude is temporarily unavailable. Automatically switched to gpt-4o for this conversation.',
          errorCode: data.errorCode || 'FALLBACK_SWITCH'
        })
      } else if (data.fallback && data.provider === "claude" && selectedAiProvider === "openai") {
        setCurrentModel("gpt-4o → Claude (fallback)")
        
        // Show clear notification about provider switch
        setNotification({
          show: true,
          type: 'warning', 
          title: 'LLM Model Switched',
          message: 'gpt-4o is temporarily unavailable. Automatically switched to Claude for this conversation.',
          errorCode: data.errorCode || 'FALLBACK_SWITCH'
        })
      } else {
        setCurrentModel(data.provider === "claude" ? "Claude Sonnet 4" : "gpt-4o")
      }

      if (data.conversationState) {
        setConversationState(data.conversationState)
        console.log(
          "[v0] Conversation state updated - Phase:",
          data.conversationState.phase,
          "Completeness:",
          data.conversationState.completeness,
        )
      }

      setShowReasoning(false)
      setCurrentReasoning("")

      // Check if the AI response contains JSON (which shouldn't happen in regular conversation)
      const containsJSON = data.content.includes('{') && data.content.includes('nodes') && data.content.includes('connections')
      
      if (containsJSON) {
        console.log("[v0] AI generated JSON in regular conversation - intercepting and redirecting to right panel")
        
        // Extract and clean the JSON
        let workflowJson = data.content.trim()
        workflowJson = workflowJson.replace(/```(?:json)?\s*/g, "").replace(/\s*```/g, "")
        
        const jsonStart = workflowJson.indexOf("{")
        const jsonEnd = workflowJson.lastIndexOf("}")
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
          workflowJson = workflowJson.substring(jsonStart, jsonEnd + 1)
          
          try {
            const parsed = JSON.parse(workflowJson)
            
            if (parsed.nodes && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
              // Save to database and update right panel
              const response = await fetch(`/api/workflows/${currentWorkflowId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ workflow_json: parsed, status: 'generated' })
              })
              
              if (response.ok) {
                console.log("[v0] Workflow JSON intercepted and saved to database")
                
                // Update right panel via callback
                if (onWorkflowGenerated) {
                  onWorkflowGenerated(workflowJson)
                }
                
                // Add a clean message instead of the JSON
                const aiMessage: Message = {
                  id: (Date.now() + 1).toString(),
                  content: "Perfect! I've generated your n8n workflow based on our conversation. You can view the complete JSON configuration in the JSON tab on the right panel.",
                  sender: "ai",
                  timestamp: new Date(),
                  provider: data.provider,
                }
                
                setMessages((prev) => [...prev, aiMessage])
                setWorkflowGenerated(true)
                return
              }
            }
          } catch (e) {
            console.log("[v0] Failed to parse intercepted JSON:", e)
          }
        }
        
        // If JSON processing failed, show error message instead
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: "I tried to generate a workflow but encountered an issue. Please use the Generate Workflow button instead.",
          sender: "ai",
          timestamp: new Date(),
          provider: data.provider,
        }
        
        setMessages((prev) => [...prev, aiMessage])
        return
      }

      // Normal message processing (no JSON detected)
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.content,
        sender: "ai",
        timestamp: new Date(),
        provider: data.provider,
      }

      setMessages((prev) => [...prev, aiMessage])

      // Check if ready for workflow generation
      if (data.conversationState) {
        const isReady = data.conversationState.phase === "ready_for_generation" && data.conversationState.completeness >= 80
        
        // CRITICAL FIX: Respect regenerateRequestPending - don't let AI response override user regeneration request
        if (regenerateRequestPending.current) {
          console.log("[v0] Respecting regenerateRequestPending - keeping regenerate button visible")
          setShowRegenerateButton(true)
          setShowGenerateButton(false)
        } else {
          // Normal CTA logic when no pending regeneration
          setShowGenerateButton(isReady && !workflowGenerated)
          
          // Enhanced regenerate button logic - show when user asks for regeneration
          const responseText = data.content.toLowerCase()
          
          // Check if AI is asking for confirmation
          const isAskingConfirmation = (responseText.includes('do you want to regenerate') ||
                                      responseText.includes('should i proceed') ||
                                      responseText.includes('do you want to update') ||
                                      responseText.includes('should i update') ||
                                      responseText.includes('do these changes look good') ||
                                      responseText.includes('proceed with') ||
                                      (responseText.includes('?') && (
                                        responseText.includes('regenerate') ||
                                        responseText.includes('update') ||
                                        responseText.includes('proceed')
                                      )))
          
          // Check if AI is confirming regeneration (after user said yes)
          const isConfirmingRegeneration = (responseText.includes('i\'ll regenerate') ||
                                          responseText.includes('let me regenerate') ||
                                          responseText.includes('regenerating the workflow') ||
                                          responseText.includes('i\'ll update') ||
                                          responseText.includes('let me update') ||
                                          responseText.includes('updating the workflow') ||
                                          responseText.includes('proceeding with') ||
                                          responseText.includes('click the "regenerate workflow" button') ||
                                          responseText.includes('click the \'regenerate workflow\' button') ||
                                          responseText.includes('please click the regenerate') ||
                                          responseText.includes('regenerate workflow" button now') ||
                                          (responseText.includes('workflow') && (
                                            responseText.includes('i\'ll') ||
                                            responseText.includes('let me') ||
                                            responseText.includes('now')
                                          )))
          
          // Show regenerate button if AI is confirming regeneration
          const shouldShowRegenerate = workflowGenerated && isConfirmingRegeneration
          console.log("[v0] Normal regenerate button logic:", {
            workflowGenerated,
            isConfirmingRegeneration,
            shouldShowRegenerate,
            responseText: data.content.substring(0, 100)
          })
          setShowRegenerateButton(shouldShowRegenerate)
        }
      }

      // Pass conversation state to parent for right panel
      if (onConversationStateChange && data.conversationState) {
        onConversationStateChange({
          conversationState: data.conversationState,
          messages: messages,
          currentWorkflowId: currentWorkflowId
        })
      }
    } catch (error) {
      console.error("[v0] AI service error:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setError(errorMessage)

      setShowReasoning(false)
      setCurrentReasoning("")

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `I apologize, but I'm having trouble connecting to the AI service right now. ${errorMessage}. Please try again in a moment.`,
        sender: "ai",
        timestamp: new Date(),
        error: true,
      }

      setMessages((prev) => [...prev, aiMessage])
    } finally {
      setIsLoading(false)
      setIsTyping(false)
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }



  const handleGenerateWorkflow = async () => {
    if (!currentWorkflowId) return

    lastGenerationAttempt.current = Date.now()
    setIsGeneratingWorkflow(true)
    setShowGenerateButton(false)

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }))

      console.log("[v0] Generating workflow JSON from conversation builder...")

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
          isWorkflowGeneration: true,
          provider: selectedAiProvider,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error("[v0] API response error:", error)
        throw new Error(error.error || "Failed to generate workflow")
      }

      const data = await response.json()
      console.log("[v0] Workflow generation response received")

      let workflowJson = data.content.trim()

      // Remove any markdown formatting
      workflowJson = workflowJson.replace(/```(?:json)?\s*/g, "").replace(/\s*```/g, "")

      // Remove any explanatory text before or after JSON
      const jsonStart = workflowJson.indexOf("{")
      const jsonEnd = workflowJson.lastIndexOf("}")

      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new Error("AI did not generate valid JSON structure. Please try again.")
      }

      workflowJson = workflowJson.substring(jsonStart, jsonEnd + 1)
      console.log("[v0] Final cleaned workflowJson:", {
        length: workflowJson.length,
        preview: workflowJson.substring(0, 200)
      })

      try {
        const parsed = JSON.parse(workflowJson)
        console.log("[v0] ✅ JSON parsed successfully, node count:", parsed.nodes?.length)

        if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
          throw new Error("Generated workflow is missing required 'nodes' array")
        }

        if (parsed.nodes.length === 0) {
          throw new Error("Generated workflow has no nodes")
        }

        // Validate settings object if present
        if (parsed.settings && typeof parsed.settings === 'object') {
          const validSettingsKeys = ['executionOrder', 'saveDataErrorExecution', 'saveDataSuccessExecution', 
                                     'saveExecutionProgress', 'saveManualExecutions', 'callerPolicy', 
                                     'callerIds', 'executionTimeout', 'errorWorkflow', 'timezone']
          const settingsKeys = Object.keys(parsed.settings)
          const invalidKeys = settingsKeys.filter(key => !validSettingsKeys.includes(key))
          
          if (invalidKeys.length > 0) {
            console.warn("[v0] ⚠️ Workflow contains invalid settings properties:", invalidKeys)
            // Remove invalid properties
            invalidKeys.forEach(key => delete parsed.settings[key])
            // Ensure executionOrder is set
            if (!parsed.settings.executionOrder) {
              parsed.settings.executionOrder = "v1"
            }
          }
        } else {
          // Add minimal valid settings
          parsed.settings = { executionOrder: "v1" }
        }

        console.log("[v0] Valid n8n workflow JSON generated with settings:", Object.keys(parsed.settings || {}))

        // CRITICAL: Validate nodes to prevent HTTP Request hacks
        const invalidNodes = parsed.nodes.filter((node: any) => {
          const isGoogleServiceWithHttpRequest = node.type === 'n8n-nodes-base.httpRequest' && 
            (node.name.toLowerCase().includes('calendar') || 
             node.name.toLowerCase().includes('drive') || 
             node.name.toLowerCase().includes('google'))
          const isWhatsAppWithHttpRequest = node.type === 'n8n-nodes-base.httpRequest' && 
            node.name.toLowerCase().includes('whatsapp')
          return isGoogleServiceWithHttpRequest || isWhatsAppWithHttpRequest
        })

        if (invalidNodes.length > 0) {
          console.error("[v0] CRITICAL: Generated workflow contains forbidden HTTP Request nodes:", invalidNodes)
          throw new Error(`❌ AI generated invalid workflow! Found HTTP Request nodes for: ${invalidNodes.map((n: any) => n.name).join(', ')}. These services have dedicated nodes available.`)
        }

        // Save to database
        const response = await fetch(`/api/workflows/${currentWorkflowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow_json: parsed, status: 'generated' })
        })

        if (!response.ok) {
          throw new Error("Failed to save workflow to database")
        }

        console.log("[v0] Workflow JSON and status saved to database")

        // Trigger sidebar refresh to show updated workflow
        if (onSidebarRefreshNeeded) {
          console.log("[v0] Triggering sidebar refresh after workflow generation")
          onSidebarRefreshNeeded()
        }

        // Trigger workflow updated callback
        if (onWorkflowUpdated) {
          console.log("[v0] Triggering workflow updated callback")
          onWorkflowUpdated()
        }

        // Pass to parent to update right panel
        if (onConversationStateChange) {
          onConversationStateChange({
            conversationState: conversationState,
            messages: messages,
            currentWorkflowId: currentWorkflowId,
            generatedWorkflowJson: workflowJson
          })
        }

        setWorkflowGenerated(true)

        // Generate enhanced success message with workflow summary
        const generateSuccessMessage = (workflowData: any) => {
          const nodeCount = workflowData.nodes?.length || 0
          const nodeNames = workflowData.nodes?.map((node: any) => node.name).join(', ') || 'No nodes'
          
          // Extract credential requirements
          const credentialNodes = workflowData.nodes?.filter((node: any) => 
            node.credentials || node.type?.includes('gmail') || node.type?.includes('google') || 
            node.type?.includes('slack') || node.type?.includes('twitter') || node.type?.includes('openai')
          ) || []
          
          const credentialRequirements = credentialNodes.map((node: any) => {
            if (node.type?.includes('gmail')) return 'Gmail OAuth2'
            if (node.type?.includes('googleDrive')) return 'Google Drive OAuth2'
            if (node.type?.includes('googleCalendar')) return 'Google Calendar OAuth2'
            if (node.type?.includes('slack')) return 'Slack OAuth2'
            if (node.type?.includes('twitter')) return 'Twitter API credentials'
            if (node.type?.includes('openai')) return 'OpenAI API key'
            if (node.type?.includes('whatsapp')) return 'WhatsApp Business API'
            return null
          }).filter(Boolean)
          
          const uniqueCredentials = [...new Set(credentialRequirements)]
          
          let message = `🎉 **Workflow "${workflowData.name}" generated successfully!**\n\n`
          message += `📊 **Summary:** ${nodeCount} nodes created\n`
          message += `🔧 **Nodes:** ${nodeNames}\n\n`
          
          if (uniqueCredentials.length > 0) {
            message += `🔐 **Required Credentials:**\n`
            uniqueCredentials.forEach(cred => {
              message += `• ${cred}\n`
            })
            message += `\n`
          }
          
          message += `✅ You can view the complete workflow in the JSON tab on the right panel.\n\n`
          message += `🚀 **Ready to deploy?** Click the green **Deploy to n8n** button in the header to deploy this workflow to your n8n instance!`
          
          return message
        }

        // Add enhanced success message to conversation  
        const initialSuccessMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: generateSuccessMessage(parsed),
          sender: "ai",
          timestamp: new Date(),
          provider: currentProvider,
        }
        setMessages((prev) => [...prev, initialSuccessMessage])
        console.log("[v0] ✅ Added initial generation success message to conversation")
        
        // Show success notification
        showNotification({
          title: "🎉 Workflow Generated Successfully!",
          description: `Your workflow "${parsed.name}" is ready to deploy. Click the green "Deploy to n8n" button in the header to deploy it to your n8n instance.`,
          type: "success",
        })

      } catch (parseError) {
        console.error("[v0] Generated content is not valid JSON:", parseError)
        throw new Error("Generated workflow is not valid JSON")
      }

    } catch (error) {
      console.error("[v0] Workflow generation error:", error)
      let errorMessage = "I encountered an issue while generating your workflow."
      
      if (error instanceof Error) {
        // Use the already user-friendly error message from the API handling
        errorMessage = error.message
      }

      // Add error message to conversation
      const errorAiMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: `${errorMessage} Please try again, and if the issue persists, check your API key configuration in the settings.`,
        sender: "ai",
        timestamp: new Date(),
        error: true,
      }
      setMessages((prev) => [...prev, errorAiMessage])

      setShowGenerateButton(true)
    } finally {
      setIsGeneratingWorkflow(false)
    }
  }

  const handleRegenerateWorkflow = async () => {
    if (!currentWorkflowId) return

    lastGenerationAttempt.current = Date.now()
    setIsGeneratingWorkflow(true)
    // Keep regenerate button visible during generation to show process is happening
    // setShowRegenerateButton(false)

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.sender === "user" ? ("user" as const) : ("assistant" as const),
        content: msg.content,
      }))

      console.log("[v0] Regenerating workflow JSON from conversation builder...")
      console.log("[v0] Regeneration context:", {
        workflowId: currentWorkflowId,
        messageCount: conversationHistory.length,
        lastUserMessage: conversationHistory.filter(m => m.role === 'user').slice(-1)[0]?.content?.substring(0, 100),
        lastAiMessage: conversationHistory.filter(m => m.role === 'assistant').slice(-1)[0]?.content?.substring(0, 100)
      })

      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: conversationHistory,
          isWorkflowGeneration: true,
          provider: selectedAiProvider,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'I apologize, but I encountered an issue while regenerating the workflow.'
        
        try {
          const error = await response.json()
          console.error("[v0] API response error:", error)
          
          if (error.error) {
            switch (error.error) {
              case 'NO_API_KEYS':
              case 'OPENAI_KEY_MISSING':
              case 'CLAUDE_KEY_MISSING':
                errorMessage = 'Please configure your AI API keys to generate workflows.'
                break
              case 'INVALID_API_KEY':
                errorMessage = 'Your AI API key is invalid. Please check your configuration.'
                break
              default:
                errorMessage = error.content || errorMessage
            }
          }
        } catch (parseError) {
          console.error('[v0] Failed to parse regeneration error:', parseError)
          errorMessage = 'The workflow generation service is temporarily unavailable. Please try again.'
        }
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log("[v0] Workflow regeneration response received", {
        hasContent: !!data.content,
        contentLength: data.content?.length,
        contentPreview: data.content?.substring(0, 100)
      })

      // CRITICAL: Check if AI returned error instead of JSON
      if (!data.content || data.content.trim() === "" || data.content.includes("No response received")) {
        console.error("[v0] ❌ AI returned empty or error response:", data.content)
        throw new Error("AI service did not generate workflow JSON. Please try again.")
      }

      let workflowJson = data.content.trim()
      console.log("[v0] Raw workflowJson before cleaning:", {
        length: workflowJson.length,
        preview: workflowJson.substring(0, 200)
      })

      // Remove any markdown formatting
      workflowJson = workflowJson.replace(/```(?:json)?\s*/g, "").replace(/\s*```/g, "")

      // Remove any explanatory text before or after JSON
      const jsonStart = workflowJson.indexOf("{")
      const jsonEnd = workflowJson.lastIndexOf("}")

      if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        throw new Error("AI did not generate valid JSON structure. Please try again.")
      }

      workflowJson = workflowJson.substring(jsonStart, jsonEnd + 1)
      console.log("[v0] Final cleaned workflowJson:", {
        length: workflowJson.length,
        preview: workflowJson.substring(0, 200)
      })

      try {
        const parsed = JSON.parse(workflowJson)
        console.log("[v0] ✅ JSON parsed successfully, node count:", parsed.nodes?.length)

        if (!parsed.nodes || !Array.isArray(parsed.nodes)) {
          throw new Error("Generated workflow is missing required 'nodes' array")
        }

        if (parsed.nodes.length === 0) {
          throw new Error("Generated workflow has no nodes")
        }

        // Validate settings object if present
        if (parsed.settings && typeof parsed.settings === 'object') {
          const validSettingsKeys = ['executionOrder', 'saveDataErrorExecution', 'saveDataSuccessExecution', 
                                     'saveExecutionProgress', 'saveManualExecutions', 'callerPolicy', 
                                     'callerIds', 'executionTimeout', 'errorWorkflow', 'timezone']
          const settingsKeys = Object.keys(parsed.settings)
          const invalidKeys = settingsKeys.filter(key => !validSettingsKeys.includes(key))
          
          if (invalidKeys.length > 0) {
            console.warn("[v0] ⚠️ Regenerated workflow contains invalid settings properties:", invalidKeys)
            // Remove invalid properties
            invalidKeys.forEach(key => delete parsed.settings[key])
            // Ensure executionOrder is set
            if (!parsed.settings.executionOrder) {
              parsed.settings.executionOrder = "v1"
            }
          }
        } else {
          // Add minimal valid settings
          parsed.settings = { executionOrder: "v1" }
        }

        console.log("[v0] Valid n8n workflow JSON regenerated with settings:", Object.keys(parsed.settings || {}))

        // CRITICAL: Validate nodes to prevent HTTP Request hacks
        const invalidNodes = parsed.nodes.filter((node: any) => {
          const isGoogleServiceWithHttpRequest = node.type === 'n8n-nodes-base.httpRequest' && 
            (node.name.toLowerCase().includes('calendar') || 
             node.name.toLowerCase().includes('drive') || 
             node.name.toLowerCase().includes('google'))
          const isWhatsAppWithHttpRequest = node.type === 'n8n-nodes-base.httpRequest' && 
            node.name.toLowerCase().includes('whatsapp')
          return isGoogleServiceWithHttpRequest || isWhatsAppWithHttpRequest
        })

        if (invalidNodes.length > 0) {
          console.error("[v0] CRITICAL: Generated workflow contains forbidden HTTP Request nodes:", invalidNodes)
          throw new Error(`❌ AI generated invalid workflow! Found HTTP Request nodes for: ${invalidNodes.map((n: any) => n.name).join(', ')}. These services have dedicated nodes available.`)
        }

        // Save to database with modifying status for regeneration
        console.log("[v0] Regenerating workflow: saving JSON and setting status to modifying")
        const response = await fetch(`/api/workflows/${currentWorkflowId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ workflow_json: parsed, status: 'modifying' })
        })

        if (!response.ok) {
          throw new Error("Failed to save regenerated workflow to database")
        }

        console.log("[v0] Regenerated workflow JSON saved to database")

        // Trigger sidebar refresh
        if (onSidebarRefreshNeeded) {
          console.log("[v0] Triggering sidebar refresh after workflow regeneration")
          onSidebarRefreshNeeded()
        }

        // Trigger workflow updated callback
        if (onWorkflowUpdated) {
          console.log("[v0] Triggering workflow updated callback")
          onWorkflowUpdated()
        }

        // Pass to parent to update right panel - FLAG AS REGENERATION
        console.log("[v0] 🔄 REGENERATION: Calling onConversationStateChange", { 
          hasCallback: !!onConversationStateChange,
          workflowJsonLength: workflowJson.length,
          isRegeneration: true
        })
        if (onConversationStateChange) {
          onConversationStateChange({
            conversationState: conversationState,
            messages: messages,
            currentWorkflowId: currentWorkflowId,
            generatedWorkflowJson: workflowJson,
            isRegeneration: true // Flag this as a regeneration
          })
          console.log("[v0] 🔄 REGENERATION: onConversationStateChange called successfully")
        } else {
          console.error("[v0] ❌ REGENERATION: onConversationStateChange callback is missing!")
        }

        // Also trigger the status change to modifying immediately
        if (onStatusChange) {
          console.log("[v0] 🔄 REGENERATION: Setting status to modifying")
          onStatusChange('modifying')
        }

        // Add success message to conversation
        const regenerationSuccessMessage: Message = {
          id: Date.now().toString(),
          sender: "ai",
          content: "✅ **Workflow regenerated successfully!** I've updated your automation with the improved configuration.\n\n📋 **Next Step:** Click the **Push** button in the header to deploy these changes to your n8n instance.",
          timestamp: new Date().toISOString() as any,
        }
        setMessages(prev => [...prev, regenerationSuccessMessage])

        setWorkflowGenerated(true)

        // Generate enhanced success message with workflow summary
        const generateSuccessMessage = (workflowData: any) => {
          const nodeCount = workflowData.nodes?.length || 0
          const nodeNames = workflowData.nodes?.map((node: any) => node.name).join(', ') || 'No nodes'
          
          // Extract credential requirements
          const credentialNodes = workflowData.nodes?.filter((node: any) => 
            node.credentials || node.type?.includes('gmail') || node.type?.includes('google') || 
            node.type?.includes('slack') || node.type?.includes('twitter') || node.type?.includes('openai')
          ) || []
          
          const credentialRequirements = credentialNodes.map((node: any) => {
            if (node.type?.includes('gmail')) return 'Gmail OAuth2'
            if (node.type?.includes('googleDrive')) return 'Google Drive OAuth2'
            if (node.type?.includes('googleCalendar')) return 'Google Calendar OAuth2'
            if (node.type?.includes('slack')) return 'Slack OAuth2'
            if (node.type?.includes('twitter')) return 'Twitter API credentials'
            if (node.type?.includes('openai')) return 'OpenAI API key'
            if (node.type?.includes('whatsapp')) return 'WhatsApp Business API'
            return null
          }).filter(Boolean)
          
          const uniqueCredentials = [...new Set(credentialRequirements)]
          
          let message = `🔄 **Workflow "${workflowData.name}" regenerated successfully!**\n\n`
          message += `📊 **Updated Summary:** ${nodeCount} nodes\n`
          message += `🔧 **Nodes:** ${nodeNames}\n\n`
          
          if (uniqueCredentials.length > 0) {
            message += `🔐 **Required Credentials:**\n`
            uniqueCredentials.forEach(cred => {
              message += `• ${cred}\n`
            })
            message += `\n`
          }
          
          message += `✅ You can view the updated workflow in the JSON tab on the right panel.\n\n`
          message += `🚀 **Ready to update?** Click the **Push to n8n** button in the header to push this updated workflow to your n8n instance!`
          
          return message
        }

        // Add enhanced success message to conversation
        const successMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: generateSuccessMessage(parsed),
          sender: "ai",
          timestamp: new Date(),
          provider: currentProvider,
        }
        setMessages((prev) => [...prev, successMessage])
        
        // Show success notification for regeneration
        showNotification({
          title: "🔄 Workflow Regenerated Successfully!",
          description: `Your workflow "${parsed.name}" has been updated. Click the "Push to n8n" button in the header to deploy the changes to your n8n instance.`,
          type: "success",
        })

        // Hide regenerate button after successful regeneration
        regenerateRequestPending.current = false
        setShowRegenerateButton(false)

      } catch (parseError) {
        console.error("[v0] Generated content is not valid JSON:", parseError)
        throw new Error("Generated workflow is not valid JSON")
      }

    } catch (error) {
      console.error("[v0] Workflow regeneration error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to regenerate workflow"

      // Add error message to conversation
      const errorAiMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: `I apologize, but I encountered an error while regenerating the workflow: ${errorMessage}. Please try again.`,
        sender: "ai",
        timestamp: new Date(),
        error: true,
      }
      setMessages((prev) => [...prev, errorAiMessage])

      // Reset regenerate request state on error
      regenerateRequestPending.current = false
      setShowRegenerateButton(true)
    } finally {
      setIsGeneratingWorkflow(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleClearConversation = () => {
    setConversationState(null)
    setShowReasoning(false)
    setCurrentReasoning("")
    setWorkflowGenerated(false)
    loadWorkflowData(null)
  }

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getProviderInfo = () => {
    if (!currentProvider) return { name: "AI", color: "bg-slate-600" }

    switch (currentProvider.toLowerCase()) {
      case "claude":
        return { name: "Claude Sonnet 4", color: "bg-orange-600" }
      case "openai":
        return { name: "gpt-4o", color: "bg-green-600" }
      default:
        return { name: currentProvider, color: "bg-blue-600" }
    }
  }

  const getNotificationStyle = () => {
    switch (notification.type) {
      case "credits":
        return {
          bg: "bg-red-900/90",
          border: "border-red-700",
          icon: "text-red-400",
          text: "text-red-100",
          subtext: "text-red-200",
        }
      case "overload":
        return {
          bg: "bg-orange-900/90",
          border: "border-orange-700",
          icon: "text-orange-400",
          text: "text-orange-100",
          subtext: "text-orange-200",
        }
      default:
        return {
          bg: "bg-blue-900/90",
          border: "border-blue-700",
          icon: "text-blue-400",
          text: "text-blue-100",
          subtext: "text-blue-200",
        }
    }
  }

  const providerInfo = getProviderInfo()
  const notificationStyle = getNotificationStyle()

  return (
    <div className="flex-1 bg-slate-900 flex flex-col relative h-full">
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Name Your Workflow</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="workflow-name" className="text-slate-300">
                Workflow Name
              </Label>
              <Input
                id="workflow-name"
                placeholder="e.g., Daily Email Automation"
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="workflow-description" className="text-slate-300">
                Description (optional)
              </Label>
              <Input
                id="workflow-description"
                placeholder="Brief description of what this workflow does"
                value={workflowDescription}
                onChange={(e) => setWorkflowDescription(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNameDialog(false)
                setWorkflowName("")
                setWorkflowDescription("")
                setInputValue("")
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateWorkflow}
              disabled={!workflowName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Create Workflow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {notification.show && (
        <div
          className={`absolute top-4 right-4 z-50 ${notificationStyle.bg} backdrop-blur-sm border ${notificationStyle.border} rounded-lg p-4 shadow-lg max-w-sm`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle className={`w-5 h-5 ${notificationStyle.icon} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <p className={`text-sm ${notificationStyle.text} font-medium`}>{notification.title}</p>
              <p className={`text-xs ${notificationStyle.subtext} mt-1`}>{notification.message}</p>
              {notification.errorCode && (
                <p className={`text-xs ${notificationStyle.subtext} mt-1 font-mono opacity-75`}>
                  Error: {notification.errorCode}
                </p>
              )}
            </div>
            <button
              onClick={() => setNotification((prev) => ({ ...prev, show: false }))}
              className={`${notificationStyle.icon} hover:opacity-75 transition-opacity`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="border-b border-slate-700 p-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="font-semibold text-white">AI Conversation Builder</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${providerInfo.color}`}></div>
                <p className="text-xs text-slate-400">
                  Powered by {providerInfo.name}
                  {conversationState &&
                    ` • ${conversationState.phase} phase (${conversationState.completeness}% complete)`}
                  {error && " • Connection Issues"}
                </p>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={handleClearConversation}
            title="Clear conversation"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <p className="text-xs text-red-400">Unable to connect to AI service. Please check your internet connection and try again.</p>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 overflow-auto min-h-0" ref={messagesContainerRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender === "ai" && (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.error ? "bg-red-600" : "bg-blue-600"
                  }`}
                >
                  {message.error ? (
                    <AlertCircle className="w-4 h-4 text-white" />
                  ) : (
                    <Bot className="w-4 h-4 text-white" />
                  )}
                </div>
              )}
              {message.sender === "system" && (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.debugContext?.type === 'fix_complete' ? 'bg-green-600' : 'bg-orange-600'
                }`}>
                  <Wand2 className="w-4 h-4 text-white" />
                </div>
              )}

              <div className={`max-w-[80%] ${message.sender === "user" ? "order-first" : ""}`}>
                <div
                  className={`rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white ml-auto"
                      : message.sender === "system"
                        ? message.debugContext?.type === 'fix_complete'
                          ? "bg-green-900/20 border border-green-700 text-green-100"
                          : "bg-orange-900/20 border border-orange-700 text-orange-100"
                        : message.error
                          ? "bg-red-900/20 border border-red-800 text-red-100"
                          : "bg-slate-800 text-slate-100"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p
                  className={`text-xs text-slate-400 mt-1 flex items-center gap-1 ${
                    message.sender === "user" ? "text-right justify-end" : "text-left justify-start"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString('en-US', {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: 'UTC'
                  })}
                  {message.provider && (
                    <span className="text-slate-500">
                      •{" "}
                      {message.provider === "claude"
                        ? "Claude"
                        : message.provider === "openai"
                          ? (selectedAiProvider === "claude" ? "Claude → gpt-4o" : "gpt-4o")
                          : message.provider}
                    </span>
                  )}
                </p>
              </div>

              {message.sender === "user" && (
                <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}



          {showReasoning && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-800/50 border border-slate-600 rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"></div>
                    <div
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">AI Reasoning</span>
                </div>
                <p className="text-sm text-slate-300 italic">{currentReasoning}</p>
              </div>
            </div>
          )}

          {showGenerateButton && !isGeneratingWorkflow && !workflowGenerated && (
            <div className="flex gap-3 justify-center my-6">
              <button
                onClick={handleGenerateWorkflow}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Wand2 className="w-5 h-5" />
                Generate n8n Workflow
              </button>
            </div>
          )}

          {showRegenerateButton && !isGeneratingWorkflow && (
            <div className="flex gap-3 justify-center my-6">
              <button
                onClick={handleRegenerateWorkflow}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <RefreshCw className="w-5 h-5" />
                Regenerate Workflow
              </button>
            </div>
          )}

          {isGeneratingWorkflow && (
            <div className="flex gap-3 justify-center my-6">
              <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-slate-300 font-medium">Generating workflow...</span>
              </div>
            </div>
          )}

          {isTyping && !showReasoning && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-800 rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-slate-700 p-4 flex-shrink-0 bg-slate-900">
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            placeholder="Describe your n8n automation needs..."
            className="flex-1 bg-slate-800 border-slate-600 text-white placeholder-slate-400 resize-none min-h-[40px] max-h-[120px]"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            rows={1}
          />
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Press Enter to send, Shift+Enter for new line
          {messages.length > 1 && ` • ${messages.length - 1} messages`}
          {currentModel && ` • ${currentModel}`}
          {currentWorkflow && ` • ${currentWorkflow.name}`}
        </p>
      </div>
    </div>
  )
})

export default AIConversationBuilder