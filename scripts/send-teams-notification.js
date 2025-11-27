/**
 * Teams Notification Script
 *
 * Sends test results to Microsoft Teams via Incoming Webhook.
 * Can be used standalone or integrated into CI/CD pipelines.
 *
 * Usage:
 *   node scripts/send-teams-notification.js [results-file.json]
 *
 * Environment:
 *   TEAMS_WEBHOOK_URL - Required: Teams Incoming Webhook URL
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Parse command line arguments
const resultsFile = process.argv[2] || 'test-results/results.json';

/**
 * Send a message card to Teams
 */
async function sendToTeams(webhookUrl, card) {
  return new Promise((resolve, reject) => {
    const url = new URL(webhookUrl);

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`Teams API returned ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(card));
    req.end();
  });
}

/**
 * Parse Playwright JSON results
 */
function parseResults(resultsPath) {
  try {
    const data = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      failures: [],
    };

    if (data.suites) {
      for (const suite of data.suites) {
        for (const spec of suite.specs || []) {
          for (const test of spec.tests || []) {
            results.total++;
            results.duration += test.results?.[0]?.duration || 0;

            const status = test.results?.[0]?.status;
            if (status === 'passed') {
              results.passed++;
            } else if (status === 'failed' || status === 'timedOut') {
              results.failed++;
              results.failures.push({
                name: `${suite.title} > ${spec.title}`,
                error: test.results?.[0]?.error?.message || 'Unknown error',
              });
            } else {
              results.skipped++;
            }
          }
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Failed to parse results:', error.message);
    return null;
  }
}

/**
 * Build Teams message card
 */
function buildMessageCard(results, runUrl) {
  const isSuccess = results.failed === 0;
  const themeColor = isSuccess ? '00FF00' : 'FF0000';
  const emoji = isSuccess ? 'white_check_mark' : 'x';
  const title = isSuccess
    ? 'All E2E Tests Passed'
    : 'E2E Tests Failed';

  const card = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor,
    summary: `E2E Tests: ${results.passed}/${results.total} Passed`,
    sections: [
      {
        activityTitle: `${title}`,
        activitySubtitle: `Cart Checkout Flow Tests`,
        facts: [
          { name: 'Total Tests', value: results.total.toString() },
          { name: 'Passed', value: results.passed.toString() },
          { name: 'Failed', value: results.failed.toString() },
          {
            name: 'Duration',
            value: `${Math.round(results.duration / 1000)}s`,
          },
          { name: 'Time', value: new Date().toISOString() },
        ],
        markdown: true,
      },
    ],
    potentialAction: [],
  };

  // Add failure details
  if (results.failures.length > 0) {
    card.sections.push({
      title: 'Failed Tests:',
      text: results.failures
        .map((f) => `- **${f.name}**: ${f.error.substring(0, 100)}...`)
        .join('\n'),
    });
  }

  // Add link to run if provided
  if (runUrl) {
    card.potentialAction.push({
      '@type': 'OpenUri',
      name: 'View Run Details',
      targets: [{ os: 'default', uri: runUrl }],
    });
  }

  return card;
}

/**
 * Main function
 */
async function main() {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('Error: TEAMS_WEBHOOK_URL environment variable is required');
    process.exit(1);
  }

  // Check if results file exists
  if (!fs.existsSync(resultsFile)) {
    console.log(`Results file not found: ${resultsFile}`);
    console.log('Sending generic failure notification...');

    const card = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      themeColor: 'FFA500',
      summary: 'E2E Tests - Results Not Found',
      sections: [
        {
          activityTitle: 'E2E Test Results Not Available',
          text: `Could not find results file: ${resultsFile}`,
        },
      ],
    };

    await sendToTeams(webhookUrl, card);
    return;
  }

  // Parse results
  const results = parseResults(resultsFile);
  if (!results) {
    console.error('Failed to parse results');
    process.exit(1);
  }

  console.log(`Test Results: ${results.passed}/${results.total} passed`);

  // Only send notification if there are failures (or always if NOTIFY_ALWAYS is set)
  if (results.failed > 0 || process.env.NOTIFY_ALWAYS === 'true') {
    const runUrl = process.env.GITHUB_RUN_URL || process.env.RUN_URL;
    const card = buildMessageCard(results, runUrl);

    try {
      await sendToTeams(webhookUrl, card);
      console.log('Teams notification sent successfully');
    } catch (error) {
      console.error('Failed to send Teams notification:', error.message);
      process.exit(1);
    }
  } else {
    console.log('All tests passed - no notification sent');
  }
}

main().catch(console.error);
