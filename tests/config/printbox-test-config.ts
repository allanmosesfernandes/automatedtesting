/**
 * Configuration for Printbox link validation tests
 */

export interface PrintboxTestConfig {
  // Batch configuration
  batchStart: number;
  batchSize: number;
  batchRefreshInterval: number; // Login refresh every N links

  // Timeouts (in milliseconds)
  timeouts: {
    productPageLoad: number;
    themePageLoad: number;
    designerPageLoad: number;
    iframeLoad: number;
    designerUILoad: number;
    navigationTimeout: number;
  };

  // Credentials
  credentials: {
    email: string;
    password: string;
  };

  // Paths
  paths: {
    linksFile: string;
    resultsDir: string;
    screenshotsDir: string;
    logsDir: string;
    reportsDir: string;
  };

  // Validation settings
  validation: {
    checkErrorPopup: boolean;
    checkIframeLoaded: boolean;
    checkDesignerUI: boolean;
    captureScreenshotOnFailure: boolean;
    captureConsoleErrors: boolean;
  };
}

/**
 * Get test configuration from environment variables with defaults
 */
export function getPrintboxTestConfig(): PrintboxTestConfig {
  const batchStart = parseInt(process.env.BATCH_START || '1', 10);
  const batchSize = parseInt(process.env.BATCH_SIZE || '10', 10);  // Default to 10 for Stage 1
  const batchRefreshInterval = parseInt(process.env.BATCH_REFRESH_INTERVAL || '100', 10);

  // Support for chunk files (e.g., CHUNK_FILE=test-data/chunks/links-chunk-1.json)
  const linksFile = process.env.CHUNK_FILE || process.env.LINKS_FILE || 'final.json';
  const chunkId = process.env.CHUNK_ID || '0';

  return {
    batchStart,
    batchSize,
    batchRefreshInterval,

    timeouts: {
      productPageLoad: 15000,     // 15 seconds for "Start My Book" button
      themePageLoad: 15000,       // 15 seconds for theme selection page
      designerPageLoad: 45000,    // 45 seconds for qdesigner to load
      iframeLoad: 20000,          // 20 seconds for Printbox iframe
      designerUILoad: 15000,      // 15 seconds for designer UI elements
      navigationTimeout: 45000,   // 45 seconds default navigation
    },

    credentials: {
      email: 'allan.fernandes@printerpix.co.uk',
      password: 'All@in1234*',
    },

    paths: {
      linksFile: linksFile,
      resultsDir: `test-results/printbox`,
      screenshotsDir: `test-results/printbox/screenshots`,
      logsDir: `test-results/printbox/logs`,
      reportsDir: `test-results/printbox/reports`,
    },

    validation: {
      checkErrorPopup: true,
      checkIframeLoaded: true,
      checkDesignerUI: true,
      captureScreenshotOnFailure: true,
      captureConsoleErrors: true,
    },
  };
}

/**
 * Test result interface
 */
export interface PrintboxTestResult {
  url: string;
  index: number;
  success: boolean;
  timestamp: string;
  duration: number;
  checkpoints: {
    productPageLoaded: boolean;
    themePageLoaded: boolean;
    loginCompleted: boolean;
    designerPageLoaded: boolean;
    errorPopupAbsent: boolean;
    iframeLoaded: boolean;
    designerUIVisible: boolean;
  };
  error?: {
    type: string;
    message: string;
    checkpoint: string;
  };
  errorText?: string | null;
  finalUrl?: string;
  screenshotPath?: string;
  consoleErrors?: string[];
}

/**
 * Test summary interface
 */
export interface PrintboxTestSummary {
  totalTested: number;
  totalPassed: number;
  totalFailed: number;
  successRate: number;
  batchInfo: {
    start: number;
    end: number;
    size: number;
  };
  duration: number;
  timestamp: string;
  errorCategories: {
    [key: string]: number;
  };
}
