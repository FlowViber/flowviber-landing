import { NextRequest, NextResponse } from 'next/server'
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/shared/auth-config'
import { database } from '../../../../lib/shared/database'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    console.log('[v0] Main API: Fetching workflow', params.id)
    const db = database()
    const result = await db.query(
      'SELECT * FROM workflows WHERE id = $1',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const workflow = {
      ...result.rows[0],
      chat_history: result.rows[0].chat_history || [],
      workflow_json: result.rows[0].workflow_json || null
    }

    console.log('[v0] Main API: Returning workflow', params.id)
    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('[v0] Main API: Failed to fetch workflow:', error)
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    console.log('[v0] Main API: Updating workflow', params.id)
    const data = await request.json()
    const db = database()

    const updates = []
    const values = []
    let paramCount = 1

    if (data.chat_history !== undefined) {
      updates.push(`chat_history = $${paramCount++}`)
      values.push(JSON.stringify(data.chat_history))
    }

    if (data.workflow_json !== undefined) {
      updates.push(`workflow_json = $${paramCount++}`)
      values.push(JSON.stringify(data.workflow_json))
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`)
      values.push(data.status)
    }

    if (data.n8n_workflow_id !== undefined) {
      updates.push(`n8n_workflow_id = $${paramCount++}`)
      values.push(data.n8n_workflow_id)
    }

    if (data.deployed_at !== undefined) {
      updates.push(`deployed_at = $${paramCount++}`)
      values.push(data.deployed_at)
    }

    if (data.last_sync_at !== undefined) {
      updates.push(`last_sync_at = $${paramCount++}`)
      values.push(data.last_sync_at)
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(params.id)

    const query = `UPDATE workflows SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`
    const result = await db.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const workflow = {
      ...result.rows[0],
      chat_history: result.rows[0].chat_history || [],
      workflow_json: result.rows[0].workflow_json || null
    }

    console.log('[v0] Main API: Successfully updated workflow', params.id)
    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('[v0] Main API: Failed to update workflow:', error)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    console.log('[v0] Main API: Force updating workflow', params.id)
    const data = await request.json()
    const db = database()

    if (data.chat_history !== undefined) {
      await db.query(
        'UPDATE workflows SET chat_history = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(data.chat_history), params.id]
      )
    }

    // Handle metadata updates
    if (data.n8n_workflow_id !== undefined || data.deployed_at !== undefined || data.last_sync_at !== undefined) {
      const updates = []
      const values = []
      let paramCount = 1

      if (data.n8n_workflow_id !== undefined) {
        updates.push(`n8n_workflow_id = $${paramCount++}`)
        values.push(data.n8n_workflow_id)
      }

      if (data.deployed_at !== undefined) {
        updates.push(`deployed_at = $${paramCount++}`)
        values.push(data.deployed_at)
      }

      if (data.last_sync_at !== undefined) {
        updates.push(`last_sync_at = $${paramCount++}`)
        values.push(data.last_sync_at)
      }

      updates.push(`updated_at = NOW()`)
      values.push(params.id)

      const query = `UPDATE workflows SET ${updates.join(', ')} WHERE id = $${paramCount}`
      await db.query(query, values)
    }

    console.log('[v0] Main API: Successfully force updated workflow', params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Main API: Failed to force update workflow:', error)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    console.log('[v0] Main API: Deleting workflow', params.id)
    const db = database()
    const result = await db.query(
      'DELETE FROM workflows WHERE id = $1 RETURNING id',
      [params.id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    console.log('[v0] Main API: Successfully deleted workflow', params.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Main API: Failed to delete workflow:', error)
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}