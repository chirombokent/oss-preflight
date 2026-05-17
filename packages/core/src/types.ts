import { z } from 'zod';

/**
 * Source type for evidence facts
 */
export const SourceTypeSchema = z.enum(['npm', 'pypi', 'github', 'openssf', 'inferred']);
export type SourceType = z.infer<typeof SourceTypeSchema>;

/**
 * Ecosystem type for packages
 */
export const EcosystemSchema = z.enum(['npm', 'pypi', 'github']);
export type Ecosystem = z.infer<typeof EcosystemSchema>;

/**
 * Evidence fact with source attribution
 */
export const EvidenceFactSchema = z.object({
  value: z.union([z.string(), z.number()]),
  source: z.string(),
  collectedAt: z.string(),
  sourceType: SourceTypeSchema,
}).nullable();

export type EvidenceFact = z.infer<typeof EvidenceFactSchema>;

/**
 * IdeaBrief - parsed user intent
 * 
 * @source: 'inferred' - capabilities, domain, targetUser, ecosystem are LLM-inferred
 */
export const IdeaBriefSchema = z.object({
  /**
   * @source inferred
   */
  capabilities: z.array(z.string()),
  /**
   * @source inferred
   */
  domain: z.string(),
  /**
   * @source inferred
   */
  targetUser: z.string().optional(),
  /**
   * @source inferred
   */
  ecosystem: EcosystemSchema,
  /**
   * User-provided constraints (not inferred)
   */
  constraints: z.record(z.any()).optional(),
});

export type IdeaBrief = z.infer<typeof IdeaBriefSchema>;

/**
 * Candidate - a package found in a registry
 */
export const CandidateSchema = z.object({
  name: z.string(),
  version: z.string(),
  ecosystem: EcosystemSchema,
  homepageUrl: z.string().nullable().optional(),
  repositoryUrl: z.string().nullable().optional(),
});

export type Candidate = z.infer<typeof CandidateSchema>;

/**
 * EvidencePassport - facts and interpretation separated
 */
export const EvidencePassportSchema = z.object({
  facts: z.object({
    license: EvidenceFactSchema,
    weeklyDownloads: EvidenceFactSchema,
    lastCommit: EvidenceFactSchema,
    stars: EvidenceFactSchema,
    openIssues: EvidenceFactSchema,
    openssfScore: EvidenceFactSchema,
  }),
  interpretation: z.object({
    /**
     * @source inferred
     */
    goalFit: z.string(),
    /**
     * @source inferred
     */
    compatibility: z.string(),
    /**
     * @source inferred
     */
    tradeoffs: z.array(z.string()),
    /**
     * @source inferred
     */
    warnings: z.array(z.string()),
    /**
     * @source inferred
     */
    recommendedAlongside: z.array(z.string()),
  }),
});

export type EvidencePassport = z.infer<typeof EvidencePassportSchema>;

/**
 * Collected facts for a single candidate (the `facts` block of an
 * EvidencePassport). Built by the I/O layer (collectors live in the CLI),
 * then injected into the pure scorer so core stays zero-I/O.
 */
export type CandidateFacts = EvidencePassport['facts'];

/**
 * Map of candidate name → collected facts, injected into `scoreAndRank`.
 * Candidates absent from the map (or facts left as `null`) keep explicit
 * `null` evidence — missing evidence is never silently invented.
 */
export type EvidenceMap = Record<string, CandidateFacts>;

/**
 * Subscores - 6 dimensions, each 0-100
 */
export const SubscoresSchema = z.object({
  goalFit: z.number().min(0).max(100),
  repoCompat: z.number().min(0).max(100),
  maintenance: z.number().min(0).max(100),
  safety: z.number().min(0).max(100),
  community: z.number().min(0).max(100),
  docsQuality: z.number().min(0).max(100),
});

export type Subscores = z.infer<typeof SubscoresSchema>;

/**
 * Recommendation - final ranked output
 */
export const RecommendationSchema = z.object({
  rank: z.number().int().positive(),
  score: z.number().min(0).max(100),
  candidate: CandidateSchema,
  subscores: SubscoresSchema,
  passport: EvidencePassportSchema,
  scaffoldAvailable: z.boolean(),
  templateId: z.string().nullable(),
});

export type Recommendation = z.infer<typeof RecommendationSchema>;

/**
 * Canonical ID for cache keys
 */
export type CanonicalId = string;

/**
 * Repo stack for compatibility scoring
 */
export interface RepoStack {
  ecosystem: Ecosystem;
  dependencies: string[];
  devDependencies?: string[];
  language?: string;
  frameworks?: string[];
}

// Made with Bob
