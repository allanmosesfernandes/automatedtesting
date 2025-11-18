@echo off
echo ================================
echo Clear Printbox Test Reports
echo ================================
echo.
echo This will delete ALL printbox test reports and screenshots.
echo.
echo WARNING: This action cannot be undone!
echo.
pause

echo.
echo Clearing reports...
rmdir /s /q test-results\printbox\reports
rmdir /s /q test-results\printbox\screenshots

echo Creating fresh directories...
mkdir test-results\printbox\reports
mkdir test-results\printbox\screenshots

echo.
echo ================================
echo Reports Cleared Successfully!
echo ================================
echo.
pause
