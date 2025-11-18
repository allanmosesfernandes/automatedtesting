@echo off
echo ================================
echo Running Chunk 10 (509 links)
echo ================================
echo.

REM Set chunk configuration
set CHUNK_FILE=test-data/chunks/links-chunk-10.json
set CHUNK_ID=10

REM Run tests with 5 parallel workers
echo Starting tests with 5 parallel workers...
echo.
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts --workers=5

echo.
echo ================================
echo Chunk 10 Test Completed!
echo ================================
echo.
echo Reports generated:
echo   - chunk-10-report.html
echo   - chunk-10-results.txt
echo.
echo Location: test-results\printbox\reports\
echo.
pause
