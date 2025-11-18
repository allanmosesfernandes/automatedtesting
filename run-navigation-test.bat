@echo off
REM Navigation Links Monitoring Test - Quick Runner
REM This script makes it easy to run the test with custom duration

echo ================================================
echo Navigation Links Monitoring Test
echo ================================================
echo.

REM Check if duration argument is provided
if "%1"=="" (
    echo Using default duration: 5 minutes
    set TEST_DURATION_MINUTES=5
) else (
    echo Using custom duration: %1 minutes
    set TEST_DURATION_MINUTES=%1
)

echo.
echo Starting test...
echo.

REM Run the test
npx playwright test navigation-monitor --reporter=list,html

echo.
echo ================================================
echo Test Complete!
echo ================================================
echo.
echo Reports available in: test-results\navigation-monitoring\
echo HTML Report: test-results\html-report\index.html
echo.

pause
