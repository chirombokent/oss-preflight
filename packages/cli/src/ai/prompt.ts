export function buildIntentPrompt(idea: string): string {
  return `Parse this software idea into structured intent. Extract:
- capabilities (array of strings)
- domain (short lowercase slug. Use a known slug when it clearly fits: discord, weather, web-framework, data-science, testing, http-client. Otherwise use a precise free-form slug such as music-generation, image-processing, vector-database, browser-automation, or general only when the idea is truly generic)
- targetUser (string, optional)
- ecosystem (one of: npm, pypi, github; this is the best initial search target, not a hard constraint)
- searchTerms (array of 3-6 registry-search phrases that would discover packages for this idea, including domain-specific synonyms and likely OSS terminology)

Idea: "${idea}"

Respond with ONLY valid JSON matching this schema:
{
  "capabilities": ["string"],
  "domain": "string",
  "targetUser": "string",
  "ecosystem": "npm|pypi|github",
  "searchTerms": ["string"]
}`;
}
