# Deploy Pallet Ticket Capture Online

**Important:** This app needs a **Python server** (Flask). **GitHub Pages will NOT work** – it only hosts static HTML/CSS/JS files, not backend code.

Use one of these instead:

---

## Option A: Render.com (Recommended)

1. Push your code to GitHub (create a repo, push the `camcapprod` folder contents).

2. Go to **[render.com](https://render.com)** → Sign up (free with GitHub).

3. Click **New** → **Web Service**.

4. Connect GitHub and select your repository.

5. **Root Directory:** Leave blank (or use `/` if it asks).

6. **Build & Deploy:**
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements_web.txt`
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT web_app:app`

7. **Environment Variables** (in Dashboard):
   - `OCR_PROVIDER` = `ocrspace`
   - `GOOGLE_SHEET_ID` = your Google Sheet ID (from the URL)

8. **Google Sheets credentials** (pick one):
   - **Secret Files:** Add `credentials.json` with your service account JSON contents, or
   - **Environment variable:** Add `GOOGLE_CREDENTIALS_JSON` = paste the entire JSON as the value

9. Click **Create Web Service**. Render will build and deploy. Use the generated URL (e.g. `https://your-app.onrender.com`).

---

## Option B: Railway.app

1. Push code to GitHub.

2. Go to **[railway.app](https://railway.app)** → Login with GitHub.

3. **New Project** → **Deploy from GitHub repo** → Select your repo.

4. Railway usually auto-detects Python. If not:
   - **Build Command:** `pip install -r requirements_web.txt`
   - **Start Command:** `gunicorn web_app:app`

5. Add variables:
   - `GOOGLE_SHEET_ID` = your Sheet ID
   - `OCR_PROVIDER` = `ocrspace`
   - `GOOGLE_CREDENTIALS_JSON` = paste your full service account JSON

6. Paste your full Google service account JSON into that variable. For `credentials.json`: use Railway’s “Variables” → “Raw Editor” and add as a file variable if supported, or set `GOOGLE_CREDENTIALS_JSON` and load it from the app.

---

## Option C: PythonAnywhere

1. Sign up at **[pythonanywhere.com](https://www.pythonanywhere.com)** (free account).

2. Upload your project (or clone from GitHub).

3. Create a **Web App** → Manual configuration → Flask.

4. Point it to your `web_app.py` and set the WSGI file.

5. Add `requirements_web.txt` packages via the **Bash** console:  
   `pip install -r requirements_web.txt`

6. Set environment variables in the Web tab.

---

## Why Not GitHub Pages?

| GitHub Pages | This app |
|--------------|----------|
| Static HTML/CSS/JS only | Python Flask backend |
| No server, no APIs | OCR API, image processing |
| No database/Sheets | Google Sheets integration |

Use Render, Railway, or PythonAnywhere for this app.

---

## Files Needed in Your Repo

Your GitHub repo should include at least:
- `web_app.py`
- `requirements_web.txt`
- `templates/` folder
- `ocr_processor.py`, `data_parser.py`, `sheets_integration.py`

Do **not** commit `credentials.json` to GitHub. Add it as a secret on your hosting platform.
