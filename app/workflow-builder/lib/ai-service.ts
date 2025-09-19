// This file should ONLY be used server-side
// Client-side components should interact through API routes only

// Prevent any client-side usage
if (typeof window !== 'undefined') {
  throw new Error('AIService module should not be imported on client-side. Use API routes instead.')
}

// Lazy import to prevent client-side bundling
let database: any = null
const getDatabase = async () => {
  if (!database) {
    const { database: db } = await import('@/lib/database')
    database = db()
  }
  return database
}

interface AIProvider {
  name: string
  apiKey: string
  baseUrl?: string
  models: string[]
  isActive: boolean
}

interface RateLimitInfo {
  count: number
  resetTime: number
}

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

interface Conversation {
  messages: ConversationMessage[]
  createdAt: Date
}

interface AIResponse {
  content: string
  error?: string
}

interface ApiKeyRow {
  provider: 'openai' | 'claude'
  encrypted_key: string | null
}

class AIService {
  private providers: AIProvider[] = []
  private rateLimits = new Map<string, RateLimitInfo>()
  private conversations = new Map<string, Conversation>()
  private initializationPromise: Promise<void> | null = null

  constructor() {
    // Only initialize providers on server-side
    if (typeof window === 'undefined') {
      this.initializationPromise = this.initializeProviders()
    }
  }

  private async initializeProviders() {
    try {
      // Only initialize on server-side
      if (typeof window !== 'undefined') {
        console.log('Skipping provider initialization on client-side')
        return
      }

      const db = await getDatabase()
      
      // Load API keys from api_keys table instead of ai_providers
      const result = await db.query(
        'SELECT provider, encrypted_key FROM api_keys WHERE user_id = $1',
        ['00000000-0000-0000-0000-000000000001']
      )

      // Initialize providers with loaded API keys
      this.providers = []
      
      // Create provider configs
      const providerConfigs = {
        openai: {
          name: 'openai',
          baseUrl: 'https://api.openai.com/v1',
          models: ['gpt-4o', 'gpt-4o-mini'],
          isActive: true
        },
        claude: {
          name: 'claude', 
          baseUrl: 'https://api.anthropic.com',
          models: ['claude-3-7-sonnet-20250219'],
          isActive: true
        }
      }

      // Map database results to providers
      result.rows.forEach((row: ApiKeyRow) => {
        const config = providerConfigs[row.provider]
        if (config && row.encrypted_key) {
          this.providers.push({
            ...config,
            apiKey: row.encrypted_key
          })
        }
      })

      // Fallback to environment variables for missing providers
      if (!this.providers.find(p => p.name === 'openai')) {
        const openaiKey = process.env.OPENAI_API_KEY
        if (openaiKey) {
          this.providers.push({
            ...providerConfigs.openai,
            apiKey: openaiKey
          })
        }
      }

      if (!this.providers.find(p => p.name === 'claude')) {
        const claudeKey = process.env.ANTHROPIC_API_KEY
        if (claudeKey) {
          this.providers.push({
            ...providerConfigs.claude,
            apiKey: claudeKey
          })
        }
      }

      console.log('Initialized AI providers from database:', this.providers.map(p => ({ 
        name: p.name, 
        models: p.models,
        hasKey: !!p.apiKey 
      })))
    } catch (error) {
      console.error('Failed to load AI providers from database:', error)
      // Fallback to environment variables only
      this.providers = [
        {
          name: 'claude',
          apiKey: process.env.ANTHROPIC_API_KEY || '',
          baseUrl: 'https://api.anthropic.com',
          models: ['claude-3-sonnet-20240229'],
          isActive: true
        },
        {
          name: 'openai',
          apiKey: process.env.OPENAI_API_KEY || '',
          baseUrl: 'https://api.openai.com/v1',
          models: ['gpt-4o', 'gpt-4o-mini'],
          isActive: true
        }
      ]
    }
  }

  async addProvider(provider: Omit<AIProvider, 'isActive'>): Promise<void> {
    try {
      const db = await getDatabase()
      const result = await db.query(
        'INSERT INTO ai_providers (name, api_key, base_url, models, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [provider.name, provider.apiKey, provider.baseUrl, JSON.stringify(provider.models), true]
      )
      this.providers.push({ ...provider, isActive: true })
    } catch (error) {
      console.error('Failed to add AI provider:', error)
      throw error
    }
  }

  async removeProvider(name: string): Promise<void> {
    try {
      const db = await getDatabase()
      await db.query('DELETE FROM ai_providers WHERE name = $1', [name])
      this.providers = this.providers.filter(p => p.name !== name)
    } catch (error) {
      console.error('Failed to remove AI provider:', error)
      throw error
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise
      this.initializationPromise = null
    }
  }

  getProviders(): AIProvider[] {
    return this.providers.filter(p => p.isActive)
  }

  async chat(messages: ConversationMessage[], provider?: string): Promise<{ content: string, provider: string }> {
    await this.ensureInitialized()
    
    // If no specific provider requested, try all available providers with OpenAI first
    if (!provider) {
      const availableProviders = this.providers.filter(p => p.isActive && p.apiKey)
      
      // Sort to prioritize OpenAI for reliability
      availableProviders.sort((a, b) => {
        if (a.name === 'openai') return -1
        if (b.name === 'openai') return 1
        return 0
      })
      
      for (const p of availableProviders) {
        try {
          console.log(`Attempting chat with ${p.name}`)
          if (p.name === 'openai') {
            return await this.chatWithOpenAI(messages, p)
          } else if (p.name === 'claude') {
            return await this.chatWithClaude(messages, p)
          }
        } catch (error) {
          console.error(`Chat error with ${p.name}:`, error)
          console.log(`AI service error:`, error)
          // Continue to next provider
          continue
        }
      }
      
      throw new Error('All AI providers are currently unavailable')
    }
    
    // Specific provider requested
    const selectedProvider = this.providers.find(p => p.name === provider && p.isActive)

    if (!selectedProvider) {
      throw new Error(`Provider ${provider} not available`)
    }

    if (!selectedProvider.apiKey) {
      throw new Error(`API key not configured for ${selectedProvider.name}`)
    }

    try {
      if (selectedProvider.name === 'openai') {
        return await this.chatWithOpenAI(messages, selectedProvider)
      } else if (selectedProvider.name === 'claude') {
        return await this.chatWithClaude(messages, selectedProvider)
      } else {
        throw new Error(`Unsupported provider: ${selectedProvider.name}`)
      }
    } catch (error) {
      console.error(`Chat error with ${selectedProvider.name}:`, error)
      throw error
    }
  }

  private async chatWithOpenAI(messages: ConversationMessage[], provider: AIProvider): Promise<{ content: string, provider: string }> {
    // Detect if this is workflow generation by checking system message content
    const systemMessage = messages.find(msg => msg.role === 'system')
    const isWorkflowGeneration = systemMessage?.content.includes('n8n workflow JSON generator') || 
                                systemMessage?.content.includes('Output ONLY valid JSON')
    
    const requestBody: any = {
      model: isWorkflowGeneration ? 'gpt-4o' : (provider.models[0] || 'gpt-4o-mini'),
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: isWorkflowGeneration ? 0.2 : 0.7,
      max_tokens: isWorkflowGeneration ? 8000 : 4000,
    }
    
    // Add JSON response format for workflow generation
    if (isWorkflowGeneration) {
      requestBody.response_format = { type: 'json_object' }
    }
    
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    
    // Enhanced error handling for empty responses
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error('OpenAI API returned unexpected response format:', JSON.stringify(data, null, 2))
      throw new Error(`OpenAI API returned empty or malformed response. Response structure: ${JSON.stringify(data, null, 2)}`)
    }
    
    const content = data.choices[0].message.content.trim()
    if (!content) {
      throw new Error('OpenAI API returned empty content')
    }
    
    return {
      content: content,
      provider: provider.name
    }
  }

  private async chatWithClaude(messages: ConversationMessage[], provider: AIProvider): Promise<{ content: string, provider: string }> {
    const systemMessage = messages.find(msg => msg.role === 'system')
    const conversationMessages = messages.filter(msg => msg.role !== 'system')

    const response = await fetch(`${provider.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': provider.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: provider.models[0] || 'claude-3-5-sonnet-20250320',
        max_tokens: 4000,
        system: systemMessage?.content || '',
        messages: conversationMessages.map(msg => ({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        })),
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Claude API error: ${error.error?.message || response.statusText}`)
    }

    const data = await response.json()
    
    // Enhanced error handling for empty responses
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Claude API returned unexpected response format:', JSON.stringify(data, null, 2))
      throw new Error(`Claude API returned empty or malformed response. Response structure: ${JSON.stringify(data, null, 2)}`)
    }
    
    const content = data.content[0].text.trim()
    if (!content) {
      throw new Error('Claude API returned empty content')
    }
    
    return {
      content: content,
      provider: provider.name
    }
  }
}

// Only export instance for server-side use
let aiServiceInstance: AIService | null = null

export function getAIService(): AIService {
  if (typeof window !== 'undefined') {
    throw new Error('AIService should not be used on client-side. Use API routes instead.')
  }

  if (!aiServiceInstance) {
    aiServiceInstance = new AIService()
  }
  return aiServiceInstance
}

// Legacy export for backward compatibility - will throw error on client-side
export const aiService = new Proxy({} as AIService, {
  get() {
    if (typeof window !== 'undefined') {
      throw new Error('AIService should not be used on client-side. Use API routes instead.')
    }
    return getAIService()
  }
})