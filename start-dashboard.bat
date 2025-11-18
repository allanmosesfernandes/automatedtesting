@echo off
REM Navigation Monitor Dashboard Launcher
REM Starts the Express server with real-time monitoring

echo ========================================
echo Navigation Monitor Dashboard
echo ========================================
echo.
echo Starting server...
echo.
echo Dashboard will be available at:
echo http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

REM Start the dashboard server
node server/dashboard-server.js

pause
