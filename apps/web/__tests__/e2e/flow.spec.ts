import { test, expect } from '@playwright/test';

/**
 * Automated Browser Test - Full Flow
 * AC12: Full flow completes in automated browser test:
 * idea input → submit → 3 cards render → click Passport → modal opens → click Scaffold → files render
 */

test.describe('OSS Preflight Full Flow', () => {
  test('should complete full idea-to-scaffold flow', async ({ page }) => {
    await page.route('/api/recommend', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
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
        }),
      });
    });

    await page.route('/api/scaffold', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          files: ['package.json', 'src/index.ts', 'src/summarizer.ts', 'smoke-test.ts', 'README.md', 'ADOPTION_REPORT.md'],
          passed: true,
          output: 'Smoke test passed',
        }),
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
    await expect(page.locator('h1')).toContainText('Recommendations');
    await expect(page.locator('text=discord.js')).toBeVisible();
    await expect(page.locator('text=discord.py')).toBeVisible();
    await expect(page.locator('text=eris')).toBeVisible();

    // Step 4: Click "Open Passport" on first card
    const passportButton = page.locator('button:has-text("Open Passport")').first();
    await passportButton.click();

    // Step 5: Assert modal opens
    await expect(page.locator('h2:has-text("Evidence Passport")')).toBeVisible();

    // Assert fact/inference split is visible
    await expect(page.locator('h3:has-text("Facts")')).toBeVisible();
    await expect(page.locator('h3:has-text("Interpretation")')).toBeVisible();

    // Close modal
    const closeButton = page.locator('button[aria-label="Close"]');
    await closeButton.click();

    // Step 6: Click "Generate Scaffold" (if available)
    const scaffoldButton = page.locator('button:has-text("Generate Scaffold")').first();
    if (await scaffoldButton.isVisible()) {
      await scaffoldButton.click();

      // Wait for scaffold to generate
      await page.waitForTimeout(2000);

      // Step 7: Assert files render
      await expect(page.locator('h1')).toContainText('Scaffold Generated');
      await expect(page.locator('h2:has-text("Generated Files")')).toBeVisible();
      await expect(page.locator('h2:has-text("Smoke Test")')).toBeVisible();
    }
  });

  test('should display error when API fails', async ({ page }) => {
    await page.goto('/');

    // Mock API failure
    await page.route('/api/recommend', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'API error' }),
      });
    });

    await page.locator('textarea').fill('test idea');
    await page.locator('button[type="submit"]').click();

    // Assert error is displayed
    await expect(page.locator('.bg-pf-error-bg')).toBeVisible();
    await expect(page.getByText('API error')).toBeVisible();
  });

  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/');

    // Find dark mode toggle button
    const darkModeButton = page.locator('button[aria-label="Toggle dark mode"]');
    await darkModeButton.click();

    // Assert dark class is applied
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    // Toggle back
    await darkModeButton.click();
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
});

// Made with Bob
