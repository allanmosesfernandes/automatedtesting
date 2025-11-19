@echo off
REM Run ALL Photo Books Batches (500 links across 10 batches)
REM Each batch runs 50 links

echo.
echo ================================================================================
echo PHOTO BOOKS - RUN ALL 10 BATCHES (500 LINKS TOTAL)
echo ================================================================================
echo This will run all 500 photo books links in 10 batches of 50 links each
echo Estimated time: 1.4 hours (10 seconds per link average)
echo ================================================================================
echo.

set START_TIME=%time%

FOR /L %%i IN (1,1,10) DO (
    echo.
    echo ================================================================================
    echo STARTING BATCH %%i of 10
    echo ================================================================================
    echo.

    call scripts\run-photo-books-batch.bat %%i

    if errorlevel 1 (
        echo.
        echo ================================================================================
        echo ERROR: Batch %%i failed!
        echo ================================================================================
        echo.
        pause
        exit /b 1
    )

    echo.
    echo ================================================================================
    echo BATCH %%i COMPLETE
    echo ================================================================================
    echo.
)

set END_TIME=%time%

echo.
echo ================================================================================
echo ALL 10 BATCHES COMPLETE!
echo ================================================================================
echo Start Time: %START_TIME%
echo End Time: %END_TIME%
echo.
echo Check reports in: test-results\photo-books-optimized\reports\
echo ================================================================================
echo.

pause
