# IMPORTANT: How to Run the SOP Tool

## ⚠️ Logo Issue with file:// Protocol

If you open the HTML file by double-clicking it (using `file://` protocol), the logo **will not appear** in PDFs due to browser CORS security restrictions.

## ✅ Solution: Use a Local Server

### Option 1: Use the Start Script (Easiest)

1. Double-click `start-server.bat` 
2. Wait for "Serving HTTP on 0.0.0.0 port 8000"
3. Open your browser and go to: **http://localhost:8000**
4. The logo will now work in PDFs!

### Option 2: Python (if installed)

1. Open a terminal in this folder
2. Run: `python -m http.server 8000`
3. Open: **http://localhost:8000**

### Option 3: Node.js (if installed)

1. Open a terminal in this folder
2. Run: `npx http-server -p 8000`
3. Open: **http://localhost:8000**

### Option 4: VS Code Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click `index.html`
3. Select "Open with Live Server"

## Why This is Needed

Browsers block `fetch()` and canvas operations when files are opened via `file://` protocol for security reasons. Using a local server (`http://localhost`) solves this.

---

**Note:** Once running via a server, the logo will appear in all generated PDFs!


