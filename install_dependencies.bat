@echo off
REM Install all dependencies for Pallet Ticket Capture
REM This script installs packages directly (not from requirements.txt) to avoid tkinter issues

echo ============================================
echo Installing Pallet Ticket Capture Dependencies
echo ============================================
echo.
echo Note: tkinter is part of Python standard library and cannot be installed via pip
echo If tkinter is missing, reinstall Python with tcl/tk support
echo.

python --version
if errorlevel 1 (
    echo [ERROR] Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo Installing packages...
echo.

pip install opencv-python>=4.8.0
pip install numpy>=1.24.0
pip install Pillow>=10.0.0
pip install requests>=2.31.0
pip install gspread>=5.12.0
pip install google-auth>=2.23.0
pip install google-auth-oauthlib>=1.1.0
pip install google-auth-httplib2>=0.1.1
pip install flask>=3.0.0
pip install flask-cors>=4.0.0

echo.
echo ============================================
echo Installation complete!
echo ============================================
echo.
echo Checking tkinter (should be included with Python)...
python -c "import tkinter; print('[OK] tkinter available')" 2>nul || echo [WARNING] tkinter not found - reinstall Python with tcl/tk support

echo.
echo [INFO] OCR Configuration:
echo   Using online OCR APIs - no Tesseract installation needed!
echo   Default: OCR.space (FREE, no API key required)
echo   Configure in app settings if you want to use a different provider

echo.
pause

