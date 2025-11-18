@echo off
echo ================================
echo Final Test: 10 Links with 2 Workers
echo ================================
echo.

REM Set configuration for final test
set CHUNK_FILE=test-data/chunks/links-chunk-1.json
set CHUNK_ID=final-test
set BATCH_START=1
set BATCH_SIZE=10

REM Run tests with 2 parallel workers
echo Starting tests with 2 parallel workers...
echo Testing first 10 links from chunk-1...
echo.
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts --workers=2

echo.
echo ================================
echo Final Test Completed!
echo ================================
echo Results available at: test-results\printbox\reports\
echo.
pause
