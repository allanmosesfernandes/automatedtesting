@echo off
REM Single Link Test for Photo Books
REM Tests just one link to validate the flow

echo.
echo ================================================================================
echo PHOTO BOOKS SINGLE LINK TEST
echo ================================================================================
echo This will test a single photo books link to validate the flow
echo ================================================================================
echo.

REM Set the test URL (can be overridden with environment variable)
if not defined TEST_URL (
    echo Using first URL from photo-books.json
) else (
    echo Testing URL: %TEST_URL%
)
echo.

REM Run the single link test
npx playwright test tests/e2e/photo-books-optimized/photo-books-single-link-test.spec.ts --workers=1 --headed

echo.
echo ================================================================================
echo TEST COMPLETE
echo ================================================================================
echo.

pause
