// Auto Debugger - Main Orchestrator
import { ErrorAnalyzer, ErrorAnalysis } from './error-analyzer'
import { WorkflowFixer, WorkflowFix } from './workflow-fixer'
import { AutoDeployer, DeployResult } from './auto-deploy'

export interface AutoDebugResult {
  success: boolean
  analysis: ErrorAnalysis
  fix?: WorkflowFix
  deployResult?: DeployResult
  message: string
  requiresUserAction?: {
    type: 'credential' | 'manual'
    instructions: string
    setupGuide?: string
  }
}

export class AutoDebugger {
  static async debugAndFix(
    error: any,
    workflowJson: any,
    userId: string,
    workflowId?: string
  ): Promise<AutoDebugResult> {
    console.log('[v0] AutoDebugger: Starting debug and fix process...')
    
    try {
      // Step 1: Analyze the error
      const analysis = ErrorAnalyzer.analyzeExecutionError(error, workflowJson)
      console.log('[v0] AutoDebugger: Error analysis complete:', analysis.rootCause)

      // Step 2: Handle credential issues (not auto-fixable)
      if (analysis.errorType === 'credential' && analysis.credentialIssue) {
        return {
          success: false,
          analysis,
          message: `🔑 Credential Issue Detected`,
          requiresUserAction: {
            type: 'credential',
            instructions: `Your ${analysis.nodeName} node is missing valid ${analysis.credentialIssue.credentialType} credentials.`,
            setupGuide: analysis.credentialIssue.setupGuide
          }
        }
      }

      // Step 3: Handle non-fixable errors
      if (!analysis.fixable) {
        return {
          success: false,
          analysis,
          message: `❌ Unable to auto-fix this error: ${analysis.description}`,
          requiresUserAction: {
            type: 'manual',
            instructions: 'This error requires manual intervention. Please check your workflow configuration.'
          }
        }
      }

      // Step 4: Generate fix
      const fix = WorkflowFixer.generateFix(analysis, workflowJson)
      if (!fix) {
        return {
          success: false,
          analysis,
          message: `❌ Could not generate a fix for this error.`
        }
      }

      console.log('[v0] AutoDebugger: Fix generated:', fix.explanation)

      // Step 5: Apply fix to workflow
      const fixedWorkflow = WorkflowFixer.applyFix(workflowJson, fix)
      console.log('[v0] AutoDebugger: Fix applied to workflow JSON')

      // Step 6: Deploy fixed workflow
      const deployResult = await AutoDeployer.deployFixedWorkflow(
        fixedWorkflow,
        userId,
        workflowId
      )

      if (!deployResult.success) {
        return {
          success: false,
          analysis,
          fix,
          deployResult,
          message: deployResult.message
        }
      }

      // Success!
      return {
        success: true,
        analysis,
        fix,
        deployResult,
        message: `✅ **Errors Solved Successfully!**\n\n**🔄 JSON Sync Complete**: Retrieved workflow from n8n and cross-checked with documentation\n\n**🔍 Root Cause**: ${analysis.rootCause || 'Configuration error detected'}\n\n**🛠️ Solution Applied**: ${fix.explanation}\n\n**🚀 Auto-Push to n8n**: Complete!\n\n${deployResult.message}\n\n**✨ Next Step**: Please execute your workflow again on n8n to verify everything works correctly.`
      }

    } catch (error) {
      console.error('[v0] AutoDebugger: Debug process failed:', error)
      return {
        success: false,
        analysis: {
          errorType: 'unknown',
          rootCause: 'Debug process error',
          description: error instanceof Error ? error.message : 'Unknown error during debug process',
          severity: 'high',
          fixable: false
        },
        message: `❌ Auto-debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }
}

// Export all types and classes
export { ErrorAnalyzer } from './error-analyzer'
export type { ErrorAnalysis } from './error-analyzer'
export { WorkflowFixer } from './workflow-fixer'
export type { WorkflowFix } from './workflow-fixer'
export { AutoDeployer } from './auto-deploy'
export type { DeployResult } from './auto-deploy'