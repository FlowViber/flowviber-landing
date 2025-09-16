import { type NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { database } = await import('@/lib/database')
    const db = database()
    const result = await db.query('SELECT * FROM workflows WHERE id = $1', [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    const workflow = {
      ...result.rows[0],
      chat_history: result.rows[0].chat_history || [],
      workflow_json: result.rows[0].workflow_json || null
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Failed to fetch workflow:', error)
    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const updates = await request.json()
    const { database } = await import('@/lib/database')
    const db = database()

    if (updates.chat_history !== undefined) {
      await db.query(
        'UPDATE workflows SET chat_history = $1, updated_at = NOW() WHERE id = $2',
        [JSON.stringify(updates.chat_history), id]
      )
    }

    if (updates.workflow_json !== undefined && updates.status !== undefined) {
      await db.query(
        'UPDATE workflows SET workflow_json = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [JSON.stringify(updates.workflow_json), updates.status, id]
      )
    } else if (updates.status !== undefined) {
      await db.query(
        'UPDATE workflows SET status = $1, updated_at = NOW() WHERE id = $2',
        [updates.status, id]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update workflow:', error)
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { database } = await import('@/lib/database')
    const db = database()
    
    // Delete the workflow from the database
    const result = await db.query('DELETE FROM workflows WHERE id = $1', [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete workflow:', error)
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 })
  }
}