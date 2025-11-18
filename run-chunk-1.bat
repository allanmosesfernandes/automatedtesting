@echo off
echo ================================
echo Running Chunk 1 (509 links)
echo ================================
echo.

REM Set configuration for chunk 1
set CHUNK_FILE=test-data/chunks/links-chunk-1.json
set CHUNK_ID=chunk-1
set BATCH_START=1
set BATCH_SIZE=509

REM Run tests with 5 parallel workers for faster execution
echo Starting tests with 5 parallel workers...
echo.
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts --workers=5

echo.
echo ================================
echo Chunk 1 Test Completed!
echo ================================
echo Results available at: test-results\printbox\reports\
echo.
pause
