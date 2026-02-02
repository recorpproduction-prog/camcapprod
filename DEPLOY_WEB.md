# Deploy Pallet Ticket Capture - Web Application

## Quick Deployment Guide

This web application can be deployed to various platforms. Choose one:

---

## Option 1: PythonAnywhere (Easiest - FREE)

### 1. Create Account
- Go to [pythonanywhere.com](https://www.pythonanywhere.com)
- Sign up for free account

### 2. Upload Files
- In Web tab, create new web app
- Upload all Python files to your home directory
- Upload `templates/` and `static/` folders

### 3. Install Dependencies
In Bash console:
```bash
pip3.10 install --user flask flask-cors opencv-python numpy Pillow requests gspread google-auth
```

### 4. Configure
Set environment variables in Web > Web app configuration:
- `OCR_PROVIDER=ocrspace`
- `GOOGLE_SHEET_ID=your_sheet_id`
- `GOOGLE_CREDENTIALS_FILE=credentials.json`

### 5. Upload Credentials
- Upload `credentials.json` (Google Service Account key)
- Upload to your home directory

### 6. Set WSGI File
Point to `app_web.py` as your Flask application

### 7. Reload
Click "Reload" button

---

## Option 2: Render (FREE tier available)

### 1. Create Account
- Go to [render.com](https://render.com)
- Sign up

### 2. Connect Repository
- Push code to GitHub
- Connect GitHub repo to Render

### 3. Create Web Service
- New > Web Service
- Select your repository
- Build command: `pip install -r requirements_web.txt`
- Start command: `python app_web.py`

### 4. Set Environment Variables
In Render dashboard:
- `OCR_PROVIDER=ocrspace`
- `GOOGLE_SHEET_ID=your_sheet_id`
- `PORT=5000`

### 5. Upload Credentials
- Use Render's environment variables or Secrets
- Or upload credentials.json via Render shell

---

## Option 3: Heroku (Paid, but reliable)

### 1. Create Account
- Go to [heroku.com](https://heroku.com)
- Install Heroku CLI

### 2. Prepare Files
Create `Procfile`:
```
web: python app_web.py
```

### 3. Deploy
```bash
heroku create your-app-name
git push heroku main
```

### 4. Set Config Vars
```bash
heroku config:set OCR_PROVIDER=ocrspace
heroku config:set GOOGLE_SHEET_ID=your_sheet_id
```

### 5. Upload Credentials
Use Heroku config vars or upload file

---

## Option 4: Google Cloud Run (Best for Google Sheets)

### 1. Install Google Cloud SDK
- Install from [cloud.google.com/sdk](https://cloud.google.com/sdk)

### 2. Create Project
```bash
gcloud projects create pallet-capture
gcloud config set project pallet-capture
```

### 3. Build Container
Create `Dockerfile`:
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements_web.txt .
RUN pip install -r requirements_web.txt

COPY . .

CMD ["python", "app_web.py"]
```

### 4. Deploy
```bash
gcloud run deploy pallet-capture --source .
```

### 5. Set Environment Variables
In Cloud Console or via CLI:
```bash
gcloud run services update pallet-capture --set-env-vars OCR_PROVIDER=ocrspace,GOOGLE_SHEET_ID=your_sheet_id
```

---

## Setup Steps (All Platforms)

### 1. Google Sheets Setup

1. Create Google Service Account:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Enable Google Sheets API and Drive API
   - Create Service Account
   - Download JSON key as `credentials.json`

2. Share Google Sheet:
   - Open your Google Sheet
   - Click Share
   - Add service account email (from JSON file)
   - Give Editor permissions

3. Get Sheet ID:
   - From Sheet URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
   - Copy the `SHEET_ID` part

### 2. Environment Variables

Set these in your deployment platform:
- `GOOGLE_SHEET_ID` - Your Google Sheet ID
- `OCR_PROVIDER` - `ocrspace` (default, free)
- `OCR_API_KEY` - Optional (not needed for ocrspace)
- `GOOGLE_CREDENTIALS_FILE` - Path to credentials.json (or upload file)

### 3. File Structure

Your deployment should have:
```
/
├── app_web.py
├── ocr_processor.py
├── sheets_integration.py
├── data_parser.py
├── credentials.json (or set path)
├── templates/
│   └── index.html
│   └── review.html
├── static/
│   └── capture.js
│   └── captured_images/
└── requirements_web.txt
```

---

## Testing Locally First

1. Install dependencies:
```bash
pip install flask flask-cors opencv-python numpy Pillow requests gspread google-auth
```

2. Set environment variables:
```bash
# Windows
set GOOGLE_SHEET_ID=your_sheet_id
set OCR_PROVIDER=ocrspace

# Mac/Linux
export GOOGLE_SHEET_ID=your_sheet_id
export OCR_PROVIDER=ocrspace
```

3. Run:
```bash
python app_web.py
```

4. Open browser:
```
http://localhost:5000
```

---

## Recommended: PythonAnywhere (Free & Easy)

**Best for quick deployment:**

✅ FREE tier available  
✅ Easy setup  
✅ Good for Google Sheets  
✅ No credit card required  
✅ Simple file upload  

**Steps:**
1. Sign up at pythonanywhere.com
2. Upload files via web interface
3. Install dependencies in Bash console
4. Configure web app
5. Done!

---

## Security Notes

1. **Never commit credentials.json to Git**
   - Add to `.gitignore`
   - Upload separately to deployment platform

2. **Use environment variables**
   - Store sensitive data in platform's env vars
   - Don't hardcode in code

3. **HTTPS required**
   - Camera access requires HTTPS (all platforms provide this)

---

## Troubleshooting

### Camera not working
- Ensure HTTPS is enabled (required for camera access)
- Check browser permissions
- Try different browser (Chrome recommended)

### Google Sheets not connecting
- Verify credentials.json is uploaded
- Check service account email is shared on Sheet
- Verify Sheet ID is correct
- Check API is enabled in Google Cloud Console

### OCR not working
- OCR.space is free but requires internet
- Check network connectivity
- Try different OCR provider if needed

---

## Support

For issues:
1. Check deployment platform logs
2. Test locally first
3. Verify all environment variables are set
4. Check Google Sheets permissions

