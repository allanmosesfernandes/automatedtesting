@echo off
echo Killing all Playwright and Node processes...

:: Kill all node processes (this includes Playwright)
taskkill /F /IM node.exe /T 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Killed Node.js processes
) else (
    echo No Node.js processes found
)

:: Kill Chromium browser processes
taskkill /F /IM chrome.exe /T 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Killed Chrome browser processes
) else (
    echo No Chrome processes found
)

:: Kill Playwright-specific processes
taskkill /F /IM playwright.exe /T 2>nul

echo.
echo All Playwright processes terminated!
pause
