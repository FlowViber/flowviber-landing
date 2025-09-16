// n8n API integration service
import { validateWorkflowJson, stripWorkflowForPush } from './workflow-validator'

interface N8nWorkflow {
  id?: string
  name: string
  nodes: any[]
  connections: any
  active?: boolean
  settings?: any
}

interface N8nExecution {
  id: string
  workflowId: string
  mode: string
  retryOf?: string
  status: "new" | "running" | "success" | "error" | "canceled" | "crashed" | "waiting"
  startedAt: string
  stoppedAt?: string
  workflowData: any
  data?: any
}

interface N8nApiResponse<T> {
  data: T
  nextCursor?: string
}

class N8nApiService {
  constructor() {
    // Using direct database connections
  }

  private decrypt(text: string): string {
    try {
      const crypto = require('crypto')
      const algorithm = 'aes-256-cbc'
      const key = crypto.scryptSync(process.env.NEXTAUTH_SECRET || 'default-secret', 'salt', 32)
      const textParts = text.split(':')
      const iv = Buffer.from(textParts.shift()!, 'hex')
      const encryptedText = textParts.join(':')
      const decipher = crypto.createDecipheriv(algorithm, key, iv)
      let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
      decrypted += decipher.final('utf8')
      return decrypted
    } catch (error) {
      console.error('[v0] N8nApi: Decryption error:', error)
      return ''
    }
  }

  private async getDatabase() {
    const { database } = await import('@/lib/shared/database')
    return database()
  }

  private async getN8nApiKey(userId?: string): Promise<string> {
    console.log("[v0] N8nApi: Getting API key for user:", userId || "not provided")

    // If userId provided, get from database
    if (userId) {
      try {
        console.log("[v0] N8nApi: Querying database for n8n API key...")
        const db = await this.getDatabase()
        const result = await db.query(
          'SELECT encrypted_key FROM api_keys WHERE user_id = $1 AND provider = $2',
          [userId, 'n8n']
        )

        console.log("[v0] N8nApi: Database query result:", {
          hasData: result.rows.length > 0,
          userId,
        })

        if (result.rows.length > 0 && result.rows[0].encrypted_key) {
          console.log("[v0] N8nApi: Found n8n API key in database for user")
          const decryptedKey = this.decrypt(result.rows[0].encrypted_key)
          const normalizedKey = decryptedKey.trim().replace(/^"|"$/g, '')
          console.log("[v0] N8nApi: Key length after normalization:", normalizedKey.length)
          return normalizedKey
        } else {
          console.log("[v0] N8nApi: No n8n API key found in database for user:", userId)
        }
      } catch (error) {
        console.error("[v0] N8nApi: Error retrieving API key from database:", error)
      }

      // Try default user as fallback
      try {
        console.log("[v0] N8nApi: Trying default user as fallback...")
        const defaultUserId = "00000000-0000-0000-0000-000000000001"
        const db = await this.getDatabase()
        const result = await db.query(
          'SELECT encrypted_key FROM api_keys WHERE user_id = $1 AND provider = $2',
          [defaultUserId, 'n8n']
        )

        if (result.rows.length > 0 && result.rows[0].encrypted_key) {
          console.log("[v0] N8nApi: Found n8n API key using default user fallback")
          const decryptedKey = this.decrypt(result.rows[0].encrypted_key)
          return decryptedKey
        }
      } catch (fallbackError) {
        console.log("[v0] N8nApi: Default user fallback also failed")
      }
    } else {
      console.log("[v0] N8nApi: No userId provided, trying default user fallback...")
      
      // Try default user when no userId provided
      try {
        const defaultUserId = "00000000-0000-0000-0000-000000000001"
        const db = await this.getDatabase()
        const result = await db.query(
          'SELECT encrypted_key FROM api_keys WHERE user_id = $1 AND provider = $2',
          [defaultUserId, 'n8n']
        )

        if (result.rows.length > 0 && result.rows[0].encrypted_key) {
          console.log("[v0] N8nApi: Found n8n API key using default user fallback")
          const decryptedKey = this.decrypt(result.rows[0].encrypted_key)
          const normalizedKey = decryptedKey.trim().replace(/^"|"$/g, '')
          console.log("[v0] N8nApi: Key length after normalization:", normalizedKey.length)
          return normalizedKey
        } else {
          console.log("[v0] N8nApi: No n8n API key found for default user")
        }
      } catch (fallbackError) {
        console.error("[v0] N8nApi: Default user fallback failed:", fallbackError)
      }
    }

    // Try environment variable as last resort
    const envKey = process.env.N8N_API_KEY
    if (envKey) {
      console.log("[v0] N8nApi: Using environment variable N8N_API_KEY")
      return envKey
    }

    console.log("[v0] N8nApi: No API key found in database or environment")
    throw new Error(
      "n8n API key not configured. Please add your n8n API key in the Advanced Settings tab (right panel) or set the N8N_API_KEY environment variable.",
    )
  }

  private async getN8nBaseUrl(userId?: string): Promise<string> {
    console.log("[v0] N8nApi: Getting base URL for user:", userId || "not provided")

    // If userId provided, get from user profile
    if (userId) {
      try {
        console.log("[v0] N8nApi: Querying database for n8n instance URL...")
        const db = await this.getDatabase()
        const result = await db.query(
          'SELECT n8n_instance_url FROM profiles WHERE id = $1',
          [userId]
        )

        console.log("[v0] N8nApi: Database query result:", {
          hasData: result.rows.length > 0,
          hasUrl: result.rows.length > 0 && !!result.rows[0].n8n_instance_url,
          userId,
        })

        if (result.rows.length > 0 && result.rows[0].n8n_instance_url) {
          console.log("[v0] N8nApi: Found base URL in profile:", result.rows[0].n8n_instance_url)
          return result.rows[0].n8n_instance_url
        } else {
          console.log("[v0] N8nApi: No base URL found in profile for user:", userId)
        }
      } catch (error) {
        console.error("[v0] N8nApi: Error retrieving base URL from database:", error)
      }

      // Try default user profile as fallback
      try {
        console.log("[v0] N8nApi: Trying default user profile as fallback...")
        const defaultUserId = "00000000-0000-0000-0000-000000000001"
        const db = await this.getDatabase()
        const result = await db.query(
          'SELECT n8n_instance_url FROM profiles WHERE id = $1',
          [defaultUserId]
        )

        if (result.rows.length > 0 && result.rows[0].n8n_instance_url) {
          console.log("[v0] N8nApi: Found base URL in default profile:", result.rows[0].n8n_instance_url)
          return result.rows[0].n8n_instance_url
        }
      } catch (error) {
        console.log("[v0] N8nApi: Error retrieving base URL from default profile (non-fatal):", error)
      }
    } else {
      console.log("[v0] N8nApi: No userId provided, trying default user for n8n URL...")
      
      // Try default user when no userId provided
      try {
        const defaultUserId = "00000000-0000-0000-0000-000000000001"
        const db = await this.getDatabase()
        const result = await db.query(
          'SELECT n8n_instance_url FROM profiles WHERE id = $1',
          [defaultUserId]
        )

        if (result.rows.length > 0 && result.rows[0].n8n_instance_url) {
          console.log("[v0] N8nApi: Found base URL using default user:", result.rows[0].n8n_instance_url)
          return result.rows[0].n8n_instance_url
        } else {
          console.log("[v0] N8nApi: No base URL found for default user")
        }
      } catch (fallbackError) {
        console.error("[v0] N8nApi: Default user URL fallback failed:", fallbackError)
      }
    }

    // Try environment variable as fallback
    const envUrl = process.env.NEXT_PUBLIC_N8N_BASE_URL || process.env.N8N_BASE_URL
    if (envUrl) {
      console.log("[v0] N8nApi: Using environment variable for base URL:", envUrl)
      return envUrl
    }

    console.log("[v0] N8nApi: No base URL found in profile or environment")
    throw new Error(
      "n8n instance URL not configured. Please add your n8n instance URL in the Advanced Settings tab (right panel) or set the NEXT_PUBLIC_N8N_BASE_URL environment variable.",
    )
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}, userId?: string): Promise<T> {
    console.log("[v0] N8nApi: Making request to:", endpoint)
    console.log("[v0] N8nApi: With userId:", userId || "not provided")

    try {
      const apiKey = await this.getN8nApiKey(userId)
      const baseUrl = await this.getN8nBaseUrl(userId)

      // Ensure base URL doesn't have trailing slash
      const cleanBaseUrl = baseUrl.replace(/\/$/, "")
      const url = `${cleanBaseUrl}/api/v1${endpoint}`

      console.log("[v0] N8nApi: Full request URL:", url)
      console.log("[v0] N8nApi: Has API key:", !!apiKey)
      console.log("[v0] N8nApi: Request method:", options.method || "GET")

      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-N8N-API-KEY": apiKey,
          ...options.headers,
        },
      })

      console.log("[v0] N8nApi: Response status:", response.status)

      if (!response.ok) {
        let errorText: string
        try {
          errorText = await response.text()
        } catch (textError) {
          errorText = `Failed to read error response: ${response.status} ${response.statusText}`
        }
        console.error("[v0] N8nApi: Error response:", errorText)

        if (response.status === 401) {
          throw new Error("n8n API authentication failed. Please verify your API key in the Advanced Settings tab.")
        } else if (response.status === 404) {
          throw new Error("n8n endpoint not found. Please verify your instance URL and ensure the n8n API is enabled.")
        } else if (response.status === 500) {
          throw new Error("n8n server error. Please check your n8n instance status and logs.")
        } else {
          throw new Error(`n8n API error (${response.status}): ${errorText}`)
        }
      }

      // Parse JSON response
      const result = await response.json()
      console.log("[v0] N8nApi: Request successful")
      return result
    } catch (error) {
      console.error("[v0] N8nApi: Request failed:", error)

      // Re-throw with more context if it's our custom error
      if (
        error instanceof Error &&
        (error.message.includes("not configured") ||
          error.message.includes("authentication failed") ||
          error.message.includes("endpoint not found"))
      ) {
        throw error
      }

      // Handle ECONNREFUSED specifically for n8n connection
      if (error instanceof Error && error.message.includes("ECONNREFUSED")) {
        throw new Error("Failed to connect to n8n. Please ensure your n8n instance is running and accessible at the configured URL.")
      }

      // Wrap other errors with more context
      throw new Error(`n8n API request failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  // Deploy workflow to n8n (create new workflow)
  async deployWorkflow(workflowJson: any, workflowName: string, userId?: string): Promise<N8nWorkflow> {
    console.log("[v0] N8nApi: Starting deployment for workflow:", workflowName)
    console.log("[v0] N8nApi: User ID for deployment:", userId || "not provided")

    const workflowData = {
      name: workflowName,
      nodes: workflowJson.nodes || [],
      connections: workflowJson.connections || {},
      settings: workflowJson.settings || { executionOrder: "v1" },
    }

    console.log("[v0] N8nApi: Workflow data prepared:", {
      name: workflowData.name,
      nodeCount: workflowData.nodes.length,
      hasConnections: Object.keys(workflowData.connections).length > 0,
      settings: workflowData.settings,
    })

    const result = await this.makeRequest<N8nWorkflow>(
      "/workflows",
      {
        method: "POST",
        body: JSON.stringify(workflowData),
      },
      userId,
    )

    console.log("[v0] N8nApi: Workflow deployed successfully with ID:", result.id)
    return result
  }

  // Validate workflow configuration locally
  async validateWorkflowConfiguration(workflowJson: any): Promise<{ valid: boolean; errors: Array<{ nodeId: string; nodeName: string; error: string }> }> {
    console.log("[v0] N8nApi: Validating workflow configuration")
    const errors: Array<{ nodeId: string; nodeName: string; error: string }> = []

    // Check if workflow has nodes
    if (!workflowJson.nodes || workflowJson.nodes.length === 0) {
      return { valid: false, errors: [{ nodeId: 'workflow', nodeName: 'Workflow', error: 'Workflow has no nodes' }] }
    }

    // Validate each node
    for (const node of workflowJson.nodes) {
      // Check for AI Agent nodes without prompts
      if (node.type === '@n8n/n8n-nodes-langchain.agent' || node.type?.includes('agent')) {
        if (!node.parameters?.text && node.parameters?.promptType !== 'auto') {
          errors.push({
            nodeId: node.id,
            nodeName: node.name,
            error: 'AI Agent node is missing a system prompt'
          })
        }
      }

      // Check for nodes with missing credentials
      if (node.credentials) {
        for (const [credType, credData] of Object.entries(node.credentials)) {
          if (!credData || (typeof credData === 'object' && Object.keys(credData).length === 0)) {
            errors.push({
              nodeId: node.id,
              nodeName: node.name,
              error: `Missing ${credType} credentials`
            })
          }
        }
      }

      // Check for HTTP Request nodes with invalid URLs
      if (node.type === 'n8n-nodes-base.httpRequest') {
        if (!node.parameters?.url || node.parameters.url === '') {
          errors.push({
            nodeId: node.id,
            nodeName: node.name,
            error: 'HTTP Request node is missing URL'
          })
        }
      }

      // Check for trigger nodes
      if (node.type === 'n8n-nodes-base.manualTrigger' && workflowJson.nodes.length > 1) {
        // This is fine for testing
      } else if (node.type?.includes('trigger') && !node.disabled) {
        // Trigger nodes should have proper configuration
        if (node.type === 'n8n-nodes-base.webhook') {
          // Check for required webhook parameters
          if (!node.parameters?.path || node.parameters.path === '') {
            errors.push({
              nodeId: node.id,
              nodeName: node.name,
              error: 'Webhook trigger is missing path configuration'
            })
          }
          // Optionally check for HTTP method
          if (!node.parameters?.httpMethod) {
            errors.push({
              nodeId: node.id,
              nodeName: node.name,
              error: 'Webhook trigger is missing HTTP method configuration'
            })
          }
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  // Enhanced: Retrieve workflow errors including configuration issues
  async getWorkflowErrors(workflowId?: string, userId?: string, workflowJson?: any): Promise<N8nExecution[]> {
    console.log("[v0] N8nApi: Retrieving workflow errors for workflow:", workflowId || "all")

    try {
      const allErrors: N8nExecution[] = []

      // First, check for configuration errors if workflow JSON is provided
      if (workflowJson) {
        const validation = await this.validateWorkflowConfiguration(workflowJson)
        if (!validation.valid && validation.errors.length > 0) {
          console.log("[v0] N8nApi: Found configuration errors:", validation.errors)
          
          // Create mock execution errors for configuration issues
          for (const configError of validation.errors) {
            allErrors.push({
              id: `config-error-${configError.nodeId}`,
              workflowId: workflowId || 'unknown',
              mode: 'manual',
              status: 'error',
              startedAt: new Date().toISOString(),
              workflowData: workflowJson,
              data: {
                resultData: {
                  error: {
                    message: configError.error,
                    description: `Configuration error in node "${configError.nodeName}": ${configError.error}`,
                    cause: 'Configuration validation failed',
                    nodeId: configError.nodeId,
                    nodeName: configError.nodeName
                  },
                  lastNodeExecuted: configError.nodeName
                }
              }
            })
          }
        }
      }

      // Then check for actual execution errors (n8n only accepts: error, success, waiting)
      try {
        let endpoint = `/executions?status=error&limit=50`
        if (workflowId) {
          endpoint += `&workflowId=${workflowId}`
        }

        console.log(`[v0] N8nApi: Checking executions with status: error`)
        const result = await this.makeRequest<N8nApiResponse<N8nExecution[]>>(endpoint, {}, userId)
        
        if (result.data && result.data.length > 0) {
          console.log(`[v0] N8nApi: Found ${result.data.length} error executions`)
          allErrors.push(...result.data)
        }
      } catch (statusError) {
        console.log(`[v0] N8nApi: No error executions found`)
      }

      // Also check for workflow validation issues by getting workflow details
      if (workflowId && allErrors.length === 0) {
        try {
          console.log("[v0] N8nApi: Checking workflow validation issues...")
          const workflowDetails = await this.makeRequest<N8nWorkflow>(`/workflows/${workflowId}`, {}, userId)
          
          // Check if workflow has validation issues
          if (workflowDetails.nodes) {
            console.log(`[v0] N8nApi: Analyzing ${workflowDetails.nodes.length} nodes for validation issues`)
            
            // Check for problematic node types that might cause "unrecognized" errors
            const problematicNodes = workflowDetails.nodes.filter(node => {
              if (!node.type) return true
              
              // Check for known problematic node types
              const problematicTypes = [
                'whatsappBusinessCloud',
                'n8n-nodes-base.whatsappBusinessCloud',
                'whatsappBusiness',
                'whatsapp'
              ]
              
              return problematicTypes.some(type => 
                node.type.toLowerCase().includes(type.toLowerCase())
              )
            })
            
            // Also check for nodes that might be missing or have invalid types
            const invalidNodes = workflowDetails.nodes.filter(node => 
              !node.type || node.type.includes('unknown') || node.type === '' || node.type.includes('undefined')
            )
            
            const totalProblematicNodes = problematicNodes.length + invalidNodes.length
            
            if (totalProblematicNodes > 0) {
              console.log(`[v0] N8nApi: Found ${totalProblematicNodes} nodes with validation issues`)
              console.log(`[v0] N8nApi: Problematic nodes:`, problematicNodes.map(n => ({ name: n.name, type: n.type })))
              console.log(`[v0] N8nApi: Invalid nodes:`, invalidNodes.map(n => ({ name: n.name, type: n.type })))
              
              let errorMessage = 'Workflow validation error: '
              if (problematicNodes.length > 0) {
                const nodeNames = problematicNodes.map(n => `"${n.name}" (${n.type})`).join(', ')
                errorMessage += `Found unrecognized node type(s): ${nodeNames}. `
              }
              if (invalidNodes.length > 0) {
                errorMessage += `Found ${invalidNodes.length} nodes with missing or invalid types. `
              }
              errorMessage += 'Please check node configurations and ensure all required n8n nodes are available in your instance.'
              
              // Create a synthetic error execution for validation issues
              allErrors.push({
                id: `validation-${Date.now()}`,
                workflowId: workflowId,
                mode: 'manual',
                status: 'error',
                startedAt: new Date().toISOString(),
                stoppedAt: new Date().toISOString(),
                workflowData: workflowDetails,
                data: {
                  resultData: {
                    error: {
                      message: errorMessage,
                      description: errorMessage,
                      cause: 'Workflow validation error'
                    },
                    lastNodeExecuted: problematicNodes.length > 0 ? problematicNodes[0].name : (invalidNodes.length > 0 ? invalidNodes[0].name : 'Unknown')
                  }
                }
              } as N8nExecution)
            } else {
              console.log(`[v0] N8nApi: All nodes appear to have valid types`)
            }
          }
        } catch (validationError) {
          console.log("[v0] N8nApi: Could not check workflow validation:", validationError)
        }
      }

      console.log("[v0] N8nApi: Found", allErrors.length, "error executions, fetching detailed data...")
      
      // Fetch detailed execution data for each error
      const detailedErrors: N8nExecution[] = []
      for (const execution of allErrors) {
        try {
          console.log(`[v0] N8nApi: Fetching detailed data for execution: ${execution.id}`)
          const detailedExecution = await this.makeRequest<N8nExecution>(`/executions/${execution.id}?includeData=true`, {}, userId)
          
          // Log the COMPLETE structure to see what n8n actually returns
          console.log(`[v0] N8nApi: COMPLETE execution data for ${execution.id}:`, JSON.stringify(detailedExecution, null, 2))
          
          detailedErrors.push(detailedExecution)
          console.log(`[v0] N8nApi: Retrieved detailed execution data for: ${execution.id}`)
        } catch (detailError) {
          console.log(`[v0] N8nApi: Could not fetch details for execution ${execution.id}, using basic data`)
          detailedErrors.push(execution)
        }
      }
      
      console.log("[v0] N8nApi: Total detailed errors found:", detailedErrors.length)
      return detailedErrors
    } catch (error) {
      console.error("[v0] N8nApi: Failed to retrieve workflow errors:", error)
      // Return empty array instead of throwing to allow graceful handling
      return []
    }
  }

  // Sync workflow from n8n (get existing workflow)
  async syncWorkflowFromN8n(workflowId: string, userId?: string): Promise<N8nWorkflow> {
    console.log("[v0] N8nApi: Syncing workflow from n8n:", workflowId)

    const result = await this.makeRequest<N8nWorkflow>(`/workflows/${workflowId}`, {}, userId)

    const cleanWorkflow: N8nWorkflow = {
      id: result.id,
      name: result.name,
      nodes: result.nodes || [],
      connections: result.connections || {},
      active: result.active,
      settings: result.settings || { executionOrder: "v1" },
    }

    console.log("[v0] N8nApi: Workflow synced and filtered successfully:", cleanWorkflow.name)
    console.log("[v0] N8nApi: Filtered workflow contains:", {
      nodeCount: cleanWorkflow.nodes.length,
      hasConnections: Object.keys(cleanWorkflow.connections).length > 0,
      isActive: cleanWorkflow.active,
    })

    return cleanWorkflow
  }

  // Push workflow to n8n (update existing workflow)
  async pushWorkflowToN8n(
    workflowId: string,
    workflowJson: any,
    workflowName: string,
    userId?: string,
  ): Promise<N8nWorkflow> {
    console.log("[v0] N8nApi: Pushing workflow to n8n:", workflowId)

    // Validate and sanitize the workflow JSON before pushing
    let validatedWorkflow
    try {
      // First validate the entire workflow structure
      validatedWorkflow = validateWorkflowJson({
        ...workflowJson,
        name: workflowName
      })
      
      console.log("[v0] N8nApi: Workflow validated successfully")
    } catch (validationError) {
      console.error("[v0] N8nApi: Workflow validation failed:", validationError)
      throw new Error(`Workflow validation failed: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`)
    }

    // Strip to only essential properties for n8n API
    const workflowData = stripWorkflowForPush(validatedWorkflow)
    
    console.log("[v0] N8nApi: Sending validated workflow data with settings:", 
      workflowData.settings ? Object.keys(workflowData.settings) : 'none')

    const result = await this.makeRequest<N8nWorkflow>(
      `/workflows/${workflowId}`,
      {
        method: "PUT",
        body: JSON.stringify(workflowData),
      },
      userId,
    )

    console.log("[v0] N8nApi: Workflow pushed successfully")
    return result
  }

  // Get all workflows from n8n
  async getWorkflows(userId?: string): Promise<N8nWorkflow[]> {
    console.log("[v0] N8nApi: Getting all workflows from n8n")

    const result = await this.makeRequest<N8nApiResponse<N8nWorkflow[]>>("/workflows", {}, userId)

    console.log("[v0] N8nApi: Retrieved", result.data.length, "workflows")
    return result.data
  }

  // Test API connection
  async testConnection(userId?: string): Promise<boolean> {
    try {
      console.log("[v0] N8nApi: Testing connection for user:", userId || "not provided")
      await this.makeRequest("/workflows?limit=1", {}, userId)
      console.log("[v0] N8nApi: Connection test successful")
      return true
    } catch (error) {
      console.error("[v0] N8nApi: Connection test failed:", error)
      return false
    }
  }
}

// Export singleton instance
export const n8nApi = new N8nApiService()
export default n8nApi