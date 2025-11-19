/**
 * Navigation Links Monitoring Test
 *
 * This test monitors navigation links on PrinterPix for blank page issues.
 * It runs for 5 minutes per environment (QA and Production), clicking through
 * top-level navigation links and validating that content loads correctly.
 *
 * Reports:
 * - JSON statistics for each environment
 * - Screenshots of failures
 * - Detailed error logs
 * - Combined HTML summary report
 */

import { test, expect, Page } from '@playwright/test';
import * as path from 'path';
import { TOP_LEVEL_NAVIGATION_LINKS, NavigationLink } from '../../config/navigation-links';
import { NavigationPage } from '../../pages/NavigationPage';
import {
  setupPageMonitoring,
  resetPageState,
  isContentLoaded,
  captureScreenshot,
  saveDetailedLog,
  generateSummary,
  saveSummaryReport,
  generateHtmlSummary,
  calculateLoadTime,
  PageState,
  NavigationTestResult,
  TestSummary
} from '../../helpers/navigation-monitor-helper';
import {
  initProgressFile,
  updateProgress,
  addFailure,
  shouldStopTest,
  markTestComplete,
  markTestStopped
} from '../../helpers/progress-reporter';

// Test configuration
const TEST_DURATION_MINUTES = parseInt(process.env.TEST_DURATION_MINUTES || '5');
const TEST_DURATION_MS = TEST_DURATION_MINUTES * 60 * 1000;

const ENVIRONMENTS = [
  { name: 'QA UK', baseUrl: 'https://qa.printerpix.co.uk' }
];

// Report directories
const REPORT_BASE_DIR = path.join(process.cwd(), 'test-results', 'navigation-monitoring');

/**
 * Get a random navigation link from the list
 */
function getRandomLink(): NavigationLink {
  const randomIndex = Math.floor(Math.random() * TOP_LEVEL_NAVIGATION_LINKS.length);
  return TOP_LEVEL_NAVIGATION_LINKS[randomIndex];
}

/**
 * Add brief delay between actions (optimized for fast monitoring)
 */
async function humanDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 300) + 200; // 0.2-0.5 seconds
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Dismiss Klaviyo popup if present
 */
async function dismissKlaviyoPopup(page: Page): Promise<void> {
  try {
    // Wait a bit for popup to potentially appear
    await page.waitForTimeout(2000);

    const popupSelectors = [
      'button[aria-label*="Close"]',
      '.klaviyo-close-form',
      '[class*="needsclick"][class*="kl-private-reset-css-Xuajs1"]',
      'button:has-text("Close")',
      'button:has-text("No thanks")',
      '.needsclick.kl-private-reset-css-Xuajs1'
    ];

    for (const selector of popupSelectors) {
      const popup = page.locator(selector).first();
      const isVisible = await popup.isVisible({ timeout: 1000 }).catch(() => false);

      if (isVisible) {
        await popup.click().catch(() => {});
        console.log(`  ✅ Dismissed Klaviyo popup`);
        await page.waitForTimeout(500);
        return;
      }
    }
  } catch {
    // Popup handling is non-critical
  }
}

/**
 * Test a single navigation link
 */
async function testNavigationLink(
  page: Page,
  navPage: NavigationPage,
  link: NavigationLink,
  baseUrl: string,
  pageState: PageState,
  reportDirs: { screenshots: string; logs: string }
): Promise<NavigationTestResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Reset page state for this navigation
  resetPageState(pageState);

  let contentLoadedResult = { loaded: false, errorDetails: 'Unknown error' };
  let screenshotPath: string | undefined;
  let status: 'pass' | 'fail' = 'fail';

  try {
    console.log(`  🔗 Testing: ${link.name} (${link.url})`);

    // Navigate to the link
    await navPage.navigateToLink(link, baseUrl);

    // Check if content loaded successfully (includes 1 second wait internally)
    contentLoadedResult = await isContentLoaded(page);

    if (contentLoadedResult.loaded) {
      status = 'pass';
      console.log(`  ✅ SUCCESS: ${link.name}`);
    } else {
      status = 'fail';
      console.log(`  ❌ FAILURE: ${link.name} - ${contentLoadedResult.errorDetails}`);

      // Capture screenshot of the failure
      screenshotPath = await captureScreenshot(page, link.name, reportDirs.screenshots);
      console.log(`     📸 Screenshot saved: ${screenshotPath}`);
    }

  } catch (error) {
    status = 'fail';
    contentLoadedResult = {
      loaded: false,
      errorDetails: `Navigation error: ${error instanceof Error ? error.message : String(error)}`
    };
    console.log(`  ❌ ERROR: ${link.name} - ${contentLoadedResult.errorDetails}`);

    // Try to capture screenshot even on error
    try {
      screenshotPath = await captureScreenshot(page, link.name, reportDirs.screenshots);
    } catch {
      // Screenshot failed, continue
    }
  }

  const endTime = Date.now();
  const loadTime = endTime - startTime;

  // Get page metrics
  const viewport = await navPage.getViewport();
  const pageHeight = await navPage.getPageHeight();

  // Create test result
  const result: NavigationTestResult = {
    linkName: link.name,
    linkUrl: link.url,
    timestamp,
    status,
    loadTime,
    screenshotPath,
    contentLoaded: contentLoadedResult.loaded,
    failedRequests: [...pageState.failedRequests],
    consoleErrors: [...pageState.consoleErrors],
    pageErrors: [...pageState.pageErrors],
    viewport,
    pageHeight,
    errorDetails: contentLoadedResult.errorDetails
  };

  // Save detailed log for failures
  if (status === 'fail') {
    await saveDetailedLog(result, reportDirs.logs);
  }

  return result;
}

/**
 * Run navigation monitoring test for a single environment
 */
async function runNavigationTest(
  page: Page,
  environment: { name: string; baseUrl: string }
): Promise<TestSummary> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 Starting Navigation Test for ${environment.name}`);
  console.log(`   Environment: ${environment.baseUrl}`);
  console.log(`   Duration: ${TEST_DURATION_MINUTES} minutes`);
  console.log(`${'='.repeat(80)}\n`);

  // Initialize progress file for real-time dashboard updates
  initProgressFile(environment.baseUrl, TEST_DURATION_MINUTES);

  // Setup report directories
  const envDir = environment.baseUrl.replace(/https?:\/\//, '').replace(/\./g, '-');
  const reportDirs = {
    base: path.join(REPORT_BASE_DIR, envDir),
    screenshots: path.join(REPORT_BASE_DIR, envDir, 'screenshots'),
    logs: path.join(REPORT_BASE_DIR, envDir, 'logs')
  };

  // Initialize page monitoring
  const pageState: PageState = {
    failedRequests: [],
    consoleErrors: [],
    pageErrors: []
  };
  setupPageMonitoring(page, pageState);

  // Initialize navigation page
  const navPage = new NavigationPage(page);

  // Go to homepage first
  console.log(`  🏠 Loading homepage...`);
  await navPage.goToHomepage(environment.baseUrl);

  // Dismiss Klaviyo popup
  console.log(`  🔄 Handling popups...`);
  await dismissKlaviyoPopup(page);

  // Test results
  const results: NavigationTestResult[] = [];
  const testStartTime = new Date();
  const testEndTime = new Date(testStartTime.getTime() + TEST_DURATION_MS);

  let clickCount = 0;

  // Run test loop for specified duration
  while (Date.now() < testEndTime.getTime()) {
    clickCount++;

    // Get a random link to test
    const link = getRandomLink();

    // Test the navigation link
    const result = await testNavigationLink(
      page,
      navPage,
      link,
      environment.baseUrl,
      pageState,
      reportDirs
    );

    results.push(result);

    // Calculate current metrics
    const successfulClicks = results.filter(r => r.status === 'pass').length;
    const failedClicks = results.filter(r => r.status === 'fail').length;

    // Update progress for real-time dashboard
    updateProgress({
      totalClicks: clickCount,
      successfulClicks,
      failedClicks,
      currentLink: link.name
    });

    // Add failure to progress if test failed
    if (result.status === 'fail' && result.screenshotPath) {
      addFailure({
        linkName: link.name,
        timestamp: result.timestamp,
        screenshotPath: result.screenshotPath,
        errorDetails: result.errorDetails || 'Unknown error'
      });
    }

    // Display progress
    const elapsed = Date.now() - testStartTime.getTime();
    const remaining = testEndTime.getTime() - Date.now();
    const remainingMinutes = Math.floor(remaining / 60000);
    const remainingSeconds = Math.floor((remaining % 60000) / 1000);

    console.log(`  ⏱️  Progress: ${clickCount} clicks | ${remainingMinutes}m ${remainingSeconds}s remaining\n`);

    // Check if test should stop (from dashboard)
    if (shouldStopTest()) {
      console.log(`  ⏹️  Stop signal received. Ending test early...`);
      markTestStopped();
      break;
    }

    // Human-like delay before next navigation
    if (Date.now() < testEndTime.getTime()) {
      await humanDelay();
    }
  }

  const actualEndTime = new Date();

  // Generate summary
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 Test Complete for ${environment.name}`);
  console.log(`${'='.repeat(80)}\n`);

  const summary = generateSummary(environment.baseUrl, testStartTime, actualEndTime, results);

  console.log(`Total Clicks: ${summary.totalClicks}`);
  console.log(`Successful Loads: ${summary.successfulLoads} ✅`);
  console.log(`Failed Loads: ${summary.failedLoads} ❌`);
  console.log(`Success Rate: ${summary.successRate}`);

  if (summary.failures.length > 0) {
    console.log(`\nFailures:`);
    summary.failures.forEach((failure, index) => {
      console.log(`  ${index + 1}. ${failure.linkName} - ${failure.errorDetails}`);
    });
  }

  // Save summary report
  const summaryPath = path.join(reportDirs.base, 'summary.json');
  saveSummaryReport(summary, summaryPath);
  console.log(`\n📄 Summary saved to: ${summaryPath}\n`);

  // Mark test as complete for dashboard
  markTestComplete();

  return summary;
}

// Test suite - Parallel execution
test.describe('Navigation Links Monitoring', () => {
  test.setTimeout(TEST_DURATION_MS + 120000); // Single environment duration + buffer

  // Create separate test for each environment to run in parallel
  ENVIRONMENTS.forEach((environment) => {
    test(`Monitor navigation links on ${environment.name}`, async ({ browser }) => {
      // Create a new page for this environment
      const context = await browser.newContext();
      const page = await context.newPage();

      try {
        // Run the navigation test for this environment
        const summary = await runNavigationTest(page, environment);

        // Check success rate assertions
        const successRate = parseFloat(summary.successRate);

        if (successRate >= 95) {
          console.log(`✅ ${environment.name} PASSED: Success rate ${summary.successRate} >= 95%`);
        } else if (successRate >= 90) {
          console.log(`⚠️  ${environment.name} WARNING: Success rate ${summary.successRate} is between 90-95%`);
        } else {
          console.log(`❌ ${environment.name} FAILED: Success rate ${summary.successRate} < 90%`);
        }

        // Assert acceptable success rate
        expect(successRate).toBeGreaterThanOrEqual(90);

        console.log(`✅ ${environment.name} test completed successfully!`);
        console.log(`📂 Reports available in: ${REPORT_BASE_DIR}\n`);

      } finally {
        await context.close();
      }
    });
  });

  // Generate combined report after all tests complete
  test.afterAll(async () => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 ALL TESTS COMPLETE - Generating Combined Report`);
    console.log(`${'='.repeat(80)}\n`);

    // Load all summaries from the saved JSON files
    const allSummaries: TestSummary[] = [];

    for (const environment of ENVIRONMENTS) {
      const envDir = environment.baseUrl.replace(/https?:\/\//, '').replace(/\./g, '-');
      const summaryPath = path.join(REPORT_BASE_DIR, envDir, 'summary.json');

      try {
        const fs = require('fs');
        if (fs.existsSync(summaryPath)) {
          const summaryData = fs.readFileSync(summaryPath, 'utf-8');
          const summary = JSON.parse(summaryData);
          allSummaries.push(summary);
        }
      } catch (error) {
        console.log(`Warning: Could not load summary for ${environment.name}`);
      }
    }

    if (allSummaries.length > 0) {
      // Generate combined HTML report
      const htmlReportPath = path.join(REPORT_BASE_DIR, 'combined-summary.html');
      generateHtmlSummary(allSummaries, htmlReportPath);
      console.log(`\n📊 HTML Report generated: ${htmlReportPath}\n`);

      // Final summary
      allSummaries.forEach(summary => {
        console.log(`${summary.environment}:`);
        console.log(`  Total Clicks: ${summary.totalClicks}`);
        console.log(`  Success Rate: ${summary.successRate}`);
        console.log(`  Failures: ${summary.failedLoads}`);
        console.log();
      });
    }
  });
});
