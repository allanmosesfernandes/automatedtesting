import { test, expect } from '@playwright/test';
import { dismissKlaviyoPopup } from '../../helpers/popup-handler';

// Use the saved session storage state
test.use({ storageState: '.auth/printbox-session.json' });

// Load first 10 links from final.json for testing
const fs = require('fs');
const allLinks = JSON.parse(fs.readFileSync('final.json', 'utf-8'));
// Skip index 0 which contains "link" (bad data), start from index 1
const testLinks = allLinks.slice(1, 11); // Test links 2-11 (10 valid links)

test.describe('Printbox Validator - Optimized with Session Reuse', () => {
  const testResults: Array<{
    url: string;
    status: 'passed' | 'failed';
    error?: string;
    duration: number;
  }> = [];

  test.beforeAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('PRINTBOX OPTIMIZED VALIDATION TEST');
    console.log('='.repeat(80));
    console.log(`Testing ${testLinks.length} links with session reuse`);
    console.log(`Cookie consent: Already dismissed`);
    console.log(`Klaviyo popup: Already dismissed`);
    console.log(`Login: Already authenticated`);
    console.log('='.repeat(80) + '\n');
  });

  testLinks.forEach((testUrl, index) => {
    test(`Link ${index + 1}: ${testUrl}`, async ({ page }) => {
      const startTime = Date.now();
      console.log(`\n[${index + 1}/${testLinks.length}] Testing: ${testUrl}`);

      try {
        // Step 1: Navigate to product page
        console.log(`[1/7] Navigating to product page...`);
        await page.goto(testUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });
        console.log('✓ Product page loaded');

        // Step 2: Dismiss Klaviyo popup (might reappear)
        console.log(`[2/7] Checking for Klaviyo popup...`);
        await dismissKlaviyoPopup(page, 3000);
        console.log('✓ Klaviyo check complete');

        // Step 3: Click "Start My Book" button
        console.log(`[3/7] Looking for "Start My Book" button...`);
        const startMyBookButton = page.getByRole('link', { name: 'Start My Book' }).first();
        await startMyBookButton.scrollIntoViewIfNeeded({ timeout: 5000 });
        await expect(startMyBookButton).toBeVisible({ timeout: 10000 });

        // Try to click
        try {
          await startMyBookButton.click({ timeout: 5000 });
        } catch (error) {
          console.log('Click blocked, dismissing Klaviyo popup again...');
          await dismissKlaviyoPopup(page, 3000);
          await startMyBookButton.click({ force: true });
        }
        console.log('✓ Clicked "Start My Book" button');

        // Step 4: Verify navigation to themes page
        console.log(`[4/7] Verifying navigation to themes page...`);
        await page.waitForURL('**/themes/**', { timeout: 15000 });
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        expect(currentUrl).toContain('https://www.printerpix.co.uk/themes/');
        console.log('✓ Themes page loaded');

        // Step 5: Click "Design Your Own Theme"
        console.log(`[5/7] Looking for "Design Your Own Theme"...`);
        await page.waitForTimeout(3000); // Wait for themes to load

        const designYourOwnTheme = page.locator('div.bg-white.rounded-\\[4px\\]').filter({
          hasText: 'Design Your Own Theme'
        }).first();

        await expect(designYourOwnTheme).toBeVisible({ timeout: 10000 });
        await designYourOwnTheme.scrollIntoViewIfNeeded();
        await designYourOwnTheme.click();
        console.log('✓ Clicked "Design Your Own Theme"');

        // Step 6: Verify navigation to designer (should skip login because we have session)
        console.log(`[6/7] Waiting for redirect to designer page...`);
        try {
          await page.waitForURL('**/qdesigner/**', { timeout: 45000 });
          const designerUrl = page.url();
          console.log(`Designer URL: ${designerUrl}`);
          expect(designerUrl).toContain('https://www.printerpix.co.uk/qdesigner/photobook');
          console.log('✓ Successfully redirected to designer page (login skipped!)');
        } catch (error: any) {
          console.error(`✗ Failed to redirect to designer: ${error.message}`);
          console.log(`Current URL: ${page.url()}`);
          throw error;
        }

        // Step 7: Wait for designer page to load and check for error
        console.log('[7/7] Waiting for designer page to fully load...');
        await page.waitForTimeout(10000); // Initial load time
        console.log('✓ Designer initial load completed');

        // Check for error modal
        console.log('[7/7] Checking for error modal...');
        const errorModal = page.locator('.ModalsContainer.ErrorPopup');
        const errorModalVisible = await errorModal.isVisible().catch(() => false);

        if (errorModalVisible) {
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

        console.log(`\n✓ TEST PASSED [${duration}ms / ${(duration / 1000).toFixed(1)}s]: ${testUrl}\n`);

      } catch (error: any) {
        // Record failure
        const duration = Date.now() - startTime;
        const errorMessage = error.message || 'Unknown error';

        testResults.push({
          url: testUrl,
          status: 'failed',
          error: errorMessage,
          duration
        });

        console.error(`\n✗ TEST FAILED [${duration}ms / ${(duration / 1000).toFixed(1)}s]: ${testUrl}`);
        console.error(`   Error: ${errorMessage}\n`);

        throw error;
      }
    });
  });

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('OPTIMIZED TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = testResults.filter(r => r.status === 'passed').length;
    const failed = testResults.filter(r => r.status === 'failed').length;
    const totalDuration = testResults.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = testResults.length > 0 ? totalDuration / testResults.length : 0;
    const successRate = testResults.length > 0 ? ((passed / testResults.length) * 100).toFixed(2) : '0.00';

    console.log(`Total Tested: ${testResults.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);
    console.log(`Average per Link: ${(avgDuration / 1000).toFixed(1)}s`);
    console.log('='.repeat(80) + '\n');

    // Generate reports
    const path = require('path');
    const reportsDir = 'test-results/printbox-optimized/reports';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Ensure reports directory exists
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Generate HTML Report
    const htmlReport = `<!DOCTYPE html>
<html>
<head>
  <title>Printbox Optimized Test Report</title>
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
    <h1>Printbox Optimized Test Report (Session Reuse)</h1>

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
      <p><strong>Total Duration:</strong> ${(totalDuration / 1000).toFixed(1)}s</p>
      <p><strong>Average per Link:</strong> ${(avgDuration / 1000).toFixed(1)}s</p>
      <p><strong>Timestamp:</strong> ${timestamp}</p>
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
          <td class="duration-cell">${(result.duration / 1000).toFixed(1)}s</td>
          <td class="error-cell">${result.error || '-'}</td>
        </tr>
`).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;

    // Save HTML report
    const htmlPath = path.join(reportsDir, `optimized-test-report-${timestamp}.html`);
    fs.writeFileSync(htmlPath, htmlReport);
    console.log(`\nHTML Report saved: ${htmlPath}`);

    // Generate text results file
    const textResults = `PRINTBOX OPTIMIZED TEST RESULTS (Session Reuse)
${'='.repeat(80)}

SUMMARY:
Total Tested: ${testResults.length}
Passed: ${passed}
Failed: ${failed}
Success Rate: ${successRate}%
Total Duration: ${(totalDuration / 1000).toFixed(1)}s
Average per Link: ${(avgDuration / 1000).toFixed(1)}s
Timestamp: ${timestamp}

${'='.repeat(80)}

PASSED LINKS (${passed}):
${testResults.filter(r => r.status === 'passed').map((r, i) => `${i + 1}. ${r.url} (${(r.duration / 1000).toFixed(1)}s)`).join('\n')}

${'='.repeat(80)}

FAILED LINKS (${failed}):
${testResults.filter(r => r.status === 'failed').map((r, i) => `${i + 1}. ${r.url}\n   Error: ${r.error}\n   Duration: ${(r.duration / 1000).toFixed(1)}s`).join('\n\n')}

${'='.repeat(80)}
`;

    // Save text results
    const textPath = path.join(reportsDir, `optimized-test-results-${timestamp}.txt`);
    fs.writeFileSync(textPath, textResults);
    console.log(`Text Results saved: ${textPath}`);
    console.log('='.repeat(80) + '\n');
  });
});
