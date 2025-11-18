/**
 * Real-time WebSocket Client
 * Handles Socket.IO connection and real-time progress updates
 */

// Initialize Socket.IO connection
const socket = io();

// Connection event handlers
socket.on('connect', () => {
  console.log('✅ Connected to server');
  updateConnectionStatus(true);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
  updateConnectionStatus(false);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  updateConnectionStatus(false);
});

// Progress update handler
socket.on('progress-update', (data) => {
  console.log('📊 Progress update received:', data);
  updateDashboard(data);
});

/**
 * Update dashboard with progress data
 */
function updateDashboard(data) {
  // Update status
  updateTestStatus(data.status);

  // Update environment
  document.getElementById('current-environment').textContent =
    data.currentEnvironment || '-';

  // Update times
  document.getElementById('elapsed-time').textContent =
    formatTime(data.elapsed || 0);
  document.getElementById('remaining-time').textContent =
    data.remaining > 0 ? formatTime(data.remaining) : '-';

  // Update current link
  document.getElementById('current-link').textContent =
    data.currentLink || '-';

  // Update metrics
  document.getElementById('total-clicks').textContent = data.totalClicks || 0;
  document.getElementById('successful-clicks').textContent = data.successfulClicks || 0;
  document.getElementById('failed-clicks').textContent = data.failedClicks || 0;

  // Update success rate with color coding
  const successRateElement = document.getElementById('success-rate');
  successRateElement.textContent = data.successRate || '0.0%';

  // Apply color coding
  const rate = parseFloat(data.successRate);
  successRateElement.classList.remove('success-rate-high', 'success-rate-medium', 'success-rate-low');
  if (rate >= 95) {
    successRateElement.classList.add('success-rate-high');
  } else if (rate >= 90) {
    successRateElement.classList.add('success-rate-medium');
  } else if (rate > 0) {
    successRateElement.classList.add('success-rate-low');
  }

  // Update recent failures
  if (data.recentFailures && data.recentFailures.length > 0) {
    updateRecentFailures(data.recentFailures);
  }

  // Update button states based on status
  updateButtonStates(data.status);
}

/**
 * Update test status display
 */
function updateTestStatus(status) {
  const statusElement = document.getElementById('test-status');

  // Remove all status classes
  statusElement.classList.remove('status-idle', 'status-running', 'status-completed', 'status-stopped');

  // Add current status class
  statusElement.classList.add(`status-${status}`);

  // Update text
  switch(status) {
    case 'idle':
      statusElement.textContent = 'Idle';
      break;
    case 'running':
      statusElement.textContent = 'Running';
      break;
    case 'completed':
      statusElement.textContent = 'Completed';
      break;
    case 'stopped':
      statusElement.textContent = 'Stopped';
      break;
    default:
      statusElement.textContent = status;
  }
}

/**
 * Update button states based on test status
 */
function updateButtonStates(status) {
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');

  if (status === 'running') {
    startBtn.disabled = true;
    stopBtn.disabled = false;
  } else {
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

/**
 * Update recent failures list
 */
function updateRecentFailures(failures) {
  const container = document.getElementById('failures-container');

  if (failures.length === 0) {
    container.innerHTML = '<p class="empty-state">No failures yet</p>';
    return;
  }

  container.innerHTML = failures.map(failure => `
    <div class="failure-item">
      <div class="failure-header">
        <span class="failure-name">${escapeHtml(failure.linkName)}</span>
        <span class="failure-time">${formatTimestamp(failure.timestamp)}</span>
      </div>
      <div class="failure-details">${escapeHtml(failure.errorDetails)}</div>
      ${failure.screenshotPath ? `
        <div class="failure-screenshot">
          <img src="${failure.screenshotPath}"
               alt="Screenshot of ${escapeHtml(failure.linkName)}"
               loading="lazy"
               style="max-width: 100%; border: 1px solid #ddd; border-radius: 4px; margin-top: 10px;">
        </div>
      ` : ''}
    </div>
  `).join('');
}

/**
 * Update connection status indicator (optional)
 */
function updateConnectionStatus(connected) {
  // You can add a visual indicator for connection status if desired
  // For now, we just log it
  if (connected) {
    console.log('🟢 Real-time updates active');
  } else {
    console.log('🔴 Real-time updates inactive');
  }
}

/**
 * Format seconds to MM:SS
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format ISO timestamp to readable format
 */
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
