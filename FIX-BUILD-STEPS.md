# Fix Cloud Run build – do BOTH of these

The build fails at Step 3 because it uses a Dockerfile that says `COPY package*.json ./` and can't find that file. Fix it in one of these two ways.

---

## Fix A – Build from repo root (recommended)

**1. Upload these two files to the ROOT of your GitHub repo** (same level as index.html):

- **Dockerfile** (the one in your sop tool folder – it must have `COPY sop-shared-backend/package.json ./` in it)
- **cloudbuild.yaml** (the new file in your sop tool folder)

**2. Tell Cloud Build to use cloudbuild.yaml**

- Go to **Google Cloud Console** → **Cloud Build** → **Triggers**
- Find the trigger for **RECORPSOPTOOL** (or your Cloud Run service)
- Click it → **Edit**
- Under **Configuration**, change to **Cloud Build configuration file (yaml or json)**
- Set the path to **cloudbuild.yaml** (or **/cloudbuild.yaml**)
- Save

**3. Redeploy:** Cloud Run → your service → **Edit & deploy new revision** → **Deploy**

---

## Fix B – If the build uses the sop-shared-backend folder

If your Cloud Run service has **Directory** set to **sop-shared-backend**, the build uses the Dockerfile *inside* that folder. Then that folder **must** contain **package.json**.

**On GitHub:**

1. Open **github.com/recorpproduction-prog/RECORPSOPTOOL**
2. Open the **sop-shared-backend** folder
3. Check: do you see **package.json** there (next to index.js)?
4. If **package.json is missing**, add it:
   - Click **Add file** → **Create new file**
   - Name: **package.json**
   - Paste this exactly, then **Commit changes**:

```json
{
  "name": "sop-shared-backend",
  "version": "1.0.0",
  "description": "Backend so staff can view/edit SOPs without OAuth or API keys.",
  "main": "index.js",
  "engines": { "node": ">=18" },
  "dependencies": {
    "googleapis": "^128.0.0"
  }
}
```

5. Redeploy in Cloud Run.

---

Use **Fix A** if you can edit the trigger; use **Fix B** if **sop-shared-backend** on GitHub is missing **package.json**.
