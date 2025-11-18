@echo off
echo ================================
echo Running Chunk 3 (509 links)
echo ================================
echo.

REM Set chunk configuration
set CHUNK_FILE=test-data/chunks/links-chunk-3.json
set CHUNK_ID=3

REM Run tests with 5 parallel workers
echo Starting tests with 5 parallel workers...
echo.
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts --workers=5

echo.
echo ================================
echo Chunk 3 Test Completed!
echo ================================
echo.
echo Reports generated:
echo   - chunk-3-report.html
echo   - chunk-3-results.txt
echo.
echo Location: test-results\printbox\reports\
echo.
pause
