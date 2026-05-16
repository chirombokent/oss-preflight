import type { Recommendation, IdeaBrief } from '@oss-preflight/core';

/**
 * Output Formatter - Phase P3
 * 
 * Supports three formats:
 * - table: Human-readable table (default)
 * - json: Machine-readable JSON matching architecture.md §13.1 schema
 * - md: Markdown table format
 */

export type OutputFormat = 'table' | 'json' | 'md';

/**
 * Format recommendations for output
 */
export function formatOutput(
  recommendations: Recommendation[],
  brief: IdeaBrief,
  format: OutputFormat = 'table'
): string {
  switch (format) {
    case 'json':
      return formatJson(recommendations, brief);
    case 'md':
      return formatMarkdown(recommendations, brief);
    case 'table':
    default:
      return formatTable(recommendations, brief);
  }
}

/**
 * Format as JSON matching architecture.md §13.1 schema
 */
function formatJson(recommendations: Recommendation[], brief: IdeaBrief): string {
  const output = {
    recommendations: recommendations.map(rec => ({
      rank: rec.rank,
      score: rec.score,
      candidate: {
        name: rec.candidate.name,
        version: rec.candidate.version,
        ecosystem: rec.candidate.ecosystem,
        homepageUrl: rec.candidate.homepageUrl,
        repositoryUrl: rec.candidate.repositoryUrl
      },
      subscores: {
        goalFit: rec.subscores.goalFit,
        repoCompat: rec.subscores.repoCompat,
        maintenance: rec.subscores.maintenance,
        safety: rec.subscores.safety,
        community: rec.subscores.community,
        docsQuality: rec.subscores.docsQuality
      },
      passport: {
        facts: rec.passport.facts,
        interpretation: rec.passport.interpretation
      },
      scaffoldAvailable: rec.scaffoldAvailable,
      templateId: rec.templateId
    })),
    ideas_parsed: {
      capabilities: brief.capabilities,
      domain: brief.domain,
      targetUser: brief.targetUser,
      ecosystem: brief.ecosystem
    }
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Format as human-readable table
 * Columns: rank, name, score, goal-fit, maintenance, safety
 */
function formatTable(recommendations: Recommendation[], brief: IdeaBrief): string {
  if (recommendations.length === 0) {
    return 'No recommendations found.';
  }

  const lines: string[] = [];
  
  // Header
  lines.push('');
  lines.push('OSS Preflight Recommendations');
  lines.push('═'.repeat(80));
  lines.push('');
  
  // Brief summary
  lines.push(`Domain: ${brief.domain}`);
  lines.push(`Ecosystem: ${brief.ecosystem}`);
  lines.push(`Capabilities: ${brief.capabilities.join(', ')}`);
  lines.push('');
  lines.push('─'.repeat(80));
  lines.push('');
  
  // Table header
  const header = sprintf(
    '%-4s %-25s %-8s %-10s %-12s %-10s',
    'Rank',
    'Name',
    'Score',
    'Goal Fit',
    'Maintenance',
    'Safety'
  );
  lines.push(header);
  lines.push('─'.repeat(80));
  
  // Table rows
  for (const rec of recommendations) {
    const row = sprintf(
      '%-4d %-25s %-8.1f %-10d %-12d %-10d',
      rec.rank,
      rec.candidate.name,
      rec.score,
      rec.subscores.goalFit,
      rec.subscores.maintenance,
      rec.subscores.safety
    );
    lines.push(row);
  }
  
  lines.push('');
  lines.push('─'.repeat(80));
  lines.push('');
  
  // Scaffold availability
  const withScaffold = recommendations.filter(r => r.scaffoldAvailable);
  if (withScaffold.length > 0) {
    lines.push('✓ Scaffold available for: ' + withScaffold.map(r => r.candidate.name).join(', '));
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Format as markdown table
 */
function formatMarkdown(recommendations: Recommendation[], brief: IdeaBrief): string {
  if (recommendations.length === 0) {
    return 'No recommendations found.';
  }

  const lines: string[] = [];
  
  // Header
  lines.push('# OSS Preflight Recommendations');
  lines.push('');
  lines.push(`**Domain:** ${brief.domain}`);
  lines.push(`**Ecosystem:** ${brief.ecosystem}`);
  lines.push(`**Capabilities:** ${brief.capabilities.join(', ')}`);
  lines.push('');
  
  // Table
  lines.push('| Rank | Name | Score | Goal Fit | Maintenance | Safety | Scaffold |');
  lines.push('|------|------|-------|----------|-------------|--------|----------|');
  
  for (const rec of recommendations) {
    const scaffold = rec.scaffoldAvailable ? '✓' : '—';
    lines.push(
      `| ${rec.rank} | ${rec.candidate.name} | ${rec.score.toFixed(1)} | ${rec.subscores.goalFit} | ${rec.subscores.maintenance} | ${rec.subscores.safety} | ${scaffold} |`
    );
  }
  
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Simple sprintf-like function for table formatting
 */
function sprintf(format: string, ...args: (string | number)[]): string {
  let result = format;
  let argIndex = 0;
  
  // Replace format specifiers: %-4d, %-25s, %-8.1f, etc.
  result = result.replace(/%(-?)(\d+)(?:\.(\d+))?([dfs])/g, (match, leftAlign, width, precision, type) => {
    if (argIndex >= args.length) return match;
    
    const arg = args[argIndex++];
    let str: string;
    
    if (type === 'f' && typeof arg === 'number') {
      str = precision ? arg.toFixed(parseInt(precision)) : arg.toString();
    } else if (type === 'd' && typeof arg === 'number') {
      str = Math.floor(arg).toString();
    } else {
      str = String(arg);
    }
    
    const w = parseInt(width);
    if (leftAlign === '-') {
      return str.padEnd(w, ' ');
    } else {
      return str.padStart(w, ' ');
    }
  });
  
  return result;
}

// Made with Bob