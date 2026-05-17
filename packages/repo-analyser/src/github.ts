/**
 * GitHub metadata fetcher
 * 
 * Fetches manifest files from GitHub repositories without cloning.
 * Uses GitHub's raw content API.
 */

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Support formats:
  // - https://github.com/owner/repo
  // - https://github.com/owner/repo.git
  // - https://github.com/owner/repo/tree/branch
  const match = url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  if (!match) {
    return null;
  }
  
  return {
    owner: match[1]!,
    repo: match[2]!,
  };
}

/**
 * Fetch raw file content from GitHub
 * 
 * Uses the raw.githubusercontent.com endpoint which doesn't require authentication
 * for public repos.
 */
export async function fetchGitHubFile(
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): Promise<string> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      // Try 'master' branch if 'main' fails
      if (branch === 'main') {
        return fetchGitHubFile(owner, repo, path, 'master');
      }
      throw new Error(`GitHub file not found: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch GitHub file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetch package.json from GitHub
 */
export async function fetchGitHubPackageJson(owner: string, repo: string): Promise<string> {
  return fetchGitHubFile(owner, repo, 'package.json');
}

/**
 * Fetch requirements.txt from GitHub
 */
export async function fetchGitHubRequirementsTxt(owner: string, repo: string): Promise<string> {
  return fetchGitHubFile(owner, repo, 'requirements.txt');
}

/**
 * Fetch pyproject.toml from GitHub
 */
export async function fetchGitHubPyprojectToml(owner: string, repo: string): Promise<string> {
  return fetchGitHubFile(owner, repo, 'pyproject.toml');
}

/**
 * Check if a file exists in GitHub repo
 */
export async function checkGitHubFileExists(
  owner: string,
  repo: string,
  path: string,
  branch: string = 'main'
): Promise<boolean> {
  try {
    await fetchGitHubFile(owner, repo, path, branch);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect which manifest files exist in a GitHub repo
 */
export async function detectGitHubManifests(
  owner: string,
  repo: string
): Promise<{
  hasPackageJson: boolean;
  hasPackageLock: boolean;
  hasPnpmLock: boolean;
  hasYarnLock: boolean;
  hasRequirementsTxt: boolean;
  hasPyprojectToml: boolean;
  hasReadme: boolean;
}> {
  const [
    hasPackageJson,
    hasPackageLock,
    hasPnpmLock,
    hasYarnLock,
    hasRequirementsTxt,
    hasPyprojectToml,
    hasReadme,
  ] = await Promise.all([
    checkGitHubFileExists(owner, repo, 'package.json'),
    checkGitHubFileExists(owner, repo, 'package-lock.json'),
    checkGitHubFileExists(owner, repo, 'pnpm-lock.yaml'),
    checkGitHubFileExists(owner, repo, 'yarn.lock'),
    checkGitHubFileExists(owner, repo, 'requirements.txt'),
    checkGitHubFileExists(owner, repo, 'pyproject.toml'),
    checkGitHubFileExists(owner, repo, 'README.md'),
  ]);
  
  return {
    hasPackageJson,
    hasPackageLock,
    hasPnpmLock,
    hasYarnLock,
    hasRequirementsTxt,
    hasPyprojectToml,
    hasReadme,
  };
}

// Made with Bob