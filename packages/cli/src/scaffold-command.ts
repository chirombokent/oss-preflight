/**
 * Scaffold Command - Phase P4 + P9 Phase 2
 *
 * Generates a working starter from a recommendation JSON
 * Supports three input formats:
 * 1. Full recommend --json --save wrapper (extract by rank)
 * 2. Array of recommendations (select by rank)
 * 3. Single recommendation object (ignore rank)
 */

import { generateScaffold, runSmokeTest } from '@oss-preflight/scaffold';
import type { Recommendation, IdeaBrief } from '@oss-preflight/core';
import * as fs from 'fs';
import * as path from 'path';

export interface ScaffoldOptions {
  recommendation?: string;
  out?: string;
  rank?: string;
}

/**
 * Response wrapper format from recommend --save
 */
interface RecommendationWrapper {
  workflowId: string;
  timestamp: string;
  idea: string;
  brief: IdeaBrief;
  recommendations: Recommendation[];
}

/**
 * Extract recommendation from various input formats
 */
function extractRecommendation(data: any, rank: number): Recommendation {
  // Format 1: Full wrapper from recommend --save
  if (data.workflowId && data.recommendations && Array.isArray(data.recommendations)) {
    const wrapper = data as RecommendationWrapper;
    if (rank < 1 || rank > wrapper.recommendations.length) {
      throw new Error(`Rank ${rank} is out of bounds. Available recommendations: ${wrapper.recommendations.length}`);
    }
    const recommendation = wrapper.recommendations[rank - 1];
    if (!recommendation) {
      throw new Error(`Recommendation at rank ${rank} not found`);
    }
    return recommendation;
  }

  // Format 2: Array of recommendations
  if (Array.isArray(data)) {
    if (rank < 1 || rank > data.length) {
      throw new Error(`Rank ${rank} is out of bounds. Available recommendations: ${data.length}`);
    }
    const recommendation = data[rank - 1];
    if (!recommendation) {
      throw new Error(`Recommendation at rank ${rank} not found`);
    }
    return recommendation;
  }

  // Format 3: Single recommendation object (ignore rank)
  if (data.candidate) {
    return data as Recommendation;
  }

  throw new Error('Invalid recommendation format');
}

/**
 * Scaffold command handler
 */
export async function scaffoldCommand(options: ScaffoldOptions): Promise<void> {
  try {
    // Validate options
    if (!options.recommendation) {
      console.error('Error: --recommendation flag is required');
      console.error('Usage: oss-preflight scaffold --recommendation <path> --out <directory> [--rank <number>]');
      process.exit(2);
    }

    if (!options.out) {
      console.error('Error: --out flag is required');
      console.error('Usage: oss-preflight scaffold --recommendation <path> --out <directory> [--rank <number>]');
      process.exit(2);
    }

    // Parse rank (1-indexed, default 1)
    const rank = options.rank ? parseInt(options.rank, 10) : 1;
    if (isNaN(rank) || rank < 1) {
      console.error('Error: --rank must be a positive integer (1, 2, or 3)');
      process.exit(2);
    }

    // Load recommendation JSON
    const recommendationPath = path.resolve(options.recommendation);
    if (!fs.existsSync(recommendationPath)) {
      console.error(`Error: Recommendation file not found: ${recommendationPath}`);
      process.exit(2);
    }

    const recommendationData = JSON.parse(
      fs.readFileSync(recommendationPath, 'utf-8')
    );

    // Extract recommendation based on format and rank
    let recommendation: Recommendation;
    try {
      recommendation = extractRecommendation(recommendationData, rank);
    } catch (error) {
      console.error(`Error: ${(error as Error).message}`);
      process.exit(2);
    }

    if (!recommendation || !recommendation.candidate) {
      console.error('Error: Invalid recommendation format');
      process.exit(2);
    }

    console.log(`\n🚀 Generating scaffold for ${recommendation.candidate.name}@${recommendation.candidate.version}...\n`);

    // Generate scaffold
    const outputDir = path.resolve(options.out);
    const scaffoldResult = await generateScaffold(recommendation, outputDir);

    if (!scaffoldResult.success) {
      console.error(`Error: ${scaffoldResult.message}`);
      process.exit(1);
    }

    if (scaffoldResult.skipped) {
      console.log('✓ Scaffold already exists (idempotent check passed)');
      console.log(`  Output: ${outputDir}\n`);
      process.exit(0);
    }

    console.log('✓ Scaffold generated successfully');
    console.log(`  Output: ${outputDir}\n`);

    // Run smoke test
    console.log('🧪 Running smoke test...\n');
    const smokeResult = await runSmokeTest(outputDir);

    // Update adoption report with smoke test results
    await generateScaffold(recommendation, outputDir, smokeResult);

    // Print results
    if (smokeResult.pass) {
      console.log('✅ Smoke test PASSED');
      console.log(`   Duration: ${smokeResult.duration}ms\n`);
      console.log('📄 Files generated:');
      console.log('   - src/index.ts');
      console.log('   - src/summarizer.ts');
      console.log('   - package.json');
      console.log('   - README.md');
      console.log('   - ADOPTION_REPORT.md');
      console.log('   - smoke-test.ts\n');
      console.log(`📋 See ADOPTION_REPORT.md for details\n`);
      process.exit(0);
    } else {
      console.error('❌ Smoke test FAILED');
      console.error(`   Duration: ${smokeResult.duration}ms\n`);
      console.error('Error output:');
      console.error(smokeResult.output);
      console.error('\n📋 See ADOPTION_REPORT.md for details\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Made with Bob