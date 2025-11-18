# Parallel Testing Guide - Printbox Links Validator

## Overview

This guide explains how to run automated tests for 5088 product links using 10 parallel workers.

## Architecture

```
final.json (5088 links)
    ↓
[Split Script]
    ↓
test-data/chunks/
  ├── links-chunk-1.json  (509 links)
  ├── links-chunk-2.json  (509 links)
  ├── ...
  └── links-chunk-10.json (507 links)
    ↓
[10 Parallel Workers]
    ↓
test-results/printbox/
  ├── chunk-1/ (results + screenshots)
  ├── chunk-2/
  ├── ...
  └── chunk-10/
```

## Quick Start

### Step 1: Split Links into Chunks

```bash
npm run split-links
```

This creates 10 chunk files in `test-data/chunks/`:
- Each chunk contains ~509 links
- Total: 5088 links across 10 files

### Step 2: Run Tests in Parallel

```bash
npm run test:parallel
```

This starts 10 Playwright processes simultaneously:
- Each worker tests one chunk independently
- Full user journey for each link (no session reuse)
- Results saved to separate directories

### Step 3: Monitor Progress

Check logs in real-time:
```bash
# Windows
type test-results\printbox\chunk-1\test-output.log

# Or open in editor
code test-results/printbox/chunk-1/test-output.log
```

## Test Flow (Per Link)

Each link goes through the complete user journey:

1. **Navigate to product page** (15s timeout)
2. **Dismiss cookie consent** (first link only)
3. **Dismiss Klaviyo popup**
4. **Click "Start My Book"** (with retry if blocked)
5. **Navigate to themes page** (15s timeout)
6. **Click "Design Your Own Theme"**
7. **Navigate to register page**
8. **Click "Login" link**
9. **Navigate to sign-in page**
10. **Enter credentials and sign in** (45s timeout)
11. **Redirect to designer page** (45s timeout)
12. **Wait for designer to load** (network idle, 45s timeout)
13. **Check "Auto-Create My Book" button** (in iframe)
14. **Check for error modal** (fail if present)

## Testing Single Chunk

To test just one chunk (e.g., for debugging):

```bash
# Windows
set CHUNK_FILE=test-data/chunks/links-chunk-1.json && set CHUNK_ID=1 && npm run test:chunk
```

## Expected Performance

| Metric | Value |
|--------|-------|
| Links per chunk | ~509 |
| Time per link | ~30-40 seconds |
| Total time per chunk | ~4-6 hours |
| **Parallel (10 workers)** | **~4-6 hours total** |

## Results Structure

```
test-results/printbox/
├── chunk-1/
│   ├── test-output.log          # Full console output
│   ├── screenshots/             # Failure screenshots
│   └── reports/                 # JSON reports (if implemented)
├── chunk-2/
│   └── ...
...
└── chunk-10/
```

## Troubleshooting

### Chunk files not found
```bash
npm run split-links
```

### Worker fails to start
Check that Playwright is installed:
```bash
npx playwright install
```

### Out of memory
Reduce parallel workers by manually running fewer chunks

### Network issues
Increase timeouts in `tests/config/printbox-test-config.ts`

## Manual Control

### Run specific chunks only

```bash
# Run chunks 1, 2, and 3 only
# Edit scripts/run-parallel-tests.js and change numChunks to 3
```

### Sequential testing (no parallelization)

```bash
set CHUNK_FILE=test-data/chunks/links-chunk-1.json
set CHUNK_ID=1
npm run test:chunk
```

## Configuration

Edit `tests/config/printbox-test-config.ts` to adjust:

- **Timeouts**: Increase if network is slow
- **Credentials**: Change test user
- **Result paths**: Customize output directories

## Next Steps

After tests complete:
1. Check each chunk's `test-output.log` for summary
2. Review failed link screenshots in `chunk-N/screenshots/`
3. Compile results from all 10 chunks
4. Fix failing links and re-test specific chunks

## Notes

- **Session Reuse**: Disabled to mimic real user journey
- **Cookie Persistence**: Only within each chunk
- **Retry Logic**: Built-in for Klaviyo popup blocking
- **Error Handling**: Tests continue even if links fail
