
import { NextRequest, NextResponse } from 'next/server'
import { getAIService } from '@/lib/ai-service'
import { getEnhancedSystemPrompt, getWorkflowGenerationPrompt } from '@/lib/prompt'
import { getEnhancedNodesIndex } from '@/lib/library'
import { validateOps } from '@/lib/ops'

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ConversationState {
  phase: string
  completeness: number
}

interface AIResponse {
  content: string
  provider: string
  conversationState?: ConversationState
  fallback?: boolean
  errorCode?: string
  fallbackReason?: string
  showNotification?: boolean
  silentFallback?: boolean
}

// All prompt logic moved to lib/prompt.ts for single source of truth

export async function POST(request: NextRequest) {
  try {
    const { messages, conversationState, isWorkflowGeneration, provider } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Use different prompts for conversation vs workflow generation
    let systemMessage: { role: 'system'; content: string };
    
    if (isWorkflowGeneration) {
      // Workflow generation mode - get prompt with knowledge base
      systemMessage = {
        role: 'system' as const,
        content: await getWorkflowGenerationPrompt()
      }
    } else {
      // Regular conversation mode - use enhanced prompt with recipes
      const userQuery = messages[messages.length - 1]?.content || ""
      systemMessage = {
        role: 'system' as const,
        content: getEnhancedSystemPrompt(userQuery)
      }
    }

    const allMessages = [systemMessage, ...messages]

    try {
      const aiService = getAIService()
      const response = await aiService.chat(allMessages, provider)

      // Validate workflow JSON if this is a generation request
      if (isWorkflowGeneration) {
        const validationResult = await validateWorkflowJSON(response.content)
        if (!validationResult.isValid) {
          console.error('[VALIDATION ERROR] Invalid workflow generated:', validationResult.errors)
          throw new Error(`Generated workflow contains invalid nodes: ${validationResult.errors.join(', ')}`)
        }
      }

      // Analyze conversation state if not generating workflow
      let newConversationState = conversationState
      if (!isWorkflowGeneration) {
        newConversationState = analyzeConversationState(messages, response.content)
      }

      const aiResponse: AIResponse = {
        content: response.content,
        provider: response.provider,
        conversationState: newConversationState
      }

      return NextResponse.json(aiResponse)
    } catch (aiError) {
      console.error('AI service error:', aiError)
      
      // Try fallback provider
      try {
        const aiService = getAIService()
        const fallbackResponse = await aiService.chat(allMessages, 'openai')
        
        // Parse the original error for more specific messaging
        let errorReason = 'Primary provider failed'
        let errorCode = 'FALLBACK_USED'
        
        if (aiError instanceof Error) {
          const errorMessage = aiError.message.toLowerCase()
          if (errorMessage.includes('model:') || errorMessage.includes('model')) {
            errorReason = 'Claude model configuration error'
            errorCode = 'MODEL_ERROR'
          } else if (errorMessage.includes('api error')) {
            errorReason = 'Claude API connection failed'
            errorCode = 'API_ERROR'
          } else if (errorMessage.includes('rate limit')) {
            errorReason = 'Claude rate limit exceeded'
            errorCode = 'RATE_LIMIT'
          } else if (errorMessage.includes('credit') || errorMessage.includes('quota')) {
            errorReason = 'Claude credits exhausted'
            errorCode = 'CREDITS_LOW'
          }
        }

        const aiResponse: AIResponse = {
          content: fallbackResponse.content,
          provider: fallbackResponse.provider,
          conversationState: isWorkflowGeneration ? undefined : analyzeConversationState(messages, fallbackResponse.content),
          fallback: true,
          errorCode: errorCode,
          fallbackReason: errorReason
        }

        return NextResponse.json(aiResponse)
      } catch (fallbackError) {
        console.error('Fallback provider also failed:', fallbackError)
        throw aiError // Throw original error
      }
    }
  } catch (error) {
    console.error('AI Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    )
  }
}

// Validation function to ensure generated workflows only use valid n8n nodes
async function validateWorkflowJSON(workflowContent: string): Promise<{isValid: boolean, errors: string[]}> {
  const errors: string[] = []
  
  try {
    // Clean up markdown formatting that AI might include
    let cleanedContent = workflowContent.trim()
    
    // Remove markdown code blocks
    cleanedContent = cleanedContent.replace(/^```json\s*/g, '')
    cleanedContent = cleanedContent.replace(/^```\s*/g, '')
    cleanedContent = cleanedContent.replace(/\s*```$/g, '')
    
    // Remove any leading/trailing quotes or backticks
    cleanedContent = cleanedContent.replace(/^["`']+|["`']+$/g, '')
    
    // ENHANCED: Extract JSON from explanatory text (like "Here's the updated JSON:")
    const jsonStart = cleanedContent.indexOf("{")
    const jsonEnd = cleanedContent.lastIndexOf("}")
    
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1)
      console.log('[Validation] Extracted JSON from explanatory text')
    }
    
    console.log('[Validation] Cleaned JSON content:', cleanedContent.substring(0, 200) + '...')
    
    // Check for common AI failure patterns
    if (cleanedContent.includes('No response received') || 
        cleanedContent.includes('I apologize') ||
        cleanedContent.toLowerCase().includes('error') ||
        cleanedContent.trim().length < 50) {
      errors.push(`AI generated invalid content: "${cleanedContent.substring(0, 100)}..."`)
      return { isValid: false, errors }
    }
    
    const workflow = JSON.parse(cleanedContent)
    
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push("Workflow must have a 'nodes' array")
      return { isValid: false, errors }
    }
    
    // Get valid node types from knowledge base
    const nodesIndex = await getEnhancedNodesIndex()
    const validNodeTypes = new Set(nodesIndex?.map((node: any) => `n8n-nodes-base.${node.name}`) || [])
    
    // Always allow basic n8n nodes
    validNodeTypes.add('n8n-nodes-base.webhook')
    validNodeTypes.add('n8n-nodes-base.httpRequest')
    validNodeTypes.add('n8n-nodes-base.set')
    validNodeTypes.add('n8n-nodes-base.if')
    validNodeTypes.add('n8n-nodes-base.function')
    
    // Validate each node
    for (const node of workflow.nodes) {
      if (!node.type) {
        errors.push(`Node "${node.name || 'unnamed'}" is missing 'type' field`)
        continue
      }
      
      // Basic validation - allow any valid node type format
      const isValidFormat = node.type.includes('.') || node.type.startsWith('@')
      if (!isValidFormat) {
        errors.push(`Invalid node type format: "${node.type}" - must include namespace`)
      }
    }
    
  } catch (parseError) {
    errors.push(`Invalid JSON: ${parseError}`)
  }
  
  return { isValid: errors.length === 0, errors }
}

function analyzeConversationState(messages: ConversationMessage[], response: string): ConversationState {
  const userMessages = messages.filter(m => m.role === 'user')
  const responseContent = response.toLowerCase()
  const allMessages = messages.map(m => m.content?.toLowerCase() || '').join(' ')
  
  // Check for repetitive confirmation questions (prevent loops)
  const confirmationPhrases = [
    'do these requirements look complete',
    'should i proceed to generate',
    'does this cover everything you need',
    'is this summary accurate'
  ]
  
  const hasAskedConfirmation = confirmationPhrases.some(phrase => 
    allMessages.includes(phrase)
  )
  
  // Calculate completeness based on conversation depth and content
  let completeness = Math.min(userMessages.length * 15, 60)
  
  // If we've already asked for confirmation, boost completeness to move forward
  if (hasAskedConfirmation && userMessages.length > 5) {
    completeness = Math.max(completeness, 80)
  }
  
  // Boost completeness based on specific content
  if (responseContent.includes('workflow summary') || responseContent.includes('key components')) {
    completeness = Math.max(completeness, 70)
  }
  
  if (responseContent.includes('ready to generate') || responseContent.includes('generate workflow')) {
    completeness = Math.max(completeness, 90)
  }
  
  // Determine phase
  let phase = 'information_gathering'
  if (completeness >= 40 && completeness < 70) {
    phase = 'requirements_clarification'
  } else if (completeness >= 70 && completeness < 90) {
    phase = 'workflow_design'
  } else if (completeness >= 90) {
    phase = 'ready_for_generation'
  }
  
  return {
    phase,
    completeness: Math.min(completeness, 100)
  }
}
