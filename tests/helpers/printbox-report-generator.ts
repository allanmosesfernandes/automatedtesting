import { PrintboxTestResult, PrintboxTestSummary } from '../config/printbox-test-config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate test summary from results
 */
export function generateSummary(
  results: PrintboxTestResult[],
  batchStart: number,
  batchSize: number,
  totalDuration: number
): PrintboxTestSummary {
  const totalTested = results.length;
  const totalPassed = results.filter((r) => r.success).length;
  const totalFailed = totalTested - totalPassed;
  const successRate = totalTested > 0 ? (totalPassed / totalTested) * 100 : 0;

  // Categorize errors
  const errorCategories: { [key: string]: number } = {};
  results.forEach((result) => {
    if (!result.success && result.error) {
      const errorType = result.error.type;
      errorCategories[errorType] = (errorCategories[errorType] || 0) + 1;
    }
  });

  return {
    totalTested,
    totalPassed,
    totalFailed,
    successRate: parseFloat(successRate.toFixed(2)),
    batchInfo: {
      start: batchStart,
      end: batchStart + totalTested - 1,
      size: batchSize,
    },
    duration: totalDuration,
    timestamp: new Date().toISOString(),
    errorCategories,
  };
}

/**
 * Save results to JSON file
 */
export function saveResultsJSON(
  results: PrintboxTestResult[],
  summary: PrintboxTestSummary,
  outputDir: string
): string {
  try {
    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `printbox-results-${summary.batchInfo.start}-${summary.batchInfo.end}-${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);

    const reportData = {
      summary,
      results,
    };

    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2), 'utf-8');

    console.log(`\n✓ JSON report saved: ${filepath}`);
    return filepath;
  } catch (error: any) {
    console.error('✗ Failed to save JSON report:', error.message);
    return '';
  }
}

/**
 * Generate HTML report
 */
export function generateHTMLReport(
  results: PrintboxTestResult[],
  summary: PrintboxTestSummary,
  outputDir: string
): string {
  try {
    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filename = `printbox-report-${summary.batchInfo.start}-${summary.batchInfo.end}-${Date.now()}.html`;
    const filepath = path.join(outputDir, filename);

    const html = generateHTMLContent(results, summary);

    fs.writeFileSync(filepath, html, 'utf-8');

    console.log(`✓ HTML report saved: ${filepath}`);
    return filepath;
  } catch (error: any) {
    console.error('✗ Failed to save HTML report:', error.message);
    return '';
  }
}

/**
 * Generate HTML content for report
 */
function generateHTMLContent(results: PrintboxTestResult[], summary: PrintboxTestSummary): string {
  const failedResults = results.filter((r) => !r.success);
  const passedResults = results.filter((r) => r.success);

  const errorCategoriesHTML = Object.entries(summary.errorCategories)
    .sort((a, b) => b[1] - a[1])
    .map(
      ([category, count]) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${category}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${count}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${((count / summary.totalFailed) * 100).toFixed(1)}%</td>
      </tr>
    `
    )
    .join('');

  const failedResultsHTML = failedResults
    .map(
      (result, idx) => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #f44336; border-radius: 4px; background: #ffebee;">
        <h4 style="margin: 0 0 10px 0; color: #c62828;">
          #${result.index} - Failed
        </h4>
        <p style="margin: 5px 0;"><strong>URL:</strong> <a href="${result.url}" target="_blank" style="color: #1976d2; word-break: break-all;">${result.url}</a></p>
        <p style="margin: 5px 0;"><strong>Error Type:</strong> <span style="color: #d32f2f;">${result.error?.type || 'Unknown'}</span></p>
        <p style="margin: 5px 0;"><strong>Error Message:</strong> ${result.error?.message || 'N/A'}</p>
        <p style="margin: 5px 0;"><strong>Failed Checkpoint:</strong> ${result.error?.checkpoint || 'N/A'}</p>
        ${result.errorText ? `<p style="margin: 5px 0;"><strong>Error Text:</strong> ${result.errorText}</p>` : ''}
        ${result.finalUrl ? `<p style="margin: 5px 0;"><strong>Final URL:</strong> <code style="background: #fff; padding: 2px 4px; border-radius: 3px;">${result.finalUrl}</code></p>` : ''}
        <p style="margin: 5px 0;"><strong>Duration:</strong> ${(result.duration / 1000).toFixed(2)}s</p>

        <details style="margin-top: 10px;">
          <summary style="cursor: pointer; color: #1976d2;">View Checkpoints</summary>
          <ul style="margin: 10px 0; padding-left: 20px;">
            ${Object.entries(result.checkpoints)
              .map(
                ([key, value]) => `
              <li style="color: ${value ? '#2e7d32' : '#c62828'};">
                ${value ? '✓' : '✗'} ${key}
              </li>
            `
              )
              .join('')}
          </ul>
        </details>

        ${
          result.screenshotPath
            ? `<p style="margin: 10px 0;"><strong>Screenshot:</strong> <code style="background: #fff; padding: 2px 4px; border-radius: 3px;">${result.screenshotPath}</code></p>`
            : ''
        }

        ${
          result.consoleErrors && result.consoleErrors.length > 0
            ? `
          <details style="margin-top: 10px;">
            <summary style="cursor: pointer; color: #1976d2;">Console Errors (${result.consoleErrors.length})</summary>
            <pre style="background: #fff; padding: 10px; border-radius: 3px; overflow-x: auto; font-size: 12px;">${result.consoleErrors.join('\n')}</pre>
          </details>
        `
            : ''
        }
      </div>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Printbox Link Validation Report</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 14px;
      text-transform: uppercase;
    }
    .summary-card .value {
      font-size: 32px;
      font-weight: bold;
      color: #333;
    }
    .summary-card.success .value { color: #4caf50; }
    .summary-card.error .value { color: #f44336; }
    .summary-card.rate .value { color: #2196f3; }

    .section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .section h2 {
      margin-top: 0;
      color: #333;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    th {
      background: #667eea;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: 600;
    }
    td {
      padding: 8px;
      border: 1px solid #ddd;
    }
    .progress-bar {
      width: 100%;
      height: 30px;
      background: #e0e0e0;
      border-radius: 15px;
      overflow: hidden;
      margin-top: 15px;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4caf50 0%, #8bc34a 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      transition: width 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Printbox Link Validation Report</h1>
    <p>Batch ${summary.batchInfo.start} - ${summary.batchInfo.end} | Generated: ${new Date(summary.timestamp).toLocaleString()}</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Tested</h3>
      <div class="value">${summary.totalTested}</div>
    </div>
    <div class="summary-card success">
      <h3>Passed</h3>
      <div class="value">${summary.totalPassed}</div>
    </div>
    <div class="summary-card error">
      <h3>Failed</h3>
      <div class="value">${summary.totalFailed}</div>
    </div>
    <div class="summary-card rate">
      <h3>Success Rate</h3>
      <div class="value">${summary.successRate}%</div>
    </div>
    <div class="summary-card">
      <h3>Duration</h3>
      <div class="value">${(summary.duration / 1000 / 60).toFixed(1)}<span style="font-size: 16px;">m</span></div>
    </div>
  </div>

  <div class="progress-bar">
    <div class="progress-fill" style="width: ${summary.successRate}%">
      ${summary.successRate}% Success
    </div>
  </div>

  ${
    summary.totalFailed > 0
      ? `
  <div class="section">
    <h2>Error Categories</h2>
    <table>
      <thead>
        <tr>
          <th>Error Type</th>
          <th style="text-align: center;">Count</th>
          <th style="text-align: center;">Percentage</th>
        </tr>
      </thead>
      <tbody>
        ${errorCategoriesHTML}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Failed Tests (${summary.totalFailed})</h2>
    ${failedResultsHTML}
  </div>
  `
      : `
  <div class="section">
    <h2>All Tests Passed! 🎉</h2>
    <p style="color: #4caf50; font-size: 18px;">All ${summary.totalTested} links were validated successfully.</p>
  </div>
  `
  }

  <div class="section">
    <h2>Passed Tests (${summary.totalPassed})</h2>
    ${
      passedResults.length > 0
        ? `
      <p style="color: #4caf50; margin-bottom: 15px;">${summary.totalPassed} tests passed successfully.</p>
      <details>
        <summary style="cursor: pointer; color: #1976d2; font-weight: 600;">View Passed Tests</summary>
        <table style="margin-top: 15px;">
          <thead>
            <tr>
              <th>#</th>
              <th>URL</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            ${passedResults
              .map(
                (result) => `
              <tr>
                <td>${result.index}</td>
                <td><a href="${result.url}" target="_blank" style="color: #1976d2;">${result.url}</a></td>
                <td>${(result.duration / 1000).toFixed(2)}s</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </details>
    `
        : '<p>No tests passed.</p>'
    }
  </div>

</body>
</html>`;
}

/**
 * Print summary to console
 */
export function printSummaryToConsole(summary: PrintboxTestSummary): void {
  console.log('\n' + '='.repeat(80));
  console.log('PRINTBOX LINK VALIDATION SUMMARY');
  console.log('='.repeat(80));
  console.log(`Batch: ${summary.batchInfo.start} - ${summary.batchInfo.end}`);
  console.log(`Total Tested: ${summary.totalTested}`);
  console.log(`Passed: ${summary.totalPassed} (${summary.successRate}%)`);
  console.log(`Failed: ${summary.totalFailed}`);
  console.log(`Duration: ${(summary.duration / 1000 / 60).toFixed(2)} minutes`);

  if (summary.totalFailed > 0) {
    console.log('\nError Categories:');
    Object.entries(summary.errorCategories)
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        console.log(`  - ${category}: ${count} (${((count / summary.totalFailed) * 100).toFixed(1)}%)`);
      });
  }

  console.log('='.repeat(80) + '\n');
}
