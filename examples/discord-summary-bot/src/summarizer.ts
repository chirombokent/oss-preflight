/**
 * Mock summarizer for smoke tests
 * In production, this would call an AI API
 */

interface Message {
  author: string;
  content: string;
  timestamp: string;
}

export async function summarizeMessages(messages: Message[]): Promise<string> {
  // Mock implementation for smoke tests
  const messageCount = messages.length;
  const authors = new Set(messages.map((m) => m.author));
  const authorCount = authors.size;

  // Simple mock summary
  const summary = [
    `📊 **Activity Summary**`,
    `- ${messageCount} messages from ${authorCount} user(s)`,
    `- Active participants: ${Array.from(authors).join(', ')}`,
    ``,
    `**Key Topics:**`,
    `- General discussion and updates`,
    ``,
    `*This is a mock summary. In production, this would use AI to generate insights.*`,
  ].join('\n');

  return summary;
}

// Made with Bob