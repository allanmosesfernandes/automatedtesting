/**
 * Configuration for Photo Books link validation tests
 */

export interface PhotoBooksTestConfig {
  // Batch configuration
  batchStart: number;
  batchSize: number;
  batchRefreshInterval: number; // Login refresh every N links

  // Timeouts (in milliseconds)
  timeouts: {
    categoryPageLoad: number;
    productPageLoad: number;
    themePageLoad: number;
    designerPageLoad: number;
    designerWaitTime: number; // Extra wait time before validation
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

  // Selectors
  selectors: {
    categoryLink: string; // Category selection link on landing page
    createButton: string; // "Create Yours Now" button
    designThemeButton: string; // "Design Your Own Theme" button
  };

  // Validation settings
  validation: {
    checkErrorPopup: boolean;
    checkDesignerLoaded: boolean;
    captureScreenshotOnFailure: boolean;
    captureConsoleErrors: boolean;
  };
}

/**
 * Get test configuration from environment variables with defaults
 */
export function getPhotoBooksTestConfig(): PhotoBooksTestConfig {
  const batchStart = parseInt(process.env.BATCH_START || '1', 10);
  const batchSize = parseInt(process.env.BATCH_SIZE || '10', 10);
  const batchRefreshInterval = parseInt(process.env.BATCH_REFRESH_INTERVAL || '100', 10);

  // Support for chunk files
  const linksFile = process.env.CHUNK_FILE || process.env.LINKS_FILE || 'photo-books.json';
  const chunkId = process.env.CHUNK_ID || '0';

  return {
    batchStart,
    batchSize,
    batchRefreshInterval,

    timeouts: {
      categoryPageLoad: 15000,    // 15 seconds for category page to load
      productPageLoad: 15000,     // 15 seconds for "Create Yours Now" button
      themePageLoad: 15000,       // 15 seconds for theme selection page
      designerPageLoad: 45000,    // 45 seconds for qdesigner to load
      designerWaitTime: 5000,     // 5 seconds additional wait before validation
      navigationTimeout: 45000,   // 45 seconds default navigation
    },

    credentials: {
      email: 'allan.fernandes@printerpix.co.uk',
      password: 'All@in1234*',
    },

    paths: {
      linksFile: linksFile,
      resultsDir: `test-results/photo-books-optimized`,
      screenshotsDir: `test-results/photo-books-optimized/screenshots`,
      logsDir: `test-results/photo-books-optimized/logs`,
      reportsDir: `test-results/photo-books-optimized/reports`,
    },

    selectors: {
      // Category link selector using href and class attributes
      categoryLink: 'a[href*="/photo-books/"][class*="link_slide_show_product_category"]',
      // "Create Yours Now" button (may need adjustment based on actual page)
      createButton: 'button:has-text("Create Yours Now"), a:has-text("Create Yours Now")',
      // "Design Your Own Theme" button
      designThemeButton: 'div.bg-white.rounded-\\[4px\\]:has-text("Design Your Own Theme")',
    },

    validation: {
      checkErrorPopup: true,
      checkDesignerLoaded: true,
      captureScreenshotOnFailure: true,
      captureConsoleErrors: true,
    },
  };
}

/**
 * Test result interface
 */
export interface PhotoBooksTestResult {
  url: string;
  index: number;
  success: boolean;
  timestamp: string;
  duration: number;
  checkpoints: {
    categoryPageLoaded: boolean;
    categorySelected: boolean;
    productPageLoaded: boolean;
    themePageLoaded: boolean;
    designerPageLoaded: boolean;
    errorPopupAbsent: boolean;
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
export interface PhotoBooksTestSummary {
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
