# Troubleshooting: App Shows Only "Operator Name" Box

## Issue
The app opens but only shows the "Operator Name" field and nothing else.

## Quick Fix

Try these steps in order:

### 1. Check if Window is Properly Sized
- The window might be too small
- Try maximizing the window or resizing it
- Look for scrollbars at the edges

### 2. Run Test Script
```bash
python test_app.py
```

This will show detailed error messages.

### 3. Check Console Output
When you run `start_app.bat`, look at the console window for errors.

Common errors:
- `ImportError` - Missing packages
- `tkinter` errors - GUI library issue
- Camera errors - Camera not found

### 4. Verify Dependencies
```bash
python -c "import cv2, requests, tkinter; print('All OK')"
```

If this fails, install missing packages:
```bash
pip install opencv-python requests
```

### 5. Check Camera
The app tries to initialize camera on startup. If camera fails:
- The app should still show the UI
- Camera preview will show an error message
- Other UI elements should still be visible

### 6. Force Window Refresh
If window appears blank:
- Try Alt+Tab to switch away and back
- Try minimizing and restoring
- Try closing and reopening

## Expected UI Layout

You should see:
1. **Settings Section** (top)
   - Operator Name field
   - Google Sheet ID field
   - Save Config button
   - OCR Provider dropdown
   - API Key field

2. **Camera Preview** (middle, large area)
   - Should show "Initializing camera..." or camera feed

3. **Status Bar** (below camera)
   - Status message

4. **Activity Log** (below status)
   - Text area with logs

5. **Buttons** (bottom)
   - Start Capture
   - Open Review Page
   - Exit

## If Nothing Shows

### Windows Specific
1. Right-click on `start_app.bat` > Properties
2. Check "Run as administrator" if needed
3. Try running `python app.py` directly in command prompt

### Check Python Installation
```bash
python --version
python -c "import tkinter; tkinter._test()"
```

If tkinter test window doesn't appear, tkinter might not be installed properly.

### Reinstall Dependencies
```bash
pip uninstall opencv-python requests
pip install opencv-python requests
```

## Still Not Working?

1. Check `config.json` exists (it's created automatically)
2. Check for error messages in console
3. Try running from command line: `python app.py`
4. Share the console output for help

## Manual Test

Create a simple test file `test_gui.py`:
```python
import tkinter as tk
from tkinter import ttk

root = tk.Tk()
root.title("Test")
root.geometry("800x600")

label = ttk.Label(root, text="If you see this, tkinter works!")
label.pack(pady=50)

button = ttk.Button(root, text="Click Me", command=lambda: print("Button works!"))
button.pack()

root.mainloop()
```

Run: `python test_gui.py`

If this simple window doesn't appear, there's a tkinter installation issue.


