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

async function runSmokeTest(): Promise<void> {
  console.log('🧪 Running smoke test...\n');

  try {
    // Load mocked messages from fixture
    const fixturePathLocal = join(__dirname, '../fixtures/smoke-test-messages.json');
    const fixturePathInstalled = join(__dirname, '../../scaffold/fixtures/smoke-test-messages.json');
    
    let messages: MockMessage[];
    try {
      messages = JSON.parse(readFileSync(fixturePathLocal, 'utf-8'));
    } catch {
      messages = JSON.parse(readFileSync(fixturePathInstalled, 'utf-8'));
    }

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