# SOPs not loading on other devices – checklist

Use this when SOPs load on your main PC but not on phones or other devices.

## 1. Upload these files to GitHub

- **index.html** (loads sop-config.js and has fallback URL)
- **sop-config.js** (new file – backend URL only)
- **shared-sop-api.js** (fallback URL when on GitHub Pages, CORS-friendly fetch)
- **app.js** (connection test fallback)
- **sop-shared-backend/index.js** (CORS set to `*` – see step 2)

## 2. Redeploy the backend on Cloud Run

The backend must be redeployed so the CORS change is live.

1. Push **sop-shared-backend/index.js** to GitHub (same repo).
2. In Google Cloud Console → Cloud Run → your **sop-backend** service.
3. Open the service → **EDIT & DEPLOY NEW REVISION** (or let it auto-deploy from the repo if connected).

Without this, other devices can still be blocked by CORS.

## 3. Open the live site on the other device

- Use the **exact** GitHub Pages URL, e.g.  
  `https://recorpproduction-prog.github.io/RECORPSOPTOOL/`
- Do **not** open a local file or a different URL.

## 4. Avoid cache on the other device

- **Option A:** Open the site in a **private/incognito** window.
- **Option B:** Clear the site’s cache/data for that browser, then reload.
- **Option C:** Add `?nocache=1` to the URL once, e.g.  
  `https://recorpproduction-prog.github.io/RECORPSOPTOOL/?nocache=1`

## 5. Check the red banner

- If you see **“Cannot reach SOP server”** (or similar) and **Retry**:
  - Backend is not reachable from that device/network (CORS, firewall, or network).
  - Confirm step 2 (backend redeployed) and try another network (e.g. Wi‑Fi vs mobile data).

## 6. Backend returns empty

- If there is **no** red banner but **no SOPs** either:
  - The backend is reachable but returning no SOPs.
  - In Cloud Run, check env vars: **SOP_FOLDER_ID** and **GOOGLE_SERVICE_ACCOUNT_JSON**.
  - In Google Drive, confirm the folder has `.json` SOP files and is shared with the service account email.

## Quick test: backend from the other device

On the other device’s browser, open:

`https://sop-backend-1065392834988.us-central1.run.app/sops`

- If you see JSON (e.g. `{"sops":{...}}`): backend is reachable; the app should be able to load SOPs once the checklist above is done.
- If the page fails to load or shows an error: the device/network cannot reach Cloud Run (firewall, carrier, or CORS before redeploy).
