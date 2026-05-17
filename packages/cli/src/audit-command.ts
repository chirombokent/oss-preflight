/**
 * Audit Command - P9 Phase 2
 * 
 * Audit an existing repository or manifest for dependency risks
 * Detects repo context, extracts dependencies, collects evidence, scores, and reports
 */

import { detectRepoContext, type RepoContext } from '@oss-preflight/repo-analyser';
import { scoreAndRank } from '@oss-preflight/core';
import { collectNpmData, collectGitHubData, collectOpenSSFData, collectPyPIData } from '@oss-preflight/collectors';
import { createWorkflowTrace, type WorkflowTrace } from '@oss-preflight/core';
import type { Candidate, CandidateFacts, EvidenceMap, Recommendation } from '@oss-preflight/core';
import { buildCandidateFacts, type CollectedInputs } from './recommend-command.js';
import * as fs from 'fs';
import * as path from 'path';

export interface AuditOptions {
  repo?: string;
  manifest?: string;
  out?: string;
  /**
   * Emit a single machine-readable JSON object on stdout. All progress logs
   * are redirected to stderr so stdout stays parseable (used by the web API).
   */
  json?: boolean;
}

/**
 * Risk assessment for a dependency
 */
interface DependencyRisk {
  name: string;
  version: string;
  risks: string[];
  score: number;
  recommendation?: Recommendation;
}

/**
 * Parse GitHub repo URL to owner/repo format
 */
function parseGitHubRepo(url: string): string | null {
  const match = url.match(/github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (!match) {
    return null;
  }
  return `${match[1]}/${match[2]}`;
}

/**
 * Find a GitHub owner/repo from a set of candidate URLs (repo, homepage,
 * PyPI project_urls). Returns the first GitHub match, or null.
 */
function findGitHubRepo(urls: Array<string | null | undefined>): string | null {
  for (const url of urls) {
    if (!url) continue;
    const normalized = url
      .replace(/^git\+/, '')
      .replace(/^git:\/\//, 'https://')
      .replace(/\.git$/, '');
    const ownerRepo = parseGitHubRepo(normalized);
    if (ownerRepo) {
      return ownerRepo;
    }
  }
  return null;
}

/**
 * Best-effort GitHub + OpenSSF enrichment for a resolved owner/repo. Mutates
 * `inputs` in place; any failure leaves the corresponding facts null.
 */
async function enrichFromGitHub(
  inputs: CollectedInputs,
  ownerRepo: string,
  forceRefresh: boolean
): Promise<void> {
  try {
    const gh = await collectGitHubData(ownerRepo, forceRefresh);
    inputs.github = {
      repo: {
        stargazers_count: gh.repo.stargazers_count ?? null,
        open_issues_count: gh.repo.open_issues_count ?? null,
        pushed_at: gh.repo.pushed_at ?? null,
      },
      sourceUrl: gh.sourceUrl,
      collectedAt: gh.collectedAt,
      retrievalSource: gh.source,
    };
  } catch {
    return; // GitHub unavailable → no OpenSSF lookup either.
  }

  try {
    const ossf = await collectOpenSSFData(ownerRepo, forceRefresh);
    inputs.openssf = {
      score: ossf.score,
      sourceUrl: ossf.sourceUrl,
      collectedAt: ossf.collectedAt,
      retrievalSource: ossf.source,
    };
  } catch {
    // OpenSSF unavailable → score stays null.
  }
}

/**
 * Collect evidence for a single dependency. Routes to the npm or PyPI
 * collector by ecosystem, then enriches with GitHub/OpenSSF when a source
 * repo can be resolved. Every collector call is best-effort.
 */
async function collectDependencyEvidence(
  name: string,
  ecosystem: 'npm' | 'pypi',
  forceRefresh: boolean
): Promise<CollectedInputs> {
  const inputs: CollectedInputs = {};

  try {
    if (ecosystem === 'pypi') {
      const pypiData = await collectPyPIData(name, forceRefresh);
      inputs.pypi = {
        metadata: { license: pypiData.metadata.info.license ?? null },
        sourceUrl: pypiData.sourceUrl,
        collectedAt: pypiData.collectedAt,
        retrievalSource: pypiData.source,
      };

      const projectUrls = Object.values(pypiData.metadata.info.project_urls ?? {});
      const ownerRepo = findGitHubRepo([
        pypiData.metadata.info.home_page,
        ...projectUrls,
      ]);
      if (ownerRepo) {
        await enrichFromGitHub(inputs, ownerRepo, forceRefresh);
      }
      return inputs;
    }

    const npmData = await collectNpmData(name, forceRefresh);
    inputs.npm = {
      metadata: { license: npmData.metadata.license ?? null },
      weeklyDownloads: npmData.weeklyDownloads,
      sourceUrl: npmData.sourceUrl,
      collectedAt: npmData.collectedAt,
      retrievalSource: npmData.source,
    };

    const ownerRepo = findGitHubRepo([npmData.metadata.repository?.url]);
    if (ownerRepo) {
      await enrichFromGitHub(inputs, ownerRepo, forceRefresh);
    }
  } catch {
    // Collector failed - evidence stays null
  }

  return inputs;
}

/**
 * Assess risks for a dependency
 */
function assessRisks(_name: string, facts: CandidateFacts | null, recommendation?: Recommendation): string[] {
  const risks: string[] = [];

  if (!facts) {
    risks.push('No evidence collected');
    return risks;
  }

  // License risk
  if (!facts.license || facts.license.value === null) {
    risks.push('Missing license information');
  }

  // OpenSSF risk
  if (facts.openssfScore) {
    const score = facts.openssfScore.value as number;
    if (score < 5) {
      risks.push(`Low OpenSSF score (${score}/10)`);
    }
  } else {
    risks.push('No OpenSSF score available');
  }

  // Maintenance risk
  if (facts.lastCommit) {
    const lastCommit = new Date(facts.lastCommit.value as string);
    const monthsAgo = (Date.now() - lastCommit.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsAgo > 12) {
      risks.push(`Stale maintenance (last commit ${Math.floor(monthsAgo)} months ago)`);
    }
  }

  // Low downloads (npm only)
  if (facts.weeklyDownloads) {
    const downloads = facts.weeklyDownloads.value as number;
    if (downloads < 1000) {
      risks.push(`Low adoption (${downloads} weekly downloads)`);
    }
  }

  // Warnings from recommendation
  if (recommendation?.passport.interpretation.warnings.length) {
    risks.push(...recommendation.passport.interpretation.warnings);
  }

  return risks;
}

/**
 * Generate audit report in markdown format
 */
function generateAuditReport(
  repoContext: RepoContext,
  dependencyRisks: DependencyRisk[],
  workflow: WorkflowTrace
): string {
  const highRisk = dependencyRisks.filter(d => d.risks.length >= 3);
  const mediumRisk = dependencyRisks.filter(d => d.risks.length === 2);
  const lowRisk = dependencyRisks.filter(d => d.risks.length === 1);
  const noRisk = dependencyRisks.filter(d => d.risks.length === 0);

  const report = `# OSS Preflight Audit Report

## Repository Context
**Path:** ${repoContext.path}  
**Ecosystem:** ${repoContext.ecosystem}  
**Package Manager:** ${repoContext.packageManager}  
**Language:** ${repoContext.language.join(', ')}  
${repoContext.framework ? `**Framework:** ${repoContext.framework}` : ''}
**License:** ${repoContext.license || 'Not specified'}

## Summary
- **Total Dependencies:** ${dependencyRisks.length}
- **High Risk:** ${highRisk.length} (3+ issues)
- **Medium Risk:** ${mediumRisk.length} (2 issues)
- **Low Risk:** ${lowRisk.length} (1 issue)
- **No Issues:** ${noRisk.length}

${highRisk.length > 0 ? `## ⚠️ High Risk Dependencies

${highRisk.map(dep => `### ${dep.name}@${dep.version}
**Score:** ${dep.score.toFixed(2)}/100

**Issues:**
${dep.risks.map(r => `- ⚠️ ${r}`).join('\n')}

${dep.recommendation ? `**Suggested Alternative:** ${dep.recommendation.candidate.name}@${dep.recommendation.candidate.version} (score: ${dep.recommendation.score.toFixed(2)})` : ''}
`).join('\n')}` : ''}

${mediumRisk.length > 0 ? `## ⚡ Medium Risk Dependencies

${mediumRisk.map(dep => `### ${dep.name}@${dep.version}
**Score:** ${dep.score.toFixed(2)}/100

**Issues:**
${dep.risks.map(r => `- ${r}`).join('\n')}
`).join('\n')}` : ''}

${lowRisk.length > 0 ? `## ℹ️ Low Risk Dependencies

${lowRisk.map(dep => `- **${dep.name}@${dep.version}** (score: ${dep.score.toFixed(2)}) - ${dep.risks[0]}`).join('\n')}
` : ''}

${noRisk.length > 0 ? `## ✅ No Issues Detected

${noRisk.map(dep => `- **${dep.name}@${dep.version}** (score: ${dep.score.toFixed(2)})`).join('\n')}
` : ''}

## Recommendations

${highRisk.length > 0 ? `1. **Address high-risk dependencies immediately** - Review the ${highRisk.length} package(s) with 3+ issues
2. **Consider alternatives** - Suggested replacements are provided for high-risk packages
3. **Update stale dependencies** - Check for newer versions with better maintenance` : 'All dependencies appear to be in good standing. Continue monitoring for updates.'}

## Audit Details
**Workflow ID:** ${workflow.workflowId}  
**Timestamp:** ${workflow.timestamp}  
**Evidence Gaps:** ${workflow.evidenceGaps.length} package(s) with missing data

---
*Generated by OSS Preflight*
`;

  return report;
}

/**
 * Audit command handler
 */
export async function auditCommand(options: AuditOptions): Promise<void> {
  // In --json mode, progress goes to stderr so stdout carries only the
  // final JSON payload (the web /api/audit bridge parses stdout).
  const log = options.json
    ? (...args: unknown[]) => console.error(...args)
    : (...args: unknown[]) => console.log(...args);

  try {
    // Validate input
    if (!options.repo && !options.manifest) {
      console.error('Error: Either --repo or --manifest is required');
      console.error('Usage: oss-preflight audit --repo <path-or-url> [--out <directory>]');
      console.error('   or: oss-preflight audit --manifest <path> [--out <directory>]');
      process.exit(2);
    }

    log('\n🔍 OSS Preflight Audit\n');

    // Determine output directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const outputDir = options.out || path.join('.oss-preflight', 'audits', timestamp);
    const absoluteOutputDir = path.resolve(outputDir);

    // Create workflow trace
    const workflow: WorkflowTrace = createWorkflowTrace('repo-audit', {
      repoPath: options.repo,
      manifestPath: options.manifest,
    });

    // Step 1: Detect repo context
    log('📋 Step 1/4: Detecting repository context...');
    const input = options.repo || options.manifest!;
    let repoContext: RepoContext;
    
    try {
      repoContext = await detectRepoContext(input);
      workflow.repoContext = repoContext;
      // Audit candidates come from the manifest, not discovery search.
      // Record the true ecosystem (not the npm/catalog default).
      workflow.discoveryPlan = {
        ecosystem: repoContext.ecosystem,
        domain: repoContext.framework || 'general',
        searchQuery: '',
        searchMethod: 'manifest',
      };
      log(`✓ Detected ${repoContext.ecosystem} project (${repoContext.packageManager})`);
    } catch (error) {
      console.error(`Error: Failed to detect repository context: ${(error as Error).message}`);
      process.exit(1);
    }

    // Step 2: Extract dependencies
    log('\n📦 Step 2/4: Extracting dependencies...');
    const allDeps = { ...repoContext.dependencies, ...repoContext.devDependencies };
    const depCount = Object.keys(allDeps).length;

    if (depCount === 0) {
      log('No dependencies found');
      if (options.json) {
        console.log(JSON.stringify({
          repoContext,
          summary: { total: 0, highRisk: 0, mediumRisk: 0, lowRisk: 0, noRisk: 0 },
          dependencies: [],
          workflowId: workflow.workflowId,
          artifacts: {},
        }, null, 2));
      }
      process.exit(0);
    }

    log(`✓ Found ${depCount} dependencies`);

    // Record manifest-sourced candidates in the workflow trace.
    const manifestDiscoveredAt = new Date().toISOString();
    workflow.candidates = Object.keys(allDeps).map((name) => ({
      name,
      source: 'manifest' as const,
      discoveredAt: manifestDiscoveredAt,
    }));

    // Step 3: Collect evidence and score
    log('\n🔬 Step 3/4: Collecting evidence and scoring...');
    const dependencyRisks: DependencyRisk[] = [];
    const evidence: EvidenceMap = {};

    for (const [name, version] of Object.entries(allDeps)) {
      const candidate: Candidate = {
        name,
        version: String(version),
        ecosystem: repoContext.ecosystem,
        homepageUrl: null,
        repositoryUrl: null,
      };

      // Collect evidence
      const inputs = await collectDependencyEvidence(name, repoContext.ecosystem as 'npm' | 'pypi', false);
      const facts = buildCandidateFacts(inputs);
      evidence[name] = facts;

      // Score against repo context
      const recommendations = scoreAndRank([candidate], {
        capabilities: [],
        domain: repoContext.framework || 'general',
        ecosystem: repoContext.ecosystem,
      }, undefined, evidence);

      const recommendation = recommendations[0];
      const risks = assessRisks(name, facts, recommendation);

      dependencyRisks.push({
        name,
        version: String(version),
        risks,
        score: recommendation?.score || 0,
        recommendation: risks.length >= 3 ? recommendation : undefined,
      });

      // Track evidence gaps
      if (!facts || Object.values(facts).every(f => f === null)) {
        workflow.evidenceGaps.push({
          candidate: name,
          missingFields: ['all'],
          reason: 'Collector failed or package not found',
        });
      }
    }

    log(`✓ Analyzed ${depCount} dependencies`);

    // Step 4: Generate report
    log('\n📄 Step 4/4: Generating audit report...');
    
    const reportPath = path.join(absoluteOutputDir, 'AUDIT_REPORT.md');
    const workflowPath = path.join(absoluteOutputDir, 'workflow.json');

    fs.mkdirSync(absoluteOutputDir, { recursive: true });

    const report = generateAuditReport(repoContext, dependencyRisks, workflow);
    fs.writeFileSync(reportPath, report, 'utf-8');
    log(`✓ Audit report: ${reportPath}`);

    workflow.actions.push({
      type: 'audit-report',
      timestamp: new Date().toISOString(),
      outputPath: reportPath,
      success: true,
    });
    workflow.generatedArtifacts.push(reportPath);

    fs.writeFileSync(workflowPath, JSON.stringify(workflow, null, 2), 'utf-8');
    log(`✓ Workflow trace: ${workflowPath}\n`);

    // Summary
    const highRisk = dependencyRisks.filter(d => d.risks.length >= 3).length;
    const mediumRisk = dependencyRisks.filter(d => d.risks.length === 2).length;
    const lowRisk = dependencyRisks.filter(d => d.risks.length === 1).length;
    const noRisk = dependencyRisks.filter(d => d.risks.length === 0).length;

    log('📊 Audit Summary:');
    log(`   Total: ${depCount} dependencies`);
    log(`   High Risk: ${highRisk}`);
    log(`   Medium Risk: ${mediumRisk}`);
    log(`   Low/No Risk: ${depCount - highRisk - mediumRisk}\n`);

    if (options.json) {
      console.log(JSON.stringify({
        repoContext,
        summary: {
          total: depCount,
          highRisk,
          mediumRisk,
          lowRisk,
          noRisk,
        },
        dependencies: dependencyRisks.map(d => ({
          name: d.name,
          version: d.version,
          score: d.score,
          risks: d.risks,
          facts: evidence[d.name] ?? null,
          suggestedAlternative: d.recommendation
            ? {
                name: d.recommendation.candidate.name,
                version: d.recommendation.candidate.version,
                score: d.recommendation.score,
              }
            : null,
        })),
        evidenceGaps: workflow.evidenceGaps,
        workflowId: workflow.workflowId,
        artifacts: { report: reportPath, workflow: workflowPath },
      }, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(2);
  }
}

// Made with Bob