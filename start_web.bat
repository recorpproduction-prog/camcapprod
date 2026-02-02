@echo off
REM One-Click Start for Web Application
REM Double-click this file to start the web app

echo ============================================
echo Pallet Ticket Capture - Web Application
echo ============================================
echo.

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    echo.
    echo Please install Python 3.8+ from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo [OK] Python found
python --version
echo.

REM Check if dependencies are installed
echo Checking dependencies...
python -c "import flask, cv2, requests, numpy" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Some dependencies are missing
    echo.
    echo Installing dependencies...
    echo This may take a few minutes...
    echo.
    pip install flask flask-cors opencv-python numpy Pillow requests gspread google-auth google-auth-oauthlib google-auth-httplib2
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        echo Please run manually: pip install -r requirements_web.txt
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed
) else (
    echo [OK] Dependencies ready
)

echo.
echo ============================================
echo Starting Web Application...
echo ============================================
echo.
echo Server will start on: http://localhost:5000
echo.
echo Opening browser automatically...
echo Press Ctrl+C to stop the server
echo.
echo ============================================
echo.

REM Start the web app
REM Browser will open automatically (web_app.py handles this)
python web_app.py

REM If we get here, server stopped
echo.
echo Server stopped.
pause

