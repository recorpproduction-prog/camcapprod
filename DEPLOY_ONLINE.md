# Deploy Pallet Ticket Capture Online (GitHub + Render)

Deploy the app so it runs in a web browser from any device. Uses **Render.com** (free tier) + **GitHub**.

---

## 1. Push to GitHub

```bash
cd camcapprod
git init
git add .
git commit -m "Initial pallet ticket capture app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

---

## 2. Deploy on Render

1. Go to [render.com](https://render.com) and sign up (free)
2. Click **New** → **Web Service**
3. Connect your **GitHub** account and select your repository
4. Render auto-detects Python:
   - **Build Command:** `pip install -r requirements_web.txt`
   - **Start Command:** `gunicorn --bind 0.0.0.0:$PORT web_app:app`
5. Click **Advanced** and add **Environment Variables**:

| Key | Value |
|-----|-------|
| `GOOGLE_SHEET_ID` | Your Google Sheet ID (from the sheet URL) |
| `OCR_PROVIDER` | `ocrspace` (default, free) |
| `OCR_API_KEY` | Optional: get from ocr.space for higher limits |

6. For **Google Sheets**, add your service account credentials:
   - In Render: **Environment** → **Secret Files**
   - Add file: `credentials.json` with the contents of your Google service account JSON

7. Click **Create Web Service**

---

## 3. Google Sheets Setup

1. Create a Google Sheet
2. Copy the **Sheet ID** from the URL:  
   `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
3. Create a [Google Cloud service account](https://console.cloud.google.com/iam-admin/serviceaccounts)
4. Enable **Google Sheets API** and **Google Drive API**
5. Create a key (JSON) and download it
6. Share your Google Sheet with the service account email (Editor access)

---

## 4. HTTPS and Camera

- Render provides **HTTPS** automatically
- **Camera requires HTTPS** in most browsers
- Use your Render URL (e.g. `https://pallet-ticket-capture.onrender.com`)

---

## 5. Features When Online

- **Capture** – Camera, auto-detect, OCR, parsing
- **Duplicate check** – Blocks same SSCC (unless Test Mode is ON)
- **Test Mode** – When ON, allows duplicates for testing
- **Review** – Supervisor approves/rejects
- **Google Sheets** – Approved records written to your sheet

---

## 6. Notes

- **Free tier** – Render may spin down after 15 min of inactivity (cold start)
- **Local storage** – `local_records` and images are ephemeral on Render; use Google Sheets as primary storage
- **credentials.json** – Add via Render Secret Files for production
