# The JSON File Didn’t Download – What To Do

You need the **JSON key file** from your service account. Follow these steps exactly so it downloads.

---

## Step A – Open your service account

1. Go to **console.cloud.google.com**.
2. At the top, make sure the **correct project** is selected (the one where you created the service account).
3. In the **left menu** click **APIs & Services** → **Credentials**.
4. On the page, scroll down to the section called **Service accounts** (not "API keys" or "OAuth").
5. Under **Service accounts**, click the **email** of the service account you created (e.g. **sop-backend@your-project.iam.gserviceaccount.com**).  
   That opens the service account details page.

---

## Step B – Add a key and choose JSON

1. At the top of the service account page you’ll see tabs: **Details**, **Permissions**, **Keys**.
2. Click the **Keys** tab.
3. Click **ADD KEY** → **Create new key**.
4. A small window appears with two options: **JSON** and **P12**.
5. Select **JSON** (the dot next to it should be filled).
6. Click **Create**.

---

## Step C – Let the file download

- **If a file downloads:**  
  It will be named something like `your-project-12345-abcdef.json`. That’s your JSON file. Save it somewhere safe (e.g. Desktop or Documents). You’ll use it in Step 5 of DO-THIS-FIRST.

- **If nothing happens or you see “Blocked” or “Prevented”:**
  1. Check your **browser’s download bar** (often at the bottom of the window). Click **Keep** or **Allow** if it says the download was blocked.
  2. **Allow downloads** for Google: in Chrome go to **Settings** → **Privacy and security** → **Site settings** → **Downloads** – make sure Google isn’t blocked.
  3. Try again: **Keys** tab → **ADD KEY** → **Create new key** → **JSON** → **Create**.

- **If a new tab opens** instead of downloading:
  1. That tab might show raw JSON (lots of curly braces and text).
  2. Press **Ctrl+A** (select all), then **Ctrl+C** (copy).
  3. Open **Notepad**, press **Ctrl+V** (paste).
  4. Click **File** → **Save as**.
  5. **File name:** type `service-account-key.json` (or any name ending in `.json`).
  6. **Save as type:** choose **All Files (*.*)** so it really saves as .json.
  7. Save it (e.g. to your Desktop). That file is your JSON key.

---

## Step D – If you don’t see “Keys” or “ADD KEY”

- Make sure you clicked the **service account email** (under **Service accounts** on the Credentials page), not “Create credentials” or “API keys.”
- The **Keys** tab is only on the **service account’s own page**. If you’re on the main Credentials page, click the service account **email** first, then look for **Keys**.

---

## Quick checklist

- [ ] I’m in **APIs & Services** → **Credentials**.
- [ ] I scrolled to **Service accounts** and clicked the **email** of my service account.
- [ ] I’m on the **Keys** tab.
- [ ] I clicked **ADD KEY** → **Create new key** → **JSON** → **Create**.
- [ ] I allowed the download (or copied the JSON from a new tab into Notepad and saved as a .json file).

Once you have the JSON file (or the .json file you saved from Notepad), continue with **Step 4** in DO-THIS-FIRST.md (share the folder with the robot email from that file).
