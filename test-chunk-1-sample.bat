@echo off
echo ================================
echo Testing Chunk 1 Setup (5 links with 2 workers)
echo ================================
echo.

REM Set configuration for chunk 1 test
set CHUNK_FILE=test-data/chunks/links-chunk-1.json
set CHUNK_ID=chunk-1-test
set BATCH_START=1
set BATCH_SIZE=5

REM Run tests with 2 parallel workers for testing
echo Starting tests with 2 parallel workers...
echo.
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts --workers=2

echo.
echo ================================
echo Test Completed!
echo ================================
echo Results available at: test-results\printbox\reports\
echo.
pause
