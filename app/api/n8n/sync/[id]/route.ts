import { type NextRequest, NextResponse } from "next/server"
import n8nApi from "@/lib/shared/n8n-api"

async function getDatabase() {
  const { database } = await import('@/lib/shared/database')
  return database()
}

async function ensureDefaultUser() {
  const defaultUserId = "00000000-0000-0000-0000-000000000001"
  const defaultEmail = "default@flowviber.local"

  try {
    const db = await getDatabase()

    // Check if default user exists in our profiles table
    const result = await db.query('SELECT id FROM profiles WHERE id = $1', [defaultUserId])

    if (result.rows.length > 0) {
      console.log("[v0] Sync API: Default user found in database")
      return defaultUserId
    }

    // Create default user profile if not exists
    await db.query(
      'INSERT INTO profiles (id, email, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (id) DO NOTHING',
      [defaultUserId, defaultEmail]
    )

    console.log("[v0] Sync API: Default user created in database")
    return defaultUserId
  } catch (error) {
    console.error("[v0] Sync API: Error with default user:", error)
    return defaultUserId // Return default ID even if there's an error
  }
}

async function getUserId(): Promise<string> {
  // Use default user - no auth system
  const defaultUserId = await ensureDefaultUser()
  console.log("[v0] Sync API: Using default user ID:", defaultUserId)
  return defaultUserId
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: workflowId } = await params

    console.log("[v0] Sync API: Syncing workflow from n8n:", workflowId)

    if (!workflowId) {
      return NextResponse.json({ error: "Workflow ID is required" }, { status: 400 })
    }

    const db = await getDatabase()

    // Get the n8n workflow ID from the database
    const result = await db.query(
      'SELECT n8n_workflow_id FROM workflows WHERE id = $1',
      [workflowId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
    }

    const n8nWorkflowId = result.rows[0].n8n_workflow_id

    if (!n8nWorkflowId) {
      return NextResponse.json({ error: "Workflow not deployed to n8n yet" }, { status: 400 })
    }

    const userId = await getUserId()

    // Sync from n8n
    const syncedWorkflow = await n8nApi.syncWorkflowFromN8n(n8nWorkflowId, userId)

    // Update the workflow in our database
    await db.query(
      `UPDATE workflows 
       SET workflow_json = $1, status = $2, updated_at = $3, last_sync_at = $4
       WHERE id = $5`,
      [JSON.stringify(syncedWorkflow), "deployed", new Date().toISOString(), new Date().toISOString(), workflowId]
    )

    console.log("[v0] Sync API: Workflow synced successfully")

    return NextResponse.json({
      success: true,
      workflow: syncedWorkflow,
      message: "Workflow synced from n8n successfully",
    })
  } catch (error) {
    console.error("[v0] Sync API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync workflow" },
      { status: 500 },
    )
  }
}