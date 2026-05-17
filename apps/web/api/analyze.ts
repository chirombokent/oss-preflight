import {
  runRecommendAnalysis,
  type RecommendAnalysisResult,
} from '../../../packages/cli/src/recommend-command.js';
import {
  runAuditPipeline,
  type AuditPipelineResult,
} from '../../../packages/cli/src/audit-command.js';
import {
  isAiConfigError,
  resolveAiConfig,
  type AiConfigOptions,
} from '../../../packages/cli/src/ai/index.js';

type AnalyzeMode = 'recommend' | 'audit';

interface AnalyzeBody {
  input?: unknown;
  provider?: unknown;
  token?: unknown;
  model?: unknown;
  baseUrl?: unknown;
  mode?: unknown;
  testConnection?: unknown;
}

interface GitHubTarget {
  owner: string;
  repo: string;
  fullName: string;
  url: string;
}

type AnalyzeResult =
  | (RecommendAnalysisResult & { detectedMode: AnalyzeMode; provider: string })
  | (AuditPipelineResult & { detectedMode: AnalyzeMode; provider: string });

export const config = {
  maxDuration: 60,
};

function cleanString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

async function readJsonBody(req: any): Promise<AnalyzeBody> {
  if (req.body && typeof req.body === 'object') {
    return req.body as AnalyzeBody;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as AnalyzeBody;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) as AnalyzeBody : {};
}

function sendJson(res: any, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function parseGitHubTarget(input: string): GitHubTarget | null {
  const trimmed = input.trim();
  const bareMatch = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (bareMatch) {
    const owner = bareMatch[1]!;
    const repo = bareMatch[2]!.replace(/\.git$/i, '');
    return {
      owner,
      repo,
      fullName: `${owner}/${repo}`,
      url: `https://github.com/${owner}/${repo}`,
    };
  }

  const urlMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com[/:]([^/\s#?]+)\/([^/\s#?]+?)(?:\.git)?(?:\/(?:tree|blob)\/[^#?\s]+)?\/?(?:[#?].*)?$/i
  );
  if (!urlMatch) {
    return null;
  }

  const owner = urlMatch[1]!;
  const repo = urlMatch[2]!.replace(/\.git$/i, '');
  return {
    owner,
    repo,
    fullName: `${owner}/${repo}`,
    url: `https://github.com/${owner}/${repo}`,
  };
}

function requestedMode(value: unknown): AnalyzeMode | null {
  if (value === 'recommend' || value === 'audit') {
    return value;
  }
  return null;
}

function aiOptionsFromBody(body: AnalyzeBody): AiConfigOptions {
  const provider = cleanString(body.provider) ?? 'keyword';
  const token = cleanString(body.token);
  return {
    provider,
    apiKey: provider === 'keyword' ? undefined : token,
    model: cleanString(body.model),
    baseUrl: cleanString(body.baseUrl),
    env: {},
    ignoreConfig: true,
  };
}

async function verifyPublicGitHubRepo(target: GitHubTarget): Promise<{ ok: true } | { ok: false; status: number; message: string; hint: string }> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'oss-preflight-web',
  };
  const githubToken = cleanString(process.env.GITHUB_TOKEN);
  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const response = await fetch(`https://api.github.com/repos/${target.fullName}`, { headers });
  if (response.ok) {
    const repo = await response.json() as { private?: boolean };
    if (repo.private) {
      return {
        ok: false,
        status: 404,
        message: 'OSS Preflight only analyzes public GitHub repositories.',
        hint: 'Use a public repository URL, or describe your app idea instead.',
      };
    }
    return { ok: true };
  }

  if (response.status === 404) {
    return {
      ok: false,
      status: 404,
      message: 'OSS Preflight only analyzes public GitHub repositories.',
      hint: 'Private or missing repositories cannot be inspected from the hosted app.',
    };
  }

  return {
    ok: false,
    status: response.status === 403 ? 429 : 502,
    message: 'GitHub public-repo verification failed.',
    hint: response.status === 403
      ? 'GitHub rate limits may be exhausted. A server-side GITHUB_TOKEN raises the public-data limit.'
      : 'Try again once GitHub is reachable.',
  };
}

function providerDisplayName(provider: unknown): string {
  switch (cleanString(provider)) {
    case 'anthropic':
      return 'Anthropic';
    case 'openai-compatible':
      return 'OpenAI-compatible';
    case 'gemini':
      return 'Gemini';
    case 'keyword':
      return 'Keyword mode';
    default:
      return 'Selected provider';
  }
}

function userFacingAiConfigError(error: unknown, body: AnalyzeBody): { error: string; hint: string } {
  const message = error instanceof Error ? error.message : 'Provider settings are invalid.';
  const provider = cleanString(body.provider);
  const label = providerDisplayName(provider);

  if (/requires\s+[A-Z0-9_]+_API_KEY/i.test(message)) {
    return {
      error: `${label} needs a session token.`,
      hint: `Open Settings, paste your ${label} token, then Test connection. You can switch to Keyword mode to run without a key.`,
    };
  }

  if (provider === 'openai-compatible' && /requires.+model/i.test(message)) {
    return {
      error: 'OpenAI-compatible needs a model.',
      hint: 'Open Settings, enter the model exposed by your /v1 endpoint, then Test connection.',
    };
  }

  return {
    error: message,
    hint: 'Check the session-only provider settings and token.',
  };
}

function sanitizeError(error: unknown, mode: AnalyzeMode, body: AnalyzeBody): { status: number; payload: { error: string; mode: AnalyzeMode; hint: string } } {
  if (isAiConfigError(error)) {
    const configError = userFacingAiConfigError(error, body);
    return {
      status: 400,
      payload: {
        error: configError.error,
        mode,
        hint: configError.hint,
      },
    };
  }

  const message = error instanceof Error ? error.message : 'Analyze request failed';
  return {
    status: mode === 'audit' && message.includes('Directory not found') ? 404 : 500,
    payload: {
      error: message,
      mode,
      hint: mode === 'audit'
        ? 'Confirm the repository is public and has a supported manifest.'
        : 'Try keyword mode or revise the idea prompt.',
    },
  };
}

export async function handleAnalyze(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  let body: AnalyzeBody = {};
  try {
    body = await readJsonBody(req);
    const aiOptions = aiOptionsFromBody(body);

    if (body.testConnection === true) {
      const resolved = resolveAiConfig(aiOptions);
      sendJson(res, 200, {
        ok: true,
        provider: resolved.provider,
        model: resolved.model,
        baseUrl: resolved.baseUrl,
        message: resolved.provider === 'keyword'
          ? 'Keyword mode is ready without a token.'
          : 'Provider settings are valid for this session.',
      });
      return;
    }

    const input = cleanString(body.input);
    if (!input) {
      sendJson(res, 400, {
        error: 'Input is required',
        mode: requestedMode(body.mode) ?? 'recommend',
        hint: 'Paste a public GitHub URL or describe your app idea.',
      });
      return;
    }

    const githubTarget = parseGitHubTarget(input);
    const detectedMode: AnalyzeMode = githubTarget ? 'audit' : 'recommend';
    const mode = requestedMode(body.mode) ?? detectedMode;

    if (mode === 'audit') {
      const target = githubTarget ?? parseGitHubTarget(input);
      if (!target) {
        sendJson(res, 400, {
          error: 'Audit mode requires a public GitHub repository.',
          mode,
          hint: 'Use github.com/owner/repo or owner/repo, or switch back to idea mode.',
        });
        return;
      }

      const verification = await verifyPublicGitHubRepo(target);
      if (!verification.ok) {
        sendJson(res, verification.status, {
          error: verification.message,
          mode,
          hint: verification.hint,
        });
        return;
      }

      const result = await runAuditPipeline({ repo: target.url, refresh: true });
      sendJson(res, 200, {
        ...result,
        detectedMode,
        provider: 'keyword',
      } satisfies AnalyzeResult);
      return;
    }

    const result = await runRecommendAnalysis(input, {
      ...aiOptions,
      refresh: true,
    });
    const resolved = resolveAiConfig(aiOptions);
    sendJson(res, 200, {
      ...result,
      detectedMode,
      provider: resolved.provider,
    } satisfies AnalyzeResult);
  } catch (error) {
    const fallbackMode = requestedMode(body.mode) ?? 'recommend';
    const sanitized = sanitizeError(error, fallbackMode, body);
    sendJson(res, sanitized.status, sanitized.payload);
  }
}

export default handleAnalyze;
