/**
 * Dashboard UI Logic
 * Handles user interactions, API calls, and UI state management
 */

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Dashboard initialized');

  // Setup event listeners
  setupEventListeners();

  // Load initial status
  loadStatus();

  // Load screenshots gallery
  loadScreenshots();

  // Poll for screenshots updates every 10 seconds
  setInterval(loadScreenshots, 10000);
});

/**
 * Setup event listeners for UI controls
 */
function setupEventListeners() {
  // Duration select handler
  const durationSelect = document.getElementById('duration-select');
  const customDurationInput = document.getElementById('custom-duration');

  durationSelect.addEventListener('change', (e) => {
    if (e.target.value === 'custom') {
      customDurationInput.style.display = 'block';
      customDurationInput.focus();
    } else {
      customDurationInput.style.display = 'none';
    }
  });

  // Start button handler
  document.getElementById('start-btn').addEventListener('click', startTest);

  // Stop button handler
  document.getElementById('stop-btn').addEventListener('click', stopTest);

  // Modal close handler
  const modal = document.getElementById('screenshot-modal');
  const closeBtn = document.querySelector('.modal-close');

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Load current test status from API
 */
async function loadStatus() {
  try {
    const response = await fetch('/api/status');
    const result = await response.json();

    if (result.status === 'success' && result.data) {
      updateDashboard(result.data);
    }
  } catch (error) {
    console.error('Error loading status:', error);
  }
}

/**
 * Start test via API
 */
async function startTest() {
  const durationSelect = document.getElementById('duration-select');
  const customDurationInput = document.getElementById('custom-duration');
  const environmentSelect = document.getElementById('environment-select');

  // Get duration
  let duration;
  if (durationSelect.value === 'custom') {
    duration = parseInt(customDurationInput.value);
    if (!duration || duration < 1 || duration > 120) {
      alert('Please enter a valid duration between 1 and 120 minutes');
      return;
    }
  } else {
    duration = parseInt(durationSelect.value);
  }

  // Get environment
  const environment = environmentSelect.value;

  // Disable start button
  const startBtn = document.getElementById('start-btn');
  startBtn.disabled = true;
  startBtn.textContent = 'Starting...';

  try {
    const response = await fetch('/api/start-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        duration,
        environment
      })
    });

    const result = await response.json();

    if (result.status === 'success') {
      console.log('✅ Test started successfully');
      showNotification('Test started successfully', 'success');
    } else {
      console.error('❌ Failed to start test:', result.message);
      showNotification(result.message || 'Failed to start test', 'error');
      startBtn.disabled = false;
      startBtn.innerHTML = '<span>▶</span> Start Test';
    }
  } catch (error) {
    console.error('Error starting test:', error);
    showNotification('Error starting test: ' + error.message, 'error');
    startBtn.disabled = false;
    startBtn.innerHTML = '<span>▶</span> Start Test';
  }
}

/**
 * Stop test via API
 */
async function stopTest() {
  if (!confirm('Are you sure you want to stop the test?')) {
    return;
  }

  // Disable stop button
  const stopBtn = document.getElementById('stop-btn');
  stopBtn.disabled = true;
  stopBtn.textContent = 'Stopping...';

  try {
    const response = await fetch('/api/stop-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();

    if (result.status === 'success') {
      console.log('✅ Test stopped successfully');
      showNotification('Test stopped successfully', 'success');
    } else {
      console.error('❌ Failed to stop test:', result.message);
      showNotification(result.message || 'Failed to stop test', 'error');
    }
  } catch (error) {
    console.error('Error stopping test:', error);
    showNotification('Error stopping test: ' + error.message, 'error');
  }
}

/**
 * Load screenshots gallery
 */
async function loadScreenshots() {
  const environmentSelect = document.getElementById('environment-select');
  const environment = environmentSelect.value;

  try {
    const response = await fetch(`/api/screenshots?environment=${environment}`);
    const result = await response.json();

    if (result.status === 'success') {
      displayScreenshots(result.data);
    }
  } catch (error) {
    console.error('Error loading screenshots:', error);
  }
}

/**
 * Display screenshots in gallery
 */
function displayScreenshots(screenshots) {
  const gallery = document.getElementById('screenshots-gallery');

  if (!screenshots || screenshots.length === 0) {
    gallery.innerHTML = '<p class="empty-state">No screenshots available</p>';
    return;
  }

  gallery.innerHTML = screenshots.map(screenshot => `
    <div class="screenshot-item" onclick="openScreenshotModal('${screenshot.path}', '${escapeHtml(screenshot.filename)}')">
      <img src="${screenshot.path}" alt="${escapeHtml(screenshot.filename)}" loading="lazy">
      <div class="screenshot-caption">
        ${escapeHtml(screenshot.filename.replace('.png', '').replace(/-/g, ' '))}
        <span class="screenshot-time">${formatTimestamp(screenshot.timestamp)}</span>
      </div>
    </div>
  `).join('');
}

/**
 * Open screenshot in modal
 */
function openScreenshotModal(path, filename) {
  const modal = document.getElementById('screenshot-modal');
  const modalImage = document.getElementById('modal-image');
  const modalCaption = document.getElementById('modal-caption');

  modalImage.src = path;
  modalCaption.textContent = filename;
  modal.style.display = 'flex';
}

/**
 * Show notification (simple implementation)
 */
function showNotification(message, type = 'info') {
  // Simple alert for now - can be enhanced with a toast library
  if (type === 'error') {
    console.error(message);
  } else {
    console.log(message);
  }
}

/**
 * Format timestamp to readable format
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
