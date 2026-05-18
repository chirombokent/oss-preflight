import type { Recommendation } from '@oss-preflight/core';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface ScaffoldResult {
  success: boolean;
  skipped: boolean;
  message: string;
}

export interface ScaffoldFile {
  path: string;
  content: string;
}

export interface ScaffoldFileResult extends ScaffoldResult {
  files: ScaffoldFile[];
}

const DISCORD_SUMMARY_BOT_TEMPLATES: ScaffoldFile[] = [
  {
    path: 'package.json',
    content: `{
  "name": "discord-summary-bot",
  "version": "1.0.0",
  "description": "Discord bot that summarizes channel activity",
  "type": "module",
  "main": "src/index.ts",
  "scripts": {
    "start": "node --loader ts-node/esm src/index.ts",
    "typecheck": "tsc --noEmit",
    "test": "node --loader ts-node/esm smoke-test.ts"
  },
  "dependencies": {
    "{{PACKAGE_NAME}}": "{{PACKAGE_VERSION}}",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "@types/node": "^20.11.19",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
`,
  },
  {
    path: 'tsconfig.json',
    content: `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": ".",
    "types": ["node"]
  },
  "include": ["src/**/*", "smoke-test.ts"],
  "exclude": ["node_modules", "dist"]
}
`,
  },
  {
    path: 'src/index.ts',
    content: `import { Client, GatewayIntentBits, TextChannel } from '{{PACKAGE_NAME}}';
import { summarizeMessages } from './summarizer.js';
import * as dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once('ready', () => {
  console.log(\`Logged in as \${client.user?.tag}\`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!summarize') {
    const channel = message.channel as TextChannel;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const messages = await channel.messages.fetch({ limit: 100 });

    const recentMessages = messages.filter(
      (msg) => msg.createdTimestamp > oneDayAgo && !msg.author.bot
    );

    if (recentMessages.size === 0) {
      await message.reply('No messages found in the last 24 hours.');
      return;
    }

    const messageTexts = recentMessages.map((msg) => ({
      author: msg.author.username,
      content: msg.content,
      timestamp: msg.createdAt.toISOString(),
    }));

    const summary = await summarizeMessages(messageTexts);
    await message.reply(\`**Channel Summary (Last 24h)**\\n\\n\${summary}\`);
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Error: DISCORD_TOKEN environment variable is required');
  process.exit(1);
}

client.login(token);
`,
  },
  {
    path: 'src/summarizer.ts',
    content: `interface Message {
  author: string;
  content: string;
  timestamp: string;
}

export async function summarizeMessages(messages: Message[]): Promise<string> {
  const messageCount = messages.length;
  const authors = new Set(messages.map((m) => m.author));
  const authorCount = authors.size;

  return [
    '**Activity Summary**',
    \`- \${messageCount} messages from \${authorCount} user(s)\`,
    \`- Active participants: \${Array.from(authors).join(', ')}\`,
    '',
    '**Key Topics:**',
    '- General discussion and updates',
    '',
    '*This is a mock summary. In production, this would use AI to generate insights.*',
  ].join('\\n');
}
`,
  },
  {
    path: 'smoke-test.ts',
    content: `import { summarizeMessages } from './src/summarizer.js';

interface MockMessage {
  id: string;
  content: string;
  author: {
    username: string;
    id: string;
  };
  timestamp: string;
  channelId: string;
}

const fallbackMessages: MockMessage[] = [
  {
    id: '1234567890',
    content: 'Hey team, just deployed the new feature to staging!',
    author: { username: 'alice', id: '111' },
    timestamp: '2026-05-16T10:30:00Z',
    channelId: 'general',
  },
  {
    id: '1234567891',
    content: "Great work! I'll test it this afternoon.",
    author: { username: 'bob', id: '222' },
    timestamp: '2026-05-16T11:15:00Z',
    channelId: 'general',
  },
  {
    id: '1234567892',
    content: 'Found a small bug in the login flow, creating a ticket.',
    author: { username: 'charlie', id: '333' },
    timestamp: '2026-05-16T14:20:00Z',
    channelId: 'general',
  },
  {
    id: '1234567893',
    content: 'Fixed! PR is up for review.',
    author: { username: 'alice', id: '111' },
    timestamp: '2026-05-16T16:45:00Z',
    channelId: 'general',
  },
  {
    id: '1234567894',
    content: 'LGTM, merging now.',
    author: { username: 'bob', id: '222' },
    timestamp: '2026-05-16T17:30:00Z',
    channelId: 'general',
  },
];

async function runSmokeTest(): Promise<void> {
  console.log('Running smoke test...');

  try {
    const messageTexts = fallbackMessages.map((msg) => ({
      author: msg.author.username,
      content: msg.content,
      timestamp: msg.timestamp,
    }));

    const summary = await summarizeMessages(messageTexts);

    if (!summary || summary.length === 0) {
      throw new Error('Summary is empty');
    }

    if (!summary.includes('Activity Summary')) {
      throw new Error('Summary missing expected content');
    }

    console.log('All smoke tests passed');
    console.log('No network calls made');
    console.log('No credentials required');
    process.exit(0);
  } catch (error) {
    console.error('Smoke test failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runSmokeTest();
`,
  },
];

/**
 * Generate a version hash for idempotency check
 */
function generateVersionHash(recommendation: Recommendation): string {
  const hashInput = `${recommendation.candidate.name}@${recommendation.candidate.version}`;
  return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
}

/**
 * Check if scaffold already exists with matching version hash
 */
function checkIdempotency(outputDir: string, versionHash: string): boolean {
  const hashFile = path.join(outputDir, '.scaffold-version');
  
  if (!fs.existsSync(outputDir)) {
    return false;
  }

  if (!fs.existsSync(hashFile)) {
    return false;
  }

  const existingHash = fs.readFileSync(hashFile, 'utf-8').trim();
  return existingHash === versionHash;
}

/**
 * Interpolate template variables
 */
function interpolateTemplate(content: string, recommendation: Recommendation): string {
  return content
    .replace(/\{\{PACKAGE_NAME\}\}/g, recommendation.candidate.name)
    .replace(/\{\{PACKAGE_VERSION\}\}/g, recommendation.candidate.version)
    .replace(/\{\{REPOSITORY_URL\}\}/g, recommendation.candidate.repositoryUrl || '')
    .replace(/\{\{HOMEPAGE_URL\}\}/g, recommendation.candidate.homepageUrl || '');
}

/**
 * Generate README.md
 */
function generateReadme(recommendation: Recommendation): string {
  return `# Discord Summary Bot

A Discord bot that summarizes channel activity, built with ${recommendation.candidate.name}.

## Installation

\`\`\`bash
npm install
\`\`\`

## Configuration

Create a \`.env\` file with your Discord bot token:

\`\`\`
DISCORD_TOKEN=your_token_here
\`\`\`

## Running

\`\`\`bash
npm start
\`\`\`

## Testing

Run the smoke test (uses mocked messages, no credentials required):

\`\`\`bash
npm test
\`\`\`

## Package Information

- **Package**: ${recommendation.candidate.name}@${recommendation.candidate.version}
- **Repository**: ${recommendation.candidate.repositoryUrl || 'N/A'}
- **License**: ${recommendation.passport.facts.license?.value || 'Unknown'}

## Next Steps

1. Get a Discord bot token from https://discord.com/developers/applications
2. Add the token to your \`.env\` file
3. Invite the bot to your server
4. Run \`npm start\` to start the bot

## Generated by OSS Preflight

This scaffold was generated by OSS Preflight based on your project requirements.
`;
}

/**
 * Generate ADOPTION_REPORT.md
 */
function generateAdoptionReport(recommendation: Recommendation, smokeResult?: { pass: boolean; output: string; duration: number }): string {
  const timestamp = new Date().toISOString();
  
  let report = `# Adoption Report

**Generated**: ${timestamp}

## Selected Candidate

- **Name**: ${recommendation.candidate.name}
- **Version**: ${recommendation.candidate.version}
- **Kind**: ${recommendation.candidate.kind ?? (recommendation.candidate.ecosystem === 'github' ? 'repository' : 'package')}
- **Ecosystem**: ${recommendation.candidate.ecosystem}
- **Score**: ${recommendation.score}/100

## Evidence Sources

`;

  // Add source URLs from facts
  const facts = recommendation.passport.facts;
  const sources = new Set<string>();

  if (facts.license?.source) sources.add(facts.license.source);
  if (facts.weeklyDownloads?.source) sources.add(facts.weeklyDownloads.source);
  if (facts.lastCommit?.source) sources.add(facts.lastCommit.source);
  if (facts.stars?.source) sources.add(facts.stars.source);
  if (facts.openIssues?.source) sources.add(facts.openIssues.source);

  for (const source of sources) {
    report += `- ${source}\n`;
  }

  report += `\n## Candidate Details

- **Repository**: ${recommendation.candidate.repositoryUrl || 'N/A'}
- **Homepage**: ${recommendation.candidate.homepageUrl || 'N/A'}
- **License**: ${facts.license?.value || 'Unknown'}
- **Weekly Downloads**: ${facts.weeklyDownloads?.value || 'N/A'}
- **Stars**: ${facts.stars?.value || 'N/A'}
- **Last Commit**: ${facts.lastCommit?.value || 'N/A'}

## Smoke Test

`;

  if (smokeResult) {
    if (smokeResult.pass) {
      report += `**Status**: PASS ✓\n`;
      report += `**Duration**: ${smokeResult.duration}ms\n\n`;
      report += `The smoke test completed successfully. The generated scaffold is ready to use.\n`;
    } else {
      report += `**Status**: FAIL ✗\n`;
      report += `**Duration**: ${smokeResult.duration}ms\n\n`;
      report += `### Error Output\n\n\`\`\`\n${smokeResult.output}\n\`\`\`\n`;
    }
  } else {
    report += `**Status**: Not run yet\n\n`;
    report += `Run \`npm test\` to execute the smoke test.\n`;
  }

  report += `\n## Next Steps

1. Review the generated code in \`src/\`
2. Run \`npm test\` to verify the smoke test passes
3. Configure your Discord bot token in \`.env\`
4. Customize the bot logic in \`src/index.ts\`
5. Deploy to your preferred hosting platform

## Tradeoffs

`;

  for (const tradeoff of recommendation.passport.interpretation.tradeoffs) {
    report += `- ${tradeoff}\n`;
  }

  if (recommendation.passport.interpretation.warnings.length > 0) {
    report += `\n## Warnings\n\n`;
    for (const warning of recommendation.passport.interpretation.warnings) {
      report += `- ${warning}\n`;
    }
  }

  report += `\n---\n\n*Generated by OSS Preflight*\n`;

  return report;
}

export function generateAdoptionPack(idea: string, recommendation: Recommendation): string {
  const facts = recommendation.passport.facts;
  const sources = new Set<string>();

  for (const fact of Object.values(facts)) {
    if (fact?.source) {
      sources.add(fact.source);
    }
  }

  return `# OSS Preflight Adoption Pack

## Input
${idea}

## Selected Candidate
- Name: ${recommendation.candidate.name}
- Version: ${recommendation.candidate.version}
- Kind: ${recommendation.candidate.kind ?? (recommendation.candidate.ecosystem === 'github' ? 'repository' : 'package')}
- Ecosystem: ${recommendation.candidate.ecosystem}
- Rank: ${recommendation.rank}
- Score: ${recommendation.score}

## Why This Was Recommended
${recommendation.passport.interpretation.goalFit}

${recommendation.passport.interpretation.compatibility}

## Evidence
- License: ${facts.license?.value ?? 'Not available'}
- Weekly downloads: ${facts.weeklyDownloads?.value ?? 'Not available'}
- Stars: ${facts.stars?.value ?? 'Not available'}
- Last commit: ${facts.lastCommit?.value ?? 'Not available'}
- OpenSSF score: ${facts.openssfScore?.value ?? 'Not available'}

## Evidence Sources
${sources.size > 0 ? [...sources].map((source) => `- ${source}`).join('\n') : '- No source URLs were available for collected facts'}

## Evidence Gaps
${Object.entries(facts)
  .filter(([, fact]) => fact === null)
  .map(([name]) => `- ${name}: not available`)
  .join('\n') || '- None'}

## Suggested Adoption Steps
1. Add the package with your package manager.
2. Read the linked upstream documentation and license.
3. Create a minimal integration test around the first use case.
4. Run your normal dependency audit before merging.

## Notes
No scaffold template was available for this package, so OSS Preflight generated this adoption pack instead of code.
`;
}

export function generateScaffoldFiles(
  recommendation: Recommendation,
  smokeResult?: { pass: boolean; output: string; duration: number }
): ScaffoldFileResult {
  if (!recommendation.scaffoldAvailable || recommendation.templateId !== 'discord-summary-bot') {
    return {
      success: false,
      skipped: false,
      message: `No scaffold template is available for ${recommendation.candidate.name}`,
      files: [
        {
          path: 'ADOPTION_PACK.md',
          content: generateAdoptionPack(
            `Adopt ${recommendation.candidate.name} for this project.`,
            recommendation
          ),
        },
      ],
    };
  }

  const versionHash = generateVersionHash(recommendation);
  const files = DISCORD_SUMMARY_BOT_TEMPLATES.map((file) => ({
    path: file.path,
    content: interpolateTemplate(file.content, recommendation),
  }));

  files.push(
    { path: 'README.md', content: generateReadme(recommendation) },
    { path: 'ADOPTION_REPORT.md', content: generateAdoptionReport(recommendation, smokeResult) },
    { path: '.scaffold-version', content: versionHash }
  );

  return {
    success: true,
    skipped: false,
    message: 'Scaffold generated successfully',
    files,
  };
}

function writeScaffoldFiles(outputDir: string, files: ScaffoldFile[]): void {
  for (const file of files) {
    const outputPath = path.join(outputDir, file.path);
    const parentDir = path.dirname(outputPath);
    fs.mkdirSync(parentDir, { recursive: true });
    fs.writeFileSync(outputPath, file.content, 'utf-8');
  }
}

/**
 * Generate scaffold from recommendation
 */
export async function generateScaffold(
  recommendation: Recommendation,
  outputDir: string,
  smokeResult?: { pass: boolean; output: string; duration: number }
): Promise<ScaffoldResult> {
  try {
    if (!recommendation.scaffoldAvailable || recommendation.templateId !== 'discord-summary-bot') {
      return {
        success: false,
        skipped: false,
        message: `No scaffold template is available for ${recommendation.candidate.name}`,
      };
    }

    const versionHash = generateVersionHash(recommendation);

    // Check idempotency - skip only if no smoke result provided
    if (!smokeResult && checkIdempotency(outputDir, versionHash)) {
      return {
        success: true,
        skipped: true,
        message: 'Scaffold already exists with matching version',
      };
    }

    // If smokeResult provided, only update adoption report
    if (smokeResult && checkIdempotency(outputDir, versionHash)) {
      const adoptionReport = generateAdoptionReport(recommendation, smokeResult);
      fs.writeFileSync(path.join(outputDir, 'ADOPTION_REPORT.md'), adoptionReport, 'utf-8');
      return {
        success: true,
        skipped: false,
        message: 'Adoption report updated with smoke test results',
      };
    }

    const generated = generateScaffoldFiles(recommendation, smokeResult);
    writeScaffoldFiles(outputDir, generated.files);

    return {
      success: true,
      skipped: false,
      message: 'Scaffold generated successfully',
    };
  } catch (error) {
    return {
      success: false,
      skipped: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Made with Bob
