@echo off
REM Silent Installation Script for Engineering Olympics
REM Run this batch file as Administrator

echo ========================================
echo Engineering Olympics - Silent Installer
echo ========================================
echo.

REM Check if installer exists
if not exist "Engineering Olympics Setup X.X.X.exe" (
    echo ERROR: Installer not found!
    echo Please place "Engineering Olympics Setup X.X.X.exe" in the same folder as this script.
    pause
    exit /b 1
)

echo Installing Engineering Olympics silently...
echo.

REM Run silent installer
"Engineering Olympics Setup X.X.X.exe" /S

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Installation completed successfully!
    echo.
    echo Engineering Olympics has been installed.
    echo Users can find it in the Start Menu.
) else (
    echo.
    echo Installation failed with error code: %ERRORLEVEL%
    echo Please check Windows Event Viewer for details.
)

echo.
echo ========================================
pause

