# Render Troubleshooting

## App "thinks forever" or never loads

### 1. Check Build Logs
In Render Dashboard → your service → **Logs** tab:
- If build fails: check for "command failed" or "timeout"
- If deploy fails: check for Python import errors

### 2. Try the Health Endpoint
Once deployed, open: `https://YOUR-APP.onrender.com/health`

- **If it loads:** App is running. Main page should work. First load can take 30–60 seconds (cold start on free tier).
- **If it times out:** Service may be failing to start. Check **Logs** for errors.
- **If 404:** Wrong URL or route. Ensure you're using the Render URL.

### 3. Cold Start (Free Tier)
On the free tier, the app sleeps after ~15 min of no traffic. The **first request** after sleep can take **30–60 seconds**. Wait and try again.

### 4. Environment Variables
Confirm these are set in Render → **Environment**:
- `OCR_PROVIDER` = `ocrspace`
- `GOOGLE_SHEET_ID` = your Sheet ID (optional but needed for Sheets)
- `GOOGLE_CREDENTIALS_JSON` = your full service account JSON (optional; needed for Sheets)

**For GOOGLE_CREDENTIALS_JSON:** Paste the JSON as a **single line** (minified). Remove all line breaks. Example:
```
{"type":"service_account","project_id":"my-project",...}
```

### 5. Build Command
Should be: `pip install -r requirements_web.txt`

### 6. Start Command
Should be: `gunicorn --bind 0.0.0.0:$PORT --workers 1 --timeout 300 web_app:app`

### 7. No Keys Needed for Basic Run
The app works without Google Sheets:
- OCR uses OCR.space (free, no key)
- Records are saved locally (ephemeral on Render)
- Add `GOOGLE_SHEET_ID` and `GOOGLE_CREDENTIALS_JSON` only if you want Sheets

---

## TemplateNotFound: capture.html

**Symptom:** `jinja2.exceptions.TemplateNotFound: capture.html`

**Cause:** The `templates` folder (with `capture.html`, `review.html`) is not on the Render server.

**Fix:**
1. Ensure `templates/` is in your GitHub repo. In your project folder, run:
   ```bash
   git status
   ```
   You should see `templates/capture.html`, `templates/review.html`, etc. If they show as "untracked", add and push:
   ```bash
   git add templates/
   git commit -m "Add templates folder"
   git push
   ```
2. In Render Dashboard → your service → **Settings** → **Build & Deploy** → check **Root Directory**. It should be blank (use repo root) or point to the folder that contains both `web_app.py` and `templates/`.

---

## Internal Server Error (500)

### See the actual error message
The app now returns JSON for 500 errors. Check:
- **Capture page:** The red status box in the camera area will show the error text.
- **Network tab:** In browser DevTools (F12) → Network → click the failed request → Response.

### Enable full traceback (for debugging)
In Render → **Environment**, add:
- `FLASK_DEBUG` = `true`

Redeploy. 500 responses will then include the full traceback. Remove this after debugging (don't leave it on in production).

### Common causes
- **OCR not initialized** – Add `OCR_API_KEY` (get a free key from ocr.space).
- **Sheets error** – Check `GOOGLE_CREDENTIALS_JSON` is valid JSON (minified, one line).
- **Disk write** – Images save to `captured_images/` (outside static). If your host restricts writes, this could fail.
