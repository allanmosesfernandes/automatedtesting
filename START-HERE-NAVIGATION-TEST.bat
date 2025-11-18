@echo off
echo ========================================
echo Navigation Test Setup Guide
echo ========================================
echo.
echo This will run the navigation test for 14 hours on:
echo   1. QA UK (qa.printerpix.co.uk)
echo   2. Live US (www.printerpix.com)
echo.
echo BOTH ENVIRONMENTS RUN IN PARALLEL!
echo TOTAL TIME: 14 hours (both run simultaneously)
echo.
echo ========================================
echo INSTRUCTIONS:
echo ========================================
echo.
echo 1. OPEN A NEW TERMINAL and run: start-dashboard.bat
echo    - This starts the real-time monitoring dashboard
echo    - Dashboard will be at: http://localhost:3000
echo.
echo 2. THEN run this batch file to start the test
echo.
echo ========================================
echo.
echo Press any key to start the navigation test...
pause >nul

REM Set test duration to 840 minutes (14 hours)
set TEST_DURATION_MINUTES=840

echo.
echo Starting navigation test for 14 hours (both environments in parallel)...
echo.
npx playwright test tests/e2e/navigation/navigation-monitor.spec.ts --workers=2

echo.
echo ========================================
echo Navigation Test Completed!
echo ========================================
echo.
echo Results available at: test-results\navigation-monitoring\
echo Combined report: test-results\navigation-monitoring\combined-summary.html
echo.
pause
