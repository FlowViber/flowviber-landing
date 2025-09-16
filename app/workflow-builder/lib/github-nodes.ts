// GitHub n8n Node Repository Access
// Provides fallback access to the complete n8n node library from GitHub

interface GitHubNodeInfo {
  id: string;
  displayName: string;
  name: string;
  credentials?: string | string[];
  resources?: string[];
  operations?: string[];
  file: string;
  description?: string;
}

interface GitHubDirectoryItem {
  name: string;
  path: string;
  type: 'file' | 'dir';
  download_url?: string;
}

// Cache for GitHub API responses to avoid hitting rate limits
const githubCache = new Map<string, any>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export class GitHubNodeRepository {
  private baseUrl = 'https://api.github.com/repos/n8n-io/n8n/contents/packages/nodes-base/nodes';
  private rawBaseUrl = 'https://raw.githubusercontent.com/n8n-io/n8n/master/packages/nodes-base/nodes';

  private getCacheKey(path: string): string {
    return `github_${path}`;
  }

  private isValidCache(cacheEntry: any): boolean {
    return cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_TTL;
  }

  async searchNodes(searchTerm: string): Promise<GitHubNodeInfo[]> {
    console.log(`[GitHub] Searching for nodes matching: ${searchTerm}`);
    
    try {
      // Get all node directories from GitHub
      const directories = await this.getNodeDirectories();
      
      // Filter directories that might contain the searched node
      const matchingDirs = directories.filter(dir => 
        dir.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        this.isLikelyMatch(dir.name, searchTerm)
      );

      console.log(`[GitHub] Found ${matchingDirs.length} matching directories for '${searchTerm}':`, 
        matchingDirs.map(d => d.name));

      // Fetch node information from matching directories
      const nodePromises = matchingDirs.map(dir => this.getNodeInfo(dir));
      const nodes = await Promise.all(nodePromises);
      
      return nodes.filter(node => node !== null) as GitHubNodeInfo[];
    } catch (error) {
      console.error('[GitHub] Error searching nodes:', error);
      return [];
    }
  }

  async getAllNodes(): Promise<GitHubNodeInfo[]> {
    console.log('[GitHub] Loading all available nodes...');
    
    try {
      // Get all node directories
      const directories = await this.getNodeDirectories();
      console.log(`[GitHub] Processing ${directories.length} node directories...`);
      
      // Fetch node information from all directories (in batches to avoid rate limits)
      const batchSize = 10;
      const validNodes: GitHubNodeInfo[] = [];
      
      for (let i = 0; i < directories.length; i += batchSize) {
        const batch = directories.slice(i, i + batchSize);
        const nodePromises = batch.map(dir => this.getNodeInfo(dir));
        const nodes = await Promise.all(nodePromises);
        
        const batchValidNodes = nodes.filter(node => node !== null) as GitHubNodeInfo[];
        validNodes.push(...batchValidNodes);
        
        console.log(`[GitHub] Batch ${Math.floor(i/batchSize) + 1}: ${batchValidNodes.length}/${batch.length} nodes loaded`);
        
        // Small delay to avoid rate limiting
        if (i + batchSize < directories.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`[GitHub] Successfully loaded ${validNodes.length} nodes out of ${directories.length} directories`);
      
      return validNodes;
    } catch (error) {
      console.error('[GitHub] Error loading all nodes:', error);
      return [];
    }
  }

  async getNodeDirectories(): Promise<GitHubDirectoryItem[]> {
    const cacheKey = this.getCacheKey('directories');
    const cached = githubCache.get(cacheKey);
    
    if (this.isValidCache(cached)) {
      console.log('[GitHub] Using cached directories');
      return cached.data;
    }

    console.log('[GitHub] Fetching node directories from GitHub API...');
    
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const items: GitHubDirectoryItem[] = await response.json();
      const directories = items.filter(item => item.type === 'dir');
      
      // Cache the results
      githubCache.set(cacheKey, {
        data: directories,
        timestamp: Date.now()
      });
      
      console.log(`[GitHub] Found ${directories.length} node directories`);
      return directories;
    } catch (error) {
      console.error('[GitHub] Failed to fetch directories:', error);
      return [];
    }
  }

  async getNodeInfo(directory: GitHubDirectoryItem): Promise<GitHubNodeInfo | null> {
    const cacheKey = this.getCacheKey(`node_${directory.name}`);
    const cached = githubCache.get(cacheKey);
    
    if (this.isValidCache(cached)) {
      return cached.data;
    }

    try {
      // Try to find the main node file in the directory
      const nodeFile = await this.findNodeFile(directory.path);
      if (!nodeFile) {
        console.log(`[GitHub] No node file found in ${directory.name}`);
        return null;
      }

      // Fetch and parse the node file
      const nodeInfo = await this.parseNodeFile(nodeFile, directory.name);
      
      // Cache the result
      githubCache.set(cacheKey, {
        data: nodeInfo,
        timestamp: Date.now()
      });
      
      return nodeInfo;
    } catch (error) {
      console.error(`[GitHub] Error getting node info for ${directory.name}:`, error);
      return null;
    }
  }

  private async findNodeFile(dirPath: string): Promise<string | null> {
    try {
      const response = await fetch(`https://api.github.com/repos/n8n-io/n8n/contents/packages/nodes-base/nodes/${dirPath}`);
      if (!response.ok) return null;
      
      const items: GitHubDirectoryItem[] = await response.json();
      
      // Look for .node.json files (contains complete node definitions)
      const nodeFiles = items.filter(item => 
        item.type === 'file' && 
        item.name.endsWith('.node.json')
      );
      
      if (nodeFiles.length > 0) {
        return nodeFiles[0].download_url || null;
      }
      
      return null;
    } catch (error) {
      console.error(`[GitHub] Error finding node file in ${dirPath}:`, error);
      return null;
    }
  }

  private async parseNodeFile(fileUrl: string, dirName: string): Promise<GitHubNodeInfo | null> {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) return null;
      
      const content = await response.text();
      const nodeData = JSON.parse(content);
      
      // Convert JSON node definition to our format
      return this.convertNodeJsonToInfo(nodeData, fileUrl);
    } catch (error) {
      console.error(`[GitHub] Error parsing node file ${fileUrl}:`, error);
      return null;
    }
  }

  private convertNodeJsonToInfo(nodeData: any, fileUrl: string): GitHubNodeInfo {
    // Extract data directly from JSON node definition
    const nodeInfo: GitHubNodeInfo = {
      id: nodeData.name || nodeData.displayName?.toLowerCase() || 'unknown',
      displayName: nodeData.displayName || nodeData.name || 'Unknown Node',
      name: nodeData.name || nodeData.displayName?.toLowerCase() || 'unknown',
      file: fileUrl,
      description: nodeData.description || ''
    };

    // Extract credentials from JSON
    if (nodeData.credentials && Array.isArray(nodeData.credentials)) {
      const credNames = nodeData.credentials.map((cred: any) => cred.name || cred);
      nodeInfo.credentials = credNames.length === 1 ? credNames[0] : credNames;
    }

    // Extract resources and operations from properties
    nodeInfo.resources = this.extractResourcesFromProperties(nodeData.properties);
    nodeInfo.operations = this.extractOperationsFromProperties(nodeData.properties);

    return nodeInfo;
  }

  private extractResourcesFromProperties(properties: any): string[] {
    if (!properties || !properties.resource || !properties.resource.options) {
      return [];
    }
    
    return properties.resource.options.map((option: any) => option.value).filter(Boolean);
  }

  private extractOperationsFromProperties(properties: any): string[] {
    if (!properties || !properties.operation || !properties.operation.options) {
      return [];
    }
    
    return properties.operation.options.map((option: any) => option.value).filter(Boolean);
  }

  private extractId(content: string, dirName: string): string {
    // Try to extract from class name or use directory name
    const classMatch = content.match(/export class (\w+) implements INodeType/);
    if (classMatch) {
      return this.camelToKebab(classMatch[1].replace(/Node$/, ''));
    }
    return dirName.toLowerCase();
  }

  private extractDisplayName(content: string, dirName: string): string {
    const displayNameMatch = content.match(/displayName:\s*['"`]([^'"`]+)['"`]/);
    if (displayNameMatch) {
      return displayNameMatch[1];
    }
    return this.kebabToPascal(dirName);
  }

  private extractName(content: string, dirName: string): string {
    const nameMatch = content.match(/name:\s*['"`]([^'"`]+)['"`]/);
    if (nameMatch) {
      return nameMatch[1];
    }
    return dirName.toLowerCase();
  }

  private extractDescription(content: string): string {
    const descMatch = content.match(/description:\s*['"`]([^'"`]+)['"`]/);
    return descMatch ? descMatch[1] : '';
  }

  private extractCredentials(content: string): string[] {
    const credentials: string[] = [];
    
    // Look for credential definitions
    const credentialMatches = content.matchAll(/['"`]([^'"`]*[Aa]pi)['"`]/g);
    for (const match of credentialMatches) {
      if (match[1] && !credentials.includes(match[1])) {
        credentials.push(match[1]);
      }
    }
    
    return credentials;
  }

  private extractResources(content: string): string[] {
    const resources: string[] = [];
    
    // Look for resource definitions in properties
    const resourceSection = content.match(/resource:\s*{[\s\S]*?options:\s*\[([\s\S]*?)\]/);
    if (resourceSection) {
      const resourceMatches = resourceSection[1].matchAll(/value:\s*['"`]([^'"`]+)['"`]/g);
      for (const match of resourceMatches) {
        if (match[1] && !resources.includes(match[1])) {
          resources.push(match[1]);
        }
      }
    }
    
    return resources;
  }

  private extractOperations(content: string): string[] {
    const operations: string[] = [];
    
    // Look for operation definitions
    const operationSection = content.match(/operation:\s*{[\s\S]*?options:\s*\[([\s\S]*?)\]/);
    if (operationSection) {
      const opMatches = operationSection[1].matchAll(/value:\s*['"`]([^'"`]+)['"`]/g);
      for (const match of opMatches) {
        if (match[1] && !operations.includes(match[1])) {
          operations.push(match[1]);
        }
      }
    }
    
    return operations;
  }

  private isLikelyMatch(dirName: string, searchTerm: string): boolean {
    // Check for common variations
    const term = searchTerm.toLowerCase();
    const dir = dirName.toLowerCase();
    
    // Direct matches
    if (dir.includes(term)) return true;
    
    // Special cases for messaging platforms
    if (term === 'whatsapp' && (dir.includes('whats') || dir.includes('wa'))) return true;
    if (term === 'telegram' && dir.includes('telegram')) return true;
    if (term === 'discord' && dir.includes('discord')) return true;
    if (term === 'slack' && dir.includes('slack')) return true;
    
    return false;
  }

  private camelToKebab(str: string): string {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  private kebabToPascal(str: string): string {
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
}

// Singleton instance
export const githubNodeRepository = new GitHubNodeRepository();