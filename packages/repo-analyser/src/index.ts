/**
 * @oss-preflight/repo-analyser
 * 
 * Repository context detection and analysis.
 * Supports local paths, GitHub URLs, and manifest files.
 * 
 * Never clones repos - uses GitHub raw content API.
 * Never executes discovered code.
 * Missing fields are explicit null, never omitted.
 */

export { detectRepoContext } from './detector.js';
export { 
  parsePackageJson,
  parseRequirementsTxt,
  parsePyprojectToml,
  fileExists,
  directoryExists,
} from './parser.js';
export {
  parseGitHubUrl,
  fetchGitHubFile,
  fetchGitHubPackageJson,
  fetchGitHubRequirementsTxt,
  fetchGitHubPyprojectToml,
  checkGitHubFileExists,
  detectGitHubManifests,
} from './github.js';
export type {
  RepoContext,
  RepoInput,
  PackageJsonManifest,
  RequirementsTxtManifest,
  PyprojectTomlManifest,
} from './types.js';
export { RepoContextSchema } from './types.js';

// Made with Bob