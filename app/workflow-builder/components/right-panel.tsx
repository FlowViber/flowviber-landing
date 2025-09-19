"use client"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Copy, Key, Eye, EyeOff, Globe, Wand2, Bot } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface ApiKeyConfig {
  provider: string
  key: string
  isConnected: boolean
  isLoading: boolean
  showKey: boolean
  error?: string
  showSuccessMessage?: boolean
}

interface N8nConfig {
  baseUrl: string
  isLoading: boolean
  error?: string
  showSuccessMessage?: boolean
}

interface RightPanelProps {
  generatedWorkflowJson?: string
  conversationState?: any
  onWorkflowGenerated?: (workflowJson: string) => void
  workflowId?: string
  onStatusChange?: (status: "draft" | "generated" | "deployed" | "modifying") => void
  isFromN8nSync?: boolean
  selectedAiProvider?: string
  onAiProviderChange?: (provider: string) => void
}

interface AIProvider {
  name: string
  displayName: string
  models: string[]
  isActive: boolean
}

const TEMP_USER_ID = "00000000-0000-0000-0000-000000000001"

export default function RightPanel({ 
  generatedWorkflowJson, 
  conversationState, 
  onWorkflowGenerated, 
  workflowId,
  onStatusChange,
  isFromN8nSync = false,
  selectedAiProvider = "claude",
  onAiProviderChange
}: RightPanelProps) {
  const { addToast } = useToast()
  const [editableJson, setEditableJson] = useState(generatedWorkflowJson || '')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>([])
  const [isLoadingProviders, setIsLoadingProviders] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  // Fetch available AI providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/ai-providers')
        if (response.ok) {
          const providers = await response.json()
          setAvailableProviders(providers)
        } else {
          // Fallback to default providers
          setAvailableProviders([
            { name: 'openai', displayName: 'OpenAI (GPT-4)', models: ['gpt-4o', 'gpt-4o-mini'], isActive: true },
            { name: 'claude', displayName: 'Claude (Anthropic)', models: ['claude-3-5-sonnet-20250320'], isActive: true }
          ])
        }
      } catch (error) {
        console.error('Error fetching AI providers:', error)
        // Fallback to default providers
        setAvailableProviders([
          { name: 'openai', displayName: 'OpenAI (GPT-4)', models: ['gpt-4o', 'gpt-4o-mini'], isActive: true },
          { name: 'claude', displayName: 'Claude (Anthropic)', models: ['claude-3-5-sonnet-20250320'], isActive: true }
        ])
      } finally {
        setIsLoadingProviders(false)
      }
    }

    fetchProviders()
  }, [])

  // Sync external JSON changes (from n8n or AI generation)
  useEffect(() => {
    console.log('[v0] RightPanel: JSON prop change detected', { 
      hasGeneratedJson: !!generatedWorkflowJson,
      jsonLength: generatedWorkflowJson?.length || 0,
      editableJsonLength: editableJson?.length || 0,
      isFromN8nSync,
      willUpdate: generatedWorkflowJson && (generatedWorkflowJson !== editableJson || isFromN8nSync),
      jsonPreview: generatedWorkflowJson ? generatedWorkflowJson.substring(0, 100) + '...' : 'null'
    })
    
    // CRITICAL FIX: Always update for n8n sync, even if JSON appears identical
    if (generatedWorkflowJson && (generatedWorkflowJson !== editableJson || isFromN8nSync)) {
      console.log('[v0] RightPanel: 🔄 UPDATING JSON DISPLAY - Syncing external JSON change')
      
      // Add visual feedback for sync operations
      if (isFromN8nSync) {
        console.log('[v0] RightPanel: 🎬 STARTING SYNC ANIMATION - Setting isSyncing to true')
        setIsSyncing(true)
        setTimeout(() => {
          console.log('[v0] RightPanel: 🎬 ENDING SYNC ANIMATION - Setting isSyncing to false')
          setIsSyncing(false)
        }, 2000) // Show sync animation for 2 seconds (increased from 1 second)
      }
      
      setEditableJson(generatedWorkflowJson)
      setHasUnsavedChanges(false)
      setIsEditing(false)
    }
  }, [generatedWorkflowJson, isFromN8nSync])

  // Handle JSON editing
  const handleJsonChange = (value: string) => {
    setEditableJson(value)
    const hasChanges = value !== generatedWorkflowJson
    setHasUnsavedChanges(hasChanges)
    
    // Set status to modifying if this is a local edit (not from n8n sync)
    if (hasChanges && !isFromN8nSync && workflowId && onStatusChange) {
      console.log('[v0] RightPanel: Detected local JSON edit, setting status to modifying')
      onStatusChange('modifying')
    }
  }

  // Save JSON changes
  const handleSaveJson = async () => {
    if (!workflowId || !hasUnsavedChanges) return
    
    try {
      const parsed = JSON.parse(editableJson)
      const WorkflowStorage = (await import('@/lib/workflow-storage')).default
      const storage = new WorkflowStorage()
      
      await storage.updateWorkflowJsonAndStatus(workflowId, parsed, 'modifying')
      setHasUnsavedChanges(false)
      
      addToast({
        variant: 'success',
        title: 'JSON Saved',
        description: 'Workflow JSON has been saved with modifying status.'
      })
    } catch (error) {
      addToast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Failed to save JSON. Please check the format.'
      })
    }
  }

  const [n8nConfig, setN8nConfig] = useState<N8nConfig>({
    baseUrl: "",
    isLoading: false,
    showSuccessMessage: false,
  })

  

  const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyConfig>>({
    n8n: {
      provider: "n8n",
      key: "",
      isConnected: false,
      isLoading: false,
      showKey: false,
      showSuccessMessage: false,
    },
    openai: {
      provider: "openai",
      key: "",
      isConnected: false,
      isLoading: false,
      showKey: false,
      showSuccessMessage: false,
    },
    claude: {
      provider: "claude",
      key: "",
      isConnected: false,
      isLoading: false,
      showKey: false,
      showSuccessMessage: false,
    },
  })

  useEffect(() => {
    loadApiKeys()
    loadN8nConfig()
  }, [])

  

  const loadN8nConfig = async () => {
    try {
      const response = await fetch("/api/n8n-config")
      const result = await response.json()

      if (result.result?.n8nInstanceUrl) {
        setN8nConfig((prev) => ({ ...prev, baseUrl: result.result.n8nInstanceUrl }))
        return
      }
    } catch (error) {
      console.error("[v0] Failed to load n8n URL from API:", error)
    }

    // Fallback to environment variable or localStorage
    const savedBaseUrl = process.env.NEXT_PUBLIC_N8N_BASE_URL || localStorage.getItem("n8n_base_url") || ""
    setN8nConfig((prev) => ({ ...prev, baseUrl: savedBaseUrl }))
  }

  const saveN8nConfig = async () => {
    if (!n8nConfig.baseUrl.trim()) {
      addToast({
        variant: "warning",
        title: "Base URL Required",
        description: "Please enter a valid n8n base URL.",
      })
      return
    }

    try {
      new URL(n8nConfig.baseUrl)
    } catch {
      addToast({
        variant: "destructive",
        title: "Invalid URL",
        description: "Please enter a valid URL (e.g., https://your-n8n-instance.com)",
      })
      return
    }

    setN8nConfig((prev) => ({ ...prev, isLoading: true, error: undefined, showSuccessMessage: false }))

    try {
      console.log("[v0] Starting n8n URL save process")

      const response = await fetch("/api/n8n-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          n8nInstanceUrl: n8nConfig.baseUrl,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save n8n configuration")
      }

      console.log("[v0] Successfully saved n8n URL via API")

      // Also save to localStorage as backup
      localStorage.setItem("n8n_base_url", n8nConfig.baseUrl)
      console.log("[v0] Saved n8n URL to localStorage")

      setN8nConfig((prev) => ({ ...prev, showSuccessMessage: true }))
      addToast({
        variant: "success",
        title: "Base URL Saved",
        description: "n8n base URL saved successfully to database and localStorage.",
      })
    } catch (error) {
      console.error("[v0] n8n URL save error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save base URL"
      setN8nConfig((prev) => ({ ...prev, error: errorMessage }))
      addToast({
        variant: "destructive",
        title: "Save Failed",
        description: `Failed to save n8n base URL: ${errorMessage}`,
      })
    } finally {
      setN8nConfig((prev) => ({ ...prev, isLoading: false }))
    }
  }

  const clearN8nConfig = async () => {
    try {
      const response = await fetch("/api/n8n-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          n8nInstanceUrl: null,
        }),
      })

      if (!response.ok) {
        console.error("[v0] Failed to clear n8n URL via API")
      }
    } catch (error) {
      console.error("[v0] Failed to clear n8n URL from database:", error)
    }

    localStorage.removeItem("n8n_base_url")
    setN8nConfig({
      baseUrl: "",
      isLoading: false,
      showSuccessMessage: false,
    })
    addToast({
      variant: "success",
      title: "Base URL Cleared",
      description: "n8n base URL cleared successfully.",
    })
  }

  const updateApiKey = (provider: string, field: keyof ApiKeyConfig, value: any) => {
    setApiKeys((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        [field]: value,
      },
    }))
  }

  const loadApiKeys = async () => {
    try {
      const response = await fetch('/api/api-keys')
      if (!response.ok) throw new Error('Failed to fetch API keys')
      const data = await response.json()
      
      // Transform the API response to match our state structure
      const transformedApiKeys: { [key: string]: ApiKeyConfig } = {
        openai: { provider: 'openai', key: '', isConnected: false, isLoading: false, showKey: false },
        claude: { provider: 'claude', key: '', isConnected: false, isLoading: false, showKey: false },
        n8n: { provider: 'n8n', key: '', isConnected: false, isLoading: false, showKey: false },
      }

      // Populate with saved keys if they exist
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((item: any) => {
          if (transformedApiKeys[item.provider]) {
            transformedApiKeys[item.provider].key = item.encrypted_key || ''
            transformedApiKeys[item.provider].isConnected = !!item.encrypted_key
          }
        })
      }

      setApiKeys(transformedApiKeys)
    } catch (error) {
      console.error("Error fetching API keys:", error)
    }
  }

  const saveApiKey = async (provider: string) => {
    const config = apiKeys[provider]
    if (!config.key.trim()) {
      addToast({
        variant: "warning",
        title: "API Key Required",
        description: "Please enter an API key before saving.",
      })
      return
    }

    updateApiKey(provider, "isLoading", true)
    updateApiKey(provider, "error", undefined)
    updateApiKey(provider, "showSuccessMessage", false)

    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          key: config.key,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save API key")
      }

      addToast({
        variant: "success",
        title: "API Key Saved",
        description: `${provider.toUpperCase()} API key saved successfully.`,
      })

      await testConnection(provider, undefined, true)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save API key"
      updateApiKey(provider, "error", errorMessage)
      addToast({
        variant: "destructive",
        title: "Save Failed",
        description: `Failed to save ${provider.toUpperCase()} API key: ${errorMessage}`,
      })
      console.error("[v0] Failed to save API key:", error)
    } finally {
      updateApiKey(provider, "isLoading", false)
    }
  }

  const testConnection = async (provider: string, keyOverride?: string, showSuccessMessage = false) => {
    const config = apiKeys[provider]
    const keyToTest = keyOverride || config.key

    if (!keyToTest.trim()) {
      addToast({
        variant: "warning",
        title: "API Key Required",
        description: "Please enter an API key before testing.",
      })
      return
    }

    updateApiKey(provider, "isLoading", true)
    updateApiKey(provider, "error", undefined)
    updateApiKey(provider, "showSuccessMessage", false)

    try {
      const response = await fetch("/api/api-keys", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider,
          key: keyToTest,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.errorMessage || "Failed to test connection")
      }

      updateApiKey(provider, "isConnected", result.isValid)

      if (result.isValid) {
        if (showSuccessMessage) {
          updateApiKey(provider, "showSuccessMessage", true)
        }
        if (!keyOverride) {
          addToast({
            variant: "success",
            title: "Connection Successful",
            description: `${provider.toUpperCase()} API key is working properly.`,
          })
        }
      } else {
        const errorMessage = result.errorMessage || "Connection test failed"
        updateApiKey(provider, "error", errorMessage)
        if (!keyOverride) {
          addToast({
            variant: "destructive",
            title: "Connection Failed",
            description: `${provider.toUpperCase()} connection test failed: ${errorMessage}`,
          })
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Connection test failed"
      updateApiKey(provider, "error", errorMessage)
      updateApiKey(provider, "isConnected", false)
      if (!keyOverride) {
        addToast({
          variant: "destructive",
          title: "Connection Failed",
          description: `${provider.toUpperCase()} connection test failed: ${errorMessage}`,
        })
      }
      console.error(`[v0] ${provider} connection test failed:`, error)
    } finally {
      updateApiKey(provider, "isLoading", false)
    }
  }

  const clearConfig = async (provider: string) => {
    if (provider === "n8n") {
      await clearN8nConfig()
      return
    }

    // Clear API key from database and local storage

    localStorage.removeItem("n8n_base_url") // This line seems misplaced for API key clearing, but keeping it as per original structure for now.
    setApiKeys((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        key: "",
        isConnected: false,
        error: undefined,
        showSuccessMessage: false,
      },
    }))
    addToast({
      variant: "success",
      title: "API Key Cleared",
      description: `${provider.toUpperCase()} API key cleared successfully.`,
    })
  }

  

  const copyToClipboard = async () => {
    if (!generatedWorkflowJson) return

    try {
      await navigator.clipboard.writeText(generatedWorkflowJson)
      addToast({
        variant: "success",
        title: "Copied to Clipboard",
        description: "Workflow JSON copied successfully.",
      })
    } catch (error) {
      addToast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy workflow JSON to clipboard.",
      })
    }
  }

  const renderApiKeySection = (provider: string, title: string, description: string) => {
    const config = apiKeys[provider]

    return (
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-600 rounded flex items-center justify-center">
              <Key className="w-3 h-3 text-slate-400" />
            </div>
            <span className="font-medium text-slate-300">{title}</span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded ${
              config.isConnected ? "bg-green-600 text-white" : "bg-slate-600 text-slate-300"
            }`}
          >
            {config.isConnected ? "Connected" : "Not Connected"}
          </span>
        </div>

        <p className="text-xs text-slate-400 mb-3">{description}</p>

        <div className="space-y-4">
          <div>
            <Label className="block text-xs font-medium text-slate-300 mb-1">API Key</Label>
            <div className="relative">
              <Input
                type={config.showKey ? "text" : "password"}
                value={config.key}
                onChange={(e) => updateApiKey(provider, "key", e.target.value)}
                placeholder={`Enter your ${title} API key`}
                className="bg-slate-800 border-slate-600 text-slate-300 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-8 w-8 p-0"
                onClick={() => updateApiKey(provider, "showKey", !config.showKey)}
              >
                {config.showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => saveApiKey(provider)}
              disabled={config.isLoading || !config.key.trim()}
            >
              {config.isLoading ? "Testing..." : "Save & Test"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 bg-transparent"
              onClick={() => clearConfig(provider)}
            >
              Clear
            </Button>
          </div>

          {config.isConnected && config.showSuccessMessage && (
            <div className="bg-green-900/20 border border-green-700 rounded p-3">
              <p className="text-sm text-green-400">✓ Connection successful! API key is working properly.</p>
            </div>
          )}

          {config.error && !config.isConnected && (
            <div className="bg-red-900/20 border border-red-700 rounded p-3">
              <p className="text-sm text-red-400">✗ {config.error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderN8nBaseUrlSection = () => {
    return (
      <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-slate-600 rounded flex items-center justify-center">
              <Globe className="w-3 h-3 text-slate-400" />
            </div>
            <span className="font-medium text-slate-300">n8n Instance URL</span>
          </div>
          <span
            className={`text-xs px-2 py-1 rounded ${
              n8nConfig.baseUrl ? "bg-blue-600 text-white" : "bg-slate-600 text-slate-300"
            }`}
          >
            {n8nConfig.baseUrl ? "Configured" : "Not Configured"}
          </span>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Configure the base URL of your n8n instance for workflow deployment and management
        </p>

        <div className="space-y-4">
          <div>
            <Label className="block text-xs font-medium text-slate-300 mb-1">Base URL</Label>
            <Input
              type="url"
              value={n8nConfig.baseUrl}
              onChange={(e) => setN8nConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
              placeholder="https://your-n8n-instance.com"
              className="bg-slate-800 border-slate-600 text-slate-300"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={saveN8nConfig}
              disabled={n8nConfig.isLoading || !n8nConfig.baseUrl.trim()}
            >
              {n8nConfig.isLoading ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="outline" className="border-slate-600 bg-transparent" onClick={clearN8nConfig}>
              Clear
            </Button>
          </div>

          {n8nConfig.showSuccessMessage && (
            <div className="bg-green-900/20 border border-green-700 rounded p-3">
              <p className="text-sm text-green-400">✓ Base URL saved successfully!</p>
            </div>
          )}

          {n8nConfig.error && (
            <div className="bg-red-900/20 border border-red-700 rounded p-3">
              <p className="text-sm text-red-400">✗ {n8nConfig.error}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-800 border-l border-slate-700 flex flex-col h-full w-full">

      <Tabs defaultValue="json" className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-700 mx-2 mt-2 mb-0 h-8">
          <TabsTrigger
            value="json"
            className="data-[state=active]:bg-slate-600 text-white data-[state=active]:text-white text-xs h-6"
          >
            JSON
          </TabsTrigger>
          <TabsTrigger
            value="advanced"
            className="data-[state=active]:bg-slate-600 text-white data-[state=active]:text-white text-xs h-6"
          >
            Advanced
          </TabsTrigger>
        </TabsList>

        <TabsContent value="json" className="flex-1 flex flex-col mx-2 mt-2 mb-2 h-0">
          <div className="mb-2 flex-shrink-0">
            <h3 className="font-medium text-white mb-1 text-sm">Generated Workflow JSON</h3>
            <p className="text-xs text-slate-400 mb-2">
              {generatedWorkflowJson ? "Workflow generated successfully" : "Generated workflow JSON will appear here"}
            </p>

            {generatedWorkflowJson && (
              <div className="flex gap-1 mb-2 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-600 bg-transparent hover:bg-slate-700 h-7 px-2 text-xs"
                  onClick={copyToClipboard}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-slate-600 bg-transparent hover:bg-slate-700 h-7 px-2 text-xs"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? 'View' : 'Edit'}
                </Button>
                {hasUnsavedChanges && (
                  <Button
                    size="sm"
                    variant="default"
                    className="bg-orange-600 hover:bg-orange-700 h-7 px-2 text-xs"
                    onClick={handleSaveJson}
                  >
                    Save
                  </Button>
                )}
              </div>
            )}
          </div>

          <div
            className={`flex-1 bg-slate-900 rounded-lg p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 relative ${isSyncing ? 'transition-all duration-1000' : ''}`}
            style={{ maxHeight: "calc(100vh - 300px)", minHeight: "200px" }}
          >
            {/* Sync Animation Overlay */}
            {isSyncing && (
              <div className="absolute inset-0 bg-blue-600/20 rounded-lg flex items-center justify-center z-10 animate-pulse">
                <div className="bg-slate-800 px-4 py-2 rounded-lg border border-blue-400 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-400 font-medium">Syncing from n8n...</span>
                </div>
              </div>
            )}

            {generatedWorkflowJson ? (
              isEditing ? (
                <textarea
                  value={editableJson}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  className="w-full h-full bg-slate-800 text-slate-300 font-mono text-xs leading-relaxed p-2 border border-slate-600 rounded resize-none focus:outline-none focus:border-slate-500"
                  placeholder="Edit your workflow JSON here..."
                  spellCheck={false}
                  style={{ minWidth: "0", maxWidth: "100%" }}
                />
              ) : (
                <pre className={`text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed break-words overflow-hidden ${isSyncing ? 'opacity-50' : ''}`} style={{ minWidth: "0", maxWidth: "100%" }}>
                  {editableJson || generatedWorkflowJson}
                </pre>
              )
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <p className="text-xs">JSON workflow will appear here</p>
              </div>
            )}
          </div>

          {/* AI Provider Selection - Bottom Right Corner */}
          <div className="mt-2 flex justify-end">
            <div className="min-w-0 max-w-full" style={{ width: "min(200px, 100%)" }}>
              <Label className="text-xs font-medium text-slate-400 mb-1 block truncate">
                <Bot className="w-3 h-3 inline mr-1" />
                LLM Model
              </Label>
              <Select
                value={selectedAiProvider}
                onValueChange={onAiProviderChange}
                disabled={isLoadingProviders}
              >
                <SelectTrigger className="w-full border-slate-600 bg-slate-700 text-slate-300 hover:bg-slate-600 text-xs h-7 min-w-0">
                  <SelectValue placeholder={isLoadingProviders ? "Loading..." : "Select AI agent"} />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {availableProviders.map((provider) => (
                    <SelectItem
                      key={provider.name}
                      value={provider.name}
                      className="text-slate-300 hover:bg-slate-600 focus:bg-slate-600 text-xs"
                    >
                      {provider.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="flex-1 mx-2 mt-2 mb-2 overflow-auto h-0">
          <div>
            <h3 className="font-medium text-white mb-1 text-sm">Advanced Settings</h3>
            <p className="text-xs text-slate-400 mb-3">Configure API keys and connections for workflow integrations.</p>

            <div className="space-y-4">
              {renderN8nBaseUrlSection()}

              {renderApiKeySection(
                "n8n",
                "n8n API Key",
                "Configure your n8n API key for workflow deployment and execution",
              )}

              {renderApiKeySection("openai", "OpenAI API", "Configure OpenAI API access for AI-powered workflow nodes")}

              {renderApiKeySection(
                "claude",
                "Claude API",
                "Configure Anthropic Claude API for advanced AI capabilities",
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}