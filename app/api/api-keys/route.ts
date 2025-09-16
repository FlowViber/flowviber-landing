import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/shared/auth-config'
import { database } from '../../../lib/shared/database'
import * as crypto from 'crypto'

// For now, use a default user ID since we're not fully implementing user-specific configs
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"

// Simple encryption for API keys
function encrypt(text: string): string {
  const algorithm = 'aes-256-cbc'
  const key = crypto.scryptSync(process.env.NEXTAUTH_SECRET || 'default-secret', 'salt', 32)
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return iv.toString('hex') + ':' + encrypted
}

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

export async function GET() {
  try {
    console.log('[v0] Main API: Fetching API keys')
    const db = database()
    const result = await db.query(
      'SELECT provider, encrypted_key FROM api_keys WHERE user_id = $1',
      [DEFAULT_USER_ID]
    )

    console.log('[v0] Main API: Found', result.rows.length, 'API keys')
    return NextResponse.json({
      data: result.rows,
      defaultUserId: DEFAULT_USER_ID,
    })
  } catch (error) {
    console.error('[v0] Main API: Failed to fetch API keys:', error)
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }
}

// Test API key endpoint (PUT method)
export async function PUT(request: NextRequest) {
  try {
    console.log('[v0] Main API: Testing API key')
    const { provider, key } = await request.json()

    if (!provider || !key) {
      return NextResponse.json({ error: 'Provider and key are required' }, { status: 400 })
    }

    let isValid = false
    let errorMessage = ""

    // Validate the API key
    switch (provider) {
      case "openai":
        try {
          const response = await fetch("https://api.openai.com/v1/models", {
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": "application/json",
            },
          })
          isValid = response.ok
          if (!isValid) {
            const error = await response.json()
            errorMessage = error.error?.message || "Invalid OpenAI API key"
          }
        } catch (error) {
          errorMessage = "Failed to connect to OpenAI API"
        }
        break

      case "claude":
        try {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": key,
              "Content-Type": "application/json",
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-3-haiku-20240307",
              max_tokens: 1,
              messages: [{ role: "user", content: "test" }],
            }),
          })
          isValid = response.ok || response.status === 400 // 400 is expected for minimal test
          if (!isValid && response.status !== 400) {
            const error = await response.json()
            errorMessage = error.error?.message || "Invalid Claude API key"
          }
        } catch (error) {
          errorMessage = "Failed to connect to Claude API"
        }
        break

      case "n8n":
        // For n8n, basic validation since it's instance-specific
        isValid = key.length > 10
        if (!isValid) {
          errorMessage = "Invalid n8n API key format"
        }
        break

      default:
        errorMessage = "Unknown provider"
    }

    console.log('[v0] Main API: API key test result:', { provider, isValid, errorMessage })
    return NextResponse.json({
      isValid,
      error: isValid ? null : errorMessage,
    })
  } catch (error) {
    console.error('[v0] Main API: Failed to test API key:', error)
    return NextResponse.json({ error: 'Failed to test API key' }, { status: 500 })
  }
}

// Save API key endpoint (POST method)
export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Main API: Saving API key')
    const { provider, key } = await request.json()

    if (!provider || !key) {
      return NextResponse.json({ error: 'Provider and key are required' }, { status: 400 })
    }

    // Store the encrypted key
    const encryptedKey = encrypt(key)
    const db = database()
    
    await db.query(
      `INSERT INTO api_keys (user_id, provider, encrypted_key, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       ON CONFLICT (user_id, provider) 
       DO UPDATE SET encrypted_key = $3, updated_at = NOW()`,
      [DEFAULT_USER_ID, provider, encryptedKey]
    )

    console.log('[v0] Main API: Successfully stored API key for', provider)
    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[v0] Main API: Failed to save API key:', error)
    return NextResponse.json({ error: 'Failed to save API key' }, { status: 500 })
  }
}

// Delete API key endpoint (DELETE method)
export async function DELETE(request: NextRequest) {
  try {
    console.log('[v0] Main API: Deleting API key')
    const { provider } = await request.json()

    if (!provider) {
      return NextResponse.json({ error: 'Provider is required' }, { status: 400 })
    }

    const db = database()
    await db.query(
      'DELETE FROM api_keys WHERE user_id = $1 AND provider = $2',
      [DEFAULT_USER_ID, provider]
    )

    console.log('[v0] Main API: Successfully deleted API key for', provider)
    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('[v0] Main API: Failed to delete API key:', error)
    return NextResponse.json({ error: 'Failed to delete API key' }, { status: 500 })
  }
}