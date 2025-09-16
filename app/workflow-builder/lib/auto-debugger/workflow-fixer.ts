// Auto Debugger - Workflow Fix Logic
import { ErrorAnalysis } from './error-analyzer'

export interface WorkflowFix {
  nodeId: string
  nodeName: string
  changes: Array<{
    path: string
    oldValue: any
    newValue: any
    description: string
  }>
  explanation: string
}

export class WorkflowFixer {
  static generateFix(error: ErrorAnalysis, workflowJson: any): WorkflowFix | null {
    console.log('[v0] WorkflowFixer: Generating fix for error:', error.rootCause)
    
    if (!error.fixable || !workflowJson) {
      return null
    }

    // Find the problematic node
    const nodeToFix = workflowJson.nodes?.find((n: any) => n.id === error.nodeId)
    if (!nodeToFix) {
      console.log('[v0] WorkflowFixer: Could not find node to fix:', error.nodeId)
      return null
    }

    switch (error.rootCause) {
      case 'Missing prompt configuration in AI Agent node':
        return this.fixAIAgentPrompt(nodeToFix, workflowJson)
      
      default:
        return null
    }
  }

  static applyFix(workflowJson: any, fix: WorkflowFix): any {
    console.log('[v0] WorkflowFixer: Applying fix to workflow:', fix.explanation)
    
    const fixedWorkflow = JSON.parse(JSON.stringify(workflowJson)) // Deep clone
    
    // Find and update the node
    const nodeIndex = fixedWorkflow.nodes.findIndex((n: any) => n.id === fix.nodeId)
    if (nodeIndex === -1) {
      throw new Error(`Node ${fix.nodeId} not found in workflow`)
    }

    // Apply all changes
    fix.changes.forEach(change => {
      this.setNestedValue(fixedWorkflow.nodes[nodeIndex], change.path, change.newValue)
    })

    console.log('[v0] WorkflowFixer: Fix applied successfully')
    return fixedWorkflow
  }

  private static fixAIAgentPrompt(node: any, workflowJson?: any): WorkflowFix {
    // Generate context-aware prompt based on workflow analysis
    const workflowName = workflowJson?.name || 'Unknown Workflow'
    const workflowNodes = workflowJson?.nodes || []
    
    // Analyze workflow purpose from name and nodes
    const systemPrompt = this.generateContextualPrompt(workflowName, workflowNodes, node)

    return {
      nodeId: node.id,
      nodeName: node.name,
      changes: [
        {
          path: 'parameters.promptType',
          oldValue: node.parameters?.promptType || 'auto',
          newValue: 'define',
          description: 'Set prompt type to "define" to use custom system prompt'
        },
        {
          path: 'parameters.text',
          oldValue: node.parameters?.text || '',
          newValue: systemPrompt,
          description: `Add contextual system prompt based on workflow purpose: ${workflowName}`
        }
      ],
      explanation: `Added a contextual system prompt to the AI Agent node based on the workflow purpose (${workflowName}). The prompt is tailored to the specific use case and workflow requirements.`
    }
  }

  private static generateContextualPrompt(workflowName: string, nodes: any[], aiNode: any): string {
    const name = workflowName.toLowerCase()
    
    // Detect workflow type from name and connected nodes
    if (name.includes('joke') || name.includes('humor') || name.includes('comedy')) {
      return this.generateJokePrompt(workflowName, nodes)
    } else if (name.includes('customer') || name.includes('support') || name.includes('service')) {
      return this.generateCustomerServicePrompt(workflowName, nodes)
    } else if (name.includes('social') || name.includes('twitter') || name.includes('post')) {
      return this.generateSocialMediaPrompt(workflowName, nodes)
    } else if (name.includes('email') || name.includes('newsletter')) {
      return this.generateEmailPrompt(workflowName, nodes)
    } else if (name.includes('content') || name.includes('blog') || name.includes('article')) {
      return this.generateContentPrompt(workflowName, nodes)
    } else {
      // Generic AI assistant prompt as fallback
      return this.generateGenericPrompt(workflowName, nodes)
    }
  }

  private static generateJokePrompt(workflowName: string, nodes: any[]): string {
    const hasTwitter = nodes.some(n => n.type?.includes('twitter'))
    const hasScheduler = nodes.some(n => n.type?.includes('cron') || n.type?.includes('schedule'))
    
    return `You are a witty AI comedian specializing in generating original, funny jokes.

Your role in this ${workflowName} workflow:
- Create original, clean, and entertaining jokes
- Tailor content for social media platforms (especially Twitter if posting there)
- Keep jokes concise and engaging (under 280 characters for Twitter)
- Generate varied joke styles: puns, one-liners, observational humor
- Ensure content is appropriate for all audiences

Guidelines:
- Be creative and original - avoid recycled jokes
- Consider current trends and relatable topics
- Use wordplay, clever observations, and timing
- Keep it positive and inclusive
${hasTwitter ? '- Format for Twitter: include relevant hashtags when appropriate' : ''}
${hasScheduler ? '- Generate fresh content for regular posting schedule' : ''}

Generate an original joke:`
  }

  private static generateSocialMediaPrompt(workflowName: string, nodes: any[]): string {
    const hasTwitter = nodes.some(n => n.type?.includes('twitter'))
    const platform = hasTwitter ? 'Twitter' : 'social media'
    
    return `You are a creative social media content specialist for ${workflowName}.

Your responsibilities:
- Create engaging, original content for ${platform}
- Craft posts that drive engagement and interaction
- Use appropriate tone and style for the platform
- Include relevant hashtags and mentions when suitable
${hasTwitter ? '- Keep content within Twitter\'s character limits' : ''}
- Generate content that aligns with brand voice and objectives

Content Guidelines:
- Be authentic and relatable
- Use compelling visuals descriptions when applicable
- Include clear calls-to-action when appropriate
- Consider trending topics and current events
- Maintain consistency with brand messaging

Create engaging social media content:`
  }

  private static generateCustomerServicePrompt(workflowName: string, nodes: any[]): string {
    return `You are a professional AI customer service assistant for ${workflowName}.

Your responsibilities:
- Provide helpful, accurate, and timely responses to customer inquiries
- Maintain a friendly, professional, and empathetic tone
- Escalate complex issues to human agents when appropriate
- Follow company policies and procedures
- Ensure customer satisfaction and positive experience

Guidelines:
- Listen actively and understand customer needs
- Provide clear, concise, and actionable solutions
- Be patient and understanding with frustrated customers
- Offer alternatives when the primary solution isn't available
- Document important interactions for follow-up

Assist the customer with their inquiry:`
  }

  private static generateEmailPrompt(workflowName: string, nodes: any[]): string {
    return `You are an AI email communication specialist for ${workflowName}.

Your role:
- Craft professional, engaging, and effective email content
- Tailor messaging to specific audiences and purposes
- Ensure clear subject lines and compelling calls-to-action
- Maintain appropriate tone and formatting for email medium
- Optimize for deliverability and engagement

Email Best Practices:
- Write compelling subject lines that encourage opens
- Structure content with clear hierarchy and scannable sections
- Include personalization when possible
- Provide clear next steps or calls-to-action
- Ensure mobile-friendly formatting
- Maintain professional yet approachable tone

Generate effective email content:`
  }

  private static generateContentPrompt(workflowName: string, nodes: any[]): string {
    return `You are a skilled AI content creator for ${workflowName}.

Your expertise includes:
- Creating engaging, informative, and valuable content
- Adapting writing style to target audience and platform
- Incorporating SEO best practices and keyword optimization
- Structuring content for maximum readability and engagement
- Maintaining consistent brand voice and messaging

Content Creation Guidelines:
- Research and understand the target audience
- Create compelling headlines and introductions
- Use clear, concise, and engaging language
- Include relevant examples, data, and supporting information
- Optimize for search engines while prioritizing user experience
- Ensure content aligns with business objectives

Create high-quality content:`
  }

  private static generateGenericPrompt(workflowName: string, nodes: any[]): string {
    return `You are an intelligent AI assistant for the ${workflowName} workflow.

Your capabilities:
- Analyze input data and provide relevant responses
- Process information according to workflow requirements
- Maintain consistency and accuracy in outputs
- Adapt responses based on context and user needs
- Follow established guidelines and best practices

Operational Guidelines:
- Understand the context and purpose of each request
- Provide accurate, helpful, and relevant responses
- Maintain appropriate tone and professionalism
- Consider the broader workflow objectives
- Ensure outputs are properly formatted for downstream processes

Process the input and provide an appropriate response:`
  }

  private static setNestedValue(obj: any, path: string, value: any) {
    const keys = path.split('.')
    let current = obj
    
    // Navigate to the parent of the target property
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!(key in current)) {
        current[key] = {}
      }
      current = current[key]
    }
    
    // Set the final value
    current[keys[keys.length - 1]] = value
  }
}