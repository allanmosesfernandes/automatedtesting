# Navigation Links Monitoring Test

## Overview
This test monitors navigation links on PrinterPix (QA and Production environments) to detect blank page issues. It continuously clicks through top-level navigation links for a specified duration (default: 5 minutes) and validates that content loads correctly.

## Features
- ✅ Tests both QA (`qa.printerpix.co.uk`) and Production (`www.printerpix.co.uk`)
- ✅ Runs for 5 minutes per environment (configurable)
- ✅ Randomly clicks all top-level navigation links
- ✅ Detects blank page issues via multiple content validation checks
- ✅ Captures screenshots of failures
- ✅ Logs network errors, console errors, and page errors
- ✅ Generates JSON statistics report
- ✅ Generates HTML summary report
- ✅ Real-time progress logging

## Navigation Links Tested
1. Early Black Friday
2. Calendars
3. Gifts
4. Photo Books
5. Blankets
6. Canvas Prints
7. Photo Printing
8. Home Decor
9. Wall Art
10. Occasions

**Note**: Blog link is excluded as it doesn't exist on QA environment.

## Content Validation
The test validates that pages have loaded correctly by checking for:
- **Main content element**: `<main class="relative">` must be present and visible

The test waits 1 second after navigation, then checks if the main element has rendered. If the main element is not visible, the page is marked as a "blank page" failure.

## Usage

### Run with Default Settings (5 minutes per environment)
```bash
npx playwright test navigation-monitor
```

### Run with Custom Duration
```bash
TEST_DURATION_MINUTES=10 npx playwright test navigation-monitor
```

### Run with Headed Browser (See the test in action)
```bash
npx playwright test navigation-monitor --headed
```

### Run with Specific Reporter
```bash
npx playwright test navigation-monitor --reporter=html
```

### Quick Test (1 minute for validation)
```bash
TEST_DURATION_MINUTES=1 npx playwright test navigation-monitor
```

## Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_DURATION_MINUTES` | Test duration in minutes per environment | 5 |
| `BASE_URL_QA` | QA environment base URL | https://qa.printerpix.co.uk |
| `BASE_URL_PROD` | Production environment base URL | https://www.printerpix.co.uk |

## Output & Reports

### Directory Structure
```
test-results/
└── navigation-monitoring/
    ├── qa-printerpix-co-uk/
    │   ├── screenshots/
    │   │   ├── calendars-2025-01-14T10-30-45.png
    │   │   └── photo-books-2025-01-14T10-31-12.png
    │   ├── logs/
    │   │   ├── calendars-2025-01-14T10-30-45.json
    │   │   └── photo-books-2025-01-14T10-31-12.json
    │   └── summary.json
    ├── www-printerpix-co-uk/
    │   ├── screenshots/
    │   ├── logs/
    │   └── summary.json
    └── combined-summary.html
```

### JSON Summary Report (`summary.json`)
Contains detailed statistics:
```json
{
  "environment": "https://qa.printerpix.co.uk",
  "testStartTime": "2025-01-14T10:00:00.000Z",
  "testEndTime": "2025-01-14T10:05:00.000Z",
  "testDuration": "5m 0s",
  "totalClicks": 47,
  "successfulLoads": 44,
  "failedLoads": 3,
  "successRate": "93.6%",
  "failures": [...]
}
```

### HTML Summary Report (`combined-summary.html`)
A visual HTML report with:
- Summary statistics for each environment
- Success/failure metrics
- Detailed failure table with links to screenshots
- Color-coded success rates

### Detailed Failure Logs
Each failure generates a JSON log file with:
- Link name and URL
- Timestamp
- Load time
- Screenshot path
- Failed network requests (status 400+)
- Console errors
- Page errors
- Viewport size
- Page height

## Success Criteria
- ✅ **Pass**: Success rate >= 95%
- ⚠️ **Warning**: Success rate 90-95%
- ❌ **Fail**: Success rate < 90%

## Troubleshooting

### Test Fails to Start
- Ensure Playwright is installed: `npm install`
- Ensure browsers are installed: `npx playwright install`

### Network Timeouts
- The test has built-in timeouts (30s for navigation, 10s for content load)
- If seeing frequent timeouts, check network connectivity

### False Positives (Page marked as blank when it's not)
- Review the content validation selectors in `tests/config/navigation-links.ts`
- Adjust `CONTENT_VALIDATION_SELECTORS` or `MIN_PAGE_HEIGHT` as needed

### Screenshots Not Saving
- Check disk space
- Ensure write permissions for `test-results/` directory

## Files Structure
```
tests/
├── config/
│   └── navigation-links.ts          # Navigation links configuration
├── helpers/
│   └── navigation-monitor-helper.ts # Monitoring utilities
├── pages/
│   └── NavigationPage.ts            # Page object for navigation
└── e2e/
    └── navigation/
        ├── navigation-monitor.spec.ts  # Main test file
        └── README.md                   # This file
```

## Example Console Output
```
================================================================================
🚀 Starting Navigation Test for QA
   Environment: https://qa.printerpix.co.uk
   Duration: 5 minutes
================================================================================

  🔗 Testing: Calendars (/photo-calendars/)
  ✅ SUCCESS: Calendars
  ⏱️  Progress: 1 clicks | 4m 57s remaining

  🔗 Testing: Photo Books (/photo-books-q/)
  ❌ FAILURE: Photo Books - Page height too small: 650px (expected > 1000px)
     📸 Screenshot saved: test-results/.../photo-books-2025-01-14T10-30-45.png
  ⏱️  Progress: 2 clicks | 4m 52s remaining

...

================================================================================
📊 Test Complete for QA
================================================================================

Total Clicks: 47
Successful Loads: 44 ✅
Failed Loads: 3 ❌
Success Rate: 93.6%

Failures:
  1. Photo Books - Page height too small: 650px (expected > 1000px)
  2. Canvas Prints - Footer not visible
  3. Wall Art - Not enough images loaded: 0 (expected at least 1)

📄 Summary saved to: test-results/.../summary.json
```

## Advanced Usage

### Modify Links to Test
Edit `tests/config/navigation-links.ts` to add/remove/modify links.

### Customize Content Validation
Edit `CONTENT_VALIDATION_SELECTORS` in `tests/config/navigation-links.ts` to adjust validation criteria.

### Test Single Environment
Modify the `ENVIRONMENTS` array in the test spec to test only one environment.

## Notes
- The test uses human-like delays (1.5-3 seconds) between navigations
- Popups (like Klaviyo) are automatically dismissed
- Network errors, console errors, and page errors are captured for each navigation
- Screenshots are full-page captures
- The test is non-destructive (read-only operations)
