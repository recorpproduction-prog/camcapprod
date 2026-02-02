# Step 5 in Detail – Put the Backend on the Internet (Google Cloud Run)

This is the full, click-by-click version of **Step 5** from DO-THIS-FIRST. Do each part in order.

**If you are already on the Create Service page and see lots of options:** Use **STEP-5-CREATE-SERVICE-FULL.md** instead. It goes through every section on that page (source, name, region, authentication, variables, etc.) and tells you exactly what to choose and what to leave default.

---

## Part A – Open Cloud Run and start a new service

1. Open your browser and go to: **console.cloud.google.com**
2. At the **top of the page**, check the **project name** (next to "Google Cloud"). It must be the **same project** where you did Steps 2, 3, and 4 (e.g. "SOP App"). If it shows a different project, click it and switch to the right one.

3. **Easiest way – use the search box:**
   - At the **very top** of the page you will see a **search box** that says something like **"Search for products and resources"**.
   - Click in that box, type: **Cloud Run**
   - Press **Enter** (or click **Cloud Run** in the list that appears).
   - Click **Cloud Run** in the results. You should now be on the Cloud Run page.

4. **If you prefer the left menu instead:**
   - Click the **three horizontal lines** (☰) at the top left to open the menu.
   - In the menu, look for **Cloud Run**. It might appear as:
     - **Cloud Run** by itself, or
     - Under **Compute** (click **Compute**, then **Cloud Run**), or
     - Under **Serverless** (click the arrow next to **Serverless** to expand, then **Cloud Run**).
   - Click **Cloud Run**.

5. **Make sure you are on Services, not Jobs:**
   - On the Cloud Run page you may see **Services** and **Jobs** (tabs or links near the top).
   - You need **Services** (the one that has a **+ CREATE SERVICE** button).  
   - If you only see **"+ CREATE JOB"**, you are on the **Jobs** page. Click **Services** (or the **Services** tab) to switch. Then you should see **+ CREATE SERVICE**.

6. Click the blue button **+ CREATE SERVICE** (top of the page).

---

## Part B – Choose how to give Cloud Run your code

You will see a page that asks how you want to deploy. You have two main options.

### Option 1 – Upload a ZIP file (easiest if you have the folder on your computer)

1. Look for a option that says **"Deploy from source"**, **"Continuously deploy from a repository"**, or **"Deploy from a ZIP"** / **"Upload"**.  
   If you see **"Deploy from a ZIP"** or **"Upload"** or **"Deploy from source"** with an upload area, use that.

2. **Make a ZIP of the backend folder:**
   - On your computer, go to the folder where your SOP app lives (the one that contains **sop-shared-backend**).
   - Open the **sop-shared-backend** folder. Inside you should see **index.js** and **package.json**.
   - Go **back** one level so you see the **sop-shared-backend** folder (do not open it).
   - **Right-click** the **sop-shared-backend** folder.
   - Click **Send to** → **Compressed (zipped) folder**.
   - A new file will appear, e.g. **sop-shared-backend.zip**. Remember where it is (e.g. Desktop or the same folder).

3. In Cloud Run, in the upload / source area:
   - Click **Upload** or **Browse** (or drag the ZIP file into the area).
   - Select **sop-shared-backend.zip** and open it.
   - Wait until it finishes uploading.

4. **Skip to Part C** (environment variables).

### Option 2 – Deploy from GitHub (if your app is already on GitHub)

1. If you see **"Continuously deploy from a repository"** or **"Deploy from source"** and it asks you to connect a **repository**:
   - Click **Set up with Cloud Build** or **Connect repository**.
   - Choose **GitHub** (or the place where your code is). You may need to sign in or allow Google Cloud to see your repos.
   - Select the **repository** that contains your SOP app (the one that has the **sop-shared-backend** folder inside it).
   - For **Branch** choose **main** (or whatever branch you use).
   - For **Build configuration** it may say "Dockerfile" or "Automatic". If it asks for a **directory** or **path**, type: **sop-shared-backend** (so it only builds that folder).

2. Then **go to Part C** to add the two variables. Often the variables are in a section called **"Variables and secrets"**, **"Environment variables"**, or **"Advanced settings"** – expand that before you click Deploy.

---

## Part C – Add the two environment variables (required)

Before you deploy, you **must** add two variables. If you do not, the backend will not work.

1. On the same Cloud Run page, scroll down until you see **"Variables and secrets"**, **"Environment variables"**, or **"Container, Variables & Secrets, Connections"**. Click to **expand** that section if it is collapsed.

2. Click **+ ADD VARIABLE** or **Add variable** (you will add two variables).

   **First variable:**
   - **Name:** type exactly: **SOP_FOLDER_ID**  
     (Copy this: SOP_FOLDER_ID – no spaces, all capitals, underscore between SOP and FOLDER and between FOLDER and ID.)
   - **Value:** paste your **Folder ID** from Step 1 of DO-THIS-FIRST (the long code you copied from the Google Drive folder address). No quotes, no spaces.

   **Second variable:**
   - **Name:** type exactly: **GOOGLE_SERVICE_ACCOUNT_JSON**  
     (Copy this: GOOGLE_SERVICE_ACCOUNT_JSON – no spaces, capitals, underscores between words.)
   - **Value:** open the **JSON file** you downloaded in Step 3 (the service account key). Press **Ctrl+A** (select all), then **Ctrl+C** (copy). Go back to the browser and **paste** into the Value box. The **entire** file must be in that one box – one long line of text with curly braces { } is correct. No quotes around it in the box.

3. Double-check:
   - Variable names are exactly **SOP_FOLDER_ID** and **GOOGLE_SERVICE_ACCOUNT_JSON**.
   - Folder ID is the code from the Drive **folder** URL (e.g. from drive.google.com/.../folders/**THIS_PART**).
   - The JSON value is the **whole** contents of the key file (starts with `{"type":"service_account",...`).

---

## Part D – Set the region and create the service

1. **Region:** You will see a **Region** dropdown. You can leave the default (e.g. us-central1) or pick one close to you. Same region for everything is fine.

2. **Service name:** There is often a **Service name** box. You can leave the default (e.g. sop-shared-backend) or type something like **sop-backend**. No spaces.

3. **Authentication:** If you see **"Authentication"** or **"Allow unauthenticated invocations"**:
   - Choose **Allow unauthenticated invocations** (or **Allow all users**) so that your app (and staff) can call the backend without logging in.  
   - If you only see "Require authentication", the app may not be able to reach it; if that is the only option, select it for now and we can adjust later.

4. Click the blue **CREATE** or **DEPLOY** button at the bottom of the page.

5. Wait. Deployment can take **2–5 minutes**. You will see a progress message or a spinning icon. Do not close the page.

---

## Part E – Copy the URL when it is done

1. When deployment **finishes**, you will see a page for your new **service** (e.g. "sop-shared-backend" or the name you chose).

2. At the **top** of that page there is a **URL**. It looks like:  
   **https://sop-shared-backend-xxxxx-xx.a.run.app**  
   or  
   **https://sop-backend-xxxxx-uc.a.run.app**  
   (The exact letters and numbers will be different.)

3. **Click that URL** or the copy icon next to it to copy it.

4. **Paste it into Notepad** and write next to it: **Backend URL – for Step 6**. Save the file. You will paste this same URL into **index.html** in Step 6 (between the quotes for SOP_SHARED_API_URL).

5. **Do not add a slash** at the end. Use:  
   **https://your-service-xxxxx.run.app**  
   Not:  
   **https://your-service-xxxxx.run.app/**

---

## If you get stuck

- **"I don’t see Upload or Deploy from ZIP"**  
  The Cloud Run screen sometimes changes. Look for **"Deploy from source"** or **"Build"** and see if there is a **"Source"** dropdown – sometimes you can choose **"Upload"** or **"ZIP"** there. If not, use **"Deploy from source"** and connect GitHub (Option 2 above), and set the directory to **sop-shared-backend**.

- **"Where do I add the variables?"**  
  Scroll down on the **same** page where you chose the source (ZIP or repo). Look for **"Variables and secrets"**, **"Environment variables"**, or **"Advanced settings"** and expand it. The two variables go there.

- **"Deploy failed"**  
  Check: (1) Variable names are exactly **SOP_FOLDER_ID** and **GOOGLE_SERVICE_ACCOUNT_JSON**. (2) The JSON value is the **entire** key file (starts with `{` and ends with `}`). (3) The ZIP or repo contains the **sop-shared-backend** folder with **index.js** and **package.json** inside it.

- **"I don’t see a URL at the top"**  
  After deploy, click the **service name** (e.g. sop-shared-backend) in the list. The URL is at the top of the service details page.

Once you have the URL saved, go to **Step 6** in DO-THIS-FIRST and put that URL in **index.html**.
