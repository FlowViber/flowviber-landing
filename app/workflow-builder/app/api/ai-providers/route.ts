import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Return available AI providers with their configurations
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
        models: ['claude-3-7-sonnet-20250219'],
        isActive: true
      }
    ]

    return NextResponse.json(providers)
  } catch (error) {
    console.error('Error fetching AI providers:', error)
    return NextResponse.json({ error: 'Failed to fetch AI providers' }, { status: 500 })
  }
}