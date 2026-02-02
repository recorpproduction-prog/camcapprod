# SOPs Not Saving to Google Drive – Fix Checklist

When you click **Save**, SOPs go to the **Cloud Run backend**, which writes them to a **Google Drive folder** using a **service account**. If nothing appears in Drive, check these steps.

---

## Step 1: Create a folder in Google Drive

1. Go to [drive.google.com](https://drive.google.com)
2. Create a new folder (e.g. **SOPs**)
3. Open the folder and copy the **Folder ID** from the URL:
   - URL example: `https://drive.google.com/drive/folders/1ABC123xyz456`
   - **Folder ID** = `1ABC123xyz456` (the part after `/folders/`)

---

## Step 2: Create a service account

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (same one used for Cloud Run)
3. **APIs & Services** → **Credentials** → **Create Credentials** → **Service Account**
4. Name it (e.g. `sop-backend`) → **Create and Continue** → **Done**
5. Click the new service account → **Keys** → **Add Key** → **Create new key** → **JSON** → **Create**
6. A JSON file downloads. Open it and copy the **whole contents** (you need this in Step 4)

---

## Step 3: Share the Drive folder with the service account

1. Open the JSON file from Step 2
2. Find `"client_email": "something@project.iam.gserviceaccount.com"`
3. Copy that email
4. In Google Drive, right‑click your SOPs folder → **Share**
5. Paste the service account email → **Editor** → **Share**

The backend can only save SOPs into folders shared with this email.

---

## Step 4: Set Cloud Run environment variables

1. Go to [Cloud Run](https://console.cloud.google.com/run) → your **sop-backend** service
2. **Edit** (or **Edit & deploy new revision**)
3. Expand **Variables & Secrets** (or **Container, Variables & Secrets**)
4. Add:

   | Name | Value |
   |------|--------|
   | `SOP_FOLDER_ID` | The folder ID from Step 1 |
   | `GOOGLE_SERVICE_ACCOUNT_JSON` | The full JSON from the downloaded file (entire contents as one string) |

5. For `GOOGLE_SERVICE_ACCOUNT_JSON`, paste the whole JSON, e.g.:
   ```json
   {"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com",...}
   ```

6. **Deploy** or **Save**

---

## Step 5: Test

1. Open the SOP tool on your PC
2. Create or open an SOP and click **Save**
3. If it fails, you should see a specific error message (e.g. “Access denied” or “Backend not configured”)
4. If it succeeds, open the Drive folder – the SOP file (`SOP-ID.json`) should be there

---

## Common errors

| Error | What to do |
|-------|------------|
| **Backend not configured** | Set `SOP_FOLDER_ID` and `GOOGLE_SERVICE_ACCOUNT_JSON` in Cloud Run |
| **Access denied** | Share the Drive folder with the service account email (Editor) |
| **404 / Not found** | Check `SOP_FOLDER_ID` is correct (from the folder URL) |
| **401 / Auth failed** | Check `GOOGLE_SERVICE_ACCOUNT_JSON` is valid and not truncated |

---

## Quick checklist

- [ ] Folder exists in Google Drive
- [ ] You have the correct Folder ID from the URL
- [ ] Service account created and JSON key downloaded
- [ ] Folder shared with the service account email (Editor)
- [ ] `SOP_FOLDER_ID` set in Cloud Run
- [ ] `GOOGLE_SERVICE_ACCOUNT_JSON` set in Cloud Run (full JSON)
- [ ] New revision deployed after changing variables
