# Step 5 – Create Service: Full Option-by-Option Guide

You are on the **Create Service** page and see many options. This guide tells you **exactly what to choose** at each part. Do the sections **in order**. If you don't see a section, skip it and go to the next.

---

## Before you start – have these ready

- Your **Folder ID** from Step 1 (the code from the Google Drive folder address).
- The **JSON file** from Step 3 (the service account key). Keep it open in Notepad so you can copy all of it.
- Your **GitHub repository** that contains the **sop-shared-backend** folder (see **GET-BACKEND-ON-GITHUB.md** if not done yet).

---

## Important: There is no file upload

**The Cloud Run console does not let you upload a ZIP or a file.** You must have your backend code in a **GitHub repository** first. If **sop-shared-backend** is not on GitHub yet, open the file **GET-BACKEND-ON-GITHUB.md** in this folder and follow it step by step. Come back here when your repo has a folder **sop-shared-backend** with **package.json** and **index.js** inside it.

---

## Section 1 – How to deploy (repository only – no upload)

Near the top of the Create Service page you'll see how to provide your code. You will see options like:

- **Continuously deploy from a repository**
- **Deploy one revision from an existing container image**

**Do not choose:** "Deploy one revision from an existing container image" (that's for pre-built Docker images).

**What to do – step by step:**

1. **Choose "Continuously deploy from a repository"**  
   Click that card or option so it is selected (it may get a blue border or checkmark).

2. **Connect your repository**  
   You'll see a button or link like **"Set up with Cloud Build"**, **"Connect repository"**, **"Connect"**, or **"Select repository"**. Click it.

3. **Connect GitHub (first time only)**  
   - If you see **"Connect new repository"** or a list of providers (**GitHub**, Bitbucket, GitLab, etc.), click **GitHub**.  
   - If it says **"You need to connect your GitHub account"** or **"Authorize Google Cloud"**, click **Connect** or **Authorize**. A new tab may open. Sign in to **GitHub** if asked. Click **Authorize** or **Install** so Google Cloud can see your repos. Then go back to the Cloud Run tab.  
   - If it asks **"Install Google Cloud Build"** on GitHub, choose **All repositories** or **Only select repositories** and pick the repo that has **sop-shared-backend**. Click **Install** or **Authorize**.

4. **Select the repository**  
   - You'll see a dropdown or list of repositories. Click it and choose the **repository** that contains the **sop-shared-backend** folder (e.g. your SOP app repo or a repo you created in GET-BACKEND-ON-GITHUB).  
   - If your repo does not appear, make sure you connected GitHub in step 3 and that the repo exists under the account you connected.

5. **Branch**  
   - You'll see **Branch** (e.g. **main** or **master**). Choose **main** (or whatever branch has your **sop-shared-backend** folder). Usually **main**.

6. **Directory / Root directory / Source path (important)**  
   - Scroll or look for **"Directory"**, **"Root directory"**, **"Source path"**, **"Build context"**, or **"Monorepo"**.  
   - This tells Cloud Run **which folder** in the repo to build. You must point it to the backend folder only.  
   - In that box, type exactly: **sop-shared-backend**  
   (no slash at the start or end, no path – just **sop-shared-backend**).  
   - If you leave it blank, Cloud Run may try to build the whole repo and fail; typing **sop-shared-backend** fixes that.

7. **Build configuration**  
   - If you see **"Build configuration"**, **"Dockerfile"**, or **"Build type"**, leave **Automatic** (or **Dockerfile** if Automatic is not there). Our backend has no Dockerfile; Google will detect Node.js and build it.  
   - If you see **"Cloud Build"** or **"Build"** settings, leave defaults. You don't need to change them.

8. You are done with Section 1 when the repo is connected, branch is **main**, and directory is **sop-shared-backend**.

---

## Section 2 – Service name

- You'll see a box like **Service name** or **Name**.
- **What to do:** Type: **sop-backend** (or leave the default if it says something like **sop-shared-backend**).  
- Use only letters, numbers, and hyphens. **No spaces.**

---

## Section 3 – Region

- You'll see a **Region** dropdown (e.g. **us-central1**, **europe-west1**).
- **What to do:** Leave the default (e.g. **us-central1**) or pick one close to you.  
- You don't need to change this.

---

## Section 4 – Authentication (very important)

- Look for **Authentication** or **Who can invoke this service** or **Allow unauthenticated invocations**.
- **What to do:**  
  - Select **Allow unauthenticated invocations** (or **Allow all users** or **Public**).  
  - This lets your app and staff call the backend without logging in.
- **Do not** leave it as "Require authentication" only, or the app won't be able to reach it.

---

## Section 5 – CPU, memory, timeout (optional)

- You may see **CPU**, **Memory**, **Request timeout**, **Minimum instances**, **Maximum instances**.
- **What to do:** Leave everything as **default**. You don't need to change these for the SOP backend.

---

## Section 6 – Variables and secrets (required)

- Scroll down until you see **Variables and secrets**, **Environment variables**, or **Container, Variables & Secrets, Connections**.
- If it's collapsed, **click it to expand**.
- **What to do:** Add **two** environment variables.

**First variable:**

1. Click **+ ADD VARIABLE** or **Add variable**.
2. **Name:** type exactly: **SOP_FOLDER_ID**  
   (all capitals, underscore between SOP and FOLDER and between FOLDER and ID).
3. **Value:** paste your **Folder ID** from Step 1 (the long code from the Drive folder URL). No quotes, no spaces.

**Second variable:**

1. Click **+ ADD VARIABLE** again.
2. **Name:** type exactly: **GOOGLE_SERVICE_ACCOUNT_JSON**  
   (all capitals, underscores between words).
3. **Value:** Open the **JSON file** from Step 3. Press **Ctrl+A** (select all), then **Ctrl+C** (copy). Paste into the Value box. The **entire** file must be in that one box (one long line with `{ ... }` is correct). Do **not** put quotes around it in the box.

**Double-check:**

- Names are exactly **SOP_FOLDER_ID** and **GOOGLE_SERVICE_ACCOUNT_JSON**.
- Folder ID is only the folder code (from `drive.google.com/.../folders/THIS_PART`).
- JSON value is the **whole** key file (starts with `{"type":"service_account",...`).

---

## Section 7 – Connections, VPC, Security (optional)

- You may see **Connections**, **VPC**, **Security**, **Labels**, **Startup probe**, etc.
- **What to do:** Leave everything as **default**. Do **not** enable VPC or change security unless you know you need it.

---

## Section 8 – Deploy

- At the **bottom** of the page you'll see a blue button: **CREATE**, **DEPLOY**, or **Create service**.
- **What to do:** Click that button.
- Wait **2–5 minutes**. Do not close the page. You'll see a progress message or spinner.

---

## After deployment – get the URL

1. When it finishes, you'll see the page for your new **service** (e.g. sop-backend).
2. At the **top** of that page there is a **URL**, e.g.  
   **https://sop-backend-xxxxx-xx.a.run.app**
3. **Copy that URL** (click it or the copy icon).
4. Paste it into Notepad and write next to it: **Backend URL – for Step 6**.
5. **Do not add a slash** at the end. Use:  
   `https://your-service-xxxxx.run.app`  
   **Not:** `https://your-service-xxxxx.run.app/`

Then go to **Step 6** in DO-THIS-FIRST and put this URL in **index.html** (in the line with `SOP_SHARED_API_URL`).

---

## Quick checklist before you click Deploy

- [ ] Source: **Continuously deploy from a repository** (GitHub connected, directory **sop-shared-backend**).
- [ ] Service name: **sop-backend** (or default).
- [ ] Region: default is fine.
- [ ] Authentication: **Allow unauthenticated invocations**.
- [ ] Two environment variables: **SOP_FOLDER_ID** (Folder ID) and **GOOGLE_SERVICE_ACCOUNT_JSON** (full JSON file).
- [ ] Then click **CREATE** / **DEPLOY**.

If anything on the page doesn't match this (e.g. different labels), do the closest equivalent: set **Authentication** to allow public access and add the **two variables**; the rest can stay default.
