@echo off
echo ================================
echo Running Chunk 9 (509 links)
echo ================================
echo.

REM Set chunk configuration
set CHUNK_FILE=test-data/chunks/links-chunk-9.json
set CHUNK_ID=9

REM Run tests with 5 parallel workers
echo Starting tests with 5 parallel workers...
echo.
npx playwright test tests/e2e/printbox/printbox-links-validator.spec.ts --workers=5

echo.
echo ================================
echo Chunk 9 Test Completed!
echo ================================
echo.
echo Reports generated:
echo   - chunk-9-report.html
echo   - chunk-9-results.txt
echo.
echo Location: test-results\printbox\reports\
echo.
pause
