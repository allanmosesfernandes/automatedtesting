/**
 * Navigation Monitor Helper Utilities
 * Provides functions for monitoring navigation, detecting blank pages, and generating reports
 */

import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { CONTENT_VALIDATION_SELECTORS, MIN_PAGE_HEIGHT } from '../config/navigation-links';

export interface NetworkError {
  url: string;
  status: number;
  statusText: string;
  timestamp: string;
}

export interface ConsoleError {
  type: string;
  text: string;
  timestamp: string;
}

export interface PageState {
  failedRequests: NetworkError[];
  consoleErrors: ConsoleError[];
  pageErrors: string[];
}

export interface NavigationTestResult {
  linkName: string;
  linkUrl: string;
  timestamp: string;
  status: 'pass' | 'fail';
  loadTime: number;
  screenshotPath?: string;
  contentLoaded: boolean;
  failedRequests: NetworkError[];
  consoleErrors: ConsoleError[];
  pageErrors: string[];
  viewport: { width: number; height: number };
  pageHeight: number;
  errorDetails?: string;
}

export interface TestSummary {
  environment: string;
  testStartTime: string;
  testEndTime: string;
  testDuration: string;
  totalClicks: number;
  successfulLoads: number;
  failedLoads: number;
  successRate: string;
  failures: NavigationTestResult[];
  allResults: NavigationTestResult[];
}

/**
 * Setup listeners to capture network errors, console errors, and page errors
 */
export function setupPageMonitoring(page: Page, pageState: PageState): void {
  // Monitor network responses
  page.on('response', async (response) => {
    if (response.status() >= 400) {
      pageState.failedRequests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Monitor console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      pageState.consoleErrors.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Monitor page errors (uncaught exceptions)
  page.on('pageerror', (error) => {
    pageState.pageErrors.push(error.message);
  });
}

/**
 * Reset page state for the next navigation
 */
export function resetPageState(pageState: PageState): void {
  pageState.failedRequests = [];
  pageState.consoleErrors = [];
  pageState.pageErrors = [];
}

/**
 * Check if main content has loaded successfully
 * Multi-layer validation to detect blank screens and incomplete page loads
 */
export async function isContentLoaded(page: Page): Promise<{ loaded: boolean; errorDetails?: string }> {
  try {
    // Brief wait after navigation for content to render
    await page.waitForTimeout(500);

    // Layer 1: Check if main element with class="relative" is visible
    const mainVisible = await page.locator(CONTENT_VALIDATION_SELECTORS.mainContent).first().isVisible({ timeout: 3000 }).catch(() => false);

    if (!mainVisible) {
      return {
        loaded: false,
        errorDetails: 'Main content element (<main class="relative">) not visible'
      };
    }

    // Layer 2: Validate page height (detect blank/empty pages)
    const pageHeight = await page.evaluate(() => document.body.scrollHeight);
    if (pageHeight < MIN_PAGE_HEIGHT) {
      return {
        loaded: false,
        errorDetails: `Page too short: ${pageHeight}px (minimum: ${MIN_PAGE_HEIGHT}px) - likely blank screen`
      };
    }

    // Layer 3: Check for product elements (category pages should have products)
    // This is the key check for detecting blank product category pages
    const productSelectors = [
      '.product-card',
      '[data-product]',
      '.grid-item',
      '[class*="product"]',
      'article',
      '.product',
      '[data-testid*="product"]'
    ];

    let productCount = 0;
    for (const selector of productSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        productCount = count;
        break;
      }
    }

    // If no products found, page might be blank or failed to load content
    if (productCount === 0) {
      return {
        loaded: false,
        errorDetails: 'No product elements found - page may be blank or content failed to load'
      };
    }

    // All checks passed - content is loaded
    return { loaded: true };

  } catch (error) {
    return {
      loaded: false,
      errorDetails: `Content validation error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Open the navigation menu (hamburger menu)
 */
export async function openNavigationMenu(page: Page): Promise<boolean> {
  try {
    const menuBurger = page.locator('#menu-burger, button[aria-label*="menu"]').first();

    // Check if menu is already open
    const navContainer = page.locator('nav').first();
    const isVisible = await navContainer.isVisible().catch(() => false);

    if (isVisible) {
      return true; // Menu already open
    }

    // Click to open menu
    await menuBurger.click({ timeout: 5000 });

    // Wait for navigation to be visible
    await navContainer.waitFor({ state: 'visible', timeout: 3000 });

    return true;
  } catch (error) {
    console.error('Failed to open navigation menu:', error);
    return false;
  }
}

/**
 * Capture a screenshot with timestamp
 */
export async function captureScreenshot(
  page: Page,
  linkName: string,
  screenshotsDir: string
): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sanitizedLinkName = linkName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `${sanitizedLinkName}-${timestamp}.png`;
  const screenshotPath = path.join(screenshotsDir, filename);

  // Ensure directory exists
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  await page.screenshot({ path: screenshotPath, fullPage: true });

  return screenshotPath;
}

/**
 * Save detailed log for a navigation attempt
 */
export async function saveDetailedLog(
  result: NavigationTestResult,
  logsDir: string
): Promise<void> {
  const timestamp = new Date(result.timestamp).toISOString().replace(/[:.]/g, '-');
  const sanitizedLinkName = result.linkName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const filename = `${sanitizedLinkName}-${timestamp}.json`;
  const logPath = path.join(logsDir, filename);

  // Ensure directory exists
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  fs.writeFileSync(logPath, JSON.stringify(result, null, 2));
}

/**
 * Generate test summary report
 */
export function generateSummary(
  environment: string,
  testStartTime: Date,
  testEndTime: Date,
  results: NavigationTestResult[]
): TestSummary {
  const totalClicks = results.length;
  const successfulLoads = results.filter(r => r.status === 'pass').length;
  const failedLoads = results.filter(r => r.status === 'fail').length;
  const successRate = totalClicks > 0 ? ((successfulLoads / totalClicks) * 100).toFixed(1) : '0.0';

  const durationMs = testEndTime.getTime() - testStartTime.getTime();
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationSeconds = Math.floor((durationMs % 60000) / 1000);
  const testDuration = `${durationMinutes}m ${durationSeconds}s`;

  return {
    environment,
    testStartTime: testStartTime.toISOString(),
    testEndTime: testEndTime.toISOString(),
    testDuration,
    totalClicks,
    successfulLoads,
    failedLoads,
    successRate: `${successRate}%`,
    failures: results.filter(r => r.status === 'fail'),
    allResults: results
  };
}

/**
 * Save summary report to JSON file
 */
export function saveSummaryReport(summary: TestSummary, reportPath: string): void {
  const reportDir = path.dirname(reportPath);

  // Ensure directory exists
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
}

/**
 * Generate HTML summary report
 */
export function generateHtmlSummary(summaries: TestSummary[], outputPath: string): void {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Navigation Monitoring Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      border-bottom: 3px solid #EA0073;
      padding-bottom: 10px;
    }
    h2 {
      color: #555;
      margin-top: 30px;
    }
    .summary-card {
      background-color: #f9f9f9;
      border-left: 4px solid #EA0073;
      padding: 15px;
      margin: 20px 0;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .stat-box {
      background-color: #fff;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 4px;
      text-align: center;
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #EA0073;
    }
    .stat-label {
      color: #666;
      font-size: 0.9em;
      margin-top: 5px;
    }
    .success { color: #28a745; }
    .warning { color: #ffc107; }
    .failure { color: #dc3545; }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #EA0073;
      color: white;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .screenshot-link {
      color: #EA0073;
      text-decoration: none;
    }
    .screenshot-link:hover {
      text-decoration: underline;
    }
    .timestamp {
      font-size: 0.85em;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 Navigation Monitoring Report</h1>
    <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>

    ${summaries.map(summary => `
      <div class="summary-card">
        <h2>Environment: ${summary.environment}</h2>
        <p><strong>Test Duration:</strong> ${summary.testDuration}</p>
        <p><strong>Period:</strong> ${new Date(summary.testStartTime).toLocaleString()} - ${new Date(summary.testEndTime).toLocaleString()}</p>

        <div class="stats">
          <div class="stat-box">
            <div class="stat-value">${summary.totalClicks}</div>
            <div class="stat-label">Total Clicks</div>
          </div>
          <div class="stat-box">
            <div class="stat-value success">${summary.successfulLoads}</div>
            <div class="stat-label">Successful Loads</div>
          </div>
          <div class="stat-box">
            <div class="stat-value failure">${summary.failedLoads}</div>
            <div class="stat-label">Failed Loads</div>
          </div>
          <div class="stat-box">
            <div class="stat-value ${parseFloat(summary.successRate) >= 95 ? 'success' : parseFloat(summary.successRate) >= 90 ? 'warning' : 'failure'}">
              ${summary.successRate}
            </div>
            <div class="stat-label">Success Rate</div>
          </div>
        </div>

        ${summary.failures.length > 0 ? `
          <h3>❌ Failures (${summary.failures.length})</h3>
          <table>
            <thead>
              <tr>
                <th>Link Name</th>
                <th>URL</th>
                <th>Timestamp</th>
                <th>Load Time (ms)</th>
                <th>Error Details</th>
                <th>Screenshot</th>
              </tr>
            </thead>
            <tbody>
              ${summary.failures.map(failure => `
                <tr>
                  <td>${failure.linkName}</td>
                  <td>${failure.linkUrl}</td>
                  <td class="timestamp">${new Date(failure.timestamp).toLocaleTimeString()}</td>
                  <td>${failure.loadTime}</td>
                  <td>${failure.errorDetails || 'Content not loaded'}</td>
                  <td>${failure.screenshotPath ? `<a href="${failure.screenshotPath}" class="screenshot-link">View Screenshot</a>` : 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="success">✅ No failures detected!</p>'}
      </div>
    `).join('')}
  </div>
</body>
</html>
  `;

  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, html);
}

/**
 * Calculate load time from navigation start
 */
export async function calculateLoadTime(page: Page): Promise<number> {
  try {
    const loadTime = await page.evaluate(() => {
      const perfData = performance.timing;
      return perfData.loadEventEnd - perfData.navigationStart;
    });
    return loadTime || 0;
  } catch {
    return 0;
  }
}
