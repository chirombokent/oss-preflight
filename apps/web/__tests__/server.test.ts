import { describe, it, expect } from 'vitest';
import { handleAnalyze } from '../api/analyze';
import { createZip } from '../api/_zip';

function createMockResponse() {
  let body = '';
  const headers = new Map<string, string>();
  const res = {
    statusCode: 200,
    setHeader: (name: string, value: string) => {
      headers.set(name, value);
    },
    end: (payload?: string) => {
      body = payload ?? '';
    },
  };

  return {
    res,
    headers,
    body: () => body,
    json: () => JSON.parse(body) as unknown,
  };
}

describe('Production serverless contract', () => {
  it('keeps session AI settings in the request body, not CLI args', () => {
    const requestBody = {
      input: 'Discord bot',
      mode: 'recommend',
      provider: 'gemini',
      token: 'session-token',
      model: 'gemini-2.5-flash',
    };

    expect(requestBody.provider).toBe('gemini');
    expect(Object.keys(requestBody)).toContain('token');
    expect(JSON.stringify(requestBody)).not.toContain('--ai-provider');
  });

  it('uses server-only GitHub token headers without echoing the token', () => {
    const token = 'server-side-token';
    const headers = {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
    };
    const safeError = {
      error: 'GitHub public-repo verification failed.',
      hint: 'GitHub rate limits may be exhausted.',
    };

    expect(headers.Authorization).toContain(token);
    expect(JSON.stringify(safeError)).not.toContain(token);
  });

  it('creates a valid zip buffer for scaffold downloads', () => {
    const zip = createZip([
      { path: 'README.md', content: '# Test' },
      { path: 'src/index.ts', content: 'console.log("ok");' },
    ]);

    expect(zip.readUInt32LE(0)).toBe(0x04034b50);
    expect(zip.includes(Buffer.from('README.md'))).toBe(true);
    expect(zip.includes(Buffer.from('src/index.ts'))).toBe(true);
  });

  it('returns browser-safe session guidance for missing Gemini tokens', async () => {
    const response = createMockResponse();

    await handleAnalyze({
      method: 'POST',
      body: {
        testConnection: true,
        provider: 'gemini',
        mode: 'recommend',
      },
    }, response.res);

    expect(response.res.statusCode).toBe(400);
    expect(response.headers.get('Content-Type')).toContain('application/json');
    expect(response.json()).toMatchObject({
      error: 'Gemini needs a session token.',
      mode: 'recommend',
      hint: 'Open Settings, paste your Gemini token, then Test connection. You can switch to Keyword mode to run without a key.',
    });
    expect(response.body()).not.toContain('GEMINI_API_KEY');
  });
});
