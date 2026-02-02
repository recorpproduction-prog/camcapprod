# Quick Start Guide - One Click Launch

## Windows Users

**Simply double-click: `start_app.bat`**

That's it! The launcher will:
- ✅ Check if Python is installed
- ✅ Install missing dependencies automatically
- ✅ Check for Tesseract OCR
- ✅ Start the application

## Mac/Linux Users

**Double-click or run: `./start_app.sh`**

First time, you may need to make it executable:
```bash
chmod +x start_app.sh
./start_app.sh
```

## What the Launcher Does

1. **Checks Python** - Verifies Python 3.8+ is installed
2. **Checks Dependencies** - Verifies required packages
3. **Installs Missing Packages** - Automatically installs if needed
4. **Checks Tesseract** - Warns if OCR engine is missing
5. **Starts App** - Launches the desktop application

## First Time Setup

On first run, the launcher will:
- Install all Python packages (may take a few minutes)
- Warn about Tesseract OCR (install separately if needed)

## Manual Launch

If you prefer to launch manually:

```bash
# Windows
python launcher.py

# Mac/Linux
python3 launcher.py

# Or directly
python app.py
```

## Troubleshooting

### "Python is not installed"
- Download from: https://www.python.org/downloads/
- **Important**: Check "Add Python to PATH" during installation
- Restart computer after installation

### "Tesseract not found"
- The app will still start, but OCR won't work
- Install Tesseract:
  - **Windows**: https://github.com/UB-Mannheim/tesseract/wiki
  - **Mac**: `brew install tesseract`
  - **Linux**: `sudo apt-get install tesseract-ocr`

### "Dependencies failed to install"
- Try manually: `pip install -r requirements.txt`
- If using Python 3, use: `pip3 install -r requirements.txt`
- On Windows, you may need: `python -m pip install -r requirements.txt`

## Alternative: Direct Launch

If the launcher doesn't work, you can always run directly:

```bash
python app.py
```

But you'll need to manually ensure all dependencies are installed first.


