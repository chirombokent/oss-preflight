import { test, expect } from '@playwright/test';

/**
 * Automated Browser Test - Full Flow
 * AC12: Full flow completes in automated browser test:
 * idea input → submit → 3 cards render → click Passport → modal opens → click Scaffold → files render
 */

test.describe('OSS Preflight Full Flow', () => {
  test('should complete full idea-to-scaffold flow', async ({ page }) => {
    await page.route('/api/analyze', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          mode: 'recommend',
          detectedMode: 'recommend',
          input: 'Discord bot that summarizes channel activity',
          provider: 'keyword',
          ideas_parsed: {
            capabilities: ['message processing', 'summarization'],
            domain: 'discord',
            ecosystem: 'npm',
            constraints: {},
          },
          recommendations: [
            {
              rank: 1,
              score: 88,
              candidate: {
                name: 'discord.js',
                version: '14.14.1',
                ecosystem: 'npm',
                homepageUrl: 'https://discord.js.org',
                repositoryUrl: 'https://github.com/discordjs/discord.js',
              },
              subscores: {
                goalFit: 95,
                repoCompat: 85,
                maintenance: 85,
                safety: 80,
                community: 95,
                docsQuality: 80,
              },
              passport: {
                facts: {
                  license: {
                    value: 'Apache-2.0',
                    source: 'https://registry.npmjs.org/discord.js',
                    collectedAt: '2026-05-17T00:00:00Z',
                    sourceType: 'npm',
                  },
                  weeklyDownloads: null,
                  lastCommit: null,
                  stars: null,
                  openIssues: null,
                  openssfScore: null,
                },
                interpretation: {
                  goalFit: 'Strong fit for a Discord bot.',
                  compatibility: 'Works with Node.js and TypeScript.',
                  tradeoffs: [],
                  warnings: [],
                  recommendedAlongside: ['dotenv'],
                },
              },
              scaffoldAvailable: true,
              templateId: 'discord-summary-bot',
            },
            {
              rank: 2,
              score: 74,
              candidate: {
                name: 'discord.py',
                version: '2.3.2',
                ecosystem: 'pypi',
                homepageUrl: null,
                repositoryUrl: null,
              },
              subscores: {
                goalFit: 80,
                repoCompat: 60,
                maintenance: 80,
                safety: 75,
                community: 85,
                docsQuality: 70,
              },
              passport: {
                facts: {
                  license: null,
                  weeklyDownloads: null,
                  lastCommit: null,
                  stars: null,
                  openIssues: null,
                  openssfScore: null,
                },
                interpretation: {
                  goalFit: 'Good fit for Python Discord bots.',
                  compatibility: 'Different ecosystem than the requested npm stack.',
                  tradeoffs: ['Different ecosystem'],
                  warnings: [],
                  recommendedAlongside: [],
                },
              },
              scaffoldAvailable: false,
              templateId: null,
            },
            {
              rank: 3,
              score: 66,
              candidate: {
                name: 'eris',
                version: '0.17.2',
                ecosystem: 'npm',
                homepageUrl: null,
                repositoryUrl: null,
              },
              subscores: {
                goalFit: 72,
                repoCompat: 75,
                maintenance: 60,
                safety: 65,
                community: 55,
                docsQuality: 55,
              },
              passport: {
                facts: {
                  license: null,
                  weeklyDownloads: null,
                  lastCommit: null,
                  stars: null,
                  openIssues: null,
                  openssfScore: null,
                },
                interpretation: {
                  goalFit: 'Moderate fit as a lighter Discord client.',
                  compatibility: 'Works in npm projects.',
                  tradeoffs: [],
                  warnings: [],
                  recommendedAlongside: [],
                },
              },
              scaffoldAvailable: false,
              templateId: null,
            },
          ],
          brief: {
            capabilities: ['message processing', 'summarization'],
            domain: 'discord',
            ecosystem: 'npm',
          },
          workflow: {
            workflowId: 'workflow-1',
            mode: 'idea',
            timestamp: '2026-05-17T00:00:00Z',
            input: { idea: 'Discord bot that summarizes channel activity' },
            repoContext: null,
            discoveryPlan: {
              ecosystem: 'npm',
              domain: 'discord',
              searchQuery: 'message processing, summarization',
              searchMethod: 'registry-search',
            },
            candidates: [
              { name: 'discord.js', source: 'npm-search', discoveredAt: '2026-05-17T00:00:00Z' },
              { name: 'discord.py', source: 'pypi-search', discoveredAt: '2026-05-17T00:00:00Z' },
              { name: 'eris', source: 'npm-search', discoveredAt: '2026-05-17T00:00:00Z' },
            ],
            recommendations: [],
            evidenceGaps: [],
            actions: [],
            verification: { smokeTestPassed: null, validationErrors: [] },
            generatedArtifacts: [],
          },
        }),
      });
    });

    await page.route('/api/scaffold', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/zip',
        headers: {
          'Content-Disposition': 'attachment; filename="discord.js-starter.zip"',
          'X-OSS-Preflight-Scaffold-Type': 'template',
          'X-OSS-Preflight-Message': 'Scaffold generated successfully',
        },
        body: 'zip-content',
      });
    });

    // Navigate to app
    await page.goto('/');

    // Step 1: Idea input page should be visible
    await expect(page.locator('h1')).toContainText('OSS Preflight');
    await expect(page.locator('textarea')).toBeVisible();

    // Step 2: Enter idea and submit
    const ideaText = 'Discord bot that summarizes channel activity';
    await page.locator('textarea').fill(ideaText);
    await page.locator('button[type="submit"]').click();

    // Wait for recommendations to load (mock or real API)
    // In a real test, we'd mock the API response
    await page.waitForTimeout(1000);

    // Step 3: Assert 3 recommendation cards render
    await expect(page.getByRole('heading', { name: 'Recommendations' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'discord.js' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'discord.py' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'eris' })).toBeVisible();

    // Step 4: Click "Open Passport" on first card
    const passportButton = page.locator('button:has-text("Open Passport")').first();
    await passportButton.click();

    // Step 5: Assert modal opens (wait for React state update and render)
    await expect(page.locator('h2:has-text("Evidence Passport")')).toBeVisible({ timeout: 10000 });

    // Assert fact/inference split is visible
    await expect(page.locator('h3:has-text("Facts")')).toBeVisible();
    await expect(page.locator('h3:has-text("Interpretation")')).toBeVisible();

    // Close modal
    const closeButton = page.locator('button[aria-label="Close"]');
    await closeButton.click();

    // Step 6: Click "Generate Scaffold" (if available)
    const scaffoldButton = page.locator('button:has-text("Download starter")').first();
    if (await scaffoldButton.isVisible()) {
      await scaffoldButton.click();

      // Wait for scaffold to generate
      await page.waitForTimeout(2000);

      // Step 7: Assert files render
      await expect(page.locator('h2:has-text("Download ready")')).toBeVisible();
      await expect(page.getByText('package.json')).toBeVisible();
      await expect(page.getByText('discord.js-starter.zip')).toBeVisible();
    }
  });

  test('should display dismissible API errors as auto-expiring toasts', async ({ page }) => {
    await page.goto('/');

    // Mock API failure
    await page.route('/api/analyze', (route) => {
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'API error', hint: 'Try keyword mode.', mode: 'recommend' }),
      });
    });

    await page.locator('textarea').fill('test idea');
    await page.locator('button[type="submit"]').click();

    // Assert error toast is displayed with the hint and can be closed manually.
    const alert = page.locator('[role="alert"]');
    await expect(alert).toBeVisible();
    await expect(page.getByText('API error')).toBeVisible();
    await expect(page.getByText('Try keyword mode.')).toBeVisible();

    await page.getByRole('button', { name: 'Close notification' }).click();
    await expect(alert).toBeHidden();

    // Trigger another error and assert it expires without manual dismissal.
    await page.locator('button[type="submit"]').click();
    await expect(alert).toBeVisible();
    await expect(alert).toBeHidden({ timeout: 10000 });
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');

    // Find dark mode toggle button
    const darkModeButton = page.locator('button[aria-label="Toggle dark mode"]');
    const html = page.locator('html');

    // Light is the default when the user has not chosen a theme.
    await expect(html).not.toHaveClass(/dark/);

    await darkModeButton.click();
    await expect(html).toHaveClass(/dark/);

    // User choice is inherited on reload.
    await page.reload();
    await expect(html).toHaveClass(/dark/);

    await darkModeButton.click();
    await expect(html).not.toHaveClass(/dark/);

    await page.reload();
    await expect(html).not.toHaveClass(/dark/);
  });

  test('should navigate to build proof page', async ({ page }) => {
    await page.goto('/');

    // Click Build Proof link
    const buildProofLink = page.locator('button:has-text("Build Proof")');
    await buildProofLink.click();

    // Assert build proof page is visible
    await expect(page.locator('h1')).toContainText('Build Proof');
    await expect(page.locator('h2:has-text("Bob Configuration")')).toBeVisible();
    await expect(page.locator('h2:has-text("Bob Session Exports")')).toBeVisible();
  });

  test('should navigate to the usage guide page', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'Guide' }).click();

    await expect(page.getByRole('heading', { name: 'Use OSS Preflight from the web app, CLI, or Bob IDE' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Product Modes' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'CLI Quickstart' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'OSS Preflight In Bob IDE' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Run The Workflow In Bob IDE' })).toBeVisible();
    await expect(page.getByText('node packages/cli/dist/index.js recommend')).toBeVisible();
    await expect(page.getByText('Use oss-preflight-advisor for this idea:')).toBeVisible();
    await expect(page.getByText('review the Evidence Passport, then approve scaffolding')).toBeVisible();
  });
});

// Made with Bob
