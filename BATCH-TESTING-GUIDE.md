# Printbox Batch Testing Guide

## Overview
This system allows you to run 5,088 URL tests across multiple machines using 10 independent batches.

## Quick Start

### Run a Single Batch
```bash
scripts\run-batch.bat 1   # Runs batch 1 (URLs 1-509)
scripts\run-batch.bat 5   # Runs batch 5 (URLs 2037-2545)
```

### Or Run Manually
```bash
# Set environment variables
set START_INDEX=1
set END_INDEX=509
set BATCH_NUMBER=1

# Run the test
npx playwright test tests/e2e/printbox-optimized/printbox-validator-batch.spec.ts --workers=1
```

## Batch Configuration

Total URLs: 5,088 (valid URLs from indices 1-5088)
Batch Size: ~509 URLs per batch
Total Batches: 10
Time per Batch: ~2.3 hours

### Batch Distribution

| Batch | Start Index | End Index | URL Count | Estimated Time |
|-------|-------------|-----------|-----------|----------------|
| 1     | 1           | 509       | 509       | 2.3 hours      |
| 2     | 510         | 1018      | 509       | 2.3 hours      |
| 3     | 1019        | 1527      | 509       | 2.3 hours      |
| 4     | 1528        | 2036      | 509       | 2.3 hours      |
| 5     | 2037        | 2545      | 509       | 2.3 hours      |
| 6     | 2546        | 3054      | 509       | 2.3 hours      |
| 7     | 3055        | 3563      | 509       | 2.3 hours      |
| 8     | 3564        | 4072      | 509       | 2.3 hours      |
| 9     | 4073        | 4581      | 509       | 2.3 hours      |
| 10    | 4582        | 5088      | 507       | 2.3 hours      |

## Distributing Across 3 Machines

### Machine 1 (4 batches - ~9.2 hours)
```bash
scripts\run-batch.bat 1
scripts\run-batch.bat 2
scripts\run-batch.bat 3
scripts\run-batch.bat 4
```

### Machine 2 (3 batches - ~6.9 hours)
```bash
scripts\run-batch.bat 5
scripts\run-batch.bat 6
scripts\run-batch.bat 7
```

### Machine 3 (3 batches - ~6.9 hours)
```bash
scripts\run-batch.bat 8
scripts\run-batch.bat 9
scripts\run-batch.bat 10
```

**Total wall time: ~9.2 hours** (running on 3 machines in parallel)

## Reports

Reports are generated in: `test-results/printbox-optimized/reports/`

### Report Files:
- **HTML Report:** `batch-{NUMBER}-report-{TIMESTAMP}.html`
- **Text Report:** `batch-{NUMBER}-results-{TIMESTAMP}.txt`

Each report includes:
- Batch number and URL range
- Total tested, passed, failed counts
- Success rate percentage
- Individual URL results with durations
- Error details for failed URLs

## Prerequisites

### Before Running Batches:

1. **Session State File Must Exist**
   - File: `.auth/printbox-session.json`
   - Contains: Cookie consent, Klaviyo dismissal, and login session
   - To create: Run `npx playwright test tests/e2e/printbox-optimized/session-setup.spec.ts --headed`

2. **URLs File Must Exist**
   - File: `final.json` (in project root)
   - Contains: 5,089 entries (index 0 is invalid, indices 1-5088 are valid)

## Failure Handling

### If a Batch Fails:
1. Check the error in the report file
2. Re-run the specific batch: `scripts\run-batch.bat {NUMBER}`
3. The new report will overwrite the previous one

### If Session Expires:
1. Re-run session setup: `npx playwright test tests/e2e/printbox-optimized/session-setup.spec.ts --headed`
2. This will update `.auth/printbox-session.json`
3. Resume running batches

## Tips for Success

1. **Run in Headless Mode** (default)
   - Faster and uses less resources
   - No need for `--headed` flag

2. **Monitor Progress**
   - Check reports directory for completed batches
   - Each batch generates timestamped reports

3. **Catch Failures Early**
   - With 509 URLs per batch, you'll catch issues within 2.3 hours
   - Easy to re-run just the failed batch

4. **Distribute Smartly**
   - Give Machine 1 one extra batch (it's slightly faster)
   - Machines 2 & 3 get 3 batches each
   - All finish around the same time

## Testing Before Full Run

### Test with 10 URLs:
```bash
set START_INDEX=1
set END_INDEX=10
set BATCH_NUMBER=TEST
npx playwright test tests/e2e/printbox-optimized/printbox-validator-batch.spec.ts --workers=1
```

### Test Batch 1 First:
```bash
scripts\run-batch.bat 1
```
This validates the full batch size (509 URLs) before committing to all batches.

## Configuration Files

- **`config/batch-config.json`** - Batch definitions
- **`tests/e2e/printbox-optimized/printbox-validator-batch.spec.ts`** - Parameterized test
- **`scripts/run-batch.bat`** - Batch runner script
- **`.auth/printbox-session.json`** - Saved session state

## Example Workflow

1. **Setup (one time):**
   ```bash
   npx playwright test tests/e2e/printbox-optimized/session-setup.spec.ts --headed
   ```

2. **Test small batch:**
   ```bash
   set START_INDEX=1 && set END_INDEX=10 && set BATCH_NUMBER=TEST && npx playwright test tests/e2e/printbox-optimized/printbox-validator-batch.spec.ts --workers=1
   ```

3. **Run on Machine 1:**
   ```bash
   scripts\run-batch.bat 1
   scripts\run-batch.bat 2
   scripts\run-batch.bat 3
   scripts\run-batch.bat 4
   ```

4. **Run on Machine 2:**
   ```bash
   scripts\run-batch.bat 5
   scripts\run-batch.bat 6
   scripts\run-batch.bat 7
   ```

5. **Run on Machine 3:**
   ```bash
   scripts\run-batch.bat 8
   scripts\run-batch.bat 9
   scripts\run-batch.bat 10
   ```

6. **Check reports:**
   - Open HTML reports in `test-results/printbox-optimized/reports/`
   - Review failed URLs (if any)
   - Re-run failed batches if needed

## Success!

Your tests are now running in lightweight, manageable batches that can be distributed across multiple machines for fast execution!
