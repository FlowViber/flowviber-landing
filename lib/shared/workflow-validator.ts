/**
 * Workflow JSON validator for n8n compatibility
 * Ensures generated workflows meet n8n API requirements
 */

import { validateNodeTypes, isValidNodeType, getSuggestedNodeType } from './n8n-node-validator'
import { isValidN8nNode, getSuggestedNode } from '../github-nodes'

export interface N8nNodeParameter {
  [key: string]: any
}

export interface N8nNode {
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: N8nNodeParameter
  credentials?: any
  disabled?: boolean
  notes?: string
  color?: string
  id?: string
  webhookId?: string
  executeOnce?: boolean
  onError?: 'continueRegularOutput' | 'continueErrorOutput' | 'stopWorkflow'
}

export interface N8nConnection {
  [sourceNode: string]: {
    [outputType: string]: Array<{
      node: string
      type: string
      index: number
    }>
  }
}

export interface N8nWorkflowSettings {
  executionOrder?: 'v0' | 'v1'
  saveDataErrorExecution?: 'all' | 'none'
  saveDataSuccessExecution?: 'all' | 'none'
  saveExecutionProgress?: boolean
  saveManualExecutions?: boolean
  callerPolicy?: 'any' | 'none' | 'workflowsFromAList' | 'workflowsFromSameOwner'
  callerIds?: string[]
  executionTimeout?: number
  errorWorkflow?: string
  timezone?: string
}

export interface N8nWorkflow {
  name: string
  nodes: N8nNode[]
  connections: N8nConnection
  settings?: N8nWorkflowSettings
  staticData?: any
  active?: boolean
  versionId?: string
  meta?: {
    instanceId?: string
    [key: string]: any
  }
  tags?: Array<{ id: string; name: string }>
  pinData?: any
}

/**
 * Validates and sanitizes workflow JSON for n8n compatibility
 */
export function validateWorkflowJson(workflow: any): N8nWorkflow {
  console.log('[v0] Validator: Starting workflow validation')
  
  // Ensure required properties exist
  if (!workflow.name || typeof workflow.name !== 'string') {
    throw new Error('Workflow must have a valid name')
  }
  
  if (!Array.isArray(workflow.nodes) || workflow.nodes.length === 0) {
    throw new Error('Workflow must have at least one node')
  }
  
  if (!workflow.connections || typeof workflow.connections !== 'object') {
    workflow.connections = {}
  }
  
  // First validate all node types
  const nodeTypeValidation = validateNodeTypes(workflow.nodes)
  if (!nodeTypeValidation.valid) {
    const errorDetails = nodeTypeValidation.invalidNodes.map(n => {
      const suggestion = n.suggestion ? ` (Did you mean: ${n.suggestion}?)` : ''
      return `${n.name}: ${n.type}${suggestion}`
    }).join(', ')
    throw new Error(`Invalid node types found: ${errorDetails}`)
  }
  
  // Validate and sanitize nodes
  const validatedNodes: N8nNode[] = workflow.nodes.map((node: any, index: number) => {
    // Ensure required node properties
    if (!node.name || !node.type) {
      throw new Error(`Node at index ${index} is missing required properties (name, type)`)
    }
    
    // Validate node type using GitHub data
    if (!isValidN8nNode(node.type)) {
      const suggestion = getSuggestedNode(node.type)
      const hint = suggestion ? ` Did you mean: ${suggestion}?` : ''
      throw new Error(`Node ${node.name} has invalid type: ${node.type}.${hint}`)
    }
    
    // Ensure valid typeVersion
    const typeVersion = node.typeVersion || 1
    if (typeof typeVersion !== 'number' || typeVersion < 1) {
      throw new Error(`Node ${node.name} has invalid typeVersion`)
    }
    
    // Ensure valid position
    if (!Array.isArray(node.position) || node.position.length !== 2) {
      console.warn(`[v0] Validator: Node ${node.name} has invalid position, using default`)
      node.position = [250 + (index * 200), 300]
    }
    
    // Ensure parameters object exists
    if (!node.parameters || typeof node.parameters !== 'object') {
      node.parameters = {}
    }
    
    // Build validated node with only valid properties
    const validatedNode: N8nNode = {
      name: node.name,
      type: node.type,
      typeVersion: typeVersion,
      position: node.position,
      parameters: node.parameters
    }
    
    // Add optional properties if they exist and are valid
    if (node.credentials) {
      validatedNode.credentials = node.credentials
    }
    
    if (typeof node.disabled === 'boolean') {
      validatedNode.disabled = node.disabled
    }
    
    if (node.notes && typeof node.notes === 'string') {
      validatedNode.notes = node.notes
    }
    
    if (node.color && typeof node.color === 'string') {
      validatedNode.color = node.color
    }
    
    if (node.id && typeof node.id === 'string') {
      validatedNode.id = node.id
    }
    
    if (node.webhookId && typeof node.webhookId === 'string') {
      validatedNode.webhookId = node.webhookId
    }
    
    if (typeof node.executeOnce === 'boolean') {
      validatedNode.executeOnce = node.executeOnce
    }
    
    if (node.onError && ['continueRegularOutput', 'continueErrorOutput', 'stopWorkflow'].includes(node.onError)) {
      validatedNode.onError = node.onError
    }
    
    return validatedNode
  })
  
  // Validate connections with single-output rule enforcement
  const validatedConnections: N8nConnection = {}
  if (workflow.connections && typeof workflow.connections === 'object') {
    for (const sourceNode in workflow.connections) {
      if (typeof workflow.connections[sourceNode] === 'object') {
        validatedConnections[sourceNode] = {}
        for (const outputType in workflow.connections[sourceNode]) {
          if (Array.isArray(workflow.connections[sourceNode][outputType])) {
            const connections = workflow.connections[sourceNode][outputType]
              .filter((conn: any) => conn && conn.node && typeof conn.node === 'string')
              .map((conn: any) => ({
                node: conn.node,
                type: conn.type || 'main',
                index: typeof conn.index === 'number' ? conn.index : 0
              }))
            
            // Enforce single-output rule for non-branching nodes
            const sourceNodeData = validatedNodes.find(n => n.name === sourceNode)
            const isBranchingNode = sourceNodeData && (
              sourceNodeData.type.includes('if') || 
              sourceNodeData.type.includes('switch') ||
              (sourceNodeData.onError === 'continueErrorOutput')
            )
            
            // Only allow multiple main outputs for branching nodes
            if (outputType === 'main' && connections.length > 1 && !isBranchingNode) {
              console.warn(`[v0] Validator: Node ${sourceNode} (${sourceNodeData?.type}) cannot have multiple main outputs. Only IF/Switch nodes support branching.`)
              throw new Error(`Node ${sourceNode} cannot have multiple outputs. Use an IF node to handle success/error paths.`)
            }
            
            validatedConnections[sourceNode][outputType] = connections
          }
        }
      }
    }
  }
  
  // Build validated workflow
  const validatedWorkflow: N8nWorkflow = {
    name: workflow.name,
    nodes: validatedNodes,
    connections: validatedConnections
  }
  
  // Sanitize settings - ONLY include valid n8n properties
  if (workflow.settings && typeof workflow.settings === 'object') {
    const validatedSettings: N8nWorkflowSettings = {}
    
    // Only copy valid settings properties
    if (workflow.settings.executionOrder === 'v0' || workflow.settings.executionOrder === 'v1') {
      validatedSettings.executionOrder = workflow.settings.executionOrder
    } else {
      // Default to v1 if not specified or invalid
      validatedSettings.executionOrder = 'v1'
    }
    
    if (workflow.settings.saveDataErrorExecution === 'all' || workflow.settings.saveDataErrorExecution === 'none') {
      validatedSettings.saveDataErrorExecution = workflow.settings.saveDataErrorExecution
    }
    
    if (workflow.settings.saveDataSuccessExecution === 'all' || workflow.settings.saveDataSuccessExecution === 'none') {
      validatedSettings.saveDataSuccessExecution = workflow.settings.saveDataSuccessExecution
    }
    
    // Note: saveExecutionProgress, saveManualExecutions, and callerPolicy are not supported by n8n API
    // These settings cause "request/body/settings must NOT have additional properties" errors
    // Removed these settings to fix n8n push failures
    
    if (Array.isArray(workflow.settings.callerIds)) {
      validatedSettings.callerIds = workflow.settings.callerIds.filter((id: any) => typeof id === 'string')
    }
    
    if (typeof workflow.settings.executionTimeout === 'number' && workflow.settings.executionTimeout > 0) {
      validatedSettings.executionTimeout = workflow.settings.executionTimeout
    }
    
    if (workflow.settings.errorWorkflow && typeof workflow.settings.errorWorkflow === 'string') {
      validatedSettings.errorWorkflow = workflow.settings.errorWorkflow
    }
    
    if (workflow.settings.timezone && typeof workflow.settings.timezone === 'string') {
      validatedSettings.timezone = workflow.settings.timezone
    }
    
    // Only add settings if we have valid properties
    if (Object.keys(validatedSettings).length > 0) {
      validatedWorkflow.settings = validatedSettings
    }
  } else {
    // Add default minimal settings
    validatedWorkflow.settings = {
      executionOrder: 'v1'
    }
  }
  
  // Add optional workflow properties if valid
  if (workflow.staticData && typeof workflow.staticData === 'object') {
    validatedWorkflow.staticData = workflow.staticData
  }
  
  if (typeof workflow.active === 'boolean') {
    validatedWorkflow.active = workflow.active
  }
  
  if (workflow.versionId && typeof workflow.versionId === 'string') {
    validatedWorkflow.versionId = workflow.versionId
  }
  
  if (workflow.meta && typeof workflow.meta === 'object') {
    validatedWorkflow.meta = workflow.meta
  }
  
  if (Array.isArray(workflow.tags)) {
    validatedWorkflow.tags = workflow.tags.filter((tag: any) => 
      tag && tag.id && tag.name && typeof tag.id === 'string' && typeof tag.name === 'string'
    )
  }
  
  if (workflow.pinData && typeof workflow.pinData === 'object') {
    validatedWorkflow.pinData = workflow.pinData
  }
  
  console.log('[v0] Validator: Workflow validation complete', {
    nodeCount: validatedWorkflow.nodes.length,
    hasConnections: Object.keys(validatedWorkflow.connections).length > 0,
    settingsKeys: validatedWorkflow.settings ? Object.keys(validatedWorkflow.settings) : []
  })
  
  return validatedWorkflow
}

/**
 * Strips all non-essential properties from workflow for n8n API
 */
export function stripWorkflowForPush(workflow: N8nWorkflow): any {
  // Only send n8n-compatible settings
  const allowedSettings: Record<string, any> = {}
  
  if (workflow.settings) {
    // Only include settings that n8n actually accepts
    if (workflow.settings.executionOrder) {
      allowedSettings.executionOrder = workflow.settings.executionOrder
    }
    // Add other known valid n8n settings here if needed
  }
  
  // Default to v1 if no execution order specified
  if (!allowedSettings.executionOrder) {
    allowedSettings.executionOrder = 'v1'
  }

  return {
    name: workflow.name,
    nodes: workflow.nodes,
    connections: workflow.connections,
    settings: allowedSettings
  }
}