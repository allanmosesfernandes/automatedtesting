import { chromium, BrowserContext, Page } from 'playwright';
import { addExtra } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

/**
 * Configuration options for creating a stealth browser context
 */
export interface StealthBrowserOptions {
  /** Custom user agent string (optional) */
  userAgent?: string;
  /** Viewport width in pixels (default: 1920) */
  viewportWidth?: number;
  /** Viewport height in pixels (default: 1080) */
  viewportHeight?: number;
  /** Browser locale (default: 'en-US') */
  locale?: string;
  /** Timezone ID (default: 'America/New_York') */
  timezoneId?: string;
  /** Run browser in headless mode (default: false for better stealth) */
  headless?: boolean;
}

/**
 * Creates a stealth-enabled browser context that bypasses bot detection.
 *
 * This function uses playwright-extra with stealth plugins to mask automation
 * signatures and make the browser appear as a real user. This helps bypass
 * bot detection mechanisms like Google's "Confirm you're not a robot" popup.
 *
 * Features:
 * - Removes navigator.webdriver flag
 * - Fixes Chrome runtime fingerprinting
 * - Masks Playwright-specific properties
 * - Uses realistic browser configurations
 *
 * @param options - Configuration options for the stealth browser
 * @returns Object containing the browser context and a close function
 *
 * @example
 * ```typescript
 * const { context, close } = await createStealthBrowser();
 * const page = await context.newPage();
 * await page.goto('https://example.com');
 * // ... perform actions ...
 * await close();
 * ```
 */
export async function createStealthBrowser(options: StealthBrowserOptions = {}) {
  const {
    userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewportWidth = 1920,
    viewportHeight = 1080,
    locale = 'en-US',
    timezoneId = 'America/New_York',
    headless = false,
  } = options;

  // Add stealth plugin to playwright
  const chromiumWithStealth = addExtra(chromium);
  chromiumWithStealth.use(StealthPlugin());

  // Launch browser with stealth capabilities and anti-detection arguments
  const browser = await chromiumWithStealth.launch({
    headless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-dev-shm-usage',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
    ],
  });

  // Create context with realistic user settings
  const context: BrowserContext = await browser.newContext({
    userAgent,
    viewport: { width: viewportWidth, height: viewportHeight },
    locale,
    timezoneId,
    permissions: ['geolocation', 'notifications'],
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
    javaScriptEnabled: true,
  });

  // Add additional stealth scripts to the context
  await context.addInitScript(() => {
    // Override the plugins length to appear more real
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5],
    });

    // Override the languages property
    Object.defineProperty(navigator, 'languages', {
      get: () => ['en-US', 'en'],
    });

    // Make the browser appear to have Chrome
    Object.defineProperty(navigator, 'platform', {
      get: () => 'Win32',
    });

    // Add chrome runtime
    (window as any).chrome = {
      runtime: {},
    };
  });

  return {
    context,
    close: async () => {
      await context.close();
      await browser.close();
    },
  };
}

/**
 * Adds random human-like delay between actions.
 *
 * Helps make automated interactions appear more natural by introducing
 * realistic delays similar to human reaction times.
 *
 * @param minMs - Minimum delay in milliseconds (default: 100)
 * @param maxMs - Maximum delay in milliseconds (default: 500)
 */
export async function humanDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Types text in a human-like manner with randomized delays between keystrokes.
 *
 * This function simulates realistic typing behavior by introducing small
 * random delays between each character, making the automation less detectable.
 *
 * @param page - Playwright Page object
 * @param selector - CSS selector for the input element
 * @param text - Text to type
 * @param minDelayMs - Minimum delay between keystrokes (default: 50)
 * @param maxDelayMs - Maximum delay between keystrokes (default: 150)
 *
 * @example
 * ```typescript
 * await humanType(page, 'input[type="email"]', 'user@example.com');
 * ```
 */
export async function humanType(
  page: Page,
  selector: string,
  text: string,
  minDelayMs: number = 50,
  maxDelayMs: number = 150
): Promise<void> {
  const element = page.locator(selector);
  await element.click();
  await humanDelay(100, 300);

  for (const char of text) {
    await page.keyboard.type(char);
    const delay = Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Clicks an element with a human-like delay before clicking.
 *
 * Adds a small random delay before clicking to simulate the time it takes
 * for a human to move their mouse and decide to click.
 *
 * @param page - Playwright Page object
 * @param selector - CSS selector for the element to click
 * @param delayBefore - Whether to add delay before clicking (default: true)
 */
export async function humanClick(
  page: Page,
  selector: string,
  delayBefore: boolean = true
): Promise<void> {
  if (delayBefore) {
    await humanDelay(200, 500);
  }
  const element = page.locator(selector);
  await element.click();
}
