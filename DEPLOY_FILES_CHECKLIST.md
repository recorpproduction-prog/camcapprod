# Deploy Files Checklist – Required for Render

Use this list to confirm every required file is in your GitHub repo before deploying.

## Must be in repo root (same folder as web_app.py)

| File/Folder | Purpose |
|-------------|---------|
| `web_app.py` | Main Flask app |
| `ocr_processor.py` | OCR handling |
| `data_parser.py` | Label parsing |
| `sheets_integration.py` | Google Sheets |
| `requirements.txt` | Dependencies (Render uses this) |
| `Procfile` | Start command for Render |
| `templates/` | **Required** – HTML templates |
| `static/` | CSS/JS assets |

## Inside `templates/` (must exist)

| File | Used by |
|------|---------|
| `capture.html` | Main capture page (/) |
| `review.html` | Supervisor review (/review) |
| `index.html` | Optional |

## Inside `static/` (optional but recommended)

| File | Purpose |
|------|---------|
| `capture.js` | If referenced by templates |

---

## Quick check on GitHub

1. Open your repo on GitHub.com.
2. Confirm these exist at the root:
   - `web_app.py`
   - `templates` folder
   - `templates/capture.html`
   - `templates/review.html`

If `templates` or `templates/capture.html` is missing:

- Add the folder/files in your project.
- Stage and commit: `git add templates/`
- Push: `git push`

## Render Root Directory

In Render: **Dashboard → your service → Settings → Build & Deploy**

- **Root Directory** should be **blank** (use repo root), or  
- Set to the folder that contains both `web_app.py` and `templates/`.
