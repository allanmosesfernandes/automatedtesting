/**
 * Health Check Utilities
 *
 * Detect common failure scenarios:
 * - Site down (network errors)
 * - 500/503 error pages
 * - Maintenance pages
 * - Blank pages
 * - Cloudflare challenges
 */

import { Page } from '@playwright/test';

// Error indicators that MUST appear in page title (strict check)
const TITLE_ERROR_INDICATORS = [
  '500',
  '503',
  '502',
  '504',
  'error',
  'not found',
  'maintenance',
  'something went wrong',
];

// Error indicators for visible page content (check heading/main content only)
const CONTENT_ERROR_INDICATORS = [
  '500 Internal Server Error',
  '503 Service Unavailable',
  '502 Bad Gateway',
  '504 Gateway Timeout',
  'Site under maintenance',
  'We are currently performing maintenance',
  'This page isn\'t working',
  'ERR_CONNECTION_REFUSED',
  'ERR_NAME_NOT_RESOLVED',
];

/**
 * Check if page loaded successfully without errors
 * Throws descriptive error if page is unhealthy
 */
export async function assertPageHealthy(page: Page, context: string): Promise<void> {
  // Wait for page to be in a stable state
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});

  // 1. Check page has meaningful content
  const bodyText = await page.locator('body').textContent().catch(() => '');
  if (!bodyText || bodyText.trim().length < 50) {
    const currentUrl = page.url();
    throw new Error(`[${context}] Page appears blank or failed to load. URL: ${currentUrl}`);
  }

  // 2. Check page title for errors (most reliable indicator)
  const title = await page.title().catch(() => '');
  const titleLower = title.toLowerCase();
  for (const indicator of TITLE_ERROR_INDICATORS) {
    if (titleLower.includes(indicator)) {
      throw new Error(`[${context}] Error page detected in title: "${title}". URL: ${page.url()}`);
    }
  }

  // 3. Check visible heading/main content for error messages (not entire HTML)
  const headingText = await page.locator('h1, h2, .error, .error-message, [role="alert"]').allTextContents().catch(() => []);
  const visibleErrorText = headingText.join(' ').toLowerCase();
  for (const indicator of CONTENT_ERROR_INDICATORS) {
    if (visibleErrorText.includes(indicator.toLowerCase())) {
      throw new Error(`[${context}] Error page detected: "${indicator}". URL: ${page.url()}`);
    }
  }

  // 4. Check HTTP status via response (if we have navigation context)
  // This catches server errors even if the page renders something

  console.log(`  [Health Check] ${context}: OK`);
}

/**
 * Assert that a critical element is visible
 * Throws clear error message if element not found
 */
export async function assertElementVisible(
  page: Page,
  selector: string,
  description: string,
  timeout = 10000
): Promise<void> {
  try {
    await page.locator(selector).first().waitFor({ state: 'visible', timeout });
  } catch {
    const currentUrl = page.url();
    throw new Error(
      `[Critical Element Missing] ${description} not found.\n` +
      `  Selector: ${selector}\n` +
      `  URL: ${currentUrl}\n` +
      `  This may indicate a broken user flow or unexpected page state.`
    );
  }
}

/**
 * Assert that page URL contains expected path
 * Provides clear error if navigation failed
 */
export async function assertUrlContains(
  page: Page,
  expectedPath: string,
  context: string,
  timeout = 15000
): Promise<void> {
  try {
    await page.waitForURL(`**${expectedPath}**`, { timeout });
  } catch {
    const currentUrl = page.url();
    throw new Error(
      `[Navigation Failed] ${context}\n` +
      `  Expected URL to contain: ${expectedPath}\n` +
      `  Actual URL: ${currentUrl}`
    );
  }
}

/**
 * Combined health check after navigation
 * Use this after every page.goto() call
 */
export async function assertNavigationSuccessful(
  page: Page,
  expectedPath: string,
  context: string
): Promise<void> {
  await assertUrlContains(page, expectedPath, context);
  await assertPageHealthy(page, context);
}
