# Quick Deployment Guide

## Step-by-Step Google Apps Script Setup

### 1. Create Files in Apps Script

In the Google Apps Script editor, create these files:

#### `Code.gs` (Server-side code)
- Copy the entire content from `Code.gs`

#### `Index.html` (Operator page)
- Copy the entire content from `Index.html`

#### `Review.html` (Supervisor page)
- Copy the entire content from `Review.html`

#### `app.js` (Create as HTML file!)
- Click **File** > **New** > **HTML file**
- Name it `app.js`
- Copy ONLY the JavaScript content from `app.js` (without `<script>` tags)
- The raw JavaScript code goes here

#### `review.js` (Create as HTML file!)
- Click **File** > **New** > **HTML file**
- Name it `review.js`
- Copy ONLY the JavaScript content from `review.js` (without `<script>` tags)
- The raw JavaScript code goes here

#### `styles.css` (Create as HTML file!)
- Click **File** > **New** > **HTML file**
- Name it `styles.css`
- Copy ONLY the CSS content from `styles.css` (without `<style>` tags)
- The raw CSS code goes here

### 2. Important Notes

- **Google Apps Script doesn't support `.js` or `.css` files directly**
- You MUST create `app.js`, `review.js`, and `styles.css` as **HTML files**
- Put only the raw code content (no wrapper tags) in these HTML files
- The `<script>` and `<style>` wrapper tags are added automatically in `Index.html` and `Review.html`

### 3. Verify File Structure

Your Apps Script project should have:
```
📁 Project Name
  ├── Code.gs
  ├── Index.html
  ├── Review.html
  ├── app.js (HTML file)
  ├── review.js (HTML file)
  └── styles.css (HTML file)
```

### 4. Configure Sheet ID

1. Open `Code.gs`
2. Find: `const SHEET_ID = "PASTE_SHEET_ID_HERE";`
3. Replace with your Google Sheet ID from the URL

### 5. Configure Supervisors

1. Open `Code.gs`
2. Find: `const SUPERVISORS = ["supervisor@company.com"];`
3. Add supervisor email addresses

### 6. Deploy

1. Click **Deploy** > **New deployment**
2. Select type: **Web app**
3. Settings:
   - Execute as: **Me**
   - Who has access: **Anyone with Google account**
4. Click **Deploy**
5. Authorize permissions when prompted
6. Copy the Web App URL

### 7. Test

- Operator page: Open the Web App URL
- Supervisor page: `[WEB_APP_URL]?path=review`

---

## Troubleshooting File Includes

If JavaScript/CSS isn't loading:

1. **Check file names match exactly** (case-sensitive):
   - `Index.html` includes `app.js` → file must be named `app.js`
   - `Review.html` includes `review.js` → file must be named `review.js`
   - Both include `styles.css` → file must be named `styles.css`

2. **Verify files are HTML files** (not .gs files)

3. **Check content** - HTML files should contain raw JS/CSS only (no tags)

4. **Test include function** - Add to `Code.gs` temporarily:
   ```javascript
   function testInclude() {
     Logger.log(include('app.js').substring(0, 100));
   }
   ```


