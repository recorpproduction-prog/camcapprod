# Upload and go – no coding

**You:** Upload this whole folder to GitHub. Then deploy. That’s it.

---

## Step 1 – Upload to GitHub

1. Open **github.com/recorpproduction-prog/RECORPSOPTOOL**
2. Upload or replace files so the repo has **everything** from this folder, including:
   - **Dockerfile** (at the root, next to index.html)
   - **cloudbuild.yaml** (at the root)
   - **sop-shared-backend** folder with **package.json**, **index.js**, and **Dockerfile** inside it
   - All the rest (index.html, app.js, etc.)

You can drag the whole folder into GitHub, or use **Add file → Upload files** and select everything. If GitHub asks to replace existing files, say yes.

---

## Step 2 – Deploy in Cloud Run

1. Go to **console.cloud.google.com** → **Cloud Run**
2. Open your service (the one for this app)
3. Click **EDIT & DEPLOY NEW REVISION** (or **Deploy new revision**)
4. Click **Deploy**

Wait a few minutes. When it’s done, copy the **URL** and put it in **index.html** (the line with `SOP_SHARED_API_URL`) if you haven’t already.

---

Done. No coding, no editing files – just upload and deploy.
