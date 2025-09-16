import { type NextRequest, NextResponse } from "next/server"
import n8nApi from "@/lib/shared/n8n-api"
import WorkflowStorage from "@/lib/workflow-storage"

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
      console.log("[v0] Deploy API: Default user found in database")
      return defaultUserId
    }

    // Create default user profile if not exists
    await db.query(
      'INSERT INTO profiles (id, email, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (id) DO NOTHING',
      [defaultUserId, defaultEmail]
    )

    console.log("[v0] Deploy API: Default user created in database")
    return defaultUserId
  } catch (error) {
    console.error("[v0] Deploy API: Error with default user:", error)
    return defaultUserId // Return default ID even if there's an error
  }
}

async function getUserId(): Promise<string> {
  // Use default user for now - no auth system
  const defaultUserId = await ensureDefaultUser()
  console.log("[v0] Deploy API: Using default user ID:", defaultUserId)
  return defaultUserId
}

// Removed Supabase client - using direct database connections

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] N8n Deploy API: Starting deployment...")
    const body = await request.json()
    const { workflowJson, workflowName, workflowId } = body

    if (!workflowJson || !workflowName) {
      return NextResponse.json({ error: "Missing workflow data or name" }, { status: 400 })
    }

    console.log("[v0] N8n Deploy API: Deploying workflow:", workflowName)

    const userId = await getUserId()
    const result = await n8nApi.deployWorkflow(workflowJson, workflowName, userId)

    console.log("[v0] N8n Deploy API: Deployment successful:", result.id)

    // Save deployment info to our database
    const db = await getDatabase()
    

    // Get workflow from our database
    let targetWorkflowId = workflowId
    
    if (!targetWorkflowId) {
      // If no workflowId provided, find by name
      const workflowResult = await db.query(
        'SELECT id FROM workflows WHERE name = $1',
        [workflowName]
      )
      if (workflowResult.rows.length > 0) {
        targetWorkflowId = workflowResult.rows[0].id
      }
    }

    if (targetWorkflowId) {

      // Update workflow with n8n deployment info and set status to deployed
      await db.query(
        'UPDATE workflows SET n8n_workflow_id = $1, deployed_at = NOW(), status = $2, updated_at = NOW() WHERE id = $3',
        [result.id, 'deployed', targetWorkflowId]
      )

      console.log("[v0] N8n Deploy API: Updated workflow", targetWorkflowId, "with n8n ID", result.id)
    }

    return NextResponse.json({
      success: true,
      n8nWorkflowId: result.id,
      message: `Workflow "${workflowName}" deployed successfully to n8n!`
    })
  } catch (error) {
    console.error("[v0] N8n Deploy API: Deployment failed:", error)

    let errorMessage = "Deployment failed"
    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}