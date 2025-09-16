// Auto Debugger - Auto Deploy Logic
import n8nApi from '@/lib/shared/n8n-api'

export interface DeployResult {
  success: boolean
  workflowId?: string
  error?: string
  message: string
}

export class AutoDeployer {
  static async deployFixedWorkflow(
    workflowJson: any, 
    userId: string,
    originalWorkflowId?: string
  ): Promise<DeployResult> {
    console.log('[v0] AutoDeployer: Deploying fixed workflow...')
    
    try {
      // Update the existing workflow in n8n
      if (originalWorkflowId) {
        console.log('[v0] AutoDeployer: Updating existing workflow:', originalWorkflowId)
        // Ensure we have a valid user ID
        const validUserId = userId || '00000000-0000-0000-0000-000000000001'
        console.log('[v0] AutoDeployer: Using user ID for deployment:', validUserId)
        
        const updatedWorkflow = await n8nApi.pushWorkflowToN8n(originalWorkflowId, workflowJson, workflowJson.name || 'Fixed Workflow', validUserId)
        
        return {
          success: true,
          workflowId: updatedWorkflow.id,
          message: `✅ Workflow updated successfully! Your "${workflowJson.name}" workflow has been fixed and deployed to n8n.`
        }
      } else {
        // Deploy as new workflow
        console.log('[v0] AutoDeployer: Deploying as new workflow')
        // Ensure we have a valid user ID
        const validUserId = userId || '00000000-0000-0000-0000-000000000001'
        console.log('[v0] AutoDeployer: Using user ID for new deployment:', validUserId)
        
        const deployedWorkflow = await n8nApi.deployWorkflow(workflowJson, workflowJson.name || 'Fixed Workflow', validUserId)
        
        return {
          success: true,
          workflowId: deployedWorkflow.id,
          message: `✅ Fixed workflow deployed successfully! Your "${workflowJson.name}" workflow is now ready to use.`
        }
      }
    } catch (error) {
      console.error('[v0] AutoDeployer: Deployment failed:', error)
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown deployment error',
        message: `❌ Failed to deploy the fixed workflow. Please check your n8n connection and try again.`
      }
    }
  }

  static async testWorkflowExecution(workflowId: string, userId: string): Promise<boolean> {
    console.log('[v0] AutoDeployer: Testing workflow execution:', workflowId)
    
    try {
      // For now, we'll just check if the workflow exists and is valid
      // In a full implementation, you might trigger a test execution
      const workflow = await n8nApi.syncWorkflowFromN8n(workflowId, userId)
      return !!workflow.id
    } catch (error) {
      console.error('[v0] AutoDeployer: Test execution failed:', error)
      return false
    }
  }
}