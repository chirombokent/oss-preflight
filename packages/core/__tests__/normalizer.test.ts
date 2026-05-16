import { describe, it, expect } from 'vitest';
import { normalizePackageName } from '../src/normalizer.js';

describe('normalizer.ts', () => {
  describe('normalizePackageName - npm', () => {
    it('converts npm package names to lowercase', () => {
      expect(normalizePackageName('Discord.JS', 'npm')).toBe('discord.js');
      expect(normalizePackageName('REACT', 'npm')).toBe('react');
      expect(normalizePackageName('Express', 'npm')).toBe('express');
    });

    it('preserves scoped package names', () => {
      expect(normalizePackageName('@types/node', 'npm')).toBe('@types/node');
      expect(normalizePackageName('@Types/Node', 'npm')).toBe('@types/node');
    });

    it('handles already normalized names', () => {
      expect(normalizePackageName('discord.js', 'npm')).toBe('discord.js');
      expect(normalizePackageName('lodash', 'npm')).toBe('lodash');
    });
  });

  describe('normalizePackageName - pypi', () => {
    it('normalizes underscores to dashes', () => {
      expect(normalizePackageName('my_package', 'pypi')).toBe('my-package');
      expect(normalizePackageName('some_other_lib', 'pypi')).toBe('some-other-lib');
    });

    it('converts to lowercase', () => {
      expect(normalizePackageName('Django', 'pypi')).toBe('django');
      expect(normalizePackageName('NumPy', 'pypi')).toBe('numpy');
    });

    it('handles mixed case and underscores', () => {
      expect(normalizePackageName('My_Package', 'pypi')).toBe('my-package');
      expect(normalizePackageName('SOME_LIB', 'pypi')).toBe('some-lib');
    });

    it('handles already normalized names', () => {
      expect(normalizePackageName('django', 'pypi')).toBe('django');
      expect(normalizePackageName('requests', 'pypi')).toBe('requests');
    });
  });

  describe('normalizePackageName - github', () => {
    it('normalizes owner/repo to lowercase', () => {
      expect(normalizePackageName('DiscordJS/discord.js', 'github')).toBe('discordjs/discord.js');
      expect(normalizePackageName('Facebook/React', 'github')).toBe('facebook/react');
    });

    it('handles already normalized names', () => {
      expect(normalizePackageName('microsoft/typescript', 'github')).toBe('microsoft/typescript');
    });

    it('handles full GitHub URLs', () => {
      expect(normalizePackageName('https://github.com/DiscordJS/discord.js', 'github'))
        .toBe('discordjs/discord.js');
      expect(normalizePackageName('https://github.com/Facebook/React', 'github'))
        .toBe('facebook/react');
    });

    it('handles GitHub URLs with .git suffix', () => {
      expect(normalizePackageName('https://github.com/DiscordJS/discord.js.git', 'github'))
        .toBe('discordjs/discord.js');
    });
  });

  describe('normalizePackageName - edge cases', () => {
    it('handles empty strings', () => {
      expect(normalizePackageName('', 'npm')).toBe('');
    });

    it('handles whitespace', () => {
      expect(normalizePackageName('  discord.js  ', 'npm')).toBe('discord.js');
      expect(normalizePackageName('  My_Package  ', 'pypi')).toBe('my-package');
    });

    it('produces stable output (idempotent)', () => {
      const name1 = normalizePackageName('Discord.JS', 'npm');
      const name2 = normalizePackageName(name1, 'npm');
      expect(name1).toBe(name2);

      const pypi1 = normalizePackageName('My_Package', 'pypi');
      const pypi2 = normalizePackageName(pypi1, 'pypi');
      expect(pypi1).toBe(pypi2);
    });
  });
});

// Made with Bob
