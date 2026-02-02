#!/bin/bash
# Pallet Ticket Capture - One-Click Launcher (Mac/Linux)
# Double-click this file or run: ./start_app.sh

echo "============================================"
echo "Pallet Ticket Capture - Starting..."
echo "============================================"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo ""
    echo "Please install Python 3.8+ from: https://www.python.org/downloads/"
    echo ""
    exit 1
fi

echo "[OK] Python found"
python3 --version

# Check if required packages are installed
echo ""
echo "Checking dependencies..."
if ! python3 -c "import cv2, pytesseract, gspread" &> /dev/null; then
    echo "[WARNING] Some dependencies are missing"
    echo ""
    echo "Installing required packages..."
    pip3 install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies"
        echo "Please run manually: pip3 install -r requirements.txt"
        exit 1
    fi
fi

echo "[OK] Dependencies ready"

# Check if Tesseract is available
if ! command -v tesseract &> /dev/null; then
    echo ""
    echo "[WARNING] Tesseract OCR not found"
    echo ""
    echo "Please install Tesseract OCR:"
    echo "Mac: brew install tesseract"
    echo "Linux: sudo apt-get install tesseract-ocr"
    echo ""
    echo "The app will still start but OCR won't work until Tesseract is installed."
    sleep 3
fi

echo ""
echo "============================================"
echo "Starting Pallet Ticket Capture..."
echo "============================================"
echo ""

# Start the application (using launcher for better error handling)
python3 launcher.py

# Check exit status
if [ $? -ne 0 ]; then
    echo ""
    echo "[ERROR] Application crashed"
    echo "Check the error messages above"
    read -p "Press Enter to exit..."
fi

