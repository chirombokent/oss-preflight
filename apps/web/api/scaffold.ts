import type { Recommendation } from '@oss-preflight/core';
import { generateScaffoldFiles } from '../../../packages/scaffold/src/index.js';
import { createZip } from './_zip.js';

interface ScaffoldBody {
  recommendation?: Recommendation;
}

export const config = {
  maxDuration: 60,
};

async function readJsonBody(req: any): Promise<ScaffoldBody> {
  if (req.body && typeof req.body === 'object') {
    return req.body as ScaffoldBody;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as ScaffoldBody;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  return raw ? JSON.parse(raw) as ScaffoldBody : {};
}

function sendJson(res: any, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function safeFileBase(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'oss-preflight';
}

export async function handleScaffold(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const recommendation = body.recommendation;
    if (!recommendation?.candidate?.name) {
      sendJson(res, 400, { error: 'Recommendation is required' });
      return;
    }

    const generated = generateScaffoldFiles(recommendation);
    const zip = createZip(generated.files);
    const baseName = generated.success
      ? `${safeFileBase(recommendation.candidate.name)}-starter`
      : `${safeFileBase(recommendation.candidate.name)}-adoption-pack`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${baseName}.zip"`);
    res.setHeader('X-OSS-Preflight-Scaffold-Type', generated.success ? 'template' : 'adoption-pack');
    res.setHeader('X-OSS-Preflight-Message', generated.message);
    res.end(zip);
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'Failed to generate scaffold zip',
    });
  }
}

export default handleScaffold;
