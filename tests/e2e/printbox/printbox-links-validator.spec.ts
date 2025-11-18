import { test, expect } from '@playwright/test';
import { loadLinks } from '../../helpers/printbox-validator-helper';
import { getPrintboxTestConfig } from '../../config/printbox-test-config';
import { dismissCookieConsent } from '../../helpers/cookie-consent-handler';
import { dismissKlaviyoPopup } from '../../helpers/popup-handler';
import { LoginPage } from '../../pages/LoginPage';

// Load config and links at module level (before test.describe)
const config = getPrintboxTestConfig();
const testLinks = loadLinks(config.paths.linksFile, config.batchStart, config.batchSize);

if (testLinks.length === 0) {
  throw new Error('No links found in file. Check configuration.');
}

test.describe('Printbox Links Validator', () => {
  const testResults: Array<{
    url: string;
    status: 'passed' | 'failed';
    error?: string;
    checkpoint?: string;
    duration: number;
  }> = [];

  test.beforeAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('PRINTBOX VALIDATION TEST');
    console.log('='.repeat(80));
    console.log(`Links File: ${config.paths.linksFile}`);
    console.log(`Batch Start: ${config.batchStart}`);
    console.log(`Batch Size: ${config.batchSize}`);
    console.log(`Total Links: ${testLinks.length}`);
    console.log('='.repeat(80) + '\n');
  });

  // Create a test for each link
  testLinks.forEach((testUrl, index) => {
    test(`Link ${index + 1}: ${testUrl}`, async ({ page }) => {
      const startTime = Date.now();
      const linkNumber = config.batchStart + index;

      console.log(`\n[${linkNumber}/${testLinks.length}] Testing: ${testUrl}`);

      try {
        // Step 1: Navigate to product page
        console.log(`[1/14] Navigating to product page...`);
        await page.goto(testUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        console.log('✓ Product page loaded');

        // Step 2: Dismiss cookie consent (only on first link)
        if (index === 0) {
          console.log(`[2/14] Dismissing cookie consent popup...`);
          await dismissCookieConsent(page, 3000);
          await page.waitForTimeout(1000);
          console.log('✓ Cookie consent dismissed');
        } else {
          console.log(`[2/14] Skipping cookie consent (already dismissed)`);
        }

        // Step 3: Dismiss Klaviyo popup
        console.log(`[3/14] Dismissing Klaviyo popup...`);
        await dismissKlaviyoPopup(page, 6000);
        await page.waitForTimeout(2000);
        console.log('✓ Klaviyo popup dismissed');

    // Step 4: Click "Start My Book" button
    console.log(`[4/7] Looking for "Start My Book" button...`);
    const startMyBookButton = page.getByRole('link', { name: 'Start My Book' }).first();
    await startMyBookButton.scrollIntoViewIfNeeded({ timeout: 5000 });
    await expect(startMyBookButton).toBeVisible({ timeout: 10000 });

    // Try to click, if blocked by popup, dismiss and retry
    try {
      await startMyBookButton.click({ timeout: 5000 });
    } catch (error) {
      console.log('Click blocked, dismissing Klaviyo popup again...');
      await dismissKlaviyoPopup(page, 3000);
      await startMyBookButton.click({ force: true });
    }
    console.log('✓ Clicked "Start My Book" button');

    // Step 5: Verify navigation to themes page
    console.log(`[5/7] Verifying navigation to themes page...`);
    try {
      await page.waitForURL('**/themes/**', { timeout: 15000 });
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      expect(currentUrl).toContain('https://www.printerpix.co.uk/themes/');
      console.log('✓ Themes page loaded');
    } catch (error: any) {
      console.error(`✗ Failed to navigate to themes page: ${error.message}`);
      throw error;
    }

    // Step 6: Click "Design Your Own Theme"
    console.log(`[6/7] Looking for "Design Your Own Theme"...`);
    await page.waitForTimeout(3000); // Wait for themes to load

    const designYourOwnTheme = page.locator('div.bg-white.rounded-\\[4px\\]').filter({
      hasText: 'Design Your Own Theme'
    }).first();

    await expect(designYourOwnTheme).toBeVisible({ timeout: 10000 });
    await designYourOwnTheme.scrollIntoViewIfNeeded();
    await designYourOwnTheme.click();
    console.log('✓ Clicked "Design Your Own Theme"');

    // Step 7: Verify navigation to register page
    console.log(`[7/10] Verifying navigation to register page...`);
    await page.waitForURL('**/login/register/**', { timeout: 10000 });
    const registerUrl = page.url();
    console.log(`Register URL: ${registerUrl}`);
    expect(registerUrl).toContain('https://www.printerpix.co.uk/login/register/');
    console.log('✓ Register page loaded');

    // Step 8: Click "Login" link for existing users
    console.log(`[8/10] Looking for "Login" link (for existing users)...`);
    await page.waitForTimeout(1000); // Wait for page to settle

    const loginLink = page.locator('a.link_login_section--login').filter({ hasText: 'Login' });
    await expect(loginLink).toBeVisible({ timeout: 10000 });
    await loginLink.click();
    console.log('✓ Clicked "Login" link');

    // Step 9: Verify navigation to sign-in page
    console.log(`[9/10] Verifying navigation to sign-in page...`);
    await page.waitForURL('**/login/signin**', { timeout: 10000 });
    const signInUrl = page.url();
    console.log(`Sign-in URL: ${signInUrl}`);
    expect(signInUrl).toContain('/login/signin');
    console.log('✓ Sign-in page loaded');

    // Step 10: Sign in with credentials
    console.log(`[10/11] Signing in with credentials...`);
    const loginPage = new LoginPage(page);
    await loginPage.signIn(config.credentials.email, config.credentials.password);
    console.log('✓ Entered credentials and clicked sign-in');

    // Step 11: Wait for redirect to designer
    console.log('[11/14] Waiting for redirect to designer page...');
    try {
      await page.waitForURL('**/qdesigner/**', { timeout: 45000 }); // Increased timeout for designer
      const designerUrl = page.url();
      console.log(`Designer URL: ${designerUrl}`);
      expect(designerUrl).toContain('https://www.printerpix.co.uk/qdesigner/photobook');
      console.log('✓ Successfully redirected to designer page');
    } catch (error: any) {
      console.error(`✗ Failed to redirect to designer: ${error.message}`);
      console.log(`Current URL: ${page.url()}`);
      throw error;
    }

    // Step 12: Wait for designer page to fully load and check for iframe
    console.log('[12/14] Waiting for designer page to fully load...');

    // Check if designer content is in an iframe
    const iframes = await page.locator('iframe').count();
    console.log(`Found ${iframes} iframes on page`);

    // Wait for the designer UI to be ready by checking for actual UI elements
    // This is more reliable than networkidle for ecommerce sites
    console.log('[12/14] Waiting for designer UI elements to load...');
    await page.waitForTimeout(10000); // Initial load time (increased for parallel execution)
    console.log('✓ Designer initial load completed');

    // Step 13: Check for "Auto-Create My Book" button (could be in main page or iframe)
    console.log('[13/14] Looking for "Auto-Create My Book" button...');

    // First try to find in main page
    let autoCreateButton = page.locator('text=Auto-Create My Book').first();
    let isVisible = await autoCreateButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible && iframes > 0) {
      // Try to find in iframe
      console.log('Button not in main page, checking iframes...');
      const frame = page.frameLocator('iframe').first();
      autoCreateButton = frame.locator('text=Auto-Create My Book').first();
      isVisible = await autoCreateButton.isVisible({ timeout: 5000 }).catch(() => false);
    }

    if (isVisible) {
      console.log('✓ "Auto-Create My Book" button is visible');
    } else {
      // Log page state for debugging
      console.log('Button not found anywhere, logging page state...');
      const pageText = await page.locator('body').textContent();
      console.log('Page text sample:', pageText?.substring(0, 500));
      throw new Error('Auto-Create My Book button not found');
    }

    // Step 14: Check that NO error modal is displayed
    console.log('[14/14] Checking for error modal...');
    const errorModal = page.locator('.ModalsContainer.ErrorPopup');

    // Check if error modal exists and is visible
    const errorModalVisible = await errorModal.isVisible().catch(() => false);

    if (errorModalVisible) {
      // If error modal is visible, get the error message and fail the test
      const errorMessage = await errorModal.locator('.popup-content-wrapper').textContent();
      console.error(`✗ ERROR MODAL DETECTED: ${errorMessage}`);
      throw new Error(`Designer error modal appeared: ${errorMessage}`);
    }

        console.log('✓ No error modal detected');

        // Record success
        const duration = Date.now() - startTime;
        testResults.push({
          url: testUrl,
          status: 'passed',
          duration
        });

        console.log(`\n✓ TEST PASSED [${duration}ms]: ${testUrl}\n`);

      } catch (error: any) {
        // Record failure
        const duration = Date.now() - startTime;
        const errorMessage = error.message || 'Unknown error';

        testResults.push({
          url: testUrl,
          status: 'failed',
          error: errorMessage,
          checkpoint: extractCheckpoint(error.message),
          duration
        });

        console.error(`\n✗ TEST FAILED [${duration}ms]: ${testUrl}`);
        console.error(`   Error: ${errorMessage}\n`);

        // Take screenshot on failure
        try {
          const screenshotPath = `${config.paths.screenshotsDir}/link-${linkNumber}-failure.png`;
          await page.screenshot({ path: screenshotPath, fullPage: true });
          console.log(`   Screenshot: ${screenshotPath}`);
        } catch (screenshotError) {
          console.error(`   Failed to capture screenshot: ${screenshotError}`);
        }

        throw error; // Re-throw to mark test as failed
      }
    });
  });

  test.afterAll(async () => {
    // Generate failure report
    const fs = require('fs');
    const path = require('path');

    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const successRate = testResults.length > 0
      ? ((passed / testResults.length) * 100).toFixed(2)
      : '0.00';

    console.log(`Total Tested: ${testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('='.repeat(80));

    // Ensure reports directory exists
    if (!fs.existsSync(config.paths.reportsDir)) {
      fs.mkdirSync(config.paths.reportsDir, { recursive: true });
    }

    // Get chunk ID for naming
    const chunkId = process.env.CHUNK_ID || 'unknown';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Generate HTML Report
    const htmlReport = `<!DOCTYPE html>
<html>
<head>
  <title>Printbox Test Report - Chunk ${chunkId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }
    .summary { background: #e8f5e9; padding: 20px; border-radius: 5px; margin: 20px 0; }
    .summary h2 { margin-top: 0; color: #2e7d32; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 15px 0; }
    .stat { text-align: center; padding: 15px; background: white; border-radius: 5px; }
    .stat-value { font-size: 32px; font-weight: bold; }
    .stat-label { color: #666; font-size: 14px; }
    .pass { color: #4CAF50; }
    .fail { color: #f44336; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    thead { background: #f5f5f5; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { font-weight: bold; color: #333; }
    .status-pass { background: #c8e6c9; color: #2e7d32; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
    .status-fail { background: #ffcdd2; color: #c62828; padding: 5px 10px; border-radius: 3px; font-weight: bold; }
    .url-cell { max-width: 400px; word-wrap: break-word; font-size: 12px; }
    .error-cell { color: #c62828; font-size: 12px; }
    .duration-cell { color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Printbox Test Report - Chunk ${chunkId}</h1>

    <div class="summary">
      <h2>Test Summary</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${testResults.length}</div>
          <div class="stat-label">Total Tested</div>
        </div>
        <div class="stat">
          <div class="stat-value pass">${passed}</div>
          <div class="stat-label">Passed</div>
        </div>
        <div class="stat">
          <div class="stat-value fail">${failed}</div>
          <div class="stat-label">Failed</div>
        </div>
        <div class="stat">
          <div class="stat-value">${successRate}%</div>
          <div class="stat-label">Success Rate</div>
        </div>
      </div>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
      <p><strong>Chunk ID:</strong> ${chunkId}</p>
    </div>

    <h2>Test Results</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Status</th>
          <th>URL</th>
          <th>Duration</th>
          <th>Error Details</th>
        </tr>
      </thead>
      <tbody>
${testResults.map((result, index) => `
        <tr>
          <td>${index + 1}</td>
          <td><span class="status-${result.status === 'passed' ? 'pass' : 'fail'}">${result.status === 'passed' ? 'PASS' : 'FAIL'}</span></td>
          <td class="url-cell">${result.url}</td>
          <td class="duration-cell">${result.duration}ms</td>
          <td class="error-cell">${result.error || '-'}</td>
        </tr>
`).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

    // Save HTML report
    const htmlPath = path.join(config.paths.reportsDir, `chunk-${chunkId}-report.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    console.log(`\nHTML Report saved: ${htmlPath}`);

    // Generate simple text results file
    const textResults = `PRINTBOX TEST RESULTS - CHUNK ${chunkId}
${'='.repeat(80)}

SUMMARY:
Total Tested: ${testResults.length}
Passed: ${passed}
Failed: ${failed}
Success Rate: ${successRate}%
Timestamp: ${timestamp}

${'='.repeat(80)}

PASSED LINKS (${passed}):
${testResults.filter(r => r.status === 'passed').map((r, i) => `${i + 1}. ${r.url} (${r.duration}ms)`).join('\n')}

${'='.repeat(80)}

FAILED LINKS (${failed}):
${testResults.filter(r => r.status === 'failed').map((r, i) => `${i + 1}. ${r.url}\n   Error: ${r.error}\n   Checkpoint: ${r.checkpoint}\n   Duration: ${r.duration}ms`).join('\n\n')}

${'='.repeat(80)}
`;

    // Save text results
    const textPath = path.join(config.paths.reportsDir, `chunk-${chunkId}-results.txt`);
    fs.writeFileSync(textPath, textResults);
    console.log(`Text Results saved: ${textPath}`);

    console.log('='.repeat(80) + '\n');
  });
});

/**
 * Extract checkpoint from error message
 */
function extractCheckpoint(errorMessage: string): string {
  if (errorMessage.includes('product page')) return 'Product Page Load';
  if (errorMessage.includes('themes page')) return 'Themes Page Navigation';
  if (errorMessage.includes('designer')) return 'Designer Page Load';
  if (errorMessage.includes('Auto-Create')) return 'Auto-Create Button Check';
  if (errorMessage.includes('error modal')) return 'Error Modal Check';
  if (errorMessage.includes('login')) return 'Login';
  return 'Unknown';
}
