@echo off
REM Pallet Ticket Capture - One-Click Launcher (Windows)
REM Double-click this file to start the application

echo ============================================
echo Pallet Ticket Capture - Starting...
echo ============================================
echo.

REM Check if Python is installed
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

REM Check if required packages are installed
echo.
echo Checking dependencies...
python -c "import cv2, requests, gspread, tkinter" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Some dependencies are missing
    echo.
    echo Installing required packages...
    echo Note: Using online OCR APIs - no Tesseract installation needed!
    echo.
    REM Install packages directly (requests instead of pytesseract for online OCR)
    pip install opencv-python numpy Pillow requests gspread google-auth google-auth-oauthlib google-auth-httplib2 flask flask-cors
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies
        echo.
        echo Please run manually:
        echo   pip install opencv-python numpy Pillow requests gspread google-auth google-auth-oauthlib google-auth-httplib2 flask flask-cors
        echo.
        echo Or use: install_dependencies.bat
        pause
        exit /b 1
    )
)

echo [OK] Dependencies ready

REM Info about OCR (no longer required)
echo.
echo [INFO] Using online OCR APIs - no local Tesseract installation needed!
echo   Default: OCR.space (FREE, 25,000 requests/month, no API key required)
echo   Alternative: Tesseract.space, Google Vision API (configure in app settings)
echo.

echo.
echo ============================================
echo Starting Pallet Ticket Capture...
echo ============================================
echo.

REM Try simplified app first (more reliable UI)
echo Trying simplified app...
python app_simple.py 2>nul || python launcher.py

REM If app crashes, show error
if errorlevel 1 (
    echo.
    echo [ERROR] Application crashed
    echo Check the error messages above
    pause
)

