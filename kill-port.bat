@echo off
:: Usage: kill-port.bat [PORT_NUMBER]
:: Example: kill-port.bat 3000

if "%1"=="" (
    echo Error: Please provide a port number
    echo Usage: kill-port.bat [PORT_NUMBER]
    echo Example: kill-port.bat 3000
    exit /b 1
)

set PORT=%1

echo Checking what's running on port %PORT%...
echo.

:: Find process using the port
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%PORT%') do (
    set PID=%%a
    goto :kill
)

echo No process found using port %PORT%
exit /b 0

:kill
echo Found process PID: %PID%
echo Killing process...
taskkill /F /PID %PID%

if %ERRORLEVEL% EQU 0 (
    echo ✓ Process killed successfully!
) else (
    echo ✗ Failed to kill process
)
pause
