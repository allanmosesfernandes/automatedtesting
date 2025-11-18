@echo off
REM Batch Runner Script for Printbox Testing
REM Usage: run-batch.bat <batch_number>
REM Example: run-batch.bat 1

if "%1"=="" (
    echo Error: Batch number is required
    echo Usage: run-batch.bat ^<batch_number^>
    echo Example: run-batch.bat 1
    exit /b 1
)

set BATCH_NUMBER=%1

REM Read batch configuration
node -p "const config = require('./config/batch-config.json'); const batch = config.batches.find(b => b.batchNumber === %BATCH_NUMBER%); if (!batch) { console.error('Invalid batch number: %BATCH_NUMBER%'); process.exit(1); } console.log(`Found batch ${batch.batchNumber}: URLs ${batch.startIndex}-${batch.endIndex}`); ''" >nul 2>&1

if errorlevel 1 (
    echo Error: Invalid batch number: %BATCH_NUMBER%
    echo Valid batch numbers are 1-10
    exit /b 1
)

REM Get batch configuration
for /f "delims=" %%i in ('node -p "const config = require('./config/batch-config.json'); const batch = config.batches.find(b => b.batchNumber === %BATCH_NUMBER%); batch.startIndex"') do set START_INDEX=%%i
for /f "delims=" %%i in ('node -p "const config = require('./config/batch-config.json'); const batch = config.batches.find(b => b.batchNumber === %BATCH_NUMBER%); batch.endIndex"') do set END_INDEX=%%i
for /f "delims=" %%i in ('node -p "const config = require('./config/batch-config.json'); const batch = config.batches.find(b => b.batchNumber === %BATCH_NUMBER%); batch.urlCount"') do set URL_COUNT=%%i

echo.
echo ================================================================================
echo RUNNING BATCH %BATCH_NUMBER%
echo ================================================================================
echo Start Index: %START_INDEX%
echo End Index: %END_INDEX%
echo URL Count: %URL_COUNT%
echo ================================================================================
echo.

REM Set environment variables for the test
set START_INDEX=%START_INDEX%
set END_INDEX=%END_INDEX%
set BATCH_NUMBER=%BATCH_NUMBER%

REM Run the test
npx playwright test tests/e2e/printbox-optimized/printbox-validator-batch.spec.ts --workers=1

echo.
echo ================================================================================
echo BATCH %BATCH_NUMBER% COMPLETE
echo ================================================================================
echo.
