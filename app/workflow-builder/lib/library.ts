import fs from "node:fs";
import path from "node:path";
import { githubNodeRepository } from "./github-nodes";

type J = any;

interface LibCache {
  nodesIndex?: J;
  resourceOps?: J;
  recipesIndex?: J;
  enhancedNodesIndex?: J;
  lastGitHubFetch?: number;
}

declare global {
  var __LIB_CACHE__: LibCache | undefined;
}

global.__LIB_CACHE__ = global.__LIB_CACHE__ || {};

const read = (rel: string) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), rel), "utf8"));
  } catch (error) {
    console.error(`Failed to read ${rel}:`, error);
    return null;
  }
};

export const getNodesIndex = () => {
  if (!global.__LIB_CACHE__!.nodesIndex) {
    global.__LIB_CACHE__!.nodesIndex = read("app/workflow-builder/library/nodes/_index.json");
  }
  return global.__LIB_CACHE__!.nodesIndex;
};

export const getResourceOps = () => {
  if (!global.__LIB_CACHE__!.resourceOps) {
    global.__LIB_CACHE__!.resourceOps = read("app/workflow-builder/library/nodes/_resource_ops.json");
  }
  return global.__LIB_CACHE__!.resourceOps;
};

export const getRecipesIndex = () => {
  if (!global.__LIB_CACHE__!.recipesIndex) {
    global.__LIB_CACHE__!.recipesIndex = read("app/workflow-builder/library/recipes/_index.json");
  }
  return global.__LIB_CACHE__!.recipesIndex;
};

// Enhanced nodes index with GitHub fallback
export const getEnhancedNodesIndex = async () => {
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  const now = Date.now();
  
  // Return cached version if still valid
  if (global.__LIB_CACHE__!.enhancedNodesIndex && 
      global.__LIB_CACHE__!.lastGitHubFetch &&
      (now - global.__LIB_CACHE__!.lastGitHubFetch) < CACHE_TTL) {
    return global.__LIB_CACHE__!.enhancedNodesIndex;
  }

  console.log('[Library] Building enhanced nodes index with GitHub fallback...');
  
  // Start with local nodes
  const localNodes = getNodesIndex() || [];
  console.log(`[Library] Local nodes: ${localNodes.length}`);
  
  // Get essential nodes from GitHub (rate-limited approach)
  console.log('[Library] Loading essential nodes from GitHub...');
  const essentialTerms = ['code', 'webhook', 'httpRequest', 'openai', 'whatsapp', 'telegram', 'slack', 'gmail', 'set', 'if', 'function', 'switch'];
  const githubNodes = [];
  
  for (const term of essentialTerms) {
    try {
      const nodes = await githubNodeRepository.searchNodes(term);
      githubNodes.push(...nodes);
      console.log(`[Library] Found ${nodes.length} GitHub nodes for '${term}':`, nodes.map(n => n.displayName));
    } catch (error) {
      console.warn(`[Library] Failed to search GitHub for '${term}':`, error);
    }
  }
  
  // Merge and deduplicate
  const allNodes = [...localNodes];
  const existingIds = new Set(localNodes.map((n: any) => n.id));
  
  for (const githubNode of githubNodes) {
    if (!existingIds.has(githubNode.id)) {
      allNodes.push(githubNode);
      existingIds.add(githubNode.id);
    }
  }
  
  console.log(`[Library] Enhanced index: ${localNodes.length} local + ${githubNodes.length} GitHub = ${allNodes.length} total nodes`);
  console.log(`[Library] Available node types:`, allNodes.slice(0, 10).map(n => n.displayName).join(', '), '...');
  
  // Add comprehensive fallback nodes if GitHub fails
  if (githubNodes.length === 0) {
    console.log('[Library] GitHub failed, loading comprehensive fallback nodes...');
    try {
      const comprehensiveNodes = require('../library/comprehensive-nodes.json');
      const formattedNodes = comprehensiveNodes.map((node: any) => ({
        id: node.name,
        displayName: node.displayName,
        name: node.name,
        credentials: node.credentials,
        resources: Array.isArray(node.resources) ? node.resources : [],
        operations: Array.isArray(node.operations) ? node.operations : []
      }));
      allNodes.push(...formattedNodes);
      console.log(`[Library] Added ${formattedNodes.length} comprehensive fallback nodes`);
    } catch (error) {
      console.warn('[Library] Failed to load comprehensive nodes, using minimal fallback:', error);
      const essentialNodes = [
        { id: 'code', displayName: 'Code', name: 'code', credentials: '', resources: [], operations: ['javascript'] },
        { id: 'function', displayName: 'Function', name: 'function', credentials: '', resources: [], operations: ['javascript'] },
        { id: 'set', displayName: 'Set', name: 'set', credentials: '', resources: [], operations: ['set'] },
        { id: 'if', displayName: 'IF', name: 'if', credentials: '', resources: [], operations: ['condition'] },
        { id: 'switch', displayName: 'Switch', name: 'switch', credentials: '', resources: [], operations: ['condition'] }
      ];
      allNodes.push(...essentialNodes);
      console.log(`[Library] Added ${essentialNodes.length} minimal fallback nodes`);
    }
  }
  
  // Cache the enhanced index
  global.__LIB_CACHE__!.enhancedNodesIndex = allNodes;
  global.__LIB_CACHE__!.lastGitHubFetch = now;
  
  return allNodes;
};

// Search for specific nodes (with GitHub fallback)
export const searchNodes = async (searchTerm: string) => {
  console.log(`[Library] Searching for nodes: ${searchTerm}`);
  
  // First check local nodes
  const localNodes = getNodesIndex() || [];
  const localMatches = localNodes.filter((node: any) => 
    node.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  console.log(`[Library] Local matches: ${localMatches.length}`);
  
  // If no local matches, search GitHub
  if (localMatches.length === 0) {
    console.log(`[Library] No local matches, searching GitHub...`);
    try {
      const githubNodes = await githubNodeRepository.searchNodes(searchTerm);
      console.log(`[Library] GitHub matches: ${githubNodes.length}`);
      return githubNodes;
    } catch (error) {
      console.warn(`[Library] GitHub search failed:`, error);
      return [];
    }
  }
  
  return localMatches;
};