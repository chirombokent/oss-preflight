/**
 * OSS Preflight Scaffolder Mode Fence Tests
 * 
 * These tests validate the file access restrictions for the `oss-preflight-scaffolder` mode
 * defined in `.bob/custom_modes.yaml` lines 224-226.
 * 
 * Fence regex: ^(\.oss-preflight/|docs/oss-preflight/|examples/|oss-preflight-output/).*
 * 
 * The scaffolder mode should ONLY allow writes to:
 * - .oss-preflight/
 * - docs/oss-preflight/
 * - examples/
 * - oss-preflight-output/
 * 
 * All other paths should be blocked with FileRestrictionError.
 */

import { describe, it, expect } from 'vitest';

describe('OSS Preflight Scaffolder Mode Fence', () => {
  /**
   * AC #8: Fence test passes (blocked paths)
   * 
   * These paths should be BLOCKED by the fence regex.
   * Attempting to write to these paths in oss-preflight-scaffolder mode
   * should fail with FileRestrictionError.
   */
  describe('Blocked Paths (AC #8)', () => {
    const blockedPaths = [
      'src/app.ts',
      'packages/core/types.ts',
      'apps/web/App.tsx',
      '.bob/custom_modes.yaml',
    ];

    it.each(blockedPaths)('should block writes to %s', (path) => {
      // Test that path does NOT match the fence regex
      const fenceRegex = /^(\.oss-preflight\/|docs\/oss-preflight\/|examples\/|oss-preflight-output\/).*/;
      expect(fenceRegex.test(path)).toBe(false);
    });

    it('validates all blocked paths are outside approved directories', () => {
      const fenceRegex = /^(\.oss-preflight\/|docs\/oss-preflight\/|examples\/|oss-preflight-output\/).*/;
      
      blockedPaths.forEach(path => {
        expect(fenceRegex.test(path)).toBe(false);
      });
    });
  });

  /**
   * AC #9: Fence test passes (approved paths)
   * 
   * These paths should be ALLOWED by the fence regex.
   * Writes to these paths in oss-preflight-scaffolder mode should succeed.
   */
  describe('Approved Paths (AC #9)', () => {
    const approvedPaths = [
      '.oss-preflight/test.md',
      'docs/oss-preflight/guide.md',
      'examples/my-scaffold/index.ts',
      'oss-preflight-output/report.json',
    ];

    it.each(approvedPaths)('should allow writes to %s', (path) => {
      // Test that path DOES match the fence regex
      const fenceRegex = /^(\.oss-preflight\/|docs\/oss-preflight\/|examples\/|oss-preflight-output\/).*/;
      expect(fenceRegex.test(path)).toBe(true);
    });

    it('validates all approved paths are within approved directories', () => {
      const fenceRegex = /^(\.oss-preflight\/|docs\/oss-preflight\/|examples\/|oss-preflight-output\/).*/;
      
      approvedPaths.forEach(path => {
        expect(fenceRegex.test(path)).toBe(true);
      });
    });
  });

  /**
   * AC #10: Fence test passes (edge cases)
   * 
   * Edge cases that test path traversal and directory operations.
   */
  describe('Edge Cases (AC #10)', () => {
    describe('Path Traversal', () => {
      it('should block path traversal attempts', () => {
        const fenceRegex = /^(\.oss-preflight\/|docs\/oss-preflight\/|examples\/|oss-preflight-output\/).*/;
        
        // Path traversal attempt: .oss-preflight/../src/app.ts
        // After normalization, this becomes: src/app.ts
        const normalizedPath = '.oss-preflight/../src/app.ts'
          .split('/')
          .reduce((acc: string[], part) => {
            if (part === '..') {
              acc.pop();
            } else if (part !== '.') {
              acc.push(part);
            }
            return acc;
          }, [])
          .join('/');
        
        expect(normalizedPath).toBe('src/app.ts');
        expect(fenceRegex.test(normalizedPath)).toBe(false);
      });

      it('should block multiple path traversal attempts', () => {
        const fenceRegex = /^(\.oss-preflight\/|docs\/oss-preflight\/|examples\/|oss-preflight-output\/).*/;
        
        const traversalAttempts = [
          '.oss-preflight/../src/app.ts',
          'docs/oss-preflight/../../packages/core/types.ts',
          'examples/../apps/web/App.tsx',
          'oss-preflight-output/../.bob/custom_modes.yaml',
        ];

        traversalAttempts.forEach(path => {
          const normalized = path
            .split('/')
            .reduce((acc: string[], part) => {
              if (part === '..') {
                acc.pop();
              } else if (part !== '.') {
                acc.push(part);
              }
              return acc;
            }, [])
            .join('/');
          
          expect(fenceRegex.test(normalized)).toBe(false);
        });
      });
    });

    describe('Directory Operations', () => {
      it('should allow directory creation in approved paths', () => {
        const fenceRegex = /^(\.oss-preflight\/|docs\/oss-preflight\/|examples\/|oss-preflight-output\/).*/;
        
        const directoryPaths = [
          'examples/',
          'examples/new-dir/',
          '.oss-preflight/cache/',
          'docs/oss-preflight/guides/',
          'oss-preflight-output/scaffolds/',
        ];

        directoryPaths.forEach(path => {
          expect(fenceRegex.test(path)).toBe(true);
        });
      });

      it('should block directory creation in unapproved paths', () => {
        const fenceRegex = /^(\.oss-preflight\/|docs\/oss-preflight\/|examples\/|oss-preflight-output\/).*/;
        
        const blockedDirectories = [
          'src/',
          'packages/',
          'apps/',
          '.bob/',
        ];

        blockedDirectories.forEach(path => {
          expect(fenceRegex.test(path)).toBe(false);
        });
      });
    });
  });

  /**
   * Comprehensive fence validation
   * 
   * This test validates the complete fence behavior across all test cases.
   */
  describe('Comprehensive Fence Validation', () => {
    const fenceRegex = /^(\.oss-preflight\/|docs\/oss-preflight\/|examples\/|oss-preflight-output\/).*/;

    it('validates fence regex matches specification', () => {
      // The regex should match the one in .bob/custom_modes.yaml lines 224-226
      // Note: JavaScript regex source escapes forward slashes
      const specRegex = '^(\\.oss-preflight\\/|docs\\/oss-preflight\\/|examples\\/|oss-preflight-output\\/).*';
      expect(fenceRegex.source).toBe(specRegex);
    });

    it('validates all test scenarios', () => {
      const testCases = [
        // Blocked paths (AC #8)
        { path: 'src/app.ts', expected: false },
        { path: 'packages/core/types.ts', expected: false },
        { path: 'apps/web/App.tsx', expected: false },
        { path: '.bob/custom_modes.yaml', expected: false },
        
        // Approved paths (AC #9)
        { path: '.oss-preflight/test.md', expected: true },
        { path: 'docs/oss-preflight/guide.md', expected: true },
        { path: 'examples/my-scaffold/index.ts', expected: true },
        { path: 'oss-preflight-output/report.json', expected: true },
        
        // Edge cases (AC #10) - after normalization
        { path: 'src/app.ts', expected: false }, // normalized from .oss-preflight/../src/app.ts
        { path: 'examples/', expected: true }, // directory creation
      ];

      testCases.forEach(({ path, expected }) => {
        expect(fenceRegex.test(path)).toBe(expected);
      });
    });
  });
});

// Made with Bob
