@echo off
echo ================================
echo Navigation Test - 14 Hours
echo ================================
echo.
echo Environments:
echo   1. QA UK - qa.printerpix.co.uk
echo   2. Live US - www.printerpix.com
echo.
echo Duration: 14 hours (840 minutes per environment)
echo Total time: ~28 hours for both environments
echo.
echo ================================
echo.

REM Set test duration to 840 minutes (14 hours)
set TEST_DURATION_MINUTES=840

REM Run the navigation test with 2 workers (one per environment) for parallel execution
echo Starting navigation monitoring test...
echo Both environments will run in PARALLEL for 14 hours...
echo.
npx playwright test tests/e2e/navigation/navigation-monitor.spec.ts --workers=2

echo.
echo ================================
echo Navigation Test Completed!
echo ================================
echo.
echo Results available at: test-results\navigation-monitoring\
echo Combined report: test-results\navigation-monitoring\combined-summary.html
echo.
pause
