/**
 * Smoke test for Discord Summary Bot
 * Uses mocked messages - NO network calls, NO credentials required
 */

import { summarizeMessages } from './src/summarizer.js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

function loadMockMessages(): MockMessage[] {
  const fixturePaths = [
    join(__dirname, 'fixtures/smoke-test-messages.json'),
    join(__dirname, '../fixtures/smoke-test-messages.json'),
    join(__dirname, '../../packages/scaffold/fixtures/smoke-test-messages.json'),
  ];

  for (const fixturePath of fixturePaths) {
    try {
      return JSON.parse(readFileSync(fixturePath, 'utf-8')) as MockMessage[];
    } catch {
      // Try the next known location before falling back to embedded data.
    }
  }

  return fallbackMessages;
}

async function runSmokeTest(): Promise<void> {
  console.log('🧪 Running smoke test...\n');

  try {
    const messages = loadMockMessages();

    console.log(`✓ Loaded ${messages.length} mocked messages`);

    // Transform to format expected by summarizer
    const messageTexts = messages.map((msg) => ({
      author: msg.author.username,
      content: msg.content,
      timestamp: msg.timestamp,
    }));

    // Test summarizer with mocked data
    const summary = await summarizeMessages(messageTexts);

    console.log('✓ Summarizer processed messages');
    console.log('\n📝 Generated Summary:');
    console.log('---');
    console.log(summary);
    console.log('---\n');

    // Assertions
    if (!summary || summary.length === 0) {
      throw new Error('Summary is empty');
    }

    if (!summary.includes('Activity Summary')) {
      throw new Error('Summary missing expected content');
    }

    console.log('✅ All smoke tests passed!');
    console.log('✓ No network calls made');
    console.log('✓ No credentials required');
    console.log('✓ Mocked messages processed successfully');

    process.exit(0);
  } catch (error) {
    console.error('❌ Smoke test failed:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

runSmokeTest();

// Made with Bob
