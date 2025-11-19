@echo off
REM Batch Runner Script for Photo Books Testing
REM Usage: run-photo-books-batch.bat <batch_number>
REM Example: run-photo-books-batch.bat 1

if "%1"=="" (
    echo Error: Batch number is required
    echo Usage: run-photo-books-batch.bat ^<batch_number^>
    echo Example: run-photo-books-batch.bat 1
    exit /b 1
)

set BATCH_NUMBER=%1

REM Read batch configuration
node -p "const config = require('./config/photo-books-batch-config.json'); const batch = config.batches.find(b => b.batchNumber === %BATCH_NUMBER%); if (!batch) { console.error('Invalid batch number: %BATCH_NUMBER%'); process.exit(1); } console.log(`Found batch ${batch.batchNumber}: URLs ${batch.startIndex}-${batch.endIndex}`); ''" >nul 2>&1

if errorlevel 1 (
    echo Error: Invalid batch number: %BATCH_NUMBER%
    echo Valid batch numbers are 1-10
    exit /b 1
)

REM Get batch configuration
for /f "delims=" %%i in ('node -p "const config = require('./config/photo-books-batch-config.json'); const batch = config.batches.find(b => b.batchNumber === %BATCH_NUMBER%); batch.startIndex"') do set START_INDEX=%%i
for /f "delims=" %%i in ('node -p "const config = require('./config/photo-books-batch-config.json'); const batch = config.batches.find(b => b.batchNumber === %BATCH_NUMBER%); batch.endIndex"') do set END_INDEX=%%i
for /f "delims=" %%i in ('node -p "const config = require('./config/photo-books-batch-config.json'); const batch = config.batches.find(b => b.batchNumber === %BATCH_NUMBER%); batch.urlCount"') do set URL_COUNT=%%i

echo.
echo ================================================================================
echo RUNNING PHOTO BOOKS BATCH %BATCH_NUMBER%
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
npx playwright test tests/e2e/photo-books-optimized/photo-books-validator-batch.spec.ts --workers=1

echo.
echo ================================================================================
echo PHOTO BOOKS BATCH %BATCH_NUMBER% COMPLETE
echo ================================================================================
echo.
