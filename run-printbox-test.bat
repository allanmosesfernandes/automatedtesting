@echo off
REM Printbox Link Validation Test Runner
REM Usage:
REM   run-printbox-test.bat           - Test first 10 links (default)
REM   run-printbox-test.bat 1 50      - Test links 1-50
REM   run-printbox-test.bat 51 100    - Test links 51-150

setlocal

if "%1"=="" (
    echo Running Stage 1: Testing first 10 links...
    set BATCH_START=1
    set BATCH_SIZE=10
) else (
    echo Running custom batch: Start=%1, Size=%2
    set BATCH_START=%1
    set BATCH_SIZE=%2
)

echo.
echo ================================================================================
echo PRINTBOX LINK VALIDATOR
echo ================================================================================
echo Batch Start: %BATCH_START%
echo Batch Size: %BATCH_SIZE%
echo ================================================================================
echo.

npm run test:printbox:headed

endlocal
