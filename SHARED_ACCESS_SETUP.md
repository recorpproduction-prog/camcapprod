# Shared Access – No API Key or OAuth for Staff

**Goal:** Your 150 staff open the app and see/edit SOPs. **No one** enters an API key or connects Google Drive. You set things up once.

---

## How it works

1. **You** run a small backend (e.g. on Google Cloud Run) that has access to your SOPs folder via a **service account**.
2. **You** set the app’s `SOP_SHARED_API_URL` in `index.html` once to that backend URL.
3. **Staff** open the app → the app loads SOPs from your backend → they view and edit. No config, no OAuth.

Staff never see your Drive or any credentials. They only hit your backend, which you control.

---

## One-time setup (you only)

### Step 1: Deploy the backend

Use the backend in the **`sop-shared-backend`** folder. Full steps are in **`sop-shared-backend/README.md`**. Short version:

1. In Google Cloud: create a **service account**, download its JSON key, enable **Drive API**.
2. **Share your SOPs Drive folder** with the service account email (Editor).
3. Set env vars: **SOP_FOLDER_ID** = folder ID, **GOOGLE_SERVICE_ACCOUNT_JSON** = full JSON key.
4. Deploy to **Cloud Run** (or any Node host). You get a URL like `https://sop-shared-xxxxx.run.app`.

### Step 2: Point the app at the backend

In **index.html**, find:

```javascript
window.SOP_SHARED_API_URL = '';
```

Set it to your backend URL (no trailing slash):

```javascript
window.SOP_SHARED_API_URL = 'https://sop-shared-xxxxx.run.app';
```

Save and redeploy the app (e.g. push to GitHub Pages).

### Step 3: Done

- **You:** One-time backend + one line in `index.html`.
- **Staff:** Open the app URL on any device (phone, tablet, PC). SOPs load; they view and edit. No API key, no OAuth, no “Connect to Google Drive”.

---

## If you leave `SOP_SHARED_API_URL` empty

The app falls back to the old behaviour: each device must do **☁️ Drive → Connect to Google Drive** once (API key + OAuth). So:

- **Shared access (recommended):** Set `SOP_SHARED_API_URL` → staff get access with zero config.
- **Per-device Drive:** Leave it empty → each person connects Drive once on each device.

---

## Summary

| Who        | Shared access (backend)     | Per-device Drive        |
|-----------|-----------------------------|--------------------------|
| You       | Deploy backend once, set URL in app | Configure Drive in app once |
| 150 staff | Open app → done             | Each device: Connect once |

For 150 staff, shared access is the one that avoids “a fuck load of extra work”.
