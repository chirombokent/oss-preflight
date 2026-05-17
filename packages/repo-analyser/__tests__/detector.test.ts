import { describe, it, expect } from 'vitest';
import * as path from 'path';
import { detectRepoContext } from '../src/detector.js';

describe('detectRepoContext', () => {
  describe('NPM project detection', () => {
    it('should detect npm project from local path', async () => {
      const fixturesPath = path.join(__dirname, 'fixtures', 'npm-project');
      const context = await detectRepoContext(fixturesPath);
      
      expect(context.packageManager).toBe('npm');
      expect(context.ecosystem).toBe('npm');
      expect(context.language).toContain('javascript');
      expect(context.language).toContain('typescript');
      expect(context.hasReadme).toBe(true);
      expect(context.license).toBe('MIT');
      expect(context.dependencies).toHaveProperty('express');
      expect(context.dependencies).toHaveProperty('axios');
      expect(context.devDependencies).toHaveProperty('vitest');
      expect(context.scripts).toHaveProperty('start');
      expect(context.scripts).toHaveProperty('test');
      expect(context.framework).toBe('express');
      expect(context.detectedAt).toBeTruthy();
    });
    
    it('should detect from package.json manifest file', async () => {
      const manifestPath = path.join(__dirname, 'fixtures', 'npm-project', 'package.json');
      const context = await detectRepoContext(manifestPath);
      
      expect(context.packageManager).toBe('npm');
      expect(context.ecosystem).toBe('npm');
      expect(context.dependencies).toHaveProperty('express');
    });
  });
  
  describe('Python project detection', () => {
    it('should detect pip project from local path', async () => {
      const fixturesPath = path.join(__dirname, 'fixtures', 'python-project');
      const context = await detectRepoContext(fixturesPath);
      
      expect(context.packageManager).toBe('pip');
      expect(context.ecosystem).toBe('pypi');
      expect(context.language).toContain('python');
      expect(context.hasReadme).toBe(true);
      expect(context.dependencies).toHaveProperty('flask');
      expect(context.dependencies).toHaveProperty('requests');
      expect(context.dependencies).toHaveProperty('pytest');
      expect(context.framework).toBe('flask');
      expect(context.detectedAt).toBeTruthy();
    });
    
    it('should detect from requirements.txt manifest file', async () => {
      const manifestPath = path.join(__dirname, 'fixtures', 'python-project', 'requirements.txt');
      const context = await detectRepoContext(manifestPath);
      
      expect(context.packageManager).toBe('pip');
      expect(context.ecosystem).toBe('pypi');
      expect(context.dependencies).toHaveProperty('flask');
    });
  });
  
  describe('Error handling', () => {
    it('should return unknown context for non-existent path', async () => {
      const context = await detectRepoContext('/non/existent/path');
      
      expect(context.packageManager).toBe('unknown');
      expect(context.detectionErrors).toBeDefined();
      if (context.detectionErrors) {
        expect(context.detectionErrors.length).toBeGreaterThan(0);
      }
    });
    
    it('should handle missing fields as explicit null', async () => {
      const fixturesPath = path.join(__dirname, 'fixtures', 'python-project');
      const context = await detectRepoContext(fixturesPath);
      
      // Python project has no license in requirements.txt
      expect(context.license).toBe(null);
      // Python project has no scripts
      expect(context.scripts).toEqual({});
    });
  });
  
  describe('Determinism', () => {
    it('should produce identical results for same input', async () => {
      const fixturesPath = path.join(__dirname, 'fixtures', 'npm-project');
      
      const context1 = await detectRepoContext(fixturesPath);
      const context2 = await detectRepoContext(fixturesPath);
      
      // Timestamps will differ, so compare everything except detectedAt
      expect(context1.packageManager).toBe(context2.packageManager);
      expect(context1.ecosystem).toBe(context2.ecosystem);
      expect(context1.language).toEqual(context2.language);
      expect(context1.framework).toBe(context2.framework);
      expect(context1.dependencies).toEqual(context2.dependencies);
      expect(context1.devDependencies).toEqual(context2.devDependencies);
      expect(context1.license).toBe(context2.license);
      expect(context1.hasReadme).toBe(context2.hasReadme);
    });
  });
});

// Made with Bob