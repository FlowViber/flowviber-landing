import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { database } = await import('@/lib/database')
    const db = database()
    const result = await db.query(
      'SELECT * FROM workflows ORDER BY updated_at DESC'
    )

    const workflows = result.rows.map(row => ({
      ...row,
      chat_history: row.chat_history || [],
      workflow_json: row.workflow_json || null
    }))

    return NextResponse.json({ workflows })
  } catch (error) {
    console.error('Failed to fetch workflows:', error)
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description } = await request.json()
    const { database } = await import('@/lib/database')
    const db = database()

    const result = await db.query(
      'INSERT INTO workflows (name, description, chat_history, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description || '', JSON.stringify([]), 'draft']
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
    }

    const workflow = {
      ...result.rows[0],
      chat_history: result.rows[0].chat_history || [],
      workflow_json: result.rows[0].workflow_json || null
    }

    return NextResponse.json({ workflow })
  } catch (error) {
    console.error('Failed to create workflow:', error)
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 })
  }
}