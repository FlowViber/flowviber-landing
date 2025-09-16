import { NextRequest, NextResponse } from 'next/server'
import { database } from '../../../lib/shared/database'
import * as crypto from 'crypto'

// Decrypt API keys (matching the encryption from api-keys route)
function decrypt(text: string): string {
  try {
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
    console.error('Decryption error:', error)
    return ''
  }
}

// Check for API keys in database
async function getApiKeys(): Promise<{openai?: string, claude?: string}> {
  try {
    const db = database()
    const result = await db.query(
      'SELECT provider, encrypted_key FROM api_keys WHERE user_id = $1',
      ['00000000-0000-0000-0000-000000000001']
    )
    
    const keys: {openai?: string, claude?: string} = {}
    result.rows.forEach(row => {
      if (row.provider === 'openai' || row.provider === 'claude') {
        keys[row.provider as 'openai' | 'claude'] = decrypt(row.encrypted_key)
      }
    })
    
    return keys
  } catch (error) {
    console.error('[v0] AI Chat API: Error fetching API keys:', error)
    return {}
  }
}

// Make actual API call to OpenAI
async function callOpenAI(messages: any[], apiKey: string, isWorkflowGeneration: boolean = false): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: isWorkflowGeneration ? 'gpt-4o' : 'gpt-4o-mini',
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: isWorkflowGeneration ? 0.2 : 0.7,
      max_tokens: isWorkflowGeneration ? 8000 : 4000,
      ...(isWorkflowGeneration && { response_format: { type: 'json_object' } })
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || 'No response generated'
}

// Make actual API call to Claude
async function callClaude(messages: any[], apiKey: string, isWorkflowGeneration: boolean = false): Promise<string> {
  console.log('[v0] AI Chat API: Calling Claude with', messages.length, 'messages')
  
  // Separate system messages from user/assistant messages for Claude API
  const systemMessages = messages.filter(msg => msg.role === 'system')
  const conversationMessages = messages.filter(msg => msg.role !== 'system')
  
  // Combine system messages into a single system parameter
  const systemContent = systemMessages.map(msg => msg.content).join('\n\n')
  
  const requestBody: any = {
    model: 'claude-3-7-sonnet-20250219',
    max_tokens: isWorkflowGeneration ? 8000 : 4000,
    messages: conversationMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  }
  
  // Add system parameter if we have system content
  if (systemContent) {
    requestBody.system = systemContent
  }
  
  console.log('[v0] AI Chat API: Claude request body:', JSON.stringify(requestBody, null, 2))
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Claude API error: ${error.error?.message || response.statusText}`)
  }

  const data = await response.json()
  return data.content[0]?.text || 'No response generated'
}

// Create AI response with proper API key checking
async function createAIResponse(messages: any[], provider: string = 'openai', isWorkflowGeneration: boolean = false): Promise<any> {
  console.log('[v0] AI Chat API: Processing', messages.length, 'messages with provider:', provider)
  
  // Get API keys from database
  const apiKeys = await getApiKeys()
  
  // Check if requested provider has API key
  if (provider === 'openai' && !apiKeys.openai) {
    return {
      error: 'OPENAI_KEY_MISSING',
      content: "⚠️ OpenAI API key is not configured. Please set up your OpenAI API key in the API Keys section to use AI features.",
      showKeySetup: true,
      provider: 'openai'
    }
  }
  
  if (provider === 'claude' && !apiKeys.claude) {
    return {
      error: 'CLAUDE_KEY_MISSING', 
      content: "⚠️ Claude API key is not configured. Please set up your Claude API key in the API Keys section to use AI features.",
      showKeySetup: true,
      provider: 'claude'
    }
  }
  
  // If no API keys are available at all
  if (!apiKeys.openai && !apiKeys.claude) {
    return {
      error: 'NO_API_KEYS',
      content: "⚠️ No AI API keys are configured. Please set up either OpenAI or Claude API keys in the API Keys section to use the conversational builder.",
      showKeySetup: true,
      provider: provider
    }
  }
  
  // Try to use the requested provider, fall back to available one
  let actualProvider = provider
  let apiKey = apiKeys[provider as 'openai' | 'claude']
  
  if (!apiKey) {
    // Fall back to available provider
    if (apiKeys.openai) {
      actualProvider = 'openai'
      apiKey = apiKeys.openai
    } else if (apiKeys.claude) {
      actualProvider = 'claude' 
      apiKey = apiKeys.claude
    }
  }
  
  if (!apiKey) {
    throw new Error('No valid API key found')
  }
  
  // First attempt with requested provider
  try {
    let content: string
    
    if (actualProvider === 'openai') {
      content = await callOpenAI(messages, apiKey, isWorkflowGeneration)
    } else if (actualProvider === 'claude') {
      content = await callClaude(messages, apiKey, isWorkflowGeneration)
    } else {
      throw new Error(`Unsupported provider: ${actualProvider}`)
    }
    
    console.log('[v0] AI Chat API: Generated response:', content.substring(0, 100) + '...')
    
    return {
      content,
      provider: actualProvider,
      model: actualProvider === 'claude' ? 'claude-3-7-sonnet-20250219' : (isWorkflowGeneration ? 'gpt-4o' : 'gpt-4o-mini'),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(`[v0] AI Chat API: Error with ${actualProvider}:`, error)
    
    // Try fallback to other provider if available
    let fallbackProvider = null
    let fallbackKey = null
    
    if (actualProvider === 'claude' && apiKeys.openai) {
      fallbackProvider = 'openai'
      fallbackKey = apiKeys.openai
    } else if (actualProvider === 'openai' && apiKeys.claude) {
      fallbackProvider = 'claude'
      fallbackKey = apiKeys.claude
    }
    
    if (fallbackProvider && fallbackKey) {
      console.log(`[v0] AI Chat API: Attempting fallback to ${fallbackProvider}`)
      try {
        let fallbackContent: string
        
        if (fallbackProvider === 'openai') {
          fallbackContent = await callOpenAI(messages, fallbackKey, isWorkflowGeneration)
        } else {
          fallbackContent = await callClaude(messages, fallbackKey, isWorkflowGeneration)
        }
        
        console.log('[v0] AI Chat API: Fallback successful:', fallbackContent.substring(0, 100) + '...')
        
        return {
          content: fallbackContent,
          provider: fallbackProvider,
          model: fallbackProvider === 'claude' ? 'claude-3-7-sonnet-20250219' : (isWorkflowGeneration ? 'gpt-4o' : 'gpt-4o-mini'),
          timestamp: new Date().toISOString(),
          fallback: true,
          originalProvider: actualProvider,
          fallbackReason: error instanceof Error ? error.message : 'Unknown error'
        }
      } catch (fallbackError) {
        console.error(`[v0] AI Chat API: Fallback to ${fallbackProvider} also failed:`, fallbackError)
        // Fall through to error handling below
      }
    }
    
    // Return proper error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return {
          error: 'INVALID_API_KEY',
          content: `⚠️ ${actualProvider === 'openai' ? 'OpenAI' : 'Claude'} API key appears to be invalid. Please check your API key configuration.`,
          showKeySetup: true,
          provider: actualProvider
        }
      } else if (error.message.includes('quota') || error.message.includes('billing')) {
        return {
          error: 'QUOTA_EXCEEDED',
          content: `⚠️ ${actualProvider === 'openai' ? 'OpenAI' : 'Claude'} API quota exceeded. Please check your billing and usage limits.`,
          provider: actualProvider
        }
      } else if (error.message.includes('rate limit')) {
        return {
          error: 'RATE_LIMITED',
          content: `⚠️ ${actualProvider === 'openai' ? 'OpenAI' : 'Claude'} API rate limit exceeded. Please try again in a moment.`,
          provider: actualProvider
        }
      } else if (error.message.includes('model')) {
        return {
          error: 'MODEL_ERROR',
          content: `⚠️ Error communicating with ${actualProvider === 'openai' ? 'OpenAI' : 'Claude'}. Please try again or switch to a different AI provider.`,
          provider: actualProvider
        }
      }
    }
    
    return {
      error: 'API_ERROR',
      content: `⚠️ Error communicating with ${actualProvider === 'openai' ? 'OpenAI' : 'Claude'}. Please try again or switch to a different AI provider.`,
      provider: actualProvider,
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] AI Chat API: Received chat request')
    const { messages, conversationState, isWorkflowGeneration, provider } = await request.json()
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 })
    }
    
    console.log('[v0] AI Chat API: Request details:', {
      messageCount: messages.length,
      isWorkflowGeneration,
      provider: provider || 'default'
    })
    
    // Handle workflow generation requests differently
    if (isWorkflowGeneration) {
      console.log('[v0] AI Chat API: Handling workflow generation request')
      
      // Check for API keys first
      const apiKeys = await getApiKeys()
      if (!apiKeys.openai && !apiKeys.claude) {
        return NextResponse.json({
          error: 'NO_API_KEYS',
          content: "⚠️ No AI API keys are configured. Please set up either OpenAI or Claude API keys to generate workflows.",
          showKeySetup: true
        }, { status: 400 })
      }
      
      try {
        // Import the workflow generation prompt
        const { getWorkflowGenerationPrompt } = await import('../../workflow-builder/lib/prompt')
        
        // Generate workflow generation prompt
        const workflowPrompt = await getWorkflowGenerationPrompt()
        
        // Create workflow generation messages using conversation history
        const workflowMessages = [
          { role: 'system', content: workflowPrompt },
          ...messages, // Use FULL conversation for context - critical for regeneration!
          { 
            role: 'user', 
            content: `Based on our conversation above, generate a complete n8n workflow JSON that implements the automation we discussed. Output ONLY valid JSON, no explanations or markdown.` 
          }
        ]
        
        console.log('[v0] AI Chat API: Generating workflow with AI using', workflowMessages.length, 'messages')
        
        // Use the AI to generate the workflow
        const aiResponse = await createAIResponse(workflowMessages, provider || 'openai', true)
        
        if (aiResponse.error) {
          return NextResponse.json(aiResponse, { status: 400 })
        }
        
        // Clean up the response to extract JSON
        let workflowContent = aiResponse.content.trim()
        
        // Remove markdown formatting if present
        workflowContent = workflowContent.replace(/```(?:json)?\s*/g, '').replace(/\s*```/g, '')
        
        // Try to parse as JSON to validate
        let workflowJson
        try {
          workflowJson = JSON.parse(workflowContent)
        } catch (parseError) {
          console.error('[v0] AI Chat API: Failed to parse workflow JSON:', parseError)
          
          // Try fallback to other provider if available
          const apiKeys = await getApiKeys()
          const fallbackProvider = provider === 'openai' && apiKeys.claude ? 'claude' : 
                                 provider === 'claude' && apiKeys.openai ? 'openai' : null
          
          if (fallbackProvider) {
            console.log(`[v0] AI Chat API: Attempting workflow generation fallback to ${fallbackProvider}`)
            try {
              const fallbackResponse = await createAIResponse(workflowMessages, fallbackProvider, true)
              if (!fallbackResponse.error) {
                let fallbackContent = fallbackResponse.content.trim()
                fallbackContent = fallbackContent.replace(/```(?:json)?\s*/g, '').replace(/\s*```/g, '')
                const fallbackJson = JSON.parse(fallbackContent)
                
                console.log('[v0] AI Chat API: Fallback workflow generation successful')
                return NextResponse.json({
                  content: JSON.stringify(fallbackJson, null, 2),
                  provider: fallbackResponse.provider,
                  model: fallbackResponse.model,
                  timestamp: fallbackResponse.timestamp,
                  fallback: true,
                  originalProvider: provider,
                  workflowGenerated: true
                })
              }
            } catch (fallbackError) {
              console.error('[v0] AI Chat API: Fallback workflow generation also failed:', fallbackError)
            }
          }
          
          return NextResponse.json({
            error: 'INVALID_WORKFLOW',
            content: "Failed to generate valid workflow JSON. Please try again.",
          }, { status: 500 })
        }
        
        console.log('[v0] AI Chat API: Successfully generated workflow:', workflowJson.name || 'Unnamed Workflow')
        
        return NextResponse.json({
          content: JSON.stringify(workflowJson, null, 2),
          provider: aiResponse.provider,
          model: aiResponse.model,
          timestamp: aiResponse.timestamp,
          fallback: aiResponse.fallback,
          workflowGenerated: true
        })
        
      } catch (error) {
        console.error('[v0] AI Chat API: Workflow generation failed:', error)
        return NextResponse.json({
          error: 'GENERATION_FAILED',
          content: "Failed to generate workflow. Please try again.",
        }, { status: 500 })
      }
    }
    
    // For regular conversation (not workflow generation)
    try {
      // Import the conversation prompt
      const { getEnhancedSystemPrompt } = await import('../../workflow-builder/lib/prompt')
      
      // Generate the enhanced system prompt based on user query
      const lastUserMessage = messages[messages.length - 1]?.content || ''
      const systemPrompt = getEnhancedSystemPrompt(lastUserMessage)
      
      // Create conversation messages
      const conversationMessages = [
        { role: 'system', content: systemPrompt },
        ...messages
      ]
      
      console.log('[v0] AI Chat API: Processing conversation with', conversationMessages.length, 'messages')
      
      // Generate AI response for conversation
      const aiResponse = await createAIResponse(conversationMessages, provider || 'openai', false)
      
      if (aiResponse.error) {
        return NextResponse.json(aiResponse, { status: 400 })
      }
      
      // Analyze the AI response to determine conversation state
      const responseText = aiResponse.content.toLowerCase()
      let conversationState = null
      
      // Check if AI is indicating readiness for workflow generation
      const readyIndicators = [
        'generate workflow',
        'click the generate',
        'ready to generate',
        'proceed with generation',
        'let\'s generate',
        'create the workflow',
        'build the workflow',
        'ready to create',
        'ready to build'
      ]
      
      const isReadyForGeneration = readyIndicators.some(indicator => 
        responseText.includes(indicator)
      )
      
      console.log('[v0] AI Chat API: Checking for ready indicators in response:', {
        responseText: responseText.substring(0, 200) + '...',
        foundIndicators: readyIndicators.filter(indicator => responseText.includes(indicator)),
        isReadyForGeneration
      })
      
      if (isReadyForGeneration) {
        conversationState = {
          phase: "ready_for_generation",
          completeness: 90
        }
        console.log('[v0] AI Chat API: Detected ready for generation state')
      } else {
        // Estimate completeness based on conversation length and content
        const messageCount = messages.length
        let completeness = Math.min(messageCount * 10, 70) // Base on message count
        
        // Look for key workflow elements in conversation
        const workflowElements = [
          'trigger', 'schedule', 'webhook', 'email', 'api', 'database',
          'automation', 'integration', 'notification', 'data', 'process'
        ]
        
        const elementsFound = workflowElements.filter(element =>
          messages.some(msg => msg.content.toLowerCase().includes(element))
        ).length
        
        completeness += elementsFound * 5 // Add 5% per element
        completeness = Math.min(completeness, 75) // Cap at 75% unless ready
        
        conversationState = {
          phase: completeness < 40 ? "information_gathering" : 
                 completeness < 70 ? "requirements_clarification" : "workflow_design",
          completeness: Math.round(completeness)
        }
      }
      
      console.log('[v0] AI Chat API: Successfully generated conversation response with state:', conversationState)
      return NextResponse.json({
        ...aiResponse,
        conversationState
      })
      
    } catch (error) {
      console.error('[v0] AI Chat API: Conversation processing failed:', error)
      return NextResponse.json({
        error: 'CONVERSATION_FAILED',
        content: "Failed to process conversation. Please try again.",
      }, { status: 500 })
    }
  } catch (error) {
    console.error('[v0] AI Chat API: Request processing failed:', error)
    return NextResponse.json({
      error: 'REQUEST_FAILED',
      content: 'Failed to process request. Please try again.',
    }, { status: 500 })
  }
}