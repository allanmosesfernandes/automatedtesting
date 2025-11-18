import { Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { PrintboxDesignerPage } from '../pages/PrintboxDesignerPage';
import { PrintboxTestResult, PrintboxTestConfig } from '../config/printbox-test-config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Validate a single product link through the complete flow
 */
export async function validateProductLink(
  page: Page,
  url: string,
  index: number,
  config: PrintboxTestConfig
): Promise<PrintboxTestResult> {
  const startTime = Date.now();
  const consoleErrors: string[] = [];

  // Setup console error monitoring if enabled
  if (config.validation.captureConsoleErrors) {
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(`${msg.text()}`);
      }
    });
  }

  const result: PrintboxTestResult = {
    url,
    index,
    success: false,
    timestamp: new Date().toISOString(),
    duration: 0,
    checkpoints: {
      productPageLoaded: false,
      themePageLoaded: false,
      loginCompleted: false,
      designerPageLoaded: false,
      errorPopupAbsent: false,
      iframeLoaded: false,
      designerUIVisible: false,
    },
    consoleErrors: [],
  };

  try {
    const designerPage = new PrintboxDesignerPage(page);

    // Step 1: Navigate to product URL
    console.log(`[${index}] Navigating to: ${url}`);
    await designerPage.goto(url);

    // Step 2: Wait for product page to load
    console.log(`[${index}] Waiting for product page to load...`);
    const productPageLoaded = await designerPage.waitForProductPageLoad(config.timeouts.productPageLoad);
    result.checkpoints.productPageLoaded = productPageLoaded;

    if (!productPageLoaded) {
      throw new Error('Product page did not load - "Start My Book" button not found');
    }

    // Step 3: Click "Start My Book"
    console.log(`[${index}] Clicking "Start My Book"...`);
    await designerPage.clickStartMyBook();

    // Step 4: Wait for theme selection page
    console.log(`[${index}] Waiting for theme selection page...`);
    const themePageLoaded = await designerPage.waitForThemeSelectionPage(config.timeouts.themePageLoad);
    result.checkpoints.themePageLoaded = themePageLoaded;

    if (!themePageLoaded) {
      throw new Error('Theme selection page did not load');
    }

    // Step 5: Select first theme
    console.log(`[${index}] Selecting first theme...`);
    await designerPage.selectFirstTheme();

    // Step 6: Check if redirected to login page
    await page.waitForTimeout(2000); // Wait for redirect
    const currentUrl = page.url();

    if (currentUrl.includes('/login/')) {
      console.log(`[${index}] Redirected to login, authenticating...`);
      const loginPage = new LoginPage(page);

      // Check if we're on the registration page, click "Already have account"
      if (currentUrl.includes('/register/')) {
        try {
          const alreadyHaveAccountButton = page.locator('text=/Have an account already|Login/i');
          await alreadyHaveAccountButton.click({ timeout: 3000 });
          await page.waitForTimeout(1000);
        } catch (error) {
          // May already be on login page
        }
      }

      // Perform login
      await loginPage.signIn(config.credentials.email, config.credentials.password);
      await page.waitForTimeout(2000);

      result.checkpoints.loginCompleted = true;
    }

    // Step 7: Wait for designer page to load
    console.log(`[${index}] Waiting for designer page...`);
    const designerPageLoaded = await designerPage.waitForDesignerPage(config.timeouts.designerPageLoad);
    result.checkpoints.designerPageLoaded = designerPageLoaded;

    if (!designerPageLoaded) {
      throw new Error('Designer page did not load - URL does not contain /qdesigner/');
    }

    // Step 8: Validate designer (no errors + iframe + UI)
    console.log(`[${index}] Validating designer...`);
    const validation = await designerPage.validateDesigner();

    result.checkpoints.errorPopupAbsent = !validation.errorPopup;
    result.checkpoints.iframeLoaded = validation.iframeLoaded;
    result.checkpoints.designerUIVisible = validation.designerUIVisible;
    result.errorText = validation.errorText;
    result.finalUrl = designerPage.getCurrentUrl();

    // Determine success
    result.success = validation.success;

    if (!result.success) {
      let errorMessages = [];
      if (validation.errorPopup) errorMessages.push('Error popup detected');
      if (!validation.iframeLoaded) errorMessages.push('Printbox iframe not loaded');
      if (!validation.designerUIVisible) errorMessages.push('Designer UI not visible');

      throw new Error(errorMessages.join(', '));
    }

    console.log(`[${index}] ✓ Validation successful`);

  } catch (error: any) {
    result.success = false;
    result.error = {
      type: categorizeError(error.message),
      message: error.message,
      checkpoint: getFailedCheckpoint(result.checkpoints),
    };

    console.log(`[${index}] ✗ Validation failed: ${error.message}`);

    // Capture screenshot on failure
    if (config.validation.captureScreenshotOnFailure) {
      const screenshotPath = await captureFailureScreenshot(page, index, url, config);
      result.screenshotPath = screenshotPath;
    }
  } finally {
    result.duration = Date.now() - startTime;
    if (config.validation.captureConsoleErrors) {
      result.consoleErrors = consoleErrors;
    }
  }

  return result;
}

/**
 * Login for a new batch
 */
export async function loginForBatch(page: Page, config: PrintboxTestConfig): Promise<boolean> {
  try {
    console.log('Logging in for new batch...');

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.signIn(config.credentials.email, config.credentials.password);
    await loginPage.waitForSuccessfulLogin();

    console.log('✓ Login successful');
    return true;
  } catch (error: any) {
    console.error('✗ Login failed:', error.message);
    return false;
  }
}

/**
 * Clear session data
 */
export async function clearSession(context: BrowserContext): Promise<void> {
  console.log('Clearing session data...');
  await context.clearCookies();
  await context.clearPermissions();
}

/**
 * Capture screenshot on failure
 */
async function captureFailureScreenshot(
  page: Page,
  index: number,
  url: string,
  config: PrintboxTestConfig
): Promise<string> {
  try {
    // Ensure screenshots directory exists
    if (!fs.existsSync(config.paths.screenshotsDir)) {
      fs.mkdirSync(config.paths.screenshotsDir, { recursive: true });
    }

    // Generate filename from index and URL
    const urlPart = url
      .split('?')[0]
      .split('/')
      .filter(Boolean)
      .slice(-2)
      .join('_')
      .replace(/[^a-z0-9_-]/gi, '_')
      .substring(0, 50);

    const filename = `failure_${index}_${urlPart}_${Date.now()}.png`;
    const screenshotPath = path.join(config.paths.screenshotsDir, filename);

    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log(`  Screenshot saved: ${filename}`);
    return screenshotPath;
  } catch (error) {
    console.error('  Failed to capture screenshot:', error);
    return '';
  }
}

/**
 * Categorize error type for reporting
 */
function categorizeError(errorMessage: string): string {
  const msg = errorMessage.toLowerCase();

  if (msg.includes('product page') || msg.includes('start my book')) {
    return 'ProductPageLoadError';
  }
  if (msg.includes('theme') || msg.includes('select')) {
    return 'ThemeSelectionError';
  }
  if (msg.includes('login') || msg.includes('auth')) {
    return 'LoginError';
  }
  if (msg.includes('designer page') || msg.includes('qdesigner')) {
    return 'DesignerPageLoadError';
  }
  if (msg.includes('error popup')) {
    return 'ErrorPopupDetected';
  }
  if (msg.includes('iframe')) {
    return 'IframeLoadError';
  }
  if (msg.includes('designer ui') || msg.includes('ui not visible')) {
    return 'DesignerUIError';
  }
  if (msg.includes('timeout')) {
    return 'TimeoutError';
  }

  return 'UnknownError';
}

/**
 * Get the checkpoint where the flow failed
 */
function getFailedCheckpoint(checkpoints: any): string {
  if (!checkpoints.productPageLoaded) return 'ProductPageLoad';
  if (!checkpoints.themePageLoaded) return 'ThemePageLoad';
  if (!checkpoints.loginCompleted) return 'Login';
  if (!checkpoints.designerPageLoaded) return 'DesignerPageLoad';
  if (!checkpoints.errorPopupAbsent) return 'ErrorPopupCheck';
  if (!checkpoints.iframeLoaded) return 'IframeLoad';
  if (!checkpoints.designerUIVisible) return 'DesignerUICheck';
  return 'Unknown';
}

/**
 * Load links from JSON file
 */
export function loadLinks(filePath: string, start: number, size: number): string[] {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const allLinks = JSON.parse(fileContent) as string[];

    // Skip the first element if it's "link"
    const links = allLinks[0] === 'link' ? allLinks.slice(1) : allLinks;

    // If loading from a chunk file, load ALL links (don't slice)
    // Chunk files are pre-split and should be loaded in full
    const isChunkFile = filePath.includes('chunks/links-chunk-');

    if (isChunkFile) {
      console.log(`Loaded ${links.length} links from chunk file: ${filePath}`);
      return links;
    }

    // For non-chunk files (like final.json), use batch slicing
    const batchLinks = links.slice(start - 1, start - 1 + size);
    console.log(`Loaded ${batchLinks.length} links from ${filePath} (${start} to ${start + batchLinks.length - 1})`);

    return batchLinks;
  } catch (error: any) {
    throw new Error(`Failed to load links from ${filePath}: ${error.message}`);
  }
}
