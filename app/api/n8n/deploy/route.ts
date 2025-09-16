import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] N8n Deploy API: Received deployment request')
    
    const { workflowJson, workflowName, workflowId } = await request.json()
    
    if (!workflowJson || !workflowName) {
      return NextResponse.json(
        { error: 'Workflow JSON and name are required' },
        { status: 400 }
      )
    }

    console.log('[v0] N8n Deploy API: Deploying workflow:', workflowName)

    // Import the N8n API service
    const { n8nApi } = await import('../../../workflow-builder/lib/n8n-api')

    // Deploy the workflow to n8n
    try {
      const result = await n8nApi.deployWorkflow(workflowJson, workflowName)
      
      console.log('[v0] N8n Deploy API: Workflow deployed successfully:', result.id)

      // Update the local workflow with n8n information
      if (workflowId) {
        try {
          const { database } = await import('../../../../lib/shared/database')
          const db = database()
          
          await db.query(
            `UPDATE workflows 
             SET n8n_workflow_id = $1, deployed_at = NOW(), last_sync_at = NOW(), status = 'deployed'
             WHERE id = $2`,
            [result.id, workflowId]
          )
          console.log('[v0] N8n Deploy API: Updated local workflow with n8n ID')
        } catch (dbError) {
          console.error('[v0] N8n Deploy API: Error updating local workflow:', dbError)
          // Don't fail the deployment if we can't update the local record
        }
      }

      return NextResponse.json({
        success: true,
        n8nWorkflowId: result.id,
        message: 'Workflow deployed successfully to n8n'
      })

    } catch (deployError) {
      console.error('[v0] N8n Deploy API: Deployment failed:', deployError)
      
      // Handle specific n8n API errors
      if (deployError instanceof Error) {
        if (deployError.message.includes('credentials')) {
          return NextResponse.json(
            { error: 'N8n credentials not configured. Please check your n8n API key and instance URL.' },
            { status: 400 }
          )
        } else if (deployError.message.includes('connection')) {
          return NextResponse.json(
            { error: 'Cannot connect to n8n instance. Please verify your instance URL is correct.' },
            { status: 400 }
          )
        }
      }

      return NextResponse.json(
        { error: `Deployment failed: ${deployError instanceof Error ? deployError.message : 'Unknown error'}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('[v0] N8n Deploy API: Request processing failed:', error)
    return NextResponse.json(
      { error: 'Failed to process deployment request' },
      { status: 500 }
    )
  }
}