# Fix: "no such file or directory" for Dockerfile

**Error you saw:**  
`unable to evaluate symlinks in Dockerfile path: lstat /workspace/Dockerfile: no such file or directory`

**Cause:** Cloud Build was set to use a **Dockerfile** but the **sop-shared-backend** folder on GitHub did not have one.

**Fix:** A **Dockerfile** has been added to your **sop-shared-backend** folder on your computer. You need to put it on GitHub so Cloud Run can build again.

---

## What to do

1. **On your computer:** In the **sop-shared-backend** folder you should now see a file named **Dockerfile** (next to index.js and package.json).

2. **Add it to GitHub** (in the **sop-shared-backend** folder inside your repo):
   - Open your repo on GitHub: **github.com/recorpproduction-prog/RECORPSOPTOOL**
   - Go into the **sop-shared-backend** folder (click it).
   - Click **Add file** → **Create new file**.
   - In **"Name your file..."** type exactly: **Dockerfile**
   - Open the **Dockerfile** from your **sop-shared-backend** folder on your computer in Notepad. Press **Ctrl+A** then **Ctrl+C** to copy all. Paste into the big text box on GitHub.
   - Click **Commit changes**.

3. **Redeploy:**  
   - Go to **Cloud Run** in Google Cloud Console.  
   - Open your service (the one that failed).  
   - Click **EDIT & DEPLOY NEW REVISION** (or **Deploy new revision**).  
   - Click **Deploy** (you don’t need to change any settings). Cloud Build will run again and should find the Dockerfile in **sop-shared-backend**.

4. If the build still fails with the same error, check that in Cloud Run the **Directory** (or **Root directory**) for the build is set to **sop-shared-backend**. If it’s blank or wrong, set it to **sop-shared-backend** and deploy again.
