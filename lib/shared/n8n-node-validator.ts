// n8n Node Validator - Uses real node data from GitHub
// This validator uses the authoritative list of n8n nodes from the official repository
import { N8N_AVAILABLE_NODES, isValidN8nNode, isN8nTriggerNode, getSuggestedNode } from '../github-nodes';

export interface NodeValidationResult {
  isValid: boolean;
  suggestions?: string[];
  error?: string;
  category?: 'trigger' | 'action' | 'langchain';
}

// Re-export the comprehensive node list from GitHub
export const CORE_N8N_NODE_TYPES = N8N_AVAILABLE_NODES;

// Define the interface for NODE_CATEGORIES
interface NodeCategories {
  triggers: string[];
  core: string[];
  communication: string[];
  ai: string[];
  google: string[];
  databases: string[];
  other: string[];
}

// Define core nodes first
const coreNodes = [
  'n8n-nodes-base.set',
  'n8n-nodes-base.if',
  'n8n-nodes-base.switch',
  'n8n-nodes-base.merge',
  'n8n-nodes-base.splitInBatches',
  'n8n-nodes-base.loop',
  'n8n-nodes-base.itemLists',
  'n8n-nodes-base.code',
  'n8n-nodes-base.function',
  'n8n-nodes-base.functionItem',
  'n8n-nodes-base.wait',
  'n8n-nodes-base.noOp',
  'n8n-nodes-base.stopAndError',
  'n8n-nodes-base.respondToWebhook',
  'n8n-nodes-base.executeWorkflow',
  'n8n-nodes-base.errorWorkflow',
  'n8n-nodes-base.httpRequest',
];

const communicationNodes = [
  'n8n-nodes-base.email',
  'n8n-nodes-base.emailSend',
  'n8n-nodes-base.gmail',
  'n8n-nodes-base.slack',
  'n8n-nodes-base.telegram',
  'n8n-nodes-base.discord',
  'n8n-nodes-base.twilio',
  'n8n-nodes-base.whatsapp', // For sending messages only!
  'n8n-nodes-base.mattermost',
  'n8n-nodes-base.microsoftTeams',
];

const aiNodes = [
  'n8n-nodes-base.openAi',
  'n8n-nodes-langchain.lmChatOpenAi',
  'n8n-nodes-langchain.lmChatAnthropic',
  'n8n-nodes-langchain.agent',
  'n8n-nodes-langchain.chainLlm',
];

const googleNodes = [
  'n8n-nodes-base.googleSheets',
  'n8n-nodes-base.googleDrive',
  'n8n-nodes-base.googleCalendar',
  'n8n-nodes-base.googleDocs',
  'n8n-nodes-base.gmail',
];

const databaseNodes = [
  'n8n-nodes-base.postgres',
  'n8n-nodes-base.mongoDb',
  'n8n-nodes-base.mySql',
  'n8n-nodes-base.redis',
  'n8n-nodes-base.supabase',
];

// Categorized nodes for AI prompts and validation
export const NODE_CATEGORIES: NodeCategories = {
  triggers: N8N_AVAILABLE_NODES.triggers,
  core: coreNodes,
  communication: communicationNodes,
  ai: aiNodes,
  google: googleNodes,
  databases: databaseNodes,
  other: N8N_AVAILABLE_NODES.actions.filter(node => 
    !coreNodes.includes(node) &&
    !communicationNodes.includes(node) &&
    !aiNodes.includes(node) &&
    !googleNodes.includes(node) &&
    !databaseNodes.includes(node)
  ),
};

// Validate a single node type
export function validateNodeType(nodeType: string): NodeValidationResult {
  // Check if it's a valid node from GitHub data
  if (isValidN8nNode(nodeType)) {
    const category = isN8nTriggerNode(nodeType) ? 'trigger' : 
                    N8N_AVAILABLE_NODES.langchain.includes(nodeType) ? 'langchain' : 'action';
    return { isValid: true, category };
  }

  // Invalid node - provide smart suggestions
  const suggestion = getSuggestedNode(nodeType);
  return {
    isValid: false,
    suggestions: [suggestion],
    error: `Invalid node type: ${nodeType}. Suggested alternative: ${suggestion}`,
  };
}

// Check if a node is valid
export function isValidNodeType(nodeType: string): boolean {
  return isValidN8nNode(nodeType);
}

// Check if a node is a trigger
export function isTriggerNode(nodeType: string): boolean {
  return isN8nTriggerNode(nodeType);
}

// Check if a node can be used as a trigger
export function canBeUsedAsTrigger(nodeType: string, nodeName: string): boolean {
  // Only trigger nodes can start workflows
  if (isN8nTriggerNode(nodeType)) return true;
  
  // Common mistake: Using messaging nodes as triggers
  const messagingNodes = NODE_CATEGORIES.communication;
  if (messagingNodes.includes(nodeType)) {
    console.warn(`Warning: ${nodeName} uses ${nodeType} which is a messaging node, not a trigger. Use webhook or a proper trigger node instead.`);
    return false;
  }
  
  return false;
}

// Get a safe alternative for invalid node usage
export function getSafeAlternative(nodeType: string, intendedUse: 'trigger' | 'action'): string | null {
  if (intendedUse === 'trigger') {
    // If trying to use a messaging node as trigger, suggest webhook
    if (NODE_CATEGORIES.communication.includes(nodeType)) {
      return 'n8n-nodes-base.webhook';
    }
    // Check if WhatsApp trigger exists and was intended
    if (nodeType.toLowerCase().includes('whatsapp')) {
      return 'n8n-nodes-base.whatsappTrigger'; // This EXISTS!
    }
    // Default trigger suggestion
    return 'n8n-nodes-base.webhook';
  }
  
  // For actions, return the node if valid, otherwise suggest alternative
  if (isValidN8nNode(nodeType)) {
    return nodeType;
  }
  
  return getSuggestedNode(nodeType);
}

// Get suggested node type based on partial match
export function getSuggestedNodeType(partialType: string): string | null {
  const lowerPartial = partialType.toLowerCase();
  
  // First try exact match
  if (isValidN8nNode(partialType)) {
    return partialType;
  }
  
  // Try with n8n-nodes-base prefix
  const withPrefix = `n8n-nodes-base.${partialType}`;
  if (isValidN8nNode(withPrefix)) {
    return withPrefix;
  }
  
  // Search all nodes for partial match
  const allNodes = [
    ...N8N_AVAILABLE_NODES.triggers,
    ...N8N_AVAILABLE_NODES.actions,
    ...N8N_AVAILABLE_NODES.langchain,
  ];
  
  // Try to find exact name match
  for (const validType of allNodes) {
    const typePart = validType.split('.').pop()?.toLowerCase() || '';
    if (typePart === lowerPartial) {
      return validType;
    }
  }
  
  // Try partial match
  for (const validType of allNodes) {
    if (validType.toLowerCase().includes(lowerPartial)) {
      return validType;
    }
  }
  
  return null;
}

// Validate all nodes in a workflow
export function validateNodeTypes(nodes: any[]): { 
  valid: boolean;
  invalidNodes: Array<{ name: string; type: string; suggestion?: string; issue?: string }>;
} {
  const invalidNodes: Array<{ name: string; type: string; suggestion?: string; issue?: string }> = [];
  let hasTrigger = false;
  
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isFirstNode = i === 0;
    
    // Check if node type exists
    if (!isValidN8nNode(node.type)) {
      const suggestion = getSuggestedNode(node.type);
      invalidNodes.push({
        name: node.name,
        type: node.type,
        suggestion: suggestion,
        issue: `Node type "${node.type}" does not exist in n8n`
      });
    } 
    // Check if first node is a valid trigger
    else if (isFirstNode && node.type !== 'n8n-nodes-base.stickyNote') {
      if (!canBeUsedAsTrigger(node.type, node.name)) {
        const safeTrigger = getSafeAlternative(node.type, 'trigger');
        invalidNodes.push({
          name: node.name,
          type: node.type,
          suggestion: safeTrigger || 'n8n-nodes-base.webhook',
          issue: `${node.type} cannot be used as a trigger. Use webhook, whatsappTrigger, or other trigger nodes.`
        });
      } else {
        hasTrigger = true;
      }
    }
    
    // Track if we have any trigger
    if (isN8nTriggerNode(node.type)) {
      hasTrigger = true;
    }
  }
  
  // Workflow must have at least one trigger (unless it's all sticky notes)
  const nonStickyNodes = nodes.filter(n => n.type !== 'n8n-nodes-base.stickyNote');
  if (nonStickyNodes.length > 0 && !hasTrigger) {
    invalidNodes.push({
      name: 'Workflow',
      type: 'missing-trigger',
      suggestion: 'n8n-nodes-base.manualTrigger',
      issue: 'Workflow must have at least one trigger node to start execution'
    });
  }
  
  return {
    valid: invalidNodes.length === 0,
    invalidNodes
  };
}

// Export categorized nodes for AI prompts
export const nodesByCategory = NODE_CATEGORIES;