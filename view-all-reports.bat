@echo off
echo ================================
echo Printbox Test Reports Summary
echo ================================
echo.

cd test-results\printbox\reports

echo All Test Reports:
echo ================================
echo.

for %%f in (printbox-report-*.json) do (
    echo %%f
)

echo.
echo ================================
echo Latest Reports:
echo ================================
echo.
if exist test-report.json (
    echo test-report.json (Latest JSON)
)
if exist passed-links.txt (
    echo passed-links.txt (Latest Passed)
)
if exist failed-links.txt (
    echo failed-links.txt (Latest Failed)
)

echo.
echo ================================
echo.
echo To open a specific report, use:
echo   notepad filename.json
echo   notepad filename.txt
echo.
pause
