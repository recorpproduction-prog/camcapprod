# Web Application - Complete Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements_web.txt
```

### 2. Configure Google Sheets (Optional)

**If you want Google Sheets integration:**

1. Create Google Service Account:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable **Google Sheets API** and **Drive API**
   - Create Service Account
   - Download JSON key as `credentials.json`

2. Share Google Sheet:
   - Open your Google Sheet
   - Click **Share**
   - Add service account email (from JSON file)
   - Give **Editor** permissions

3. Set Environment Variables:
   ```bash
   # Windows
   set GOOGLE_SHEET_ID=your_sheet_id_here
   
   # Mac/Linux
   export GOOGLE_SHEET_ID=your_sheet_id_here
   ```

### 3. Run the Application

```bash
python run_web.py
```

Or directly:
```bash
python web_app.py
```

### 4. Open Browser

```
http://localhost:5000
```

---

## Deployment Options

### Option 1: PythonAnywhere (FREE - Recommended)

1. Sign up at [pythonanywhere.com](https://www.pythonanywhere.com)
2. Upload all files to your account
3. In Bash console:
   ```bash
   pip3.10 install --user flask flask-cors opencv-python numpy Pillow requests gspread google-auth
   ```
4. Set environment variables in Web > Web app:
   - `GOOGLE_SHEET_ID=your_sheet_id`
   - `OCR_PROVIDER=ocrspace`
5. Upload `credentials.json` to your home directory
6. Point WSGI file to `web_app.py`
7. Reload!

**Your app will be at:** `https://yourusername.pythonanywhere.com`

---

### Option 2: Render (FREE tier available)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. New > Web Service
4. Connect GitHub repo
5. Settings:
   - Build command: `pip install -r requirements_web.txt`
   - Start command: `python web_app.py`
6. Set environment variables:
   - `GOOGLE_SHEET_ID`
   - `OCR_PROVIDER=ocrspace`
   - `PORT=5000`
7. Upload `credentials.json` via Render shell

---

### Option 3: Heroku

1. Create `Procfile`:
   ```
   web: python web_app.py
   ```

2. Deploy:
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

3. Set config vars:
   ```bash
   heroku config:set GOOGLE_SHEET_ID=your_sheet_id
   heroku config:set OCR_PROVIDER=ocrspace
   ```

---

## File Structure

```
/
├── web_app.py              # Main Flask application
├── run_web.py              # Quick start script
├── ocr_processor.py        # OCR processing
├── sheets_integration.py   # Google Sheets API
├── data_parser.py          # Data parsing
├── credentials.json        # Google Service Account (you provide)
├── requirements_web.txt    # Python dependencies
├── templates/
│   ├── capture.html        # Main capture page
│   └── review.html         # Supervisor review page
└── static/
    └── captured_images/    # Saved images (auto-created)
```

---

## Features

✅ **Camera Source Selection** - Choose from multiple cameras  
✅ **Auto-Detection** - Automatically detects and captures tickets  
✅ **Online OCR** - Uses OCR.space (FREE, no key needed)  
✅ **Google Sheets** - Direct integration with your Sheet  
✅ **Supervisor Review** - Auto-refreshing review interface  
✅ **Mobile-Friendly** - Works on phones and tablets  
✅ **HTTPS Ready** - Works on deployed platforms  

---

## Configuration

### Environment Variables

- `GOOGLE_SHEET_ID` - Your Google Sheet ID (optional)
- `OCR_PROVIDER` - `ocrspace` (default), `tesseractspace`, `google`
- `OCR_API_KEY` - Only if using tesseractspace or google
- `GOOGLE_CREDENTIALS_FILE` - Path to credentials.json (default: `credentials.json`)
- `PORT` - Server port (default: 5000)
- `DEBUG` - Enable debug mode (default: False)

### Local Testing

Without Google Sheets:
```bash
python run_web.py
```

With Google Sheets:
```bash
set GOOGLE_SHEET_ID=your_sheet_id
python run_web.py
```

---

## Troubleshooting

### Camera Not Working

- **Use HTTPS or localhost** - Camera API requires secure connection
- **Allow permissions** - Click camera icon in browser address bar
- **Check browser** - Use Chrome, Firefox, Safari, or Edge
- **Close other apps** - Zoom, Teams, etc. may block camera

### Google Sheets Not Connecting

- **Check credentials.json** exists and is valid
- **Verify service account email** is shared on Sheet
- **Check Sheet ID** is correct
- **Enable APIs** in Google Cloud Console

### OCR Not Working

- **Check internet** - OCR.space requires internet connection
- **Check API key** if using different provider
- **Try different provider** if one fails

---

## Production Deployment

All platforms provide HTTPS automatically:
- ✅ PythonAnywhere - Free HTTPS included
- ✅ Render - HTTPS by default
- ✅ Heroku - HTTPS by default

**Camera will work on all deployed platforms!**

---

## Next Steps

1. Test locally: `python run_web.py`
2. Deploy to PythonAnywhere (easiest)
3. Configure Google Sheets
4. Start capturing tickets!

Your web app is ready for online deployment! 🚀


