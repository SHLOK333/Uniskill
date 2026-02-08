// Database abstraction - File-based for hackathon, easy to swap for Redis/Postgres
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';

const DATA_DIR = join(process.cwd(), '.data');
const AGENTS_FILE = join(DATA_DIR, 'agents.json');
const CLAIMS_FILE = join(DATA_DIR, 'claims.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

// Claims storage interface
export interface ClaimData {
  agentId: string;
  apiKey: string;
  verificationCode: string;
  createdAt: string;
  status: string;
}

// Load claims from file
function loadClaims(): Map<string, ClaimData> {
  ensureDataDir();
  if (!existsSync(CLAIMS_FILE)) {
    return new Map();
  }
  try {
    const data = JSON.parse(readFileSync(CLAIMS_FILE, 'utf-8'));
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}

// Save claims to file
function saveClaims(claims: Map<string, ClaimData>) {
  ensureDataDir();
  const data = Object.fromEntries(claims.entries());
  writeFileSync(CLAIMS_FILE, JSON.stringify(data, null, 2));
}

// Generate secure random codes
function generateCode(prefix: string, length: number = 16): string {
  return `${prefix}_${randomBytes(length).toString('hex')}`;
}

// Agent types
export type AgentStatus = 'pending' | 'pending_claim' | 'claimed' | 'active';

export interface Agent {
  id: string;
  name: string;
  description?: string;
  wallet: string; // Ethereum address
  encryptedPrivateKey?: string; // AES-256-GCM encrypted private key
  encryptionIv?: string; // Initialization vector for decryption
  userId: string;
  twitterUsername?: string;
  tweetId?: string;
  tweetUrl?: string;
  apiKey: string;
  verified: boolean;
  verifiedAt?: string;
  createdAt: string;
  lastUsedAt?: string;
  requestCount: number;
  // Claim-related fields
  status?: AgentStatus;
  claimCode?: string;
  verificationCode?: string;
  claimedBy?: string;
  claimedByTwitter?: string;
  claimedAt?: string;
  claimTweetId?: string;
  claimTweetUrl?: string;
  // Owner fields (new registration flow)
  ownerEmail?: string;
  ownerTwitter?: string;
  walletAddress?: string;
}

// Owner data for claiming an agent
export interface ClaimOwnerData {
  email: string;
  twitter?: string;
  walletAddress?: string;
}

// Load agents from file
function loadAgents(): Map<string, Agent> {
  ensureDataDir();
  if (!existsSync(AGENTS_FILE)) {
    return new Map();
  }
  try {
    const data = JSON.parse(readFileSync(AGENTS_FILE, 'utf-8'));
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}

// Save agents to file
function saveAgents(agents: Map<string, Agent>) {
  ensureDataDir();
  const data = Object.fromEntries(agents);
  writeFileSync(AGENTS_FILE, JSON.stringify(data, null, 2));
}

// Database operations
export const db = {
  // Get agent by API key
  getAgentByApiKey(apiKey: string): Agent | null {
    const agents = loadAgents();
    return agents.get(apiKey) || null;
  },

  // Get agent by ID
  getAgentById(id: string): Agent | null {
    const agents = loadAgents();
    for (const agent of agents.values()) {
      if (agent.id === id) return agent;
    }
    return null;
  },

  // Get agent by Twitter username
  getAgentByTwitter(username: string): Agent | null {
    const agents = loadAgents();
    for (const agent of agents.values()) {
      if (agent.twitterUsername?.toLowerCase() === username.toLowerCase()) {
        return agent;
      }
    }
    return null;
  },

  // Create agent
  createAgent(agent: Agent): Agent {
    const agents = loadAgents();
    agents.set(agent.apiKey, agent);
    saveAgents(agents);
    return agent;
  },

  // Update agent
  updateAgent(apiKey: string, updates: Partial<Agent>): Agent | null {
    const agents = loadAgents();
    const agent = agents.get(apiKey);
    if (!agent) return null;

    const updated = { ...agent, ...updates };
    agents.set(apiKey, updated);
    saveAgents(agents);
    return updated;
  },

  // Delete agent
  deleteAgent(apiKey: string): boolean {
    const agents = loadAgents();
    const deleted = agents.delete(apiKey);
    if (deleted) saveAgents(agents);
    return deleted;
  },

  // Validate API key exists
  validateApiKey(apiKey: string): boolean {
    if (!apiKey || !apiKey.startsWith('uniskill_')) return false;
    const agent = this.getAgentByApiKey(apiKey);
    return agent !== null && agent.verified;
  },

  // Increment request count
  incrementRequestCount(apiKey: string): void {
    const agents = loadAgents();
    const agent = agents.get(apiKey);
    if (agent) {
      agent.requestCount = (agent.requestCount || 0) + 1;
      agent.lastUsedAt = new Date().toISOString();
      agents.set(apiKey, agent);
      saveAgents(agents);
    }
  },

  // Get all agents (for admin)
  getAllAgents(): Agent[] {
    const agents = loadAgents();
    return Array.from(agents.values());
  },

  // Get agent by claim code
  getAgentByClaimCode(claimCode: string): Agent | null {
    const agents = loadAgents();
    for (const agent of agents.values()) {
      if (agent.claimCode === claimCode) return agent;
    }
    return null;
  },

  // Update agent by ID
  updateAgentById(id: string, updates: Partial<Agent>): Agent | null {
    const agents = loadAgents();
    for (const [apiKey, agent] of agents.entries()) {
      if (agent.id === id) {
        const updated = { ...agent, ...updates };
        agents.set(apiKey, updated);
        saveAgents(agents);
        return updated;
      }
    }
    return null;
  },

  // Create agent for registration (pre-claim flow)
  // Creates an agent with pending_claim status that can be claimed later
  createAgentForRegistration(name: string, description?: string): Agent {
    const agents = loadAgents();

    const id = `agent_${randomBytes(8).toString('hex')}`;
    const apiKey = generateCode('uniskill', 24);
    const claimCode = generateCode('claim', 12);
    const verificationCode = generateCode('verify', 8);

    const agent: Agent = {
      id,
      name,
      description,
      wallet: '', // Empty until claimed
      userId: '', // Empty until claimed
      apiKey,
      verified: false,
      createdAt: new Date().toISOString(),
      requestCount: 0,
      status: 'pending_claim',
      claimCode,
      verificationCode,
    };

    agents.set(apiKey, agent);
    saveAgents(agents);
    return agent;
  },

  // Claim an agent using claim code
  claimAgent(claimCode: string, ownerData: ClaimOwnerData): Agent | null {
    const agents = loadAgents();

    // Find agent by claim code
    let targetAgent: Agent | null = null;
    let targetApiKey: string | null = null;

    for (const [apiKey, agent] of agents.entries()) {
      if (agent.claimCode === claimCode) {
        targetAgent = agent;
        targetApiKey = apiKey;
        break;
      }
    }

    if (!targetAgent || !targetApiKey) {
      return null;
    }

    // Check if already claimed
    if (targetAgent.status === 'claimed' || targetAgent.status === 'active') {
      return null;
    }

    // Update agent with owner data
    const updated: Agent = {
      ...targetAgent,
      status: 'claimed',
      ownerEmail: ownerData.email,
      ownerTwitter: ownerData.twitter,
      walletAddress: ownerData.walletAddress,
      claimedAt: new Date().toISOString(),
      claimedBy: ownerData.email,
      claimedByTwitter: ownerData.twitter,
    };

    agents.set(targetApiKey, updated);
    saveAgents(agents);
    return updated;
  },

  // Get all agents owned by a specific email
  getAgentsByOwner(email: string): Agent[] {
    const agents = loadAgents();
    const owned: Agent[] = [];

    for (const agent of agents.values()) {
      if (agent.ownerEmail?.toLowerCase() === email.toLowerCase() ||
        agent.claimedBy?.toLowerCase() === email.toLowerCase()) {
        owned.push(agent);
      }
    }

    return owned;
  },

  // Get claim data by claim code (reads from claims.json)
  getClaimByCode(claimCode: string): (ClaimData & { agent?: Agent }) | null {
    const claims = loadClaims();
    const claimData = claims.get(claimCode);

    if (!claimData) {
      return null;
    }

    // Also get the agent
    const agent = this.getAgentById(claimData.agentId);

    return {
      ...claimData,
      agent: agent || undefined,
    };
  },

  // Update claim status
  updateClaimStatus(claimCode: string, status: string): boolean {
    const claims = loadClaims();
    const claimData = claims.get(claimCode);

    if (!claimData) {
      return false;
    }

    claims.set(claimCode, { ...claimData, status });
    saveClaims(claims);
    return true;
  },
};
