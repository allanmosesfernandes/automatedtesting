/**
 * Progress Reporter Module
 * Writes real-time test progress to a JSON file that the dashboard can read
 */

import * as fs from 'fs';
import * as path from 'path';

export interface ProgressData {
  status: 'idle' | 'running' | 'completed' | 'stopped';
  startTime: string;
  currentTime: string;
  duration: number; // seconds
  elapsed: number; // seconds
  remaining: number; // seconds
  totalClicks: number;
  successfulClicks: number;
  failedClicks: number;
  successRate: string;
  currentLink: string | null;
  currentEnvironment: string;
  recentFailures: Array<{
    linkName: string;
    timestamp: string;
    screenshotPath: string;
    errorDetails: string;
  }>;
  shouldStop: boolean;
}

const PROGRESS_FILE = path.join(process.cwd(), 'test-results', 'navigation-monitoring', '.progress.json');
const STOP_SIGNAL_FILE = path.join(process.cwd(), 'test-results', 'navigation-monitoring', '.stop-signal');

/**
 * Initialize progress file with default state
 */
export function initProgressFile(environment: string, durationMinutes: number): void {
  const progressDir = path.dirname(PROGRESS_FILE);

  // Ensure directory exists
  if (!fs.existsSync(progressDir)) {
    fs.mkdirSync(progressDir, { recursive: true });
  }

  const initialProgress: ProgressData = {
    status: 'running',
    startTime: new Date().toISOString(),
    currentTime: new Date().toISOString(),
    duration: durationMinutes * 60,
    elapsed: 0,
    remaining: durationMinutes * 60,
    totalClicks: 0,
    successfulClicks: 0,
    failedClicks: 0,
    successRate: '0.0%',
    currentLink: null,
    currentEnvironment: environment,
    recentFailures: [],
    shouldStop: false
  };

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(initialProgress, null, 2));

  // Remove any existing stop signal
  if (fs.existsSync(STOP_SIGNAL_FILE)) {
    fs.unlinkSync(STOP_SIGNAL_FILE);
  }
}

/**
 * Update progress with current state
 */
export function updateProgress(data: Partial<ProgressData>): void {
  try {
    // Read current progress
    let currentProgress: ProgressData;

    if (fs.existsSync(PROGRESS_FILE)) {
      const fileContent = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      currentProgress = JSON.parse(fileContent);
    } else {
      // If file doesn't exist, create default
      currentProgress = {
        status: 'running',
        startTime: new Date().toISOString(),
        currentTime: new Date().toISOString(),
        duration: 300,
        elapsed: 0,
        remaining: 300,
        totalClicks: 0,
        successfulClicks: 0,
        failedClicks: 0,
        successRate: '0.0%',
        currentLink: null,
        currentEnvironment: 'unknown',
        recentFailures: [],
        shouldStop: false
      };
    }

    // Calculate elapsed and remaining time
    const now = new Date();
    const startTime = new Date(currentProgress.startTime);
    const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    const remaining = Math.max(0, currentProgress.duration - elapsed);

    // Merge with new data
    const updatedProgress: ProgressData = {
      ...currentProgress,
      ...data,
      currentTime: now.toISOString(),
      elapsed,
      remaining
    };

    // Calculate success rate if clicks data provided
    if (data.totalClicks !== undefined) {
      const successRate = updatedProgress.totalClicks > 0
        ? ((updatedProgress.successfulClicks / updatedProgress.totalClicks) * 100).toFixed(1)
        : '0.0';
      updatedProgress.successRate = `${successRate}%`;
    }

    // Write updated progress
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(updatedProgress, null, 2));
  } catch (error) {
    console.error('Error updating progress:', error);
  }
}

/**
 * Add a failure to the recent failures list
 */
export function addFailure(failure: {
  linkName: string;
  timestamp: string;
  screenshotPath: string;
  errorDetails: string;
}): void {
  try {
    if (!fs.existsSync(PROGRESS_FILE)) {
      return;
    }

    const fileContent = fs.readFileSync(PROGRESS_FILE, 'utf-8');
    const currentProgress: ProgressData = JSON.parse(fileContent);

    // Add to recent failures (keep last 10)
    currentProgress.recentFailures.unshift(failure);
    if (currentProgress.recentFailures.length > 10) {
      currentProgress.recentFailures = currentProgress.recentFailures.slice(0, 10);
    }

    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(currentProgress, null, 2));
  } catch (error) {
    console.error('Error adding failure:', error);
  }
}

/**
 * Mark test as completed
 */
export function markTestComplete(): void {
  updateProgress({ status: 'completed' });
}

/**
 * Mark test as stopped
 */
export function markTestStopped(): void {
  updateProgress({ status: 'stopped' });
}

/**
 * Check if test should stop (stop signal file exists)
 */
export function shouldStopTest(): boolean {
  if (fs.existsSync(STOP_SIGNAL_FILE)) {
    return true;
  }

  // Also check progress file for shouldStop flag
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const fileContent = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      const progress: ProgressData = JSON.parse(fileContent);
      return progress.shouldStop === true;
    }
  } catch {
    // Ignore errors
  }

  return false;
}

/**
 * Create stop signal file
 */
export function createStopSignal(): void {
  const stopSignalDir = path.dirname(STOP_SIGNAL_FILE);

  // Ensure directory exists
  if (!fs.existsSync(stopSignalDir)) {
    fs.mkdirSync(stopSignalDir, { recursive: true });
  }

  fs.writeFileSync(STOP_SIGNAL_FILE, new Date().toISOString());

  // Also update progress file
  updateProgress({ shouldStop: true });
}

/**
 * Get current progress data
 */
export function getCurrentProgress(): ProgressData | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const fileContent = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Error reading progress:', error);
  }
  return null;
}

/**
 * Reset progress (set to idle state)
 */
export function resetProgress(): void {
  const idleProgress: ProgressData = {
    status: 'idle',
    startTime: new Date().toISOString(),
    currentTime: new Date().toISOString(),
    duration: 0,
    elapsed: 0,
    remaining: 0,
    totalClicks: 0,
    successfulClicks: 0,
    failedClicks: 0,
    successRate: '0.0%',
    currentLink: null,
    currentEnvironment: '',
    recentFailures: [],
    shouldStop: false
  };

  const progressDir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(progressDir)) {
    fs.mkdirSync(progressDir, { recursive: true });
  }

  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(idleProgress, null, 2));

  // Remove stop signal
  if (fs.existsSync(STOP_SIGNAL_FILE)) {
    fs.unlinkSync(STOP_SIGNAL_FILE);
  }
}
