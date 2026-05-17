import * as fs from 'fs/promises';
import type {
  PackageJsonManifest,
  RequirementsTxtManifest,
  PyprojectTomlManifest
} from './types.js';

/**
 * Parse package.json manifest
 */
export async function parsePackageJson(filePath: string): Promise<PackageJsonManifest> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const manifest = JSON.parse(content) as PackageJsonManifest;
    return manifest;
  } catch (error) {
    throw new Error(`Failed to parse package.json: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse requirements.txt manifest
 * 
 * Supports:
 * - package==version
 * - package>=version
 * - package
 * - # comments
 */
export async function parseRequirementsTxt(filePath: string): Promise<RequirementsTxtManifest> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const dependencies: Record<string, string> = {};
    
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      // Parse package specification
      // Match: package==version, package>=version, package<=version, package~=version, package
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)([=<>~!]+)?(.+)?$/);
      if (match) {
        const [, packageName, operator, version] = match;
        if (packageName) {
          dependencies[packageName] = version ? `${operator || ''}${version}` : '*';
        }
      }
    }
    
    return { dependencies };
  } catch (error) {
    throw new Error(`Failed to parse requirements.txt: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Parse pyproject.toml manifest
 * 
 * Basic TOML parser for Poetry and PEP 621 formats.
 * Only extracts the fields we need - not a full TOML parser.
 */
export async function parsePyprojectToml(filePath: string): Promise<PyprojectTomlManifest> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const manifest: PyprojectTomlManifest = {};
    
    // Simple TOML parsing - extract [tool.poetry] and [project] sections
    const lines = content.split('\n');
    let currentSection: string | null = null;
    let inDependencies = false;
    let inDevDependencies = false;
    
    const poetryData: any = {};
    const projectData: any = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      
      // Section headers
      if (trimmed.startsWith('[')) {
        const sectionMatch = trimmed.match(/^\[([^\]]+)\]$/);
        if (sectionMatch && sectionMatch[1]) {
          currentSection = sectionMatch[1];
          inDependencies = currentSection === 'tool.poetry.dependencies';
          inDevDependencies = currentSection === 'tool.poetry.dev-dependencies';
        }
        continue;
      }
      
      // Key-value pairs
      const kvMatch = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*(.+)$/);
      if (kvMatch) {
        const [, key, value] = kvMatch;
        if (!key || !value) continue;
        const cleanValue = value.replace(/^["']|["']$/g, '').trim();
        
        if (currentSection === 'tool.poetry') {
          if (key === 'name') poetryData.name = cleanValue;
          if (key === 'version') poetryData.version = cleanValue;
          if (key === 'license') poetryData.license = cleanValue;
        } else if (currentSection === 'project') {
          if (key === 'name') projectData.name = cleanValue;
          if (key === 'version') projectData.version = cleanValue;
        } else if (inDependencies && key) {
          if (!poetryData.dependencies) poetryData.dependencies = {};
          poetryData.dependencies[key] = cleanValue;
        } else if (inDevDependencies && key) {
          if (!poetryData['dev-dependencies']) poetryData['dev-dependencies'] = {};
          poetryData['dev-dependencies'][key] = cleanValue;
        }
      }
    }
    
    if (Object.keys(poetryData).length > 0) {
      manifest.tool = { poetry: poetryData };
    }
    if (Object.keys(projectData).length > 0) {
      manifest.project = projectData;
    }
    
    return manifest;
  } catch (error) {
    throw new Error(`Failed to parse pyproject.toml: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a directory exists
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

// Made with Bob