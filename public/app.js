/**
 * Automated Testing Dashboard - Frontend Application
 */

let currentJobId = null;
let statusCheckInterval = null;
let triviaRotationInterval = null;

// Initialize the dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Automated Testing Dashboard loaded');
    updateTestSummary();

    // Add event listeners to checkboxes
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateTestSummary);
    });
});

/**
 * Update the test summary count based on selected checkboxes
 */
function updateTestSummary() {
    const selectedRegions = getSelectedRegions();
    const selectedEnvironments = getSelectedEnvironments();
    const totalTests = selectedRegions.length * selectedEnvironments.length;

    const summary = document.getElementById('test-summary');

    if (totalTests === 0) {
        summary.innerHTML = '<p class="warning">⚠️ Please select at least one region and one environment</p>';
    } else {
        summary.innerHTML = `<p>Selected: <strong>${totalTests}</strong> test combinations (${selectedRegions.length} regions × ${selectedEnvironments.length} environments)</p>`;
    }
}

/**
 * Get selected region codes
 */
function getSelectedRegions() {
    const checkboxes = document.querySelectorAll('input[name="region"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * Get selected environments
 */
function getSelectedEnvironments() {
    const checkboxes = document.querySelectorAll('input[name="environment"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * Select all regions
 */
function selectAllRegions() {
    const checkboxes = document.querySelectorAll('input[name="region"]');
    checkboxes.forEach(cb => cb.checked = true);
    updateTestSummary();
}

/**
 * Deselect all regions
 */
function deselectAllRegions() {
    const checkboxes = document.querySelectorAll('input[name="region"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateTestSummary();
}

/**
 * Run tests with selected configuration
 */
async function runTests() {
    const regions = getSelectedRegions();
    const environments = getSelectedEnvironments();

    // Validation
    if (regions.length === 0 || environments.length === 0) {
        alert('⚠️ Please select at least one region and one environment');
        return;
    }

    // Disable run button
    const runButton = document.getElementById('run-tests-btn');
    runButton.disabled = true;
    runButton.textContent = 'Starting...';

    try {
        // Call API to start test execution
        const response = await fetch('/api/run-tests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ regions, environments })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to start tests');
        }

        const result = await response.json();
        currentJobId = result.jobId;

        console.log(`✅ Tests started with job ID: ${currentJobId}`);

        // Switch to loading view
        showLoadingPanel();

        // Start polling for status
        startStatusPolling();

        // Start trivia rotation
        startTriviaRotation();

    } catch (error) {
        console.error('❌ Error starting tests:', error);
        alert(`Error starting tests: ${error.message}`);
        runButton.disabled = false;
        runButton.innerHTML = '<span class="btn-icon">▶️</span> Run Tests';
    }
}

/**
 * Show loading panel and hide config panel
 */
function showLoadingPanel() {
    document.getElementById('config-panel').style.display = 'none';
    document.getElementById('loading-panel').style.display = 'block';
    document.getElementById('results-panel').style.display = 'none';
}

/**
 * Show results panel and hide loading panel
 */
function showResultsPanel() {
    document.getElementById('config-panel').style.display = 'none';
    document.getElementById('loading-panel').style.display = 'none';
    document.getElementById('results-panel').style.display = 'block';
}

/**
 * Reset dashboard to initial state
 */
function resetDashboard() {
    // Stop intervals
    if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
    }
    if (triviaRotationInterval) {
        clearInterval(triviaRotationInterval);
        triviaRotationInterval = null;
    }

    // Reset job ID
    currentJobId = null;

    // Show config panel
    document.getElementById('config-panel').style.display = 'block';
    document.getElementById('loading-panel').style.display = 'none';
    document.getElementById('results-panel').style.display = 'none';

    // Re-enable run button
    const runButton = document.getElementById('run-tests-btn');
    runButton.disabled = false;
    runButton.innerHTML = '<span class="btn-icon">▶️</span> Run Tests';
}

/**
 * Start polling for test status
 */
function startStatusPolling() {
    // Check immediately
    checkTestStatus();

    // Then check every 2 seconds
    statusCheckInterval = setInterval(checkTestStatus, 2000);
}

/**
 * Check current test status
 */
async function checkTestStatus() {
    if (!currentJobId) return;

    try {
        const response = await fetch(`/api/test-status/${currentJobId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch test status');
        }

        const status = await response.json();

        // Update progress bar
        const progressPercent = (status.progress.completed / status.progress.total) * 100;
        document.getElementById('progress-fill').style.width = `${progressPercent}%`;
        document.getElementById('progress-text').textContent =
            `${status.progress.completed} / ${status.progress.total} completed`;

        // Update status message
        const statusElement = document.getElementById('loading-status');
        if (status.progress.current) {
            statusElement.textContent = status.progress.current;
        }

        // Check if completed
        if (status.status === 'completed') {
            console.log('✅ Tests completed');
            clearInterval(statusCheckInterval);
            clearInterval(triviaRotationInterval);
            await loadTestResults();
        } else if (status.status === 'failed') {
            console.error('❌ Tests failed:', status.error);
            clearInterval(statusCheckInterval);
            clearInterval(triviaRotationInterval);
            alert(`Tests failed: ${status.error}`);
            resetDashboard();
        }

    } catch (error) {
        console.error('Error checking test status:', error);
    }
}

/**
 * Start rotating trivia messages
 */
function startTriviaRotation() {
    // Load first trivia immediately
    loadTrivia();

    // Then rotate every 8 seconds
    triviaRotationInterval = setInterval(loadTrivia, 8000);
}

/**
 * Load and display a random trivia message
 */
async function loadTrivia() {
    try {
        const response = await fetch('/api/trivia');
        if (!response.ok) return;

        const data = await response.json();
        const triviaElement = document.getElementById('trivia-message');

        // Fade out
        triviaElement.style.opacity = '0';

        setTimeout(() => {
            triviaElement.textContent = data.message;
            // Fade in
            triviaElement.style.opacity = '1';
        }, 300);

    } catch (error) {
        console.error('Error loading trivia:', error);
    }
}

/**
 * Load and display test results
 */
async function loadTestResults() {
    try {
        const response = await fetch(`/api/test-results/${currentJobId}`);

        if (!response.ok) {
            throw new Error('Failed to fetch test results');
        }

        const data = await response.json();
        displayResults(data);
        showResultsPanel();

    } catch (error) {
        console.error('Error loading results:', error);
        alert(`Error loading results: ${error.message}`);
        resetDashboard();
    }
}

/**
 * Display test results in the UI
 */
function displayResults(data) {
    const { results } = data;

    // Display summary cards
    displaySummaryCards(results.summary);

    // Display detailed results
    displayDetailedResults(results.testRuns);
}

/**
 * Display summary cards
 */
function displaySummaryCards(summary) {
    const cardsContainer = document.getElementById('summary-cards');

    const duration = (summary.duration / 1000).toFixed(1);
    const successRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;

    cardsContainer.innerHTML = `
        <div class="summary-card">
            <div class="card-icon">✅</div>
            <div class="card-content">
                <h3>${summary.passed}</h3>
                <p>Passed</p>
            </div>
        </div>
        <div class="summary-card ${summary.failed > 0 ? 'error' : ''}">
            <div class="card-icon">❌</div>
            <div class="card-content">
                <h3>${summary.failed}</h3>
                <p>Failed</p>
            </div>
        </div>
        <div class="summary-card">
            <div class="card-icon">📊</div>
            <div class="card-content">
                <h3>${summary.total}</h3>
                <p>Total Tests</p>
            </div>
        </div>
        <div class="summary-card">
            <div class="card-icon">⏱️</div>
            <div class="card-content">
                <h3>${duration}s</h3>
                <p>Duration</p>
            </div>
        </div>
        <div class="summary-card">
            <div class="card-icon">📈</div>
            <div class="card-content">
                <h3>${successRate}%</h3>
                <p>Success Rate</p>
            </div>
        </div>
    `;
}

/**
 * Display detailed results for each region-environment combination
 */
function displayDetailedResults(testRuns) {
    const detailsContainer = document.getElementById('results-details');

    let html = '<h3>Detailed Results by Region & Environment</h3>';

    testRuns.forEach(run => {
        const statusClass = run.status === 'passed' ? 'success' : run.status === 'failed' ? 'error' : 'warning';
        const statusIcon = run.status === 'passed' ? '✅' : run.status === 'failed' ? '❌' : '⚠️';
        const duration = (run.duration / 1000).toFixed(2);

        html += `
            <div class="test-run-card ${statusClass}">
                <div class="test-run-header">
                    <h4>
                        ${statusIcon} ${run.region} - ${run.environment.toUpperCase()}
                        <span class="test-run-url">${run.baseUrl}</span>
                    </h4>
                    <span class="test-run-duration">${duration}s</span>
                </div>
        `;

        if (run.status === 'error') {
            html += `<p class="error-message">Error: ${run.error}</p>`;
        } else if (run.summary) {
            html += `
                <div class="test-run-summary">
                    <span class="test-stat">Total: ${run.summary.total}</span>
                    <span class="test-stat success">Passed: ${run.summary.passed}</span>
                    ${run.summary.failed > 0 ? `<span class="test-stat error">Failed: ${run.summary.failed}</span>` : ''}
                    ${run.summary.skipped > 0 ? `<span class="test-stat">Skipped: ${run.summary.skipped}</span>` : ''}
                </div>
            `;

            if (run.tests && run.tests.length > 0) {
                html += '<div class="test-list">';
                run.tests.forEach(test => {
                    const testStatusIcon = test.status === 'passed' ? '✓' : test.status === 'failed' ? '✗' : '○';
                    const testStatusClass = test.status === 'passed' ? 'success' : test.status === 'failed' ? 'error' : '';

                    html += `
                        <div class="test-item ${testStatusClass}">
                            <span class="test-status">${testStatusIcon}</span>
                            <div class="test-content">
                                <span class="test-title">${test.title}</span>
                                ${test.error ? `<p class="test-error">${test.error}</p>` : ''}
                                ${test.screenshots && test.screenshots.length > 0 ? `
                                    <div class="test-screenshots">
                                        ${test.screenshots.map(screenshot => `
                                            <div class="screenshot-container">
                                                <a href="/${screenshot}" target="_blank">
                                                    <img src="/${screenshot}" alt="Test screenshot" class="test-screenshot" />
                                                </a>
                                                <p class="screenshot-caption">Click to view full size</p>
                                            </div>
                                        `).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
                });
                html += '</div>';
            }
        }

        html += '</div>';
    });

    detailsContainer.innerHTML = html;
}

/**
 * Download test results as JSON
 */
async function downloadResults() {
    if (!currentJobId) return;

    try {
        window.location.href = `/api/test-results/${currentJobId}/download`;
    } catch (error) {
        console.error('Error downloading results:', error);
        alert('Failed to download results');
    }
}
