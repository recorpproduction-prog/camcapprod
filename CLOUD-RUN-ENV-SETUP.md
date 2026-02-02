# Cloud Run Environment Variables Setup

## ⚠️ IMPORTANT – Security First

**You shared your service account private key.** Anyone who saw it can impersonate your service account.

1. Go to [Google Cloud Console → IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=ocrproject-479301)
2. Click **soptool-474@ocrproject-479301.iam.gserviceaccount.com**
3. **Keys** tab → Find the key → **Delete** (or use the three dots menu)
4. **Add Key** → **Create new key** → **JSON** → **Create**
5. Download the new JSON file – **never share it in chat or public places**

Use the **new** JSON (from step 5) below, not the old one.

---

## Values for Cloud Run

| Variable | Value |
|----------|--------|
| **SOP_FOLDER_ID** | `15HssSe1Wc_7lsRiQEtLe9Tpv0yzDCmec` |
| **GOOGLE_SERVICE_ACCOUNT_JSON** | *(see below)* |

---

## GOOGLE_SERVICE_ACCOUNT_JSON

1. Open the **new** JSON key file from the download (after regenerating).
2. Copy the **entire** contents – from `{` to `}`.
3. Make it **one line**: remove all line breaks and extra spaces. It should look like:
   ```json
   {"type":"service_account","project_id":"ocrproject-479301","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"soptool-474@ocrproject-479301.iam.gserviceaccount.com",...}
   ```

---

## Where to set them in Cloud Run

1. Go to [Cloud Run](https://console.cloud.google.com/run)
2. Click your **sop-backend** service
3. Click **Edit** (or **Edit & deploy new revision**)
4. Expand **Variables & Secrets** (or **Container, Variables & Secrets**)
5. Under **Environment variables**, add:
   - **Name:** `SOP_FOLDER_ID`  
     **Value:** `15HssSe1Wc_7lsRiQEtLe9Tpv0yzDCmec`
   - **Name:** `GOOGLE_SERVICE_ACCOUNT_JSON`  
     **Value:** *(paste the full one-line JSON string)*
6. Click **Deploy** (or **Save**)

---

## Share the Drive folder

1. Go to [Google Drive](https://drive.google.com)
2. Open the folder with ID `15HssSe1Wc_7lsRiQEtLe9Tpv0yzDCmec` (or navigate to it)
3. Right‑click → **Share**
4. Add: `soptool-474@ocrproject-479301.iam.gserviceaccount.com`
5. Set permission to **Editor**
6. Click **Share**

---

## One-line JSON tip

In a text editor:
- Select all (Ctrl+A)
- Remove line breaks (find `\n` or newlines, replace with nothing)
- Ensure you end up with a single continuous line
- Keep the `\n` inside the `private_key` string (those must stay as `\n`)

Or use an online JSON minifier: paste the JSON, minify, then copy the result.
