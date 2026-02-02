# Put the Backend on GitHub First (No Upload in Cloud Run)

**Cloud Run does not let you upload a file.** You must have your code in a **repository** (GitHub). Do this **before** you go to Cloud Run Create Service.

---

## Option A – Your app is already on GitHub (sop-shared-backend is in the same repo)

If your SOP app folder is already on GitHub and **sop-shared-backend** is inside it (same repo as your app):

- You are done. Go to **STEP-5-CREATE-SERVICE-FULL.md** and use **Section 1 – Continuously deploy from a repository**.  
- When Cloud Run asks for **repository**, pick that repo.  
- When it asks for **Directory** or **Root directory**, type: **sop-shared-backend**.

---

## Option B – Your app is on GitHub but sop-shared-backend is not there yet

1. Open your **repository** on GitHub in the browser (e.g. **github.com/YourUsername/YourRepoName**).
2. **Create the first file (this also creates the folder):**
   - Click **Add file** → **Create new file**.
   - In the box that says **"Name your file..."** type exactly: **sop-shared-backend/package.json**  
     (the slash creates the folder **sop-shared-backend** and the file **package.json** inside it).
   - Open your **sop-shared-backend** folder on your computer, open **package.json** in Notepad, press **Ctrl+A** then **Ctrl+C** to copy all. Paste into the big text box on GitHub.
   - Scroll down and click **Commit changes** (green button).
3. **Create the second file:**
   - Click **Add file** → **Create new file** again.
   - In **"Name your file..."** type exactly: **sop-shared-backend/index.js**
   - Open **index.js** from your **sop-shared-backend** folder in Notepad, **Ctrl+A** then **Ctrl+C**, paste into the text box on GitHub.
   - Click **Commit changes**.
4. **Add the Dockerfile (required for Cloud Run build):**
   - Click **Add file** → **Create new file**. Name: **sop-shared-backend/Dockerfile**
   - Open the **Dockerfile** from your **sop-shared-backend** folder on your computer in Notepad, copy all, paste into GitHub. Click **Commit changes**.
5. Check: In your repo you should see a folder **sop-shared-backend** with **package.json**, **index.js**, and **Dockerfile** inside it.
6. Then go to **STEP-5-CREATE-SERVICE-FULL.md** and use **Continuously deploy from a repository** with this repo and directory **sop-shared-backend**.

---

## Option C – Nothing is on GitHub yet (create a repo and add the backend)

1. Go to **github.com** and sign in.
2. Click the **+** (top right) → **New repository**.
3. **Repository name:** type e.g. **sop-backend** (or **sop-tool** if you will put the whole app here later).
4. **Public**. Do **not** check "Add a README". Click **Create repository**.
5. On the empty repo page you’ll see "uploading an existing file" or "Add file" → **Upload files**.
6. You need the **sop-shared-backend** folder on GitHub with **package.json** and **index.js** inside it.
   - **Method 1 – Drag two files with a folder name:**  
     - On your computer, open the **sop-shared-backend** folder. You should see **package.json** and **index.js**.  
     - GitHub sometimes flattens drag-and-drop. So:
   - **Method 2 – Create folder and files (most reliable):**
     - Click **Add file** → **Create new file**.
     - In the file name box type: **sop-shared-backend/package.json** (this creates the folder **sop-shared-backend** and the file **package.json** inside it).
     - Open your local **sop-shared-backend/package.json** in Notepad, copy all (Ctrl+A, Ctrl+C), paste into the big text box on GitHub. Click **Commit changes**.
     - Click **Add file** → **Create new file** again.
     - Name: **sop-shared-backend/index.js**. Open your local **sop-shared-backend/index.js** in Notepad, copy all, paste into the text box. Click **Commit changes**.
     - Click **Add file** → **Create new file** again. Name: **sop-shared-backend/Dockerfile**. Open your local **sop-shared-backend/Dockerfile** in Notepad, copy all, paste. Click **Commit changes**.
7. In the repo you should now see a folder **sop-shared-backend** containing **package.json**, **index.js**, and **Dockerfile**.
8. Go to **STEP-5-CREATE-SERVICE-FULL.md**. In Section 1 choose **Continuously deploy from a repository**, connect this repo, and set **Directory** (or **Root directory**) to **sop-shared-backend**.

---

## Summary

- Cloud Run has **no upload**. You must use a **repository** (GitHub).
- Get **sop-shared-backend** (with **package.json**, **index.js**, and **Dockerfile** inside it) into a GitHub repo.
- Then in Cloud Run Create Service, choose **Continuously deploy from a repository**, pick that repo, and set directory to **sop-shared-backend**.
