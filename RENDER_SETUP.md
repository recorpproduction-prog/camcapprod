# Render Setup – Step-by-Step Walkthrough

Use this to deploy your Pallet Ticket Capture app so it runs in a browser from any device.

---

## Step 1: Put your code on GitHub

1. Open [github.com](https://github.com) and sign in.
2. Click the **+** (top right) → **New repository**.
3. Name it (e.g. `pallet-capture`), leave other options default, click **Create repository**.
4. In your `camcapprod` folder, run in a terminal:

```bash
cd C:\Users\tearp\OneDrive\Desktop\camcapprod
git init
git add .
git status
git commit -m "Pallet ticket capture app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

(.gitignore will exclude credentials.json and local data – do not commit those.)

Replace `YOUR_USERNAME` and `YOUR_REPO_NAME` with your GitHub username and repo name.

---

## Step 2: Sign up on Render

1. Go to **[render.com](https://render.com)**.
2. Click **Get Started**.
3. Choose **Sign up with GitHub** and authorize Render.

---

## Step 3: Create a Web Service

1. In the Render dashboard, click **New +**.
2. Select **Web Service**.
3. In "Connect a repository", find your repo and click **Connect**.

---

## Step 4: Configure the service

| Field | Value |
|-------|--------|
| **Name** | `pallet-ticket-capture` (or any name) |
| **Region** | Oregon (US West) or nearest |
| **Root Directory** | Leave blank |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements_web.txt` |
| **Start Command** | `gunicorn --bind 0.0.0.0:$PORT web_app:app` |

---

## Step 5: Environment variables

1. Expand **Advanced**.
2. Click **Add Environment Variable** and add:

| Key | Value |
|-----|-------|
| `OCR_PROVIDER` | `ocrspace` |
| `GOOGLE_SHEET_ID` | Your Google Sheet ID (see below) |

**Getting the Sheet ID:**
- Open your Google Sheet.
- The URL is: `https://docs.google.com/spreadsheets/d/XXXXXXXXXX/edit`
- The part between `/d/` and `/edit` is your Sheet ID.

---

## Step 6: Google Sheets credentials

**Option A – Environment variable (simplest)**

1. Open your Google service account JSON file (`credentials.json`).
2. Copy the entire JSON (from `{` to `}`).
3. In Render, add another environment variable:
   - **Key:** `GOOGLE_CREDENTIALS_JSON`
   - **Value:** Paste the full JSON content (as one line or multi-line).

**Option B – Secret file**

1. In Render, go to **Environment** → **Secret Files**.
2. Filename: `credentials.json`
3. Contents: Paste the full JSON from your `credentials.json` file.

---

## Step 7: Create the Web Service

1. Click **Create Web Service**.
2. Render will build and deploy (usually 2–5 minutes).
3. At the top of the page you’ll see a URL like:  
   `https://pallet-ticket-capture-xxxx.onrender.com`

---

## Step 8: Test the app

1. **First** try: `https://YOUR-APP.onrender.com/health` – should return `{"status":"ok"}`. Cold start can take 30-60 sec.
2. Then open the main Render URL in your browser.
3. Accept the camera permission prompt.
4. Point the camera at a pallet label and verify capture works.

---

## Notes

- Free tier: App may sleep after ~15 minutes of no traffic (first load can take ~30 seconds).
- Camera needs HTTPS: Render’s URL is HTTPS, so the camera should work in supported browsers.
- Without Google Sheets: The app will run and save records locally; Sheets features will not work until credentials are set.
