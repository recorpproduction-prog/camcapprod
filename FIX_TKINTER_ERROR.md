# Fix: tkinter Installation Error

## Problem
When running `start_app.bat`, you see:
```
ERROR: Could not find a version that satisfies the requirement tkinter
```

## Solution

**tkinter is NOT installed via pip** - it's part of Python's standard library.

### Quick Fix
1. The updated `start_app.bat` now installs packages directly (not from requirements.txt)
2. Just run `start_app.bat` again - it should work now

### Manual Installation (if needed)
If you still have issues, run this instead:

```batch
pip install opencv-python numpy Pillow pytesseract gspread google-auth google-auth-oauthlib google-auth-httplib2 flask flask-cors
```

**Or use the helper script:**
- Double-click: `install_dependencies.bat`

### Verify tkinter is Available
tkinter should already be installed with Python. Test it:
```batch
python -c "import tkinter; print('tkinter OK')"
```

If this fails, you may need to:
- **Windows**: Reinstall Python from python.org and make sure "tcl/tk" is included
- **Linux**: Run `sudo apt-get install python3-tk`
- **Mac**: Should be included by default

## What Changed

1. ✅ Removed tkinter from any pip installation attempts
2. ✅ Updated `start_app.bat` to install packages directly
3. ✅ Created `install_dependencies.bat` as a standalone installer
4. ✅ Updated `requirements.txt` with clear note about tkinter

The launcher now handles tkinter correctly as a built-in Python library, not a pip package.


