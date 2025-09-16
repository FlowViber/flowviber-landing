import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/shared/auth-config'
import { database } from '../../../lib/shared/database'

export async function GET() {
  try {
    console.log('[v0] Main API: Fetching workflows')
    const db = database()
    const result = await db.query(
      'SELECT * FROM workflows ORDER BY updated_at DESC'
    )

    const workflows = result.rows.map(row => ({
      ...row,
      chat_history: row.chat_history || [],
      workflow_json: row.workflow_json || null
    }))

    console.log('[v0] Main API: Returning', workflows.length, 'workflows')
    return NextResponse.json({ workflows })
  } catch (error) {
    console.error('[v0] Main API: Failed to fetch workflows:', error)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Main API: Creating new workflow')
    const { name, description } = await request.json()
    
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Workflow name is required' }, { status: 400 })
    }

    const db = database()
    const result = await db.query(
      'INSERT INTO workflows (name, description, chat_history, status, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *',
      [name.trim(), description?.trim() || '', JSON.stringify([]), 'draft']
    )

    if (result.rows.length === 0) {
      console.error('[v0] Main API: Failed to create workflow - no rows returned')
      return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
    }

    const workflow = {
      ...result.rows[0],
      chat_history: result.rows[0].chat_history || [],
      workflow_json: result.rows[0].workflow_json || null
    }

    console.log('[v0] Main API: Successfully created workflow:', workflow.id)
    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('[v0] Main API: Failed to create workflow:', error)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}