#!/usr/bin/env node

/**
 * OSS Preflight CLI - Phase P3 + P9 Phase 2
 *
 * Main entry point with Commander.js setup
 * Commands: recommend, scaffold, run, audit
 *
 * One-pipeline contract: web and skill call this CLI, never import core directly
 */

import { Command } from 'commander';
import { runRecommendPipeline, validateInput } from './recommend-command.js';
import { scaffoldCommand } from './scaffold-command.js';
import { runCommand } from './run-command.js';
import { auditCommand } from './audit-command.js';
import { formatOutput } from './output-formatter.js';
import { isAiConfigError } from './ai/index.js';

const program = new Command();

program
  .name('oss-preflight')
  .description('OSS Preflight - Evidence-backed package recommendations')
  .version('0.1.0');

/**
 * Recommend command - full pipeline
 */
program
  .command('recommend')
  .description('Get package recommendations for your idea')
  .requiredOption('--idea <string>', 'Your software idea or requirement')
  .option('--json', 'Output as JSON')
  .option('--save', 'Save recommendations to .oss-preflight/recommendations/latest.json')
  .option('--format <type>', 'Output format: table, json, or md', 'table')
  .option('--refresh', 'Force live collector calls, bypass cache')
  .option('--ai-provider <provider>', 'AI provider: anthropic, openai-compatible, gemini, or keyword')
  .option('--ai-model <model>', 'AI model for the selected provider')
  .option('--ai-base-url <url>', 'Base URL for the selected AI provider')
  .option('--config <path>', 'Path to OSS Preflight config JSON')
  .action(async (options) => {
    try {
      // Validate input
      validateInput(options.idea);

      // Run pipeline
      const { recommendations, brief } = await runRecommendPipeline(options.idea, {
        refresh: options.refresh,
        provider: options.aiProvider,
        model: options.aiModel,
        baseUrl: options.aiBaseUrl,
        config: options.config,
        save: options.save,
      });

      // Determine format
      const format = options.json ? 'json' : (options.format || 'table');

      // Format and output
      const output = formatOutput(recommendations, brief, format as 'table' | 'json' | 'md');
      console.log(output);

      process.exit(0);
    } catch (error) {
      const err = error as Error;

      // Exit code logic per architecture.md section 14
      if (isAiConfigError(error)) {
        console.error('Error:', err.message);
        process.exit(3); // Config error
      } else if (err.message.includes('empty') || err.message.includes('cannot be empty')) {
        console.error('Error: Idea string cannot be empty');
        process.exit(2); // User input error
      } else {
        console.error('Error:', err.message);
        process.exit(1); // Collector/API error
      }
    }
  });

/**
 * Scaffold command - P4 + P9 Phase 2
 */
program
  .command('scaffold')
  .description('Generate a working starter from a recommendation')
  .option('--recommendation <path>', 'Path to recommendation JSON file')
  .option('--rank <number>', 'Select recommendation by rank (1-3)', '1')
  .option('--out <directory>', 'Output directory for generated code')
  .action(async (options) => {
    await scaffoldCommand(options);
  });

/**
 * Run command - P9 Phase 2
 * Complete workflow: recommend, scaffold, verify, report
 */
program
  .command('run')
  .description('Complete workflow: recommend, scaffold, verify, report')
  .requiredOption('--idea <string>', 'Your software idea')
  .option('--out <directory>', 'Output directory (default: .oss-preflight/runs/<timestamp>)')
  .option('--rank <number>', 'Scaffold rank to use (1-3)', '1')
  .option('--ai-provider <provider>', 'AI provider: anthropic, openai-compatible, gemini, or keyword')
  .option('--ai-model <model>', 'AI model for the selected provider')
  .option('--ai-base-url <url>', 'Base URL for the selected AI provider')
  .option('--config <path>', 'Path to OSS Preflight config JSON')
  .action(async (options) => {
    await runCommand(options);
  });

/**
 * Audit command - P9 Phase 2
 * Audit an existing repository or manifest
 */
program
  .command('audit')
  .description('Audit an existing repository or manifest for dependency risks')
  .option('--repo <path-or-url>', 'Local path or GitHub URL to repository')
  .option('--manifest <path>', 'Path to package.json or requirements.txt')
  .option('--out <directory>', 'Output directory (default: .oss-preflight/audits/<timestamp>)')
  .option('--json', 'Emit a machine-readable JSON result on stdout')
  .action(async (options) => {
    await auditCommand(options);
  });

// Export for testing
export { program };

// Parse arguments only if this is the main module
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('index.js')) {
  program.parse();
}

// Made with Bob
