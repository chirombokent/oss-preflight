export function buildIntentPrompt(idea: string): string {
  return `Parse this software idea into structured intent. Extract:
- capabilities (array of strings)
- domain (one of: discord, weather, web-framework, data-science, testing, http-client, or general)
- targetUser (string, optional)
- ecosystem (one of: npm, pypi, github)

Idea: "${idea}"

Respond with ONLY valid JSON matching this schema:
{
  "capabilities": ["string"],
  "domain": "discord|weather|web-framework|data-science|testing|http-client|general",
  "targetUser": "string",
  "ecosystem": "npm|pypi|github"
}`;
}
