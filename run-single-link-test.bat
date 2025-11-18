@echo off
echo ================================
echo Running Single Link Test
echo ================================
echo.

REM Set configuration
set BATCH_START=1
set BATCH_SIZE=1
set LINKS_FILE=single-link-test.json
set CHUNK_ID=single-test

REM Run the test in headed mode
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts --headed --workers=1

echo.
echo Test completed!
echo Results available at: test-results\printbox\chunk-single-test\reports\
pause
