#!/usr/bin/env node

/**
 * OSS Preflight CLI - Phase P3
 *
 * Main entry point with Commander.js setup
 * Two commands: recommend and scaffold
 *
 * One-pipeline contract: web and skill call this CLI, never import core directly
 */

import { Command } from 'commander';
import { runRecommendPipeline, validateInput } from './recommend-command.js';
import { scaffoldCommand } from './scaffold-command.js';
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
 * Scaffold command - stub for P4
 */
program
  .command('scaffold')
  .description('Generate a working starter from a recommendation (Phase P4)')
  .option('--recommendation <json>', 'Recommendation JSON file or string')
  .option('--out <directory>', 'Output directory for generated code')
  .action(async (options) => {
    await scaffoldCommand(options);
  });

// Export for testing
export { program };

// Parse arguments only if this is the main module
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('index.js')) {
  program.parse();
}

// Made with Bob
