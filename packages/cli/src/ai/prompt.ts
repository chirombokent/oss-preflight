export function buildIntentPrompt(idea: string): string {
  return `Parse this software idea into structured intent. Extract:
- capabilities (array of strings)
- domain (string)
- targetUser (string, optional)
- ecosystem (one of: npm, pypi, github)

Idea: "${idea}"

Respond with ONLY valid JSON matching this schema:
{
  "capabilities": ["string"],
  "domain": "string",
  "targetUser": "string",
  "ecosystem": "npm|pypi|github"
}`;
}

