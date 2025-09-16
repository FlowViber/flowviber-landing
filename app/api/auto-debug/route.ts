import { NextRequest, NextResponse } from 'next/server'
import { n8nApi } from '@/lib/shared/n8n-api'
import { AutoDebugger } from '@/lib/shared/auto-debugger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workflowId = searchParams.get('workflowId')
    
    if (!workflowId) {
      return NextResponse.json({ error: 'workflowId is required' }, { status: 400 })
    }

    console.log('[v0] Auto-debug API: Starting auto-debug for workflow:', workflowId)
    
    // Default user ID (since we're using simplified auth)
    const userId = '00000000-0000-0000-0000-000000000001'
    
    // First, get workflow JSON for analysis
    const workflowJson = await n8nApi.syncWorkflowFromN8n(workflowId, userId)
    if (!workflowJson) {
      return NextResponse.json({ 
        error: 'Could not retrieve workflow JSON for analysis' 
      }, { status: 400 })
    }
    
    // Get workflow errors from n8n, including configuration issues
    const errorExecutions = await n8nApi.getWorkflowErrors(workflowId, userId, workflowJson)
    
    if (!errorExecutions || errorExecutions.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No errors found in workflow' 
      })
    }
    
    // Use first error for debugging
    const firstError = errorExecutions[0]
    
    const result = await AutoDebugger.debugAndFix(
      firstError,
      workflowJson,
      userId,
      workflowId
    )
    
    console.log('[v0] Auto-debug API: Result:', result)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('[v0] Auto-debug API: Error:', error)
    return NextResponse.json({ 
      error: 'Failed to run auto-debugger',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}