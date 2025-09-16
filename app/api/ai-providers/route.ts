import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('[v0] Main API: Fetching AI providers')
    
    // Return the default AI providers that the workflow builder expects
    const providers = [
      { 
        name: 'openai', 
        displayName: 'OpenAI (GPT-4)', 
        models: ['gpt-4o', 'gpt-4o-mini'], 
        isActive: true 
      },
      { 
        name: 'claude', 
        displayName: 'Claude (Anthropic)', 
        models: ['claude-3-5-sonnet-20250320'], 
        isActive: true 
      }
    ]

    console.log('[v0] Main API: Returning', providers.length, 'AI providers')
    return NextResponse.json(providers)
  } catch (error) {
    console.error('[v0] Main API: Failed to fetch AI providers:', error)
    return NextResponse.json({ error: 'Failed to fetch AI providers' }, { status: 500 })
  }
}