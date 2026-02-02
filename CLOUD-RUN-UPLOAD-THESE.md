# Cloud Run – upload these 2 files to repo ROOT (real fix)

**Problem:** Build fails because of folders and missing files. This fix uses **only 2 files at the root** of your GitHub repo. No folders.

---

## Step 1 – On GitHub, put these 2 files at the ROOT

Go to **github.com/recorpproduction-prog/RECORPSOPTOOL** (main repo page – same level as index.html).

You must have these **2 files at the root** (not inside any folder):

1. **Dockerfile**  
   - From your PC: in your **sop tool** folder (same folder as index.html), the file **Dockerfile**.  
   - On GitHub: at the root, add or replace **Dockerfile** with this file.

2. **cloud-run-backend.js**  
   - From your PC: in your **sop tool** folder, the file **cloud-run-backend.js**.  
   - On GitHub: at the root, add or replace **cloud-run-backend.js** with this file.

**How to upload:**  
- **Add file** → **Upload files** → drag **Dockerfile** and **cloud-run-backend.js** from your sop tool folder.  
- Or open each file on GitHub → Edit → paste the contents from your PC → Commit.

---

## Step 2 – Cloud Run: build from repo root (no directory)

1. Go to **console.cloud.google.com** → **Cloud Run** → your service.
2. **Edit** the service (or **Edit & deploy new revision**).
3. Find **Build** / **Source** / **Directory** or **Root directory**.
4. **Clear it** – leave **Directory** / **Root directory** **blank** so the build uses the **repo root**.
5. Save. Then click **Deploy** (or deploy a new revision).

---

## Step 3 – Deploy

Click **Deploy**. The build will use the **root** Dockerfile and **cloud-run-backend.js** at root. No folders, no package.json in the repo – it will work.

---

**Summary:** At repo root you need **Dockerfile** and **cloud-run-backend.js**. Build must use repo root (no Directory set). Then deploy.
