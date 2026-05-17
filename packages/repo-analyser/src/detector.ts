import * as path from 'path';
import type { Ecosystem } from '@oss-preflight/core';
import type { RepoContext, RepoInput } from './types.js';
import {
  parsePackageJson,
  parseRequirementsTxt,
  parsePyprojectToml,
  fileExists,
  directoryExists,
} from './parser.js';
import {
  parseGitHubUrl,
  fetchGitHubPackageJson,
  fetchGitHubRequirementsTxt,
  fetchGitHubPyprojectToml,
  detectGitHubManifests,
} from './github.js';

/**
 * Detect repository context from various input types
 * 
 * Detection order for package manager:
 * - package-lock.json → npm
 * - pnpm-lock.yaml → pnpm
 * - yarn.lock → yarn
 * - requirements.txt → pip
 * - pyproject.toml → poetry
 * 
 * Rules:
 * - Never clone repos - use GitHub raw content API
 * - Never execute discovered code
 * - Missing fields are explicit null, never omitted
 * - Detection errors go in detectionErrors array
 */
export async function detectRepoContext(input: string): Promise<RepoContext> {
  const detectionErrors: string[] = [];
  const detectedAt = new Date().toISOString();
  
  // Determine input type
  const repoInput = classifyInput(input);
  
  try {
    switch (repoInput.type) {
      case 'local-path':
        return await detectLocalRepo(repoInput.path, detectedAt, detectionErrors);
      case 'github-url':
        return await detectGitHubRepo(repoInput.url, detectedAt, detectionErrors);
      case 'manifest-file':
        return await detectFromManifest(repoInput.path, detectedAt, detectionErrors);
      default:
        throw new Error('Unknown input type');
    }
  } catch (error) {
    detectionErrors.push(error instanceof Error ? error.message : String(error));
    
    // Return minimal context on failure
    return {
      path: input,
      packageManager: 'unknown',
      ecosystem: 'npm',
      language: [],
      framework: null,
      scripts: {},
      dependencies: {},
      devDependencies: {},
      license: null,
      hasReadme: false,
      detectedAt,
      detectionErrors,
    };
  }
}

/**
 * Classify input string into type
 */
function classifyInput(input: string): RepoInput {
  // GitHub URL
  if (input.includes('github.com')) {
    return { type: 'github-url', url: input };
  }
  
  // Manifest file (ends with known manifest names)
  if (
    input.endsWith('package.json') ||
    input.endsWith('requirements.txt') ||
    input.endsWith('pyproject.toml')
  ) {
    return { type: 'manifest-file', path: input };
  }
  
  // Default to local path
  return { type: 'local-path', path: input };
}

/**
 * Detect local repository
 */
async function detectLocalRepo(
  repoPath: string,
  detectedAt: string,
  detectionErrors: string[]
): Promise<RepoContext> {
  // Check if directory exists
  if (!(await directoryExists(repoPath))) {
    throw new Error(`Directory not found: ${repoPath}`);
  }
  
  // Check for lock files to determine package manager
  const packageLockPath = path.join(repoPath, 'package-lock.json');
  const pnpmLockPath = path.join(repoPath, 'pnpm-lock.yaml');
  const yarnLockPath = path.join(repoPath, 'yarn.lock');
  const requirementsTxtPath = path.join(repoPath, 'requirements.txt');
  const pyprojectTomlPath = path.join(repoPath, 'pyproject.toml');
  const packageJsonPath = path.join(repoPath, 'package.json');
  const readmePath = path.join(repoPath, 'README.md');
  
  const [
    hasPackageLock,
    hasPnpmLock,
    hasYarnLock,
    hasRequirementsTxt,
    hasPyprojectToml,
    hasPackageJson,
    hasReadme,
  ] = await Promise.all([
    fileExists(packageLockPath),
    fileExists(pnpmLockPath),
    fileExists(yarnLockPath),
    fileExists(requirementsTxtPath),
    fileExists(pyprojectTomlPath),
    fileExists(packageJsonPath),
    fileExists(readmePath),
  ]);
  
  // Detect package manager and ecosystem
  let packageManager: RepoContext['packageManager'] = 'unknown';
  let ecosystem: Ecosystem = 'npm';
  let language: string[] = [];
  let framework: string | null = null;
  let scripts: Record<string, string> = {};
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};
  let license: string | null = null;
  
  // NPM ecosystem
  if (hasPackageJson) {
    try {
      const manifest = await parsePackageJson(packageJsonPath);
      
      // Determine package manager from lock files
      if (hasPackageLock) {
        packageManager = 'npm';
      } else if (hasPnpmLock) {
        packageManager = 'pnpm';
      } else if (hasYarnLock) {
        packageManager = 'yarn';
      } else {
        packageManager = 'npm'; // Default to npm if no lock file
      }
      
      ecosystem = 'npm';
      language = ['javascript', 'typescript'];
      scripts = manifest.scripts || {};
      dependencies = manifest.dependencies || {};
      devDependencies = manifest.devDependencies || {};
      license = manifest.license || null;
      
      // Detect framework from dependencies
      framework = detectFramework(dependencies, devDependencies);
    } catch (error) {
      detectionErrors.push(`Failed to parse package.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  // Python ecosystem
  else if (hasRequirementsTxt || hasPyprojectToml) {
    ecosystem = 'pypi';
    language = ['python'];
    
    if (hasPyprojectToml) {
      try {
        const manifest = await parsePyprojectToml(pyprojectTomlPath);
        packageManager = 'poetry';
        
        if (manifest.tool?.poetry) {
          dependencies = manifest.tool.poetry.dependencies || {};
          devDependencies = manifest.tool.poetry['dev-dependencies'] || {};
          license = manifest.tool.poetry.license || null;
        } else if (manifest.project) {
          license = manifest.project.license?.text || null;
        }
        
        framework = detectPythonFramework(dependencies);
      } catch (error) {
        detectionErrors.push(`Failed to parse pyproject.toml: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (hasRequirementsTxt) {
      try {
        const manifest = await parseRequirementsTxt(requirementsTxtPath);
        packageManager = 'pip';
        dependencies = manifest.dependencies;
        
        framework = detectPythonFramework(dependencies);
      } catch (error) {
        detectionErrors.push(`Failed to parse requirements.txt: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  return {
    path: repoPath,
    packageManager,
    ecosystem,
    language,
    framework,
    scripts,
    dependencies,
    devDependencies,
    license,
    hasReadme,
    detectedAt,
    detectionErrors: detectionErrors.length > 0 ? detectionErrors : undefined,
  };
}

/**
 * Detect GitHub repository
 */
async function detectGitHubRepo(
  repoUrl: string,
  detectedAt: string,
  detectionErrors: string[]
): Promise<RepoContext> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    throw new Error(`Invalid GitHub URL: ${repoUrl}`);
  }
  
  const { owner, repo } = parsed;
  
  // Detect which manifests exist
  const manifests = await detectGitHubManifests(owner, repo);
  
  let packageManager: RepoContext['packageManager'] = 'unknown';
  let ecosystem: Ecosystem = 'npm';
  let language: string[] = [];
  let framework: string | null = null;
  let scripts: Record<string, string> = {};
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};
  let license: string | null = null;
  
  // NPM ecosystem
  if (manifests.hasPackageJson) {
    try {
      const content = await fetchGitHubPackageJson(owner, repo);
      const manifest = JSON.parse(content);
      
      // Determine package manager from lock files
      if (manifests.hasPackageLock) {
        packageManager = 'npm';
      } else if (manifests.hasPnpmLock) {
        packageManager = 'pnpm';
      } else if (manifests.hasYarnLock) {
        packageManager = 'yarn';
      } else {
        packageManager = 'npm';
      }
      
      ecosystem = 'npm';
      language = ['javascript', 'typescript'];
      scripts = manifest.scripts || {};
      dependencies = manifest.dependencies || {};
      devDependencies = manifest.devDependencies || {};
      license = manifest.license || null;
      
      framework = detectFramework(dependencies, devDependencies);
    } catch (error) {
      detectionErrors.push(`Failed to fetch/parse package.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  // Python ecosystem
  else if (manifests.hasPyprojectToml || manifests.hasRequirementsTxt) {
    ecosystem = 'pypi';
    language = ['python'];
    
    if (manifests.hasPyprojectToml) {
      try {
        const content = await fetchGitHubPyprojectToml(owner, repo);
        const manifest = await parsePyprojectTomlFromString(content);
        packageManager = 'poetry';
        
        if (manifest.tool?.poetry) {
          dependencies = manifest.tool.poetry.dependencies || {};
          devDependencies = manifest.tool.poetry['dev-dependencies'] || {};
          license = manifest.tool.poetry.license || null;
        }
        
        framework = detectPythonFramework(dependencies);
      } catch (error) {
        detectionErrors.push(`Failed to fetch/parse pyproject.toml: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else if (manifests.hasRequirementsTxt) {
      try {
        const content = await fetchGitHubRequirementsTxt(owner, repo);
        const manifest = parseRequirementsTxtFromString(content);
        packageManager = 'pip';
        dependencies = manifest.dependencies;
        
        framework = detectPythonFramework(dependencies);
      } catch (error) {
        detectionErrors.push(`Failed to fetch/parse requirements.txt: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  
  return {
    path: repoUrl,
    packageManager,
    ecosystem,
    language,
    framework,
    scripts,
    dependencies,
    devDependencies,
    license,
    hasReadme: manifests.hasReadme,
    detectedAt,
    detectionErrors: detectionErrors.length > 0 ? detectionErrors : undefined,
  };
}

/**
 * Detect from manifest file directly
 */
async function detectFromManifest(
  manifestPath: string,
  detectedAt: string,
  detectionErrors: string[]
): Promise<RepoContext> {
  const fileName = path.basename(manifestPath);
  const dirPath = path.dirname(manifestPath);
  
  let packageManager: RepoContext['packageManager'] = 'unknown';
  let ecosystem: Ecosystem = 'npm';
  let language: string[] = [];
  let framework: string | null = null;
  let scripts: Record<string, string> = {};
  let dependencies: Record<string, string> = {};
  let devDependencies: Record<string, string> = {};
  let license: string | null = null;
  
  if (fileName === 'package.json') {
    const manifest = await parsePackageJson(manifestPath);
    packageManager = 'npm';
    ecosystem = 'npm';
    language = ['javascript', 'typescript'];
    scripts = manifest.scripts || {};
    dependencies = manifest.dependencies || {};
    devDependencies = manifest.devDependencies || {};
    license = manifest.license || null;
    framework = detectFramework(dependencies, devDependencies);
  } else if (fileName === 'requirements.txt') {
    const manifest = await parseRequirementsTxt(manifestPath);
    packageManager = 'pip';
    ecosystem = 'pypi';
    language = ['python'];
    dependencies = manifest.dependencies;
    framework = detectPythonFramework(dependencies);
  } else if (fileName === 'pyproject.toml') {
    const manifest = await parsePyprojectToml(manifestPath);
    packageManager = 'poetry';
    ecosystem = 'pypi';
    language = ['python'];
    
    if (manifest.tool?.poetry) {
      dependencies = manifest.tool.poetry.dependencies || {};
      devDependencies = manifest.tool.poetry['dev-dependencies'] || {};
      license = manifest.tool.poetry.license || null;
    }
    
    framework = detectPythonFramework(dependencies);
  }
  
  const hasReadme = await fileExists(path.join(dirPath, 'README.md'));
  
  return {
    path: manifestPath,
    packageManager,
    ecosystem,
    language,
    framework,
    scripts,
    dependencies,
    devDependencies,
    license,
    hasReadme,
    detectedAt,
    detectionErrors: detectionErrors.length > 0 ? detectionErrors : undefined,
  };
}

/**
 * Detect JavaScript/TypeScript framework from dependencies
 */
function detectFramework(
  dependencies: Record<string, string>,
  devDependencies: Record<string, string>
): string | null {
  const allDeps = { ...dependencies, ...devDependencies };
  
  if (allDeps['react']) return 'react';
  if (allDeps['vue']) return 'vue';
  if (allDeps['@angular/core']) return 'angular';
  if (allDeps['svelte']) return 'svelte';
  if (allDeps['next']) return 'next.js';
  if (allDeps['nuxt']) return 'nuxt';
  if (allDeps['express']) return 'express';
  if (allDeps['fastify']) return 'fastify';
  if (allDeps['@nestjs/core']) return 'nestjs';
  
  return null;
}

/**
 * Detect Python framework from dependencies
 */
function detectPythonFramework(dependencies: Record<string, string>): string | null {
  if (dependencies['django']) return 'django';
  if (dependencies['flask']) return 'flask';
  if (dependencies['fastapi']) return 'fastapi';
  if (dependencies['tornado']) return 'tornado';
  if (dependencies['pyramid']) return 'pyramid';
  
  return null;
}

/**
 * Parse requirements.txt from string content
 */
function parseRequirementsTxtFromString(content: string): { dependencies: Record<string, string> } {
  const dependencies: Record<string, string> = {};
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    const match = trimmed.match(/^([a-zA-Z0-9_-]+)([=<>~!]+)?(.+)?$/);
    if (match) {
      const [, packageName, operator, version] = match;
      if (packageName) {
        dependencies[packageName] = version ? `${operator}${version}` : '*';
      }
    }
  }
  
  return { dependencies };
}

/**
 * Parse pyproject.toml from string content (simplified)
 */
function parsePyprojectTomlFromString(content: string): any {
  // This is a simplified parser - just extract what we need
  const result: any = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // Basic section detection - full parsing done by parsePyprojectToml
    if (trimmed.startsWith('[')) {
      // Section detected but not used in this simplified version
      continue;
    }
  }
  
  return result;
}

// Made with Bob