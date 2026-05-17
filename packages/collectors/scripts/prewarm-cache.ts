#!/usr/bin/env node
/**
 * Prewarm cache script - idempotent cache population for demo packages
 * 
 * Fetches live npm + GitHub data for demo packages (discord.js, discord.py, discordjs/discord.js repo)
 * and writes to .oss-preflight/cache/. Script checks cache timestamps and skips fetch if data is fresh
 * (within TTL). Run manually before demo; not part of `pnpm test`.
 */

import { collectNpmData } from '../src/npm.js';
import { collectGitHubData } from '../src/github.js';
import { collectOpenSSFData } from '../src/openssf.js';
import { readCache } from '../src/cache/index.js';

/**
 * Demo packages to prewarm — the exact npm Discord set the demo recommends,
 * plus their GitHub repos and OpenSSF scorecards. This is the live-API
 * seatbelt: with this cache committed, the demo never depends on a
 * rate-limited or down upstream API during judging.
 */
const DEMO_PACKAGES = {
  npm: ['discord.js', 'eris', 'oceanic.js'],
  github: ['discordjs/discord.js', 'abalabahaha/eris', 'OceanicJS/Oceanic'],
  openssf: ['discordjs/discord.js', 'abalabahaha/eris', 'OceanicJS/Oceanic']
};

/**
 * Check if cache is fresh (within TTL)
 */
async function isCacheFresh(ecosystem: string, id: string): Promise<boolean> {
  const cached = await readCache(ecosystem, id);
  return cached !== null && !cached.error;
}

/**
 * Prewarm npm packages
 */
async function prewarmNpm(): Promise<void> {
  console.log('Prewarming npm packages...');
  
  for (const packageName of DEMO_PACKAGES.npm) {
    const normalizedName = packageName.toLowerCase();
    
    if (await isCacheFresh('npm', normalizedName)) {
      console.log(`  OK ${packageName} - cache is fresh, skipping`);
      continue;
    }
    
    try {
      console.log(`  -> Fetching ${packageName}...`);
      await collectNpmData(packageName);
      console.log(`  OK ${packageName} - cached`);
    } catch (error) {
      console.error(`  FAIL ${packageName} - failed:`, (error as Error).message);
    }
  }
}

/**
 * Prewarm GitHub repositories
 */
async function prewarmGitHub(): Promise<void> {
  console.log('\nPrewarming GitHub repositories...');
  
  for (const repo of DEMO_PACKAGES.github) {
    const normalizedRepo = repo.toLowerCase();
    
    if (await isCacheFresh('github', normalizedRepo)) {
      console.log(`  OK ${repo} - cache is fresh, skipping`);
      continue;
    }
    
    try {
      console.log(`  -> Fetching ${repo}...`);
      await collectGitHubData(repo);
      console.log(`  OK ${repo} - cached`);
    } catch (error) {
      console.error(`  FAIL ${repo} - failed:`, (error as Error).message);
    }
  }
}

/**
 * Prewarm OpenSSF scorecards
 */
async function prewarmOpenSSF(): Promise<void> {
  console.log('\nPrewarming OpenSSF scorecards...');

  for (const repo of DEMO_PACKAGES.openssf) {
    const normalizedRepo = repo.toLowerCase();

    if (await isCacheFresh('openssf', normalizedRepo)) {
      console.log(`  OK ${repo} - cache is fresh, skipping`);
      continue;
    }

    try {
      console.log(`  -> Fetching OpenSSF ${repo}...`);
      await collectOpenSSFData(repo);
      console.log(`  OK ${repo} - cached`);
    } catch (error) {
      console.error(`  FAIL ${repo} - failed:`, (error as Error).message);
    }
  }
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('=== OSS Preflight Cache Prewarm ===\n');

  try {
    await prewarmNpm();
    await prewarmGitHub();
    await prewarmOpenSSF();

    console.log('\nOK Cache prewarm complete');
    process.exit(0);
  } catch (error) {
    console.error('\nFAIL Cache prewarm failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// Made with Bob
