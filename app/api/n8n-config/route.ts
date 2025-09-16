import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/shared/auth-config'
import { database } from '../../../lib/shared/database'

// For now, use a default user ID since we're not fully implementing user-specific configs
const DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"

export async function GET() {
  try {
    console.log('[v0] Main API: Getting n8n configuration')
    const db = database()
    const result = await db.query(
      'SELECT n8n_instance_url FROM profiles WHERE id = $1',
      [DEFAULT_USER_ID]
    )

    const n8nInstanceUrl = result.rows[0]?.n8n_instance_url || null
    console.log('[v0] Main API: Retrieved n8n URL:', n8nInstanceUrl ? 'configured' : 'not configured')

    return NextResponse.json({
      status: 200,
      result: {
        n8nInstanceUrl,
      },
    })
  } catch (error) {
    console.error('[v0] Main API: Error getting n8n configuration:', error)
    return NextResponse.json({ error: 'Failed to get n8n configuration' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Main API: Saving n8n configuration')
    const { n8nInstanceUrl } = await request.json()
    
    if (!n8nInstanceUrl?.trim()) {
      return NextResponse.json({ error: 'n8n instance URL is required' }, { status: 400 })
    }

    const db = database()
    await db.query(
      `INSERT INTO profiles (id, n8n_instance_url, display_name, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       ON CONFLICT (id) 
       DO UPDATE SET n8n_instance_url = $2, updated_at = NOW()`,
      [DEFAULT_USER_ID, n8nInstanceUrl.trim(), 'Development User']
    )

    console.log('[v0] Main API: Successfully saved n8n configuration')

    return NextResponse.json({
      status: 200,
      result: {
        success: true,
      },
    })
  } catch (error) {
    console.error('[v0] Main API: Error saving n8n configuration:', error)
    return NextResponse.json({ error: 'Failed to save n8n configuration' }, { status: 500 })
  }
}