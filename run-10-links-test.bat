@echo off
echo ================================
echo Running 10 Links Test (Headless)
echo ================================
echo.

REM Set configuration
set BATCH_START=1
set BATCH_SIZE=10
set LINKS_FILE=final.json
set CHUNK_ID=printbox

REM Run the test in headless mode
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts --workers=1

echo.
echo Test completed!
echo Results available at: test-results\printbox\reports\
echo.
pause
