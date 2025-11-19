# Photo Books Testing Guide

## Overview
This test suite validates 500 photo books links with an optimized flow that includes category selection after landing on the category page.

## Test Flow
1. Navigate to category landing page (from photo-books.json)
2. Dismiss Klaviyo popup (if present)
3. **Click category selection link** (e.g., Large Hardcover Photo Book)
4. Wait for product page to load
5. Click "Create Yours Now" button
6. Verify navigation to themes page
7. Click "Design Your Own Theme"
8. Wait 5 seconds
9. Verify designer page loaded
10. Check for error modal

## Directory Structure

```
tests/
  e2e/
    photo-books-optimized/
      session-setup.spec.ts                    # Session setup (reuses printbox session)
      photo-books-validator-optimized.spec.ts  # Test first 10 links
      photo-books-validator-batch.spec.ts      # Batch runner (parameterized)
      photo-books-single-link-test.spec.ts     # Single link test for validation
  config/
    photo-books-test-config.ts                 # Photo books specific configuration

config/
  photo-books-batch-config.json                # Batch configuration for 500 links

scripts/
  run-photo-books-batch.bat                    # Batch runner script

RUN-PHOTO-BOOKS-SINGLE-LINK.bat                # Single link test (headed mode)
RUN-PHOTO-BOOKS-TEST.bat                       # Quick test (first 10 links)
```

## How to Run Tests

### 1. Single Link Test (Recommended First)
Test just one link to validate the flow works correctly:

```bash
RUN-PHOTO-BOOKS-SINGLE-LINK.bat
```

This will run in **headed mode** so you can see what's happening. By default it tests:
`https://www.printerpix.co.uk/photo-books-q/`

To test a different URL, set the TEST_URL environment variable:
```bash
set TEST_URL=https://www.printerpix.co.uk/photo-books-q/?coupon...
RUN-PHOTO-BOOKS-SINGLE-LINK.bat
```

### 2. First 10 Links Test
Test the first 10 links from photo-books.json:

```bash
RUN-PHOTO-BOOKS-TEST.bat
```

Or directly:
```bash
npx playwright test tests/e2e/photo-books-optimized/photo-books-validator-optimized.spec.ts --workers=1
```

### 3. Batch Testing (All 500 Links)
Run batches of 50 links at a time:

```bash
scripts\run-photo-books-batch.bat 1    # Batch 1 (links 0-49)
scripts\run-photo-books-batch.bat 2    # Batch 2 (links 50-99)
scripts\run-photo-books-batch.bat 3    # Batch 3 (links 100-149)
...
scripts\run-photo-books-batch.bat 10   # Batch 10 (links 450-499)
```

### 4. Custom Range Testing
Test a specific range of links:

```bash
set START_INDEX=0
set END_INDEX=4
set BATCH_NUMBER=CUSTOM
npx playwright test tests/e2e/photo-books-optimized/photo-books-validator-batch.spec.ts --workers=1
```

## Session Setup

The photo-books tests reuse the same session as printbox tests (`.auth/printbox-session.json`). If you need to refresh the session, run:

```bash
npx playwright test tests/e2e/photo-books-optimized/session-setup.spec.ts
```

## Configuration

### Selectors (in photo-books-test-config.ts)
The test uses these selectors:

- **Category Link**: `a[href*="/photo-books/"][class*="link_slide_show_product_category"]`
- **Create Button**: `button:has-text("Create Yours Now"), a:has-text("Create Yours Now")`
- **Design Theme Button**: `div.bg-white.rounded-\[4px\]:has-text("Design Your Own Theme")`

### Timeouts
- Category page load: 15 seconds
- Product page load: 15 seconds
- Themes page load: 15 seconds
- Designer page load: 45 seconds
- Designer wait time: 5 seconds (additional wait before validation)

### Batch Configuration
- Total links: 500
- Batch size: 50 links per batch
- Total batches: 10
- Estimated time per link: ~60 seconds
- Estimated time per batch: ~50 minutes

## Reports

Reports are generated in: `test-results/photo-books-optimized/reports/`

Two types of reports:
1. **HTML Report**: Interactive report with stats and color-coded results
2. **Text Report**: Plain text summary with passed/failed URL lists

Report naming:
- Optimized test (10 links): `photo-books-optimized-report-[timestamp].html`
- Batch test: `photo-books-batch-[batch-number]-report-[timestamp].html`

## Troubleshooting

### Issue: "Category link not found"
**Solution**: The selector might need adjustment. Check if the category link has changed on the page.

### Issue: "Create Yours Now button not found"
**Solution**: The button text might be different. Update the selector in `photo-books-test-config.ts`:
```typescript
createButton: 'button:has-text("Start My Book"), a:has-text("Start My Book")'
```

### Issue: "Klaviyo popup blocking clicks"
**Solution**: The test already handles this with retry logic. If it persists, check the popup-handler.ts helper.

### Issue: Designer page not loading
**Solution**:
1. Check if login session is valid (run session-setup again)
2. Increase the designer timeout in config
3. Check for any error modals appearing

## Data File: photo-books.json

The test reads links from `photo-books.json` in the root directory. This file should contain an array of 500 photo books URLs:

```json
[
  "https://www.printerpix.co.uk/photo-books-q/?coupon...",
  "https://www.printerpix.co.uk/photo-books-q/?coupon...",
  ...
]
```

## Next Steps

1. **Validate flow**: Run the single link test first (`RUN-PHOTO-BOOKS-SINGLE-LINK.bat`)
2. **Test sample**: Run the 10-link test (`RUN-PHOTO-BOOKS-TEST.bat`)
3. **Full testing**: Run all batches sequentially or in parallel
4. **Review reports**: Check the HTML reports for pass/fail statistics

## Comparison with Printbox Tests

| Feature | Printbox Tests | Photo Books Tests |
|---------|---------------|-------------------|
| Session | `.auth/printbox-session.json` | `.auth/printbox-session.json` (same) |
| Data file | `final.json` (5,088 links) | `photo-books.json` (500 links) |
| Flow | Direct to product page | Category page → Select category → Product page |
| CTA Button | "Start My Book" | "Create Yours Now" |
| Batches | 10 batches (~509 links each) | 10 batches (50 links each) |
| Reports | `test-results/printbox-optimized/reports/` | `test-results/photo-books-optimized/reports/` |

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Review the HTML reports for failure patterns
3. Run tests in headed mode to see visual errors: `--headed` flag
4. Check if selectors need updating based on page changes
