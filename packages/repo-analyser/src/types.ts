import { z } from 'zod';
import { EcosystemSchema } from '@oss-preflight/core';

/**
 * RepoContext - detected repository metadata
 * 
 * All fields are explicit - missing data is null, never omitted.
 * Detection errors are captured in detectionErrors array.
 */
export const RepoContextSchema = z.object({
  path: z.string(),
  packageManager: z.enum(['npm', 'pnpm', 'yarn', 'pip', 'poetry', 'unknown']),
  ecosystem: EcosystemSchema,
  language: z.array(z.string()),
  framework: z.string().nullable(),
  scripts: z.record(z.string()),
  dependencies: z.record(z.string()),
  devDependencies: z.record(z.string()),
  license: z.string().nullable(),
  hasReadme: z.boolean(),
  detectedAt: z.string(), // ISO-8601 UTC
  detectionErrors: z.array(z.string()).optional(),
});

export type RepoContext = z.infer<typeof RepoContextSchema>;

/**
 * Input type for repo detection
 */
export type RepoInput = 
  | { type: 'local-path'; path: string }
  | { type: 'github-url'; url: string }
  | { type: 'manifest-file'; path: string };

/**
 * Package manifest data structures
 */
export interface PackageJsonManifest {
  name?: string;
  version?: string;
  license?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  repository?: string | { type: string; url: string };
}

export interface RequirementsTxtManifest {
  dependencies: Record<string, string>;
}

export interface PyprojectTomlManifest {
  tool?: {
    poetry?: {
      name?: string;
      version?: string;
      license?: string;
      dependencies?: Record<string, string>;
      'dev-dependencies'?: Record<string, string>;
    };
  };
  project?: {
    name?: string;
    version?: string;
    license?: { text?: string };
    dependencies?: string[];
  };
}

// Made with Bob