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
