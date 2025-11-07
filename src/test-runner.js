const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { getBaseUrl } = require('./environment-helper');

/**
 * Test Runner Service
 * Executes Playwright tests programmatically for selected regions and environments
 */

/**
 * Run Playwright tests for given regions and environments
 * @param {string} jobId - Unique job identifier
 * @param {string[]} regions - Array of region codes (e.g., ['US', 'GB', 'DE'])
 * @param {string[]} environments - Array of environments (e.g., ['qa', 'live'])
 * @param {Function} progressCallback - Callback function to report progress
 * @returns {Promise<Object>} Test results
 */
async function runTests(jobId, regions, environments, progressCallback) {
  console.log(`\n🧪 Starting test job ${jobId}`);
  console.log(`📍 Regions: ${regions.join(', ')}`);
  console.log(`🌍 Environments: ${environments.join(', ')}`);

  const results = {
    jobId,
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0
    },
    testRuns: []
  };

  const startTime = Date.now();
  let completedCount = 0;
  const totalRuns = regions.length * environments.length;

  // Run tests for each region-environment combination
  for (const region of regions) {
    for (const environment of environments) {
      const baseUrl = getBaseUrl(region, environment);
      const testRunId = `${region}-${environment}`;

      console.log(`\n▶️  Running tests for ${region} (${environment}): ${baseUrl}`);

      // Update progress
      progressCallback({
        progress: {
          total: totalRuns,
          completed: completedCount,
          current: `Testing ${region} - ${environment}`
        }
      });

      try {
        const testResult = await runPlaywrightTest(region, environment, baseUrl);

        results.testRuns.push({
          region,
          environment,
          baseUrl,
          status: testResult.success ? 'passed' : 'failed',
          duration: testResult.duration,
          tests: testResult.tests,
          summary: testResult.summary
        });

        // Update summary
        results.summary.total += testResult.summary.total;
        results.summary.passed += testResult.summary.passed;
        results.summary.failed += testResult.summary.failed;
        results.summary.skipped += testResult.summary.skipped;

        console.log(`✅ ${region} (${environment}): ${testResult.summary.passed}/${testResult.summary.total} tests passed`);

      } catch (error) {
        console.error(`❌ Error running tests for ${region} (${environment}):`, error.message);

        results.testRuns.push({
          region,
          environment,
          baseUrl,
          status: 'error',
          error: error.message,
          duration: 0
        });
      }

      completedCount++;
    }
  }

  const endTime = Date.now();
  results.summary.duration = endTime - startTime;

  // Update final progress
  progressCallback({
    progress: {
      total: totalRuns,
      completed: completedCount,
      current: 'Tests completed'
    }
  });

  console.log(`\n✨ Test job ${jobId} completed in ${(results.summary.duration / 1000).toFixed(2)}s`);
  console.log(`📊 Summary: ${results.summary.passed}/${results.summary.total} passed, ${results.summary.failed} failed`);

  return results;
}

/**
 * Execute Playwright tests for a specific region and environment
 * @param {string} region - Region code
 * @param {string} environment - Environment (qa or live)
 * @param {string} baseUrl - Base URL to test
 * @returns {Promise<Object>} Test execution results
 */
function runPlaywrightTest(region, environment, baseUrl) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Set environment variables for the test run
    const env = {
      ...process.env,
      BASE_URL: baseUrl,
      TEST_REGION: region,
      TEST_ENV: environment
    };

    // Run Playwright test command
    const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const playwright = spawn(npxCommand, [
      'playwright',
      'test',
      '--reporter=json'
    ], {
      cwd: path.resolve(__dirname, '..'),
      env,
      shell: true
    });

    let stdout = '';
    let stderr = '';

    playwright.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    playwright.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    playwright.on('close', (code) => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      try {
        // Try to parse JSON output
        let testResults = null;

        // Look for JSON in stdout
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            testResults = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error('Failed to parse Playwright JSON output');
          }
        }

        // Parse results or create default structure
        const summary = {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0
        };

        const tests = [];

        if (testResults && testResults.suites) {
          // Parse Playwright JSON reporter format
          const parseSpecs = (suites) => {
            suites.forEach(suite => {
              if (suite.specs) {
                suite.specs.forEach(spec => {
                  summary.total++;

                  const test = {
                    title: spec.title,
                    file: spec.file || suite.title,
                    status: 'unknown',
                    duration: 0,
                    error: null,
                    screenshots: []
                  };

                  if (spec.tests && spec.tests.length > 0) {
                    const testResult = spec.tests[0].results[0];
                    test.status = testResult.status;
                    test.duration = testResult.duration;

                    // Capture screenshots and other attachments
                    if (testResult.attachments && testResult.attachments.length > 0) {
                      testResult.attachments.forEach(attachment => {
                        if (attachment.name === 'screenshot' && attachment.path) {
                          // Convert absolute path to relative path from test-results directory
                          const testResultsDir = path.join(path.resolve(__dirname, '..'), 'test-results');
                          let relativePath = path.relative(testResultsDir, attachment.path);
                          // Convert Windows backslashes to forward slashes for URLs
                          relativePath = relativePath.replace(/\\/g, '/');
                          test.screenshots.push(relativePath);
                        }
                      });
                    }

                    if (testResult.status === 'passed') {
                      summary.passed++;
                    } else if (testResult.status === 'failed') {
                      summary.failed++;
                      test.error = testResult.error?.message || 'Test failed';
                    } else if (testResult.status === 'skipped') {
                      summary.skipped++;
                    }
                  }

                  tests.push(test);
                });
              }

              if (suite.suites) {
                parseSpecs(suite.suites);
              }
            });
          };

          parseSpecs(testResults.suites);
        } else {
          // Fallback: estimate from exit code
          // Exit code 0 = all passed, non-zero = some failed
          const success = code === 0;
          summary.total = 5; // Approximate number of auth tests
          summary.passed = success ? 5 : 0;
          summary.failed = success ? 0 : 5;

          tests.push({
            title: 'Test execution',
            status: success ? 'passed' : 'failed',
            duration,
            error: success ? null : stderr || 'Test execution failed'
          });
        }

        resolve({
          success: code === 0,
          duration,
          summary,
          tests,
          stdout: stdout.substring(0, 1000), // Limit output size
          stderr: stderr.substring(0, 1000)
        });

      } catch (error) {
        reject(new Error(`Failed to parse test results: ${error.message}`));
      }
    });

    playwright.on('error', (error) => {
      reject(new Error(`Failed to spawn Playwright process: ${error.message}`));
    });
  });
}

/**
 * Run a specific test file for a region and environment
 * @param {string} region - Region code
 * @param {string} environment - Environment
 * @param {string} testFile - Specific test file path (e.g., 'auth/signin.spec.ts')
 * @param {number} retryAttempt - Retry attempt number
 * @returns {Promise<Object>} Test execution results
 */
async function runSingleTest(region, environment, testFile, retryAttempt = 0) {
  console.log(`\n🔄 Retrying test: ${testFile} for ${region} (${environment}) - Attempt ${retryAttempt}`);

  const baseUrl = getBaseUrl(region, environment);
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      BASE_URL: baseUrl,
      TEST_REGION: region,
      TEST_ENV: environment
    };

    const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const testPath = path.join('tests/e2e', testFile);

    const playwright = spawn(npxCommand, [
      'playwright',
      'test',
      testPath,
      '--reporter=json'
    ], {
      cwd: path.resolve(__dirname, '..'),
      env,
      shell: true
    });

    let stdout = '';
    let stderr = '';

    playwright.stdout.on('data', (data) => stdout += data.toString());
    playwright.stderr.on('data', (data) => stderr += data.toString());

    playwright.on('close', (code) => {
      const endTime = Date.now();
      const duration = endTime - startTime;

      try {
        let testResults = null;
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            testResults = JSON.parse(jsonMatch[0]);
          } catch (e) {
            console.error('Failed to parse Playwright JSON output');
          }
        }

        const summary = {
          total: 0,
          passed: 0,
          failed: 0,
          skipped: 0
        };

        const tests = [];

        if (testResults && testResults.suites) {
          // Parse results
          const parseSpecs = (suites) => {
            suites.forEach(suite => {
              if (suite.specs) {
                suite.specs.forEach(spec => {
                  summary.total++;

                  const test = {
                    title: spec.title,
                    file: spec.file || suite.title,
                    status: 'unknown',
                    duration: 0,
                    error: null,
                    screenshots: []
                  };

                  if (spec.tests && spec.tests.length > 0) {
                    const testResult = spec.tests[0].results[0];
                    test.status = testResult.status;
                    test.duration = testResult.duration;

                    // Capture screenshots
                    if (testResult.attachments && testResult.attachments.length > 0) {
                      testResult.attachments.forEach(attachment => {
                        if (attachment.name === 'screenshot' && attachment.path) {
                          const testResultsDir = path.join(path.resolve(__dirname, '..'), 'test-results');
                          let relativePath = path.relative(testResultsDir, attachment.path);
                          relativePath = relativePath.replace(/\\/g, '/');
                          test.screenshots.push(relativePath);
                        }
                      });
                    }

                    if (testResult.status === 'passed') {
                      summary.passed++;
                    } else if (testResult.status === 'failed') {
                      summary.failed++;
                      test.error = testResult.error?.message || 'Test failed';
                    } else if (testResult.status === 'skipped') {
                      summary.skipped++;
                    }
                  }

                  tests.push(test);
                });
              }

              if (suite.suites) {
                parseSpecs(suite.suites);
              }
            });
          };

          parseSpecs(testResults.suites);
        }

        resolve({
          region,
          environment,
          testFile,
          retryAttempt,
          timestamp: new Date().toISOString(),
          duration,
          success: code === 0,
          summary,
          tests
        });

      } catch (error) {
        reject(new Error(`Failed to parse retry results: ${error.message}`));
      }
    });

    playwright.on('error', (error) => {
      reject(new Error(`Failed to spawn Playwright for retry: ${error.message}`));
    });
  });
}

module.exports = {
  runTests,
  runSingleTest
};
