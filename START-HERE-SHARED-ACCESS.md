# What To Do First – Simple Steps (Shared Access So Staff Don’t Need API Keys)

Do these steps **in order**. You only do this **once**. After that, your staff just open the app—no API key, no “Connect to Google Drive.”

---

## STEP 1: Get your Google Drive folder for SOPs

1. Open **Google Drive** in your browser: [drive.google.com](https://drive.google.com).
2. Find the **folder** where you want to store SOPs (or create a new folder and name it “SOPs”).
3. **Click the folder** so it’s open.
4. Look at the **address bar** at the top. The URL will look like:
   - `https://drive.google.com/drive/folders/1ABC123xyz...`
5. **Copy the long code** after `folders/` (that’s your Folder ID).  
   Example: if the URL ends with `folders/1a2B3cD4e5F6g7H8i9J0`, your Folder ID is `1a2B3cD4e5F6g7H8i9J0`.
6. **Paste it somewhere safe** (e.g. a Notepad file) and label it “SOP Folder ID.”

---

## STEP 2: Turn on Google Drive for your project

1. Open **Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com).
2. At the top, click the **project name**. If you don’t have a project, click **New Project**, give it a name (e.g. “SOP App”), and click **Create**.
3. In the left menu, click **APIs & Services** → **Library**.
4. Search for **Google Drive API**, click it, then click **Enable**.

---

## STEP 3: Create a “robot” account (service account)

1. Still in Google Cloud Console.
2. Left menu: **APIs & Services** → **Credentials**.
3. Click **+ Create Credentials** → **Service account**.
4. **Service account name:** type something like `sop-backend`.
5. Click **Create and Continue**, then **Done**.
6. On the Credentials page, under **Service Accounts**, click the one you just made (e.g. `sop-backend`).
7. Open the **Keys** tab → **Add Key** → **Create new key** → choose **JSON** → **Create**.  
   A JSON file will download. **Keep this file safe and private** (don’t share it or put it on the internet).

---

## STEP 4: Let the “robot” use your SOPs folder

1. **Open the JSON file** you just downloaded (double-click it; it might open in Notepad or a browser).
2. Find the line that says **"client_email"**. It will look like:
   - `"client_email": "sop-backend@your-project.iam.gserviceaccount.com"`
3. **Copy that whole email** (the part in quotes after `client_email`).
4. Go back to **Google Drive** and open your **SOPs folder** (from Step 1).
5. **Right‑click the folder** → **Share**.
6. In “Add people,” **paste the robot email** you copied.
7. Set the permission to **Editor**.
8. Click **Send** (you can leave “Notify people” unchecked).

---

## STEP 5: Run the small backend on your computer (to test)

1. On your computer, open the folder where your SOP app files are (the one that has `sop-shared-backend` inside it).
2. Open the **sop-shared-backend** folder.
3. **Rename** the JSON file you downloaded in Step 3 to something simple, e.g. `key.json`, and **move it** into the **sop-shared-backend** folder.
4. Open **Notepad** (or any text editor). We will create a tiny file that sets your Folder ID.
   - Type exactly (replace with **your** Folder ID from Step 1):
     ```
     set SOP_FOLDER_ID=PASTE_YOUR_FOLDER_ID_HERE
     set GOOGLE_SERVICE_ACCOUNT_JSON=
     ```
   - For the second line, you need to put the **entire contents** of `key.json` on one line. So:
     - Open `key.json`, select all (Ctrl+A), copy (Ctrl+C).
     - In Notepad, after `GOOGLE_SERVICE_ACCOUNT_JSON=`, paste. Save the file as `set-env.bat` in the **sop-shared-backend** folder.
   - *(If that’s too hard, skip to Step 6 and use a hosting service that lets you paste the JSON in a box.)*
5. Open **Command Prompt** (search for “cmd” in the Windows search bar).
6. Type:
   - `cd ` and then the full path to your **sop-shared-backend** folder (e.g. `cd C:\Users\YourName\Desktop\sop tool\sop-shared-backend`) and press Enter.
   - `npm install` and press Enter. Wait until it finishes.
   - `node index.js` and press Enter.
7. If it says something like “listening on port 8080,” the backend is running.  
   Open a browser and go to: [http://localhost:8080/sops](http://localhost:8080/sops).  
   If you see `{"sops":{}}` or a list, it worked.

*(If Step 5 is too technical, you can skip it and go to Step 6—deploy the backend online instead.)*

---

## STEP 6: Put the backend on the internet (so staff can use it)

You need the backend to be on a **URL** (like `https://something.run.app`) so the app can talk to it. Two simple options:

**Option A – Google Cloud Run (recommended)**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → **Cloud Run**.
2. Click **Create Service**.
3. Choose **Deploy from source** (or upload the **sop-shared-backend** folder if that’s an option).
4. When it asks for **environment variables**, add:
   - **Name:** `SOP_FOLDER_ID`  
     **Value:** your Folder ID from Step 1.
   - **Name:** `GOOGLE_SERVICE_ACCOUNT_JSON`  
     **Value:** open your `key.json`, copy **everything** (Ctrl+A, Ctrl+C), and paste here.
5. Deploy. When it’s done, it will show a **URL** (e.g. `https://sop-shared-xxxxx.run.app`). **Copy that URL** and save it—you need it for Step 7.

**Option B – Get help**

If this is too much, ask someone who’s used to “deploying” or “hosting” to:
- Deploy the **sop-shared-backend** folder to **Google Cloud Run** (or any server that runs Node.js).
- Set the two environment variables: `SOP_FOLDER_ID` and `GOOGLE_SERVICE_ACCOUNT_JSON`.
- Give you the **URL** of the backend (e.g. `https://....run.app`).

---

## STEP 7: Tell the app where the backend is

1. Open your **SOP app** folder and find the file **index.html**.
2. Open **index.html** in Notepad (right‑click → Open with → Notepad).
3. Use **Ctrl+F** (Find) and search for: `SOP_SHARED_API_URL`
4. You’ll see a line like:
   - `window.SOP_SHARED_API_URL = '';`
5. **Replace** the empty quotes with your backend URL (from Step 6), in quotes. Example:
   - `window.SOP_SHARED_API_URL = 'https://sop-shared-xxxxx.run.app';`
6. **Save** the file (Ctrl+S).

---

## STEP 8: Put the app back online (if you host it on GitHub Pages)

1. If your app is on **GitHub** and you use **GitHub Pages** to show it:
   - Upload the **updated** files (the changed **index.html** and the **shared-sop-api.js** and **sop-shared-backend** if needed).
   - Push the changes so the website updates.
2. If you run the app from your own computer or another host, just make sure the updated **index.html** (and the rest of the app) is what people open.

---

## You’re done

- **You did:** Steps 1–8 once (folder, Drive API, service account, share folder, deploy backend, set URL in index.html).
- **Staff do:** Open the app link. They see SOPs and can view/edit. **No API key, no “Connect to Google Drive,” no OAuth.**

---

## If something doesn’t work

- **Step 1:** Make sure you copied the Folder ID from the **folder** URL, not the file URL.
- **Step 4:** The folder must be **shared** with the **client_email** from the JSON file (Editor).
- **Step 6:** The backend URL must be the one Cloud Run (or your host) gives you, starting with `https://`.
- **Step 7:** The URL in `index.html` must be in quotes and have no space or typo; no slash at the end.

If you tell me which step you’re on and what you see (e.g. an error message or a blank page), I can give you the next exact click or fix.
