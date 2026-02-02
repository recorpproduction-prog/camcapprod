# Do This First – Clear Steps (No Computer Jargon)

**What you get:** Staff open the app and see SOPs. No API key, no "Connect to Google Drive." You do this once.

**Do the steps in order. One at a time.**

---

## Step 1 – Get your folder address (Folder ID)

1. Open Google Drive in your browser: **drive.google.com**
2. Find or create the **folder** where SOPs will be stored. Click it so it opens.
3. Look at the **address bar** at the top of the browser (where the web address is).
4. The address will look like: **drive.google.com/drive/folders/1ABC123xyz...**
5. **Copy the long code** that comes after **folders/** (that is your Folder ID).
6. Paste it into Notepad and write next to it: "SOP Folder ID". Save the file. You will need it later.

---

## Step 2 – Turn on Google Drive for your project

1. Open **console.cloud.google.com** in your browser.
2. At the top, click the **project name**. If you have no project, click "New Project", type a name (e.g. SOP App), click Create.
3. Left menu: click **APIs & Services**, then **Library**.
4. In the search box type **Google Drive API**. Click it. Click **Enable**.

---

## Step 3 – Create a "robot" account and get a key file

1. Left menu: **APIs & Services** → **Credentials**.
2. Click **+ Create Credentials** → **Service account**.
3. Service account name: type **sop-backend**. Click **Create and Continue**, then **Done**.
4. On the list, click the service account you just created (sop-backend).
5. Click the **Keys** tab. Click **Add Key** → **Create new key** → choose **JSON** → **Create**.
6. A file will download. **Keep this file safe.** Do not share it. You will use it in Step 5.

---

## Step 4 – Let the robot use your SOPs folder

1. Open the JSON file you downloaded (double-click it). It opens in Notepad or the browser.
2. Find the line that says **"client_email"**. Copy the **email** that is in quotes (e.g. sop-backend@your-project.iam.gserviceaccount.com).
3. Go back to **Google Drive**. Open your **SOPs folder** (the one from Step 1).
4. **Right-click** the folder → **Share**.
5. In "Add people", **paste the email** you copied. Set permission to **Editor**.
6. Click **Send**.

---

## Step 5 – Put the backend on the internet (Cloud Run)

1. Go to **console.cloud.google.com**. Same project as before (check the name at the top).
2. **Easiest:** At the **top of the page** there is a **search box** (it says "Search for products and resources"). Type **Cloud Run** and press **Enter**. Click **Cloud Run** in the results.  
   **Or** open the **three-line menu** (☰) on the left, then look for **Cloud Run** (it may be under **Compute** or **Serverless**). Click **Cloud Run**.
3. **Important:** On the Cloud Run page you may see **Services** and **Jobs** (tabs or links). You need **Services**, not Jobs.  
   - If you see **"Create Job"** you are on the wrong tab. Click **Services** (or the **Services** tab) so the page shows **"+ CREATE SERVICE"**.
4. Click **+ CREATE SERVICE**.
5. **Where to get the code:** Cloud Run does **not** let you upload a file. You must use a **GitHub repository** that contains the **sop-shared-backend** folder.  
   - If **sop-shared-backend** is not on GitHub yet: open **GET-BACKEND-ON-GITHUB.md** in this folder and follow it (it shows how to put the backend on GitHub using "Create new file").  
   - Then in Cloud Run choose **Continuously deploy from a repository**, connect GitHub, pick that repo, and set **Directory** (or **Root directory**) to **sop-shared-backend**.  
   - For full step-by-step on every option on the Create Service page, use **STEP-5-CREATE-SERVICE-FULL.md**.
6. When it asks for **Variables** or **Environment variables**, add two:
   - **Name:** SOP_FOLDER_ID  
     **Value:** paste your Folder ID from Step 1.
   - **Name:** GOOGLE_SERVICE_ACCOUNT_JSON  
     **Value:** open the JSON file from Step 3, press Ctrl+A (select all), Ctrl+C (copy), then paste here.
7. Click **Deploy**. Wait until it finishes (a few minutes).
8. When it is done, you will see a **URL** at the top (e.g. https://sop-shared-xxxxx.run.app). **Copy that URL** and paste it into Notepad. Write next to it: "Backend URL". You need it for Step 6.

**If the Create Service page has too many options:** Open the file **STEP-5-CREATE-SERVICE-FULL.md** in this folder. It walks through every section (source, name, region, authentication, variables, etc.) and tells you exactly what to choose.

**If this is too hard:** Ask someone who knows "deploying" or "hosting" to deploy the **sop-shared-backend** folder to Google Cloud Run with the two variables (SOP_FOLDER_ID and GOOGLE_SERVICE_ACCOUNT_JSON) and to give you the **URL**.

---

## Step 6 – Tell the app where the backend is

1. Open the folder where your **SOP app** files are. Find the file **index.html**.
2. Right-click **index.html** → **Open with** → **Notepad**.
3. Press **Ctrl+F** (Find). Type: **SOP_SHARED_API_URL** and press Enter.
4. You will see a line like: **window.SOP_SHARED_API_URL = '';**
5. **Replace the two quotes ''** with your Backend URL **in quotes**.  
   Example: if your URL is https://sop-shared-xxxxx.run.app then change it to:  
   **window.SOP_SHARED_API_URL = 'https://sop-shared-xxxxx.run.app';**  
   (Use your real URL. No slash at the end. One quote before and after the URL.)
6. Press **Ctrl+S** to save. Close Notepad.

---

## Step 7 – Put the updated app online

1. If your app is on **GitHub** and you use GitHub Pages: upload the **updated index.html** (and any other changed files) and push so the site updates.
2. If you host the app somewhere else: upload the updated **index.html** there.

---

## Done

- **You:** Did Steps 1–7 once.
- **Staff:** Open the app link. They see SOPs. No API key, no "Connect to Google Drive."

---

## If something goes wrong

- **Step 1:** Folder ID is the code from the **folder** address in Drive, not a file.
- **Step 4:** You must **share the folder** with the **client_email** from the JSON file, as **Editor**.
- **Step 5:** Copy the URL exactly as Cloud Run shows it (starts with https://).
- **Step 6:** In index.html the URL must be in quotes and have **no slash at the end**.

If you are stuck, say which **step number** (1–7) you are on and what you see (e.g. error message or blank page). Then we can fix it step by step.
