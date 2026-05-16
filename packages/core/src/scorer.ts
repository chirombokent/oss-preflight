import type { Candidate, IdeaBrief, Recommendation, RepoStack, Subscores } from './types.js';

/**
 * Scoring weights (must sum to 1.0)
 */
const WEIGHTS = {
  goalFit: 0.30,
  repoCompat: 0.25,
  maintenance: 0.15,
  safety: 0.15,
  community: 0.10,
  docsQuality: 0.05,
} as const;

/**
 * Score and rank candidates against an idea brief
 * 
 * Pure function - no I/O, deterministic
 * All subscores are 0-100 and independently computable
 * 
 * @param candidates - Array of candidates to score
 * @param brief - The parsed user intent
 * @param repoStack - Optional existing repo context for compatibility scoring
 * @returns Ranked recommendations with subscores and evidence passports
 */
export function scoreAndRank(
  candidates: Candidate[],
  brief: IdeaBrief,
  repoStack?: RepoStack
): Recommendation[] {
  if (candidates.length === 0) {
    return [];
  }

  // Score each candidate
  const scored = candidates.map(candidate => {
    const subscores = computeSubscores(candidate, brief, repoStack);
    const score = computeWeightedScore(subscores);

    return {
      candidate,
      score,
      subscores,
      passport: createEvidencePassport(candidate, brief, subscores),
      scaffoldAvailable: hasScaffoldTemplate(candidate, brief),
      templateId: getTemplateId(candidate, brief),
    };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Assign ranks
  const recommendations: Recommendation[] = scored.map((item, index) => ({
    rank: index + 1,
    score: item.score,
    candidate: item.candidate,
    subscores: item.subscores,
    passport: item.passport,
    scaffoldAvailable: item.scaffoldAvailable,
    templateId: item.templateId,
  }));

  return recommendations;
}

/**
 * Compute all 6 dimension subscores
 */
function computeSubscores(
  candidate: Candidate,
  brief: IdeaBrief,
  repoStack?: RepoStack
): Subscores {
  return {
    goalFit: scoreGoalFit(candidate, brief),
    repoCompat: scoreRepoCompat(candidate, brief, repoStack),
    maintenance: scoreMaintenance(candidate),
    safety: scoreSafety(candidate),
    community: scoreCommunity(candidate),
    docsQuality: scoreDocsQuality(candidate),
  };
}

/**
 * Goal fit: how well the candidate matches the stated capabilities and domain
 * 
 * Deterministic logic based on name matching and ecosystem alignment
 */
function scoreGoalFit(candidate: Candidate, brief: IdeaBrief): number {
  let score = 50; // baseline

  const candidateLower = candidate.name.toLowerCase();
  const domainLower = brief.domain.toLowerCase();

  // Strong match: candidate name contains domain
  if (candidateLower.includes(domainLower)) {
    score += 30;
  }

  // Ecosystem match
  if (candidate.ecosystem === brief.ecosystem) {
    score += 20;
  }

  // Capability keywords in name
  for (const capability of brief.capabilities) {
    const capLower = capability.toLowerCase();
    if (candidateLower.includes(capLower)) {
      score += 10;
      break; // Only count once
    }
  }

  return Math.min(100, score);
}

/**
 * Repo compatibility: how well it fits with existing stack
 * 
 * If no repo stack provided, use ecosystem match as baseline
 */
function scoreRepoCompat(
  candidate: Candidate,
  brief: IdeaBrief,
  repoStack?: RepoStack
): number {
  if (!repoStack) {
    // No repo context - use ecosystem match
    return candidate.ecosystem === brief.ecosystem ? 75 : 50;
  }

  let score = 50;

  // Ecosystem match
  if (candidate.ecosystem === repoStack.ecosystem) {
    score += 30;
  }

  // Language compatibility
  if (repoStack.language) {
    const langLower = repoStack.language.toLowerCase();
    const nameLower = candidate.name.toLowerCase();
    
    if (nameLower.includes(langLower) || 
        (langLower === 'typescript' && candidate.ecosystem === 'npm')) {
      score += 20;
    }
  }

  return Math.min(100, score);
}

/**
 * Maintenance health: based on version and repository presence
 * 
 * In P1, we don't have live data, so use heuristics
 */
function scoreMaintenance(candidate: Candidate): number {
  let score = 50; // baseline

  // Has repository URL
  if (candidate.repositoryUrl) {
    score += 25;
  }

  // Version indicates maturity
  const version = candidate.version;
  if (version && typeof version === 'string') {
    const parts = version.split('.');
    if (parts.length > 0 && parts[0]) {
      const major = parseInt(parts[0], 10);
      if (!isNaN(major)) {
        if (major >= 1) {
          score += 25; // Stable release
        } else if (major === 0) {
          score += 10; // Pre-1.0
        }
      }
    }
  }

  return Math.min(100, score);
}

/**
 * Safety signals: license and security indicators
 * 
 * In P1, baseline score (no live OpenSSF data yet)
 */
function scoreSafety(candidate: Candidate): number {
  let score = 50; // baseline

  // Has repository (can be audited)
  if (candidate.repositoryUrl) {
    score += 25;
  }

  // Well-known packages get bonus
  const wellKnown = ['discord.js', 'express', 'react', 'vue', 'django', 'flask'];
  if (wellKnown.includes(candidate.name.toLowerCase())) {
    score += 25;
  }

  return Math.min(100, score);
}

/**
 * Community signal: popularity indicators
 * 
 * In P1, use name recognition heuristics
 */
function scoreCommunity(candidate: Candidate): number {
  let score = 50; // baseline

  // Well-known packages
  const popular = ['discord.js', 'express', 'react', 'vue', 'django', 'flask', 'fastapi'];
  if (popular.includes(candidate.name.toLowerCase())) {
    score += 40;
  }

  // Has homepage
  if (candidate.homepageUrl) {
    score += 10;
  }

  return Math.min(100, score);
}

/**
 * Docs quality: presence of documentation indicators
 * 
 * In P1, use homepage and repository as proxies
 */
function scoreDocsQuality(candidate: Candidate): number {
  let score = 50; // baseline

  // Has homepage (likely has docs)
  if (candidate.homepageUrl) {
    score += 25;
  }

  // Has repository (likely has README)
  if (candidate.repositoryUrl) {
    score += 25;
  }

  return Math.min(100, score);
}

/**
 * Compute weighted score from subscores
 */
function computeWeightedScore(subscores: Subscores): number {
  const score =
    subscores.goalFit * WEIGHTS.goalFit +
    subscores.repoCompat * WEIGHTS.repoCompat +
    subscores.maintenance * WEIGHTS.maintenance +
    subscores.safety * WEIGHTS.safety +
    subscores.community * WEIGHTS.community +
    subscores.docsQuality * WEIGHTS.docsQuality;

  return Math.round(score * 10) / 10; // Round to 1 decimal
}

/**
 * Create evidence passport with null facts (P1 - no collectors yet)
 */
function createEvidencePassport(
  candidate: Candidate,
  brief: IdeaBrief,
  subscores: Subscores
) {
  return {
    facts: {
      license: null,
      weeklyDownloads: null,
      lastCommit: null,
      stars: null,
      openIssues: null,
      openssfScore: null,
    },
    interpretation: {
      goalFit: generateGoalFitInterpretation(candidate, brief, subscores.goalFit),
      compatibility: generateCompatibilityInterpretation(candidate, brief),
      tradeoffs: generateTradeoffs(candidate, brief),
      warnings: generateWarnings(candidate, subscores),
      recommendedAlongside: generateRecommendedAlongside(candidate, brief),
    },
  };
}

/**
 * Generate goal fit interpretation
 */
function generateGoalFitInterpretation(
  _candidate: Candidate,
  brief: IdeaBrief,
  score: number
): string {
  if (score >= 80) {
    return `Excellent match for ${brief.domain} in ${brief.ecosystem}`;
  } else if (score >= 60) {
    return `Good fit for ${brief.domain} development`;
  } else {
    return `Moderate fit for ${brief.domain}`;
  }
}

/**
 * Generate compatibility interpretation
 */
function generateCompatibilityInterpretation(
  candidate: Candidate,
  _brief: IdeaBrief
): string {
  if (candidate.ecosystem === 'npm') {
    return 'Compatible with Node.js and TypeScript projects';
  } else if (candidate.ecosystem === 'pypi') {
    return 'Compatible with Python projects';
  } else if (candidate.ecosystem === 'github') {
    return 'GitHub repository - check language compatibility';
  }
  return 'Compatibility depends on your stack';
}

/**
 * Generate tradeoffs
 */
function generateTradeoffs(candidate: Candidate, brief: IdeaBrief): string[] {
  const tradeoffs: string[] = [];

  // Ecosystem-specific tradeoffs
  if (candidate.ecosystem !== brief.ecosystem) {
    tradeoffs.push(`Different ecosystem (${candidate.ecosystem} vs ${brief.ecosystem})`);
  }

  return tradeoffs;
}

/**
 * Generate warnings based on subscores
 */
function generateWarnings(candidate: Candidate, subscores: Subscores): string[] {
  const warnings: string[] = [];

  if (subscores.maintenance < 50) {
    warnings.push('Limited maintenance indicators');
  }

  if (subscores.safety < 50) {
    warnings.push('Limited safety signals available');
  }

  if (!candidate.repositoryUrl) {
    warnings.push('No repository URL available');
  }

  return warnings;
}

/**
 * Generate recommended alongside packages
 */
function generateRecommendedAlongside(candidate: Candidate, brief: IdeaBrief): string[] {
  const alongside: string[] = [];

  // Common pairings
  if (candidate.name.toLowerCase().includes('discord')) {
    alongside.push('dotenv');
    if (brief.ecosystem === 'npm') {
      alongside.push('typescript');
    }
  }

  if (candidate.ecosystem === 'npm' && brief.ecosystem === 'npm') {
    alongside.push('typescript');
  }

  return alongside;
}

/**
 * Check if scaffold template is available
 */
function hasScaffoldTemplate(candidate: Candidate, brief: IdeaBrief): boolean {
  // In P1, only discord.js has a template
  return candidate.name.toLowerCase() === 'discord.js' && 
         brief.domain.toLowerCase().includes('discord');
}

/**
 * Get template ID if available
 */
function getTemplateId(candidate: Candidate, brief: IdeaBrief): string | null {
  if (hasScaffoldTemplate(candidate, brief)) {
    return 'discord-summary-bot';
  }
  return null;
}

// Made with Bob
