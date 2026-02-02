#!/bin/bash
# One-Click Start for Web Application (Mac/Linux)
# Run: ./start_web.sh

echo "============================================"
echo "Pallet Ticket Capture - Web Application"
echo "============================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed"
    echo ""
    echo "Please install Python 3.8+ from: https://www.python.org/downloads/"
    echo ""
    exit 1
fi

echo "[OK] Python found"
python3 --version
echo ""

# Check dependencies
echo "Checking dependencies..."
if ! python3 -c "import flask, cv2, requests, numpy" &> /dev/null; then
    echo "[WARNING] Some dependencies are missing"
    echo ""
    echo "Installing dependencies..."
    echo "This may take a few minutes..."
    echo ""
    pip3 install flask flask-cors opencv-python numpy Pillow requests gspread google-auth google-auth-oauthlib google-auth-httplib2
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to install dependencies"
        echo "Please run manually: pip3 install -r requirements_web.txt"
        exit 1
    fi
    echo ""
    echo "[OK] Dependencies installed"
else
    echo "[OK] Dependencies ready"
fi

echo ""
echo "============================================"
echo "Starting Web Application..."
echo "============================================"
echo ""
echo "Server will start on: http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "============================================"
echo ""

# Start the web app
python3 web_app.py

echo ""
echo "Server stopped."


