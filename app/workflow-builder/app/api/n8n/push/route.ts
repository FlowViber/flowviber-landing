import { type NextRequest, NextResponse } from "next/server"
import n8nApi from "@/lib/shared/n8n-api"
import { WorkflowStorage } from "@/lib/workflow-storage"

async function getDatabase() {
  const { database } = await import('@/lib/database')
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
      console.log("[v0] Push API: Default user found in database")
      return defaultUserId
    }

    // Create default user profile if not exists
    await db.query(
      'INSERT INTO profiles (id, email, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (id) DO NOTHING',
      [defaultUserId, defaultEmail]
    )
    
    console.log("[v0] Push API: Default user created in database")
    return defaultUserId
  } catch (error) {
    console.error("[v0] Push API: Error with default user:", error)
    return defaultUserId // Return default ID even if there's an error
  }
}

async function getUserId(): Promise<string> {
  // Use default user - no auth system
  const defaultUserId = await ensureDefaultUser()
  console.log("[v0] Push API: Using default user ID:", defaultUserId)
  return defaultUserId
}

export async function POST(request: NextRequest) {
  try {
    const { n8nWorkflowId, workflowJson, workflowName } = await request.json()

    if (!n8nWorkflowId || !workflowJson || !workflowName) {
      return NextResponse.json(
        { error: "Missing required fields: n8nWorkflowId, workflowJson, workflowName" },
        { status: 400 },
      )
    }

    console.log("[v0] Push API: Pushing workflow to n8n:", n8nWorkflowId)

    const userId = await getUserId()

    // Push to n8n
    const updatedWorkflow = await n8nApi.pushWorkflowToN8n(n8nWorkflowId, workflowJson, workflowName, userId)

    const workflowStorage = WorkflowStorage.getInstance()

    // Find the local workflow by n8n_workflow_id to get the local ID and update it
    const db = await getDatabase()
    
    const localWorkflowResult = await db.query(
      'SELECT id FROM workflows WHERE n8n_workflow_id = $1',
      [n8nWorkflowId]
    )

    if (localWorkflowResult.rows.length > 0) {
      const localWorkflowId = localWorkflowResult.rows[0].id
      
      await db.query(
        'UPDATE workflows SET workflow_json = $1, status = $2, updated_at = NOW() WHERE id = $3',
        [JSON.stringify(updatedWorkflow), 'deployed', localWorkflowId]
      )

      console.log("[v0] Push API: Local workflow updated authoritatively from n8n response")
    }

    console.log("[v0] Push API: Workflow pushed successfully")

    return NextResponse.json({
      success: true,
      workflow: updatedWorkflow,
      message: "Workflow pushed to n8n successfully",
    })
  } catch (error) {
    console.error("[v0] Push API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to push workflow" },
      { status: 500 },
    )
  }
}
