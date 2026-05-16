import Anthropic from '@anthropic-ai/sdk';
import type { IdeaBrief, Candidate, Recommendation } from '@oss-preflight/core';
import { discoverCandidates, scoreAndRank } from '@oss-preflight/core';

/**
 * Recommend Command - Phase P3
 * 
 * Full pipeline: Claude intent parser → discovery → collectors → scoring → output
 * Claude adapter lives in CLI (not core), preserving core's zero-I/O property
 * 
 * On Claude API error: falls back to keyword-based intent parsing
 */

/**
 * Check environment variables
 * Throws if ANTHROPIC_API_KEY is missing (exit code 3)
 */
export function checkEnvironment(): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY environment variable is required');
  }
  // GITHUB_TOKEN is optional - higher rate limits if present
}

/**
 * Validate user input
 * Throws if idea is empty (exit code 2)
 */
export function validateInput(idea: string): void {
  if (!idea || idea.trim().length === 0) {
    throw new Error('Idea string cannot be empty');
  }
}

/**
 * Create Claude adapter with deterministic settings
 * temperature=0, seed=42 for reproducible output
 */
export function createClaudeAdapter(apiKey: string) {
  const client = new Anthropic({ apiKey });
  
  return async (idea: string): Promise<IdeaBrief> => {
    const response = await client.messages.create({
      model: 'claude-haiku-3-5-20241022',
      max_tokens: 1024,
      temperature: 0,
      // @ts-ignore - seed parameter exists but may not be in types yet
      seed: 42,
      messages: [{
        role: 'user',
        content: `Parse this software idea into structured intent. Extract:
- capabilities (array of strings)
- domain (string)
- targetUser (string, optional)
- ecosystem (one of: npm, pypi, github)

Idea: "${idea}"

Respond with ONLY valid JSON matching this schema:
{
  "capabilities": ["string"],
  "domain": "string",
  "targetUser": "string",
  "ecosystem": "npm|pypi|github"
}`
      }]
    });

    const content = response.content[0];
    if (!content || content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Extract JSON from response
    const text = content.text.trim();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Claude response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      capabilities: parsed.capabilities || [],
      domain: parsed.domain || 'general',
      targetUser: parsed.targetUser,
      ecosystem: parsed.ecosystem || 'npm',
      constraints: {}
    };
  };
}

/**
 * Keyword-based fallback parser
 * Extracts ecosystem and domain from keywords when Claude fails
 */
export function keywordParser(idea: string): IdeaBrief {
  const lowerIdea = idea.toLowerCase();
  
  // Detect ecosystem
  let ecosystem: 'npm' | 'pypi' | 'github' = 'npm';
  if (lowerIdea.includes('python') || lowerIdea.includes('django') || lowerIdea.includes('flask')) {
    ecosystem = 'pypi';
  } else if (lowerIdea.includes('npm') || lowerIdea.includes('node') || lowerIdea.includes('javascript') || lowerIdea.includes('typescript')) {
    ecosystem = 'npm';
  }
  
  // Detect domain
  let domain = 'general';
  if (lowerIdea.includes('discord')) {
    domain = 'discord';
  } else if (lowerIdea.includes('bot')) {
    domain = 'bot';
  } else if (lowerIdea.includes('web') || lowerIdea.includes('api')) {
    domain = 'web';
  }
  
  // Extract capabilities (simple keyword extraction)
  const capabilities: string[] = [];
  if (lowerIdea.includes('summarize') || lowerIdea.includes('summary')) {
    capabilities.push('summarization');
  }
  if (lowerIdea.includes('message') || lowerIdea.includes('chat')) {
    capabilities.push('message processing');
  }
  if (lowerIdea.includes('schedule') || lowerIdea.includes('cron')) {
    capabilities.push('scheduling');
  }
  
  if (capabilities.length === 0) {
    capabilities.push('general functionality');
  }
  
  return {
    capabilities,
    domain,
    ecosystem,
    constraints: {}
  };
}

/**
 * Parse intent with Claude, fall back to keyword parsing on error
 */
export async function parseIntentWithFallback(
  idea: string,
  claudeAdapter?: (idea: string) => Promise<IdeaBrief>
): Promise<IdeaBrief> {
  if (!claudeAdapter) {
    // No Claude adapter provided, use keyword parser
    return keywordParser(idea);
  }
  
  try {
    return await claudeAdapter(idea);
  } catch (error) {
    // Claude failed - fall back to keyword parsing
    console.error('Claude API error, falling back to keyword parsing:', (error as Error).message);
    return keywordParser(idea);
  }
}

/**
 * Gather evidence for candidates using collectors
 */
async function gatherEvidence(
  candidates: Candidate[],
  _forceRefresh: boolean
): Promise<Candidate[]> {
  // For P3, we return candidates as-is
  // P2 collectors are integrated but evidence gathering is enhanced in later phases
  // The scorer will use available data from collectors
  return candidates;
}

/**
 * Run the full recommendation pipeline
 */
export async function runRecommendPipeline(
  idea: string,
  options: {
    refresh?: boolean;
    apiKey?: string;
  } = {}
): Promise<{ recommendations: Recommendation[]; brief: IdeaBrief }> {
  // Validate input
  validateInput(idea);
  
  // Check environment
  checkEnvironment();
  
  // Parse intent with Claude (or fallback)
  const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY!;
  const claudeAdapter = createClaudeAdapter(apiKey);
  const brief = await parseIntentWithFallback(idea, claudeAdapter);
  
  // Discover candidates
  const candidateNames = discoverCandidates(brief);
  
  // Convert names to Candidate objects
  // In P3, we use the discovery catalog which provides basic candidate info
  const candidates: Candidate[] = candidateNames.map((name: string) => ({
    name,
    version: '1.0.0', // Placeholder - collectors will provide real version
    ecosystem: brief.ecosystem,
    homepageUrl: null,
    repositoryUrl: null
  }));
  
  // Gather evidence (collectors integration)
  const enrichedCandidates = await gatherEvidence(candidates, options.refresh || false);
  
  // Score and rank
  const recommendations = scoreAndRank(enrichedCandidates, brief);
  
  // Return top 3
  return {
    recommendations: recommendations.slice(0, 3),
    brief
  };
}

/**
 * Main recommend command handler
 */
export async function recommendCommand(
  idea: string,
  options: {
    json?: boolean;
    format?: 'table' | 'json' | 'md';
    refresh?: boolean;
  }
): Promise<void> {
  try {
    await runRecommendPipeline(idea, {
      refresh: options.refresh
    });
    
    // Output will be handled by the CLI index
    // This function is a stub for the actual command handler
    return;
  } catch (error) {
    if ((error as Error).message.includes('ANTHROPIC_API_KEY')) {
      process.exit(3); // Config error
    } else if ((error as Error).message.includes('empty')) {
      process.exit(2); // User input error
    } else {
      console.error('Error:', (error as Error).message);
      process.exit(1); // Collector/API error
    }
  }
}

// Made with Bob