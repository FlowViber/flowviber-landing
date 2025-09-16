import { type NextRequest, NextResponse } from "next/server"
import n8nApi from "@/lib/shared/n8n-api"

function extractErrorMessage(execution: any): string {
  // Try multiple possible paths where n8n stores error information
  const possiblePaths = [
    execution.data?.resultData?.error,
    execution.data?.resultData?.error?.message,
    execution.data?.error,
    execution.data?.error?.message,
    execution.error,
    execution.error?.message,
    execution.lastNodeExecuted?.error,
    execution.data?.resultData?.runData?.[execution.lastNodeExecuted]?.[0]?.error,
    execution.data?.resultData?.lastNodeExecuted?.error,
  ]

  // Check for detailed node execution errors
  if (execution.data?.resultData?.runData) {
    const runData = execution.data.resultData.runData
    for (const nodeName in runData) {
      const nodeRuns = runData[nodeName]
      if (nodeRuns && nodeRuns.length > 0) {
        const nodeRun = nodeRuns[0]
        if (nodeRun.error) {
          const errorMsg = nodeRun.error.message || nodeRun.error
          if (errorMsg && typeof errorMsg === 'string') {
            return `Node "${nodeName}": ${errorMsg}`
          }
        }
      }
    }
  }

  // Check all possible paths
  for (const path of possiblePaths) {
    if (path && typeof path === 'string' && path.trim().length > 0) {
      return path.trim()
    }
  }

  // If still no error found, return a detailed fallback
  const status = execution.status || 'unknown'
  const lastNode = execution.lastNodeExecuted || 'unknown node'
  return `Execution ${status} at ${lastNode} - No detailed error message available`
}

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
      console.log("[v0] Errors API: Default user found in database")
      return defaultUserId
    }

    // Create default user profile if not exists
    await db.query(
      'INSERT INTO profiles (id, email, created_at, updated_at) VALUES ($1, $2, NOW(), NOW()) ON CONFLICT (id) DO NOTHING',
      [defaultUserId, defaultEmail]
    )

    console.log("[v0] Errors API: Default user created in database")
    return defaultUserId
  } catch (error) {
    console.error("[v0] Errors API: Error with default user:", error)
    return defaultUserId // Return default ID even if there's an error
  }
}

async function getUserId(): Promise<string> {
  // Always use default user since we don't have authentication
  const defaultUserId = await ensureDefaultUser()
  console.log("[v0] Errors API: Using default user ID:", defaultUserId)
  return defaultUserId
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get("workflowId")

    console.log("[v0] Errors API: Retrieving workflow errors")

    // Ensure default user exists and get user ID
    const userId = await getUserId()

    // Get errors from n8n with proper user ID
    const errors = await n8nApi.getWorkflowErrors(workflowId || undefined, userId)

    console.log("[v0] Errors API: Retrieved", errors.length, "error executions")
    
    // Add detailed logging for error structure analysis
    if (errors.length > 0) {
      console.log("[v0] Errors API: Sample error structure:", JSON.stringify(errors[0], null, 2))
    }

    // Test configuration separately to avoid blocking error retrieval
    let hasConfiguration = false
    try {
      hasConfiguration = await n8nApi.testConnection(userId)
    } catch (testError) {
      console.log("[v0] Errors API: Configuration test failed, but continuing with error retrieval")
      hasConfiguration = errors.length > 0
    }

    return NextResponse.json({
      success: true,
      errors: errors.map((execution) => ({
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        startedAt: execution.startedAt,
        stoppedAt: execution.stoppedAt,
        error: extractErrorMessage(execution),
      })),
      hasConfiguration,
    })
  } catch (error) {
    console.error("[v0] Errors API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retrieve errors" },
      { status: 500 },
    )
  }
}