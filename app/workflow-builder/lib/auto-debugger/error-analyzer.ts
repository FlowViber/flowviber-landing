// Auto Debugger - Error Analysis Logic
export interface ErrorAnalysis {
  errorType: 'configuration' | 'credential' | 'validation' | 'execution' | 'unknown'
  nodeId?: string
  nodeName?: string
  nodeType?: string
  rootCause: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  fixable: boolean
  credentialIssue?: {
    credentialType: string
    missingCredential: string
    setupGuide: string
  }
}

export class ErrorAnalyzer {
  static analyzeExecutionError(error: any, workflowJson?: any): ErrorAnalysis {
    console.log('[v0] ErrorAnalyzer: Analyzing error:', error)
    
    // Extract the actual error message from n8n error structure
    let errorMessage = ''
    let nodeId = error.nodeId
    let nodeName = error.nodeName
    
    // For n8n execution errors, the real error is nested
    if (error.data?.resultData?.error) {
      const realError = error.data.resultData.error
      errorMessage = realError.message || realError.description || realError.cause || ''
      
      // Get node info from execution data
      nodeName = error.data.resultData.lastNodeExecuted || nodeName
      
      console.log('[v0] ErrorAnalyzer: Extracted error message:', errorMessage)
      console.log('[v0] ErrorAnalyzer: Last executed node:', nodeName)
    } else {
      // Fallback to direct error property
      errorMessage = error.error || error.message || ''
    }
    
    // Parse node name from error message if not provided
    if (!nodeName && errorMessage.includes('Node "')) {
      const match = errorMessage.match(/Node "([^"]+)"/)
      nodeName = match ? match[1] : 'Unknown Node'
    }
    
    // Find node ID in workflow JSON if not provided
    if (!nodeId && workflowJson && workflowJson.nodes && nodeName) {
      const foundNode = workflowJson.nodes.find((n: any) => 
        n.name === nodeName || 
        (nodeName === 'AI Agent' && n.type?.includes('agent'))
      )
      nodeId = foundNode?.id
    }
    
    // Find node details from workflow JSON if available
    let nodeType = ''
    let nodeConfig: any = null
    if (workflowJson && nodeId) {
      nodeConfig = workflowJson.nodes?.find((n: any) => n.id === nodeId)
      nodeType = nodeConfig?.type || ''
    }

    // Analyze error patterns
    if (errorMessage.toLowerCase().includes('no prompt specified')) {
      return {
        errorType: 'configuration',
        nodeId,
        nodeName: nodeName || nodeConfig?.name || 'AI Agent',
        nodeType: nodeType || '@n8n/n8n-nodes-langchain.agent',
        rootCause: 'Missing prompt configuration in AI Agent node',
        description: 'The AI Agent node requires a system prompt to function. The prompt defines how the AI should behave and respond.',
        severity: 'high',
        fixable: true
      }
    }

    if (errorMessage.toLowerCase().includes('unauthorized') || errorMessage.toLowerCase().includes('api key')) {
      return {
        errorType: 'credential',
        nodeId,
        nodeName: nodeName || nodeConfig?.name,
        nodeType,
        rootCause: 'Missing or invalid API credentials',
        description: 'The node requires valid API credentials to access external services.',
        severity: 'critical',
        fixable: false,
        credentialIssue: {
          credentialType: this.detectCredentialType(nodeType),
          missingCredential: this.getCredentialName(nodeType),
          setupGuide: this.getCredentialSetupGuide(nodeType)
        }
      }
    }

    if (errorMessage.toLowerCase().includes('unrecognized node type')) {
      return {
        errorType: 'validation',
        nodeId,
        nodeName: nodeName || nodeConfig?.name,
        nodeType,
        rootCause: 'Unknown or unavailable node type',
        description: 'The workflow uses a node type that is not available in your n8n instance.',
        severity: 'critical',
        fixable: false
      }
    }

    // Default analysis for unknown errors
    return {
      errorType: 'unknown',
      nodeId,
      nodeName: nodeName || nodeConfig?.name || 'Unknown',
      nodeType,
      rootCause: 'Unrecognized error pattern',
      description: errorMessage || 'An unknown error occurred during workflow execution.',
      severity: 'medium',
      fixable: false
    }
  }

  private static detectCredentialType(nodeType: string): string {
    const credentialMap: Record<string, string> = {
      '@n8n/n8n-nodes-langchain.lmChatOpenAi': 'OpenAI API',
      'n8n-nodes-base.openai': 'OpenAI API',
      'n8n-nodes-base.telegram': 'Telegram Bot API',
      'n8n-nodes-base.slack': 'Slack API',
      'n8n-nodes-base.whatsappBusinessCloud': 'WhatsApp Business API',
      'n8n-nodes-base.googleSheets': 'Google Service Account',
      'n8n-nodes-base.googleCalendar': 'Google OAuth2'
    }
    return credentialMap[nodeType] || 'API Key'
  }

  private static getCredentialName(nodeType: string): string {
    const nameMap: Record<string, string> = {
      '@n8n/n8n-nodes-langchain.lmChatOpenAi': 'OpenAI API Key',
      'n8n-nodes-base.openai': 'OpenAI API Key',
      'n8n-nodes-base.telegram': 'Telegram Bot Token',
      'n8n-nodes-base.slack': 'Slack OAuth Token',
      'n8n-nodes-base.whatsappBusinessCloud': 'WhatsApp Access Token',
      'n8n-nodes-base.googleSheets': 'Google Service Account JSON',
      'n8n-nodes-base.googleCalendar': 'Google OAuth2 Credentials'
    }
    return nameMap[nodeType] || 'API Credentials'
  }

  private static getCredentialSetupGuide(nodeType: string): string {
    const guideMap: Record<string, string> = {
      '@n8n/n8n-nodes-langchain.lmChatOpenAi': 'Get your API key from https://platform.openai.com/api-keys',
      'n8n-nodes-base.openai': 'Get your API key from https://platform.openai.com/api-keys',
      'n8n-nodes-base.telegram': 'Create a bot with @BotFather on Telegram to get your bot token',
      'n8n-nodes-base.slack': 'Create a Slack app at https://api.slack.com/apps',
      'n8n-nodes-base.whatsappBusinessCloud': 'Set up WhatsApp Business API through Meta Business',
      'n8n-nodes-base.googleSheets': 'Create a service account in Google Cloud Console',
      'n8n-nodes-base.googleCalendar': 'Set up OAuth2 credentials in Google Cloud Console'
    }
    return guideMap[nodeType] || 'Check the service provider\'s documentation for API setup instructions'
  }
}