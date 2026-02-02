# Step-by-Step: Upload SOP Tool to GitHub

## Prerequisites
- GitHub account (create at github.com if needed)
- All your files ready in the project folder

---

## Step 1: Create GitHub Repository

1. **Go to GitHub.com** and sign in
2. Click the **"+"** icon in top right → **"New repository"**
3. Fill in:
   - **Repository name**: `sop-tool` (or any name you prefer)
   - **Description**: "SOP Creation Tool - Standard Operating Procedure Management System"
   - **Visibility**: 
     - ✅ **Public** (for free GitHub Pages)
     - OR **Private** (if you have GitHub Pro/Team)
   - **DO NOT** check "Initialize with README" (we're uploading existing files)
4. Click **"Create repository"**

---

## Step 2: Prepare Your Files

Make sure you have these files in your project folder:

```
✅ index.html
✅ app.js
✅ styles.css
✅ github-storage.js
✅ Recorp_logo.png
✅ README.md (optional)
✅ DEPLOYMENT.md (optional)
✅ GITHUB_SETUP.md (optional)
```

**Location**: `C:\Users\tearp\OneDrive\Desktop\sop tool\`

---

## Step 3: Upload Files to GitHub

### Option A: Using GitHub Web Interface (Easiest - No Git Required)

1. **On the new repository page**, you'll see: "uploading an existing file"
2. Click **"uploading an existing file"**
3. **Drag and drop** all your files into the upload area:
   - Drag `index.html`
   - Drag `app.js`
   - Drag `styles.css`
   - Drag `github-storage.js`
   - Drag `Recorp_logo.png`
   - Drag any `.md` files you want
4. Scroll down and fill in:
   - **Commit message**: `Initial commit - SOP Tool`
5. Click **"Commit changes"**
6. **Wait for upload to complete** (usually 10-30 seconds)

✅ **Files are now on GitHub!**

---

### Option B: Using Git Command Line (If You Have Git Installed)

1. **Open PowerShell or Command Prompt**
2. **Navigate to your project folder**:
   ```powershell
   cd "C:\Users\tearp\OneDrive\Desktop\sop tool"
   ```

3. **Initialize Git** (if not already done):
   ```powershell
   git init
   ```

4. **Add all files**:
   ```powershell
   git add .
   ```

5. **Commit files**:
   ```powershell
   git commit -m "Initial commit - SOP Tool"
   ```

6. **Connect to GitHub** (replace YOUR_USERNAME with your GitHub username):
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/sop-tool.git
   ```

7. **Push to GitHub**:
   ```powershell
   git branch -M main
   git push -u origin main
   ```

8. **Enter your GitHub credentials** when prompted

✅ **Files are now on GitHub!**

---

## Step 4: Enable GitHub Pages

1. **In your GitHub repository**, click **"Settings"** (top menu)
2. Scroll down to **"Pages"** (left sidebar)
3. Under **"Source"**:
   - Select branch: **`main`** (or `master`)
   - Select folder: **`/ (root)`**
4. Click **"Save"**
5. **Wait 1-2 minutes** for GitHub to build your site
6. You'll see a message: **"Your site is live at..."**
   - URL will be: `https://YOUR_USERNAME.github.io/sop-tool/`

✅ **Your site is now live!**

---

## Step 5: Verify Everything Works

1. **Visit your site**: `https://YOUR_USERNAME.github.io/sop-tool/`
2. **Test the application**:
   - ✅ Page loads correctly
   - ✅ Can create new SOP
   - ✅ Can save SOP
   - ✅ Camera works (HTTPS enables it)
   - ✅ PDF generation works
   - ✅ GitHub sync button works

---

## Step 6: Share Your Site

Your SOP tool is now accessible at:
```
https://YOUR_USERNAME.github.io/sop-tool/
```

Share this URL with your team!

---

## Troubleshooting

### Files Not Showing?
- Make sure you committed the upload
- Refresh the repository page
- Check file names match exactly

### Site Not Loading?
- Wait 2-3 minutes after enabling Pages
- Check Settings → Pages shows "Your site is published"
- Try accessing the URL in incognito mode

### 404 Error?
- Verify branch is `main` (not `master`)
- Check folder is set to `/ (root)`
- Ensure `index.html` is in the root folder

### Camera Not Working?
- Verify you're on HTTPS (GitHub Pages provides this automatically)
- Check browser permissions
- Try different browser

---

## Next Steps

### Custom Domain (Optional)
1. Go to repository **Settings** → **Pages**
2. Add your custom domain
3. Configure DNS as instructed

### Update Your Site
- Edit files locally
- Upload new versions to GitHub
- Site updates automatically (may take 1-2 minutes)

### Enable GitHub Sync (For Users)
1. Users visit your site
2. Click **☁️ Sync** button
3. Follow `GITHUB_SETUP.md` instructions
4. Users can now backup SOPs to their GitHub

---

## Quick Reference

**Repository URL**: `https://github.com/YOUR_USERNAME/sop-tool`

**Live Site URL**: `https://YOUR_USERNAME.github.io/sop-tool/`

**Settings**: Repository → Settings → Pages

---

## Success Checklist

- [ ] Repository created
- [ ] All files uploaded
- [ ] GitHub Pages enabled
- [ ] Site is live
- [ ] Tested all features
- [ ] Shared URL with team

**You're done!** 🎉

