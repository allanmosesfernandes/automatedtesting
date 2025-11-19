@echo off
REM Quick Start Script for Photo Books Testing
REM This script runs the photo books optimized test with the first 10 links

echo.
echo ================================================================================
echo PHOTO BOOKS OPTIMIZED TEST - FIRST 10 LINKS
echo ================================================================================
echo This will test the first 10 links from photo-books.json
echo ================================================================================
echo.

REM Run the optimized test (first 10 links)
npx playwright test tests/e2e/photo-books-optimized/photo-books-validator-optimized.spec.ts --workers=1

echo.
echo ================================================================================
echo TEST COMPLETE
echo ================================================================================
echo Check the reports directory: test-results/photo-books-optimized/reports/
echo ================================================================================
echo.

pause
