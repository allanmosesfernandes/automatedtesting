/**
 * Navigation Links Configuration
 * Defines all top-level navigation links to be tested
 */

export interface NavigationLink {
  name: string;
  url: string;
  selector?: string; // Optional CSS selector for the link
}

/**
 * Top-level navigation links on PrinterPix
 * These are the main category links that appear in the navigation menu
 */
export const TOP_LEVEL_NAVIGATION_LINKS: NavigationLink[] = [
  {
    name: 'Early Black Friday',
    url: '/photo-gifts/black-friday-special/',
    selector: 'nav a[href*="/black-friday-special"]'
  },
  {
    name: 'Calendars',
    url: '/photo-calendars/',
    selector: 'nav a[href="/photo-calendars/"]'
  },
  {
    name: 'Gifts',
    url: '/photo-gifts/personalised-gifts-q/',
    selector: 'nav a[href*="/personalised-gifts-q"]'
  },
  {
    name: 'Photo Books',
    url: '/photo-books-q/',
    selector: 'nav a[href="/photo-books-q/"]'
  },
  {
    name: 'Blankets',
    url: '/photo-blankets/',
    selector: 'nav a[href="/photo-blankets/"]'
  },
  {
    name: 'Canvas Prints',
    url: '/photo-gifts/canvas-photo-prints/',
    selector: 'nav a[href*="/canvas-photo-prints"]'
  },
  {
    name: 'Photo Printing',
    url: '/photo-prints/',
    selector: 'nav a[href="/photo-prints/"]'
  },
  {
    name: 'Wall Art',
    url: '/photo-wall-art/',
    selector: 'nav a[href="/photo-wall-art/"]'
  }
];

/**
 * Links that are excluded from testing (don't have dedicated pages)
 */
export const EXCLUDED_LINKS = [
  'Home Decor',
  'Occasions',
  'All Categories',
  'Blog'
];

/**
 * Content validation selectors
 * The main element should be present and visible on a successfully loaded page
 */
export const CONTENT_VALIDATION_SELECTORS = {
  mainContent: 'main.relative, main[class*="relative"]',
  menuBurger: '#menu-burger, button[aria-label*="menu"]'
};

/**
 * Minimum page height to consider content loaded (reduced threshold)
 */
export const MIN_PAGE_HEIGHT = 500;

/**
 * Navigation menu selectors
 */
export const NAVIGATION_SELECTORS = {
  menuBurger: '#menu-burger',
  navigationContainer: 'nav',
  navigationLinks: 'nav a[href^="/"]'
};
