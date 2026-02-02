# Fix Cloud Run build – use this Dockerfile at repo ROOT

The build fails because it uses a Dockerfile that says `COPY package*.json ./` (no path).  
**There must be only ONE Dockerfile, at the ROOT of your repo**, with the content below.

---

## What to do

1. On GitHub, open **github.com/recorpproduction-prog/RECORPSOPTOOL**
2. **Delete** the Dockerfile inside **sop-shared-backend** (if it exists):  
   Open **sop-shared-backend** → click **Dockerfile** → **Delete file** → Commit.
3. At the **root** of the repo (same level as index.html), open **Dockerfile**.  
   If there is no Dockerfile at root, click **Add file** → **Create new file** → name: **Dockerfile**
4. **Replace the entire file** with this (copy everything below the line):

---
```
# Build from repo root – backend lives in sop-shared-backend/
FROM node:18-slim

WORKDIR /app

COPY sop-shared-backend/package.json ./
RUN npm install --production

COPY sop-shared-backend/index.js ./

EXPOSE 8080
CMD ["node", "index.js"]
```
---

5. Commit. Then in Cloud Run: **Edit & deploy new revision** → **Deploy**.

**Important:** In Cloud Run, if **Directory** or **Root directory** is set to `sop-shared-backend`, **clear it** (leave blank) so the build runs from the repo root and uses this Dockerfile.
