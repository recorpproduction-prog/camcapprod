# Desktop Application Setup Guide

This is a **desktop/PC-based application** that uses **free Tesseract OCR** and connects to **Google Sheets** for data storage.

## Features

✅ **Desktop Application** - Runs on Windows/Mac/Linux  
✅ **Free OCR** - Uses Tesseract (no Google Vision API needed)  
✅ **Google Sheets Integration** - Stores data in your Google Sheet  
✅ **Auto-Detection** - Same automatic ticket detection  
✅ **Supervisor Review** - Web-based review interface  

---

## Prerequisites

### 1. Python 3.8+
- Download from [python.org](https://www.python.org/downloads/)
- During installation, check **"Add Python to PATH"**

### 2. Tesseract OCR

#### Windows:
1. Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run installer (default location: `C:\Program Files\Tesseract-OCR`)
3. Add to PATH or the app will auto-detect

#### Mac:
```bash
brew install tesseract
```

#### Linux:
```bash
sudo apt-get install tesseract-ocr
```

Verify installation:
```bash
tesseract --version
```

### 3. Google Service Account Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable **Google Sheets API** and **Google Drive API**
4. Create Service Account:
   - Go to **IAM & Admin** > **Service Accounts**
   - Click **Create Service Account**
   - Name it "Pallet Ticket Capture"
   - Click **Create and Continue**
   - Skip roles, click **Done**
5. Create Key:
   - Click on the service account
   - Go to **Keys** tab
   - Click **Add Key** > **Create new key**
   - Select **JSON**
   - Download the JSON file
6. Share Google Sheet:
   - Open your Google Sheet
   - Click **Share** button
   - Add the service account email (found in JSON file, looks like `xxx@xxx.iam.gserviceaccount.com`)
   - Give **Editor** permissions

---

## Installation

### 1. Clone/Download Files

All files should be in the same directory:
```
pallet-capture/
├── app.py
├── ocr_processor.py
├── sheets_integration.py
├── data_parser.py
├── requirements.txt
├── review_server/
│   ├── review.html
│   └── api_server.py
└── DESKTOP_SETUP.md
```

### 2. Install Python Dependencies

Open terminal/command prompt in the project directory:

```bash
pip install -r requirements.txt
```

If you get permission errors:
```bash
pip install --user -r requirements.txt
```

### 3. Configure Application

#### Option A: Using the UI
1. Run the application:
   ```bash
   python app.py
   ```
2. Enter your settings in the UI:
   - **Operator Name**: Your name/ID
   - **Google Sheet ID**: From your Sheet URL
   - Click **Save Config**

#### Option B: Manual Config File

Create `config.json`:
```json
{
  "operator_name": "John Doe",
  "sheets_id": "YOUR_SHEET_ID_HERE",
  "credentials_file": "path/to/credentials.json"
}
```

**Get Sheet ID:**
- Open your Google Sheet
- URL looks like: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
- Copy the `SHEET_ID` part

---

## Running the Application

### 1. Start Main Application

```bash
python app.py
```

The desktop window will open with:
- Camera preview
- Settings panel
- Activity log
- Control buttons

### 2. Start Review Server (Optional)

For supervisor review interface, in a separate terminal:

```bash
cd review_server
python api_server.py
```

Then open browser to: `http://localhost:5000`

---

## Usage

### Operator Mode

1. **Start Capture** button to begin
2. Point camera at pallet ticket
3. System automatically:
   - Detects ticket (sharpness + text density)
   - Captures image
   - Runs OCR
   - Parses fields
   - Submits to Google Sheets

### Supervisor Review

1. Start review server: `python review_server/api_server.py`
2. Open browser: `http://localhost:5000`
3. Review pending records
4. Approve or Reject with reason

---

## Configuration Options

Edit `app.py` to adjust detection parameters:

```python
CONFIG = {
    'frame_sample_interval': 0.8,  # Seconds between frame samples
    'cooldown_period': 30,  # Seconds between submissions
    'sharpness_threshold': 50,  # Increase for stricter detection
    'text_density_threshold': 0.1,  # Minimum text density (0.0-1.0)
}
```

---

## Troubleshooting

### Camera Not Working

- Check camera permissions (Windows Settings > Privacy > Camera)
- Try different camera index in code (change `cv2.VideoCapture(0)` to `cv2.VideoCapture(1)`)
- Close other applications using the camera

### Tesseract Not Found

**Windows:**
- Check if installed at: `C:\Program Files\Tesseract-OCR\tesseract.exe`
- If different location, edit `ocr_processor.py`:
  ```python
  pytesseract.pytesseract.tesseract_cmd = r'YOUR_PATH\tesseract.exe'
  ```

**Mac/Linux:**
- Verify installation: `which tesseract`
- Should return: `/usr/local/bin/tesseract` or similar

### Google Sheets Connection Error

1. **Check credentials file path** in config.json
2. **Verify service account email** is shared on Sheet
3. **Check API enablement** in Google Cloud Console
4. **Verify Sheet ID** is correct

### Poor OCR Results

1. **Improve lighting** - ensure good contrast
2. **Hold steady** - wait for sharpness detection
3. **Adjust thresholds** in config:
   - Increase `sharpness_threshold` for better quality
   - Preprocessing is automatic but can be adjusted in `ocr_processor.py`

### Images Not Showing in Review

- Review server needs access to image files
- Images saved in `captured_images/` folder
- Browser security may block `file://` URLs
- Consider using Flask to serve images instead

---

## File Structure

```
captured_images/          # Saved ticket images (auto-created)
local_records/           # JSON backups if Sheets unavailable (auto-created)
config.json              # Configuration (auto-created)
credentials.json         # Google service account key (you provide)
```

---

## Advantages Over Google Apps Script Version

✅ **No Google Apps Script limits** - No execution time limits  
✅ **Better OCR control** - Tesseract is fully configurable  
✅ **Faster processing** - Runs locally, no network delays  
✅ **Desktop GUI** - Native application experience  
✅ **Offline capable** - Can save locally if Sheets unavailable  
✅ **Free OCR** - No API costs  

---

## Next Steps

1. Test with a sample pallet ticket
2. Tune detection parameters for your use case
3. Customize field parsing rules in `data_parser.py`
4. Adjust OCR preprocessing in `ocr_processor.py`

---

## Support

For issues:
1. Check error messages in activity log
2. Verify all prerequisites are installed
3. Test Tesseract: `tesseract --version`
4. Test camera: Run a simple OpenCV script
5. Check Google Sheets API access


