/**
 * Scaffold Command - Phase P4
 * 
 * Generates a working starter from a recommendation JSON
 */

import { generateScaffold, runSmokeTest } from '@oss-preflight/scaffold';
import type { Recommendation } from '@oss-preflight/core';
import * as fs from 'fs';
import * as path from 'path';

export interface ScaffoldOptions {
  recommendation?: string;
  out?: string;
}

/**
 * Scaffold command handler
 */
export async function scaffoldCommand(options: ScaffoldOptions): Promise<void> {
  try {
    // Validate options
    if (!options.recommendation) {
      console.error('Error: --recommendation flag is required');
      console.error('Usage: oss-preflight scaffold --recommendation <path> --out <directory>');
      process.exit(2);
    }

    if (!options.out) {
      console.error('Error: --out flag is required');
      console.error('Usage: oss-preflight scaffold --recommendation <path> --out <directory>');
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

    // Handle both single recommendation and array of recommendations
    const recommendation: Recommendation = Array.isArray(recommendationData)
      ? recommendationData[0]
      : recommendationData;

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