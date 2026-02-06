# Google Sheets Setup – Step-by-Step

This lets your Pallet Ticket Capture app read and write to a Google Sheet.

---

## Step 1: Create a Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com)
2. Click **Blank** to create a new spreadsheet
3. Name it (e.g. "Pallet Tickets")
4. **Copy the Sheet ID from the URL:**
   - URL looks like: `https://docs.google.com/spreadsheets/d/1ABC123xyz456EDIT789/view`
   - The part between `/d/` and `/edit` (or `/view`) is your Sheet ID
   - Example: `1ABC123xyz456EDIT789`
5. Save this – you’ll need it for `GOOGLE_SHEET_ID`

---

## Step 2: Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Sign in with your Google account
3. At the top, open the project dropdown (says "Select a project" or a project name)
4. Click **New Project**
5. Name it (e.g. "Pallet Capture")
6. Click **Create**
7. Wait for the project to be created, then select it

---

## Step 3: Enable APIs

1. In the left menu: **APIs & Services** → **Library**
2. Search for **Google Sheets API**
3. Open it and click **Enable**
4. Go back to **Library**
5. Search for **Google Drive API**
6. Open it and click **Enable**

---

## Step 4: Create a Service Account

1. In the left menu: **APIs & Services** → **Credentials**
2. Click **+ Create Credentials**
3. Select **Service account**
4. **Service account name:** e.g. `pallet-capture`
5. **Service account ID:** leave default
6. Click **Create and Continue**
7. Step 2 (Optional): Skip – click **Continue**
8. Step 3 (Optional): Skip – click **Done**

---

## Step 5: Download the JSON key

1. On the **Credentials** page, find your new service account under **Service Accounts**
2. Click the service account email (e.g. `pallet-capture@project-id.iam.gserviceaccount.com`)
3. Open the **Keys** tab
4. Click **Add Key** → **Create new key**
5. Choose **JSON**
6. Click **Create**
7. A JSON file downloads – this is your **credentials file**
8. Rename it to `credentials.json` and keep it safe
9. Do **not** share this file or commit it to GitHub

---

## Step 6: Share the Google Sheet with the Service Account

1. Open your Google Sheet
2. Click **Share**
3. In "Add people and groups", paste the **service account email** from the JSON file  
   - It’s under `"client_email": "something@project-id.iam.gserviceaccount.com"`
4. Set permission to **Editor**
5. Uncheck "Notify people" (service accounts don’t use email)
6. Click **Share**

---

## Step 6b: Drive folder for images (must use Shared Drive)

Images go to Google Drive in date-named folders (YYYY-MM-DD, 7am–7am day blocks).

**Important:** Service accounts hit a "no storage quota" error when using a normal "My Drive" folder. You must use a **Shared Drive**.

### Create a Shared Drive and folder

1. Go to [drive.google.com](https://drive.google.com)
2. Click **Shared drives** in the left sidebar (if you don’t see it, try the **+ New** menu)
3. Click **New** to create a Shared Drive
4. Name it (e.g. "Pallet Ticket Captures") and click **Create**
5. Open the Shared Drive → right‑click → **Add a shortcut to Drive** if you want it in "My Drive"
6. Open the Shared Drive, then click **Manage members** (person icon)
7. Add your **service account email** (from `credentials.json` → `"client_email"`) as **Content manager**
8. Copy the **Folder ID** from the URL when you’re inside the Shared Drive:  
   `https://drive.google.com/drive/folders/FOLDER_ID_HERE`
9. Add to your app:  
   `GOOGLE_DRIVE_ROOT_FOLDER_ID` = `FOLDER_ID_HERE`  
   (Render: Environment → add this variable)

Date subfolders (e.g. 2025-01-31) will be created inside this Shared Drive.

---

## Step 7: Use the credentials in your app

**For local use:**
1. Put `credentials.json` in your `camcapprod` folder (same folder as `web_app.py`)
2. Set the environment variable: `GOOGLE_SHEET_ID` = your Sheet ID

**For Render (deployed app):**
1. Open the JSON file in a text editor
2. Copy the entire contents (from `{` to `}`)
3. In Render: **Environment** → add variable:
   - Key: `GOOGLE_CREDENTIALS_JSON`
   - Value: paste the full JSON
4. Add: `GOOGLE_SHEET_ID` = your Sheet ID

---

## Quick reference

| What | Where to find it |
|------|------------------|
| Sheet ID | Sheet URL: `/d/SHEET_ID_HERE/` |
| Service account email | In `credentials.json` → `"client_email"` |
| Credentials JSON | Downloaded in Step 5 |

---

## Troubleshooting

**"Permission denied" or "403"**
- Confirm the Sheet is shared with the service account email as Editor

**"API not enabled"**
- Ensure both Google Sheets API and Google Drive API are enabled

**Credentials not found**
- Local: `credentials.json` must be in the same folder as `web_app.py`
- Render: Check `GOOGLE_CREDENTIALS_JSON` is set and contains valid JSON
