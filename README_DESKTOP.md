# Pallet Ticket Capture - Desktop Application

**Desktop/PC-based solution** using **free Tesseract OCR** with **Google Sheets integration**.

## 🚀 ONE-CLICK START

### Windows:
**Double-click: `start_app.bat`**

### Mac/Linux:
**Run: `./start_app.sh`** (or double-click if enabled)

The launcher automatically:
- ✅ Checks Python installation
- ✅ Installs missing dependencies
- ✅ Verifies Tesseract OCR
- ✅ Starts the application

**That's it!** No command line needed.

---

## Manual Setup (Alternative)

### 1. Install Prerequisites

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Tesseract OCR
# Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
# Mac: brew install tesseract
# Linux: sudo apt-get install tesseract-ocr
```

### 2. Setup Google Sheets

1. Create Google Service Account (see `DESKTOP_SETUP.md`)
2. Download credentials JSON file
3. Share your Google Sheet with service account email

### 3. Run Application

```bash
python app.py
# OR use the launcher
python launcher.py
```

### 4. Configure

Enter in the UI:
- **Operator Name**: Your name/ID
- **Google Sheet ID**: From Sheet URL
- Click **Save Config** (will prompt for credentials JSON file)

### 5. Start Capturing

- Click **Start Capture**
- Point camera at pallet ticket
- System automatically detects and processes

## Supervisor Review

Start review server:
```bash
python review_server/api_server.py
```

Open browser: `http://localhost:5000`

## Features

✅ Desktop GUI application  
✅ Free Tesseract OCR (no API costs)  
✅ Google Sheets integration  
✅ Automatic ticket detection  
✅ Local image storage  
✅ Offline-capable (saves locally if Sheets unavailable)  

## Files

- `app.py` - Main desktop application
- `ocr_processor.py` - Tesseract OCR integration
- `sheets_integration.py` - Google Sheets API
- `data_parser.py` - Field extraction from OCR text
- `review_server/` - Supervisor web interface

## Full Documentation

See `DESKTOP_SETUP.md` for complete setup instructions.

