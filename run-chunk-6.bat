@echo off
echo ================================
echo Running Chunk 6 (509 links)
echo ================================
echo.

REM Set chunk configuration
set CHUNK_FILE=test-data/chunks/links-chunk-6.json
set CHUNK_ID=6

REM Run tests with 5 parallel workers
echo Starting tests with 5 parallel workers...
echo.
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts --workers=5

echo.
echo ================================
echo Chunk 6 Test Completed!
echo ================================
echo.
echo Reports generated:
echo   - chunk-6-report.html
echo   - chunk-6-results.txt
echo.
echo Location: test-results\printbox\reports\
echo.
pause
