# Fix: "Not a valid origin for the client" (Google Drive)

Your app is showing this error because **your site’s URL is not yet added** to your Google OAuth client’s **Authorized JavaScript origins**.

---

## Exact steps

1. **Open Google Cloud Console**  
   https://console.cloud.google.com/

2. **Select the correct project**  
   Use the project dropdown at the top. It must be the project where you created the **OAuth 2.0 Client ID** you use in the app (the one that matches your Client ID, e.g. `1065392834988-c05dha...`).

3. **Go to Credentials**  
   Left menu: **APIs & Services** → **Credentials**.

4. **Open your OAuth 2.0 Client ID**  
   Under **OAuth 2.0 Client IDs**, click the **name** of your **Web application** client (the one whose Client ID you pasted in the SOP tool).

5. **Add the JavaScript origin**  
   - Find the section **Authorized JavaScript origins**.
   - Click **+ ADD URI**.
   - Enter **exactly** (no trailing slash, no path):
   ```text
   https://recorpproduction-prog.github.io
   ```
   - Click **Save** at the bottom of the page.

6. **Wait a few minutes**  
   Changes can take 1–5 minutes to apply. Then try **Connect to Google Drive** again in the app.

---

## Checklist

- [ ] You are in the **same project** that owns the Client ID used in the app.
- [ ] You edited the **OAuth 2.0 Client ID** of type **Web application** (not “Desktop” or “API key”).
- [ ] The origin is **exactly** `https://recorpproduction-prog.github.io` (no `http://`, no `/RECORPSOPTOOL`, no trailing `/`).
- [ ] You clicked **Save** on the Credentials page.
- [ ] You waited a couple of minutes and refreshed the app before trying again.

---

## If you run the app locally

Add a **second** origin for local testing:

```text
http://localhost:5500
```

(Use the port your dev server uses, e.g. 5500, 8080, 3000.)

---

## Screenshot guide (where to click)

1. **APIs & Services** → **Credentials**
2. Under **OAuth 2.0 Client IDs**, click the **client name** (e.g. "Web client 1")
3. Under **Authorized JavaScript origins** → **+ ADD URI**
4. Paste: `https://recorpproduction-prog.github.io` → **Save**

After this, the "idpiframe_initialization_failed" / "Not a valid origin" error should go away once Google’s servers pick up the change.
