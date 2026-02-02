# 🚀 Quick Deploy Guide - SOP Tool Online

## Step-by-Step Deployment (Choose One Method)

---

## Option 1: GitHub Pages (RECOMMENDED - Free & Simple) ⭐

Since you have a GitHub account, this is the easiest option!

### Step 0: Install Git (If Needed)

**Check if Git is installed:**
- Open PowerShell and type: `git --version`
- If it says "not recognized", install Git:

**Install Git:**
1. Go to [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. Download and run the installer
3. Use default settings (just click "Next" through all steps)
4. Restart PowerShell after installation

**OR - Use GitHub Desktop (Easier, No Command Line!):**
1. Download GitHub Desktop: [https://desktop.github.com](https://desktop.github.com)
2. Install and sign in with your GitHub account
3. Skip to "Method B" below (much easier!)

---

### Method A: Using Command Line (Git Installed)

#### Step 1: Initialize Git Repository

1. **Open PowerShell in your project folder:**
   - Right-click the folder → "Open in Terminal" or "Open PowerShell here"
   - Or navigate: `cd "C:\Users\tearp\OneDrive\Desktop\sop tool"`

2. **Initialize git:**
   ```bash
   git init
   ```

3. **Add all files:**
   ```bash
   git add .
   ```

4. **Make first commit:**
   ```bash
   git commit -m "Initial commit - SOP Tool"
   ```

#### Step 2: Create GitHub Repository

1. **Go to GitHub.com** and log in with `recorpproduction@gmail.com`

2. **Click the "+" icon** (top right) → **"New repository"**

3. **Repository settings:**
   - **Name:** `sop-tool` (or any name you like)
   - **Description:** "Standard Operating Procedure Creation Tool"
   - **Visibility:** Public (required for free GitHub Pages)
   - **DO NOT** initialize with README (we already have files)

4. **Click "Create repository"**

### Step 3: Push Files to GitHub

After creating the repository, GitHub will show you commands. Run these in your terminal:

```bash
# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/sop-tool.git

# Rename branch to main (if needed)
git branch -M main

# Push files
git push -u origin main
```

**Note:** You'll be prompted for GitHub username and password (use a Personal Access Token if 2FA is enabled)

---

### Method B: Using GitHub Desktop (EASIER - No Commands!)

1. **Download GitHub Desktop:** [https://desktop.github.com](https://desktop.github.com)
2. **Install and sign in** with `recorpproduction@gmail.com`
3. **Create new repository:**
   - Click "File" → "New Repository"
   - Name: `sop-tool`
   - Local path: `C:\Users\tearp\OneDrive\Desktop\sop tool`
   - Click "Create Repository"
4. **Add all files:**
   - In GitHub Desktop, you'll see all your files
   - Write commit message: "Initial commit - SOP Tool"
   - Click "Commit to main"
5. **Publish to GitHub:**
   - Click "Publish repository" button
   - Name: `sop-tool`
   - Make it Public
   - Click "Publish repository"
6. **Done!** Your files are now on GitHub.

---

### Step 3: Enable GitHub Pages (Both Methods)

1. **Go to your repository on GitHub**

2. **Click "Settings" tab** (top of repository page)

3. **Scroll down to "Pages"** (left sidebar)

4. **Under "Source":**
   - Select **"Deploy from a branch"**
   - Branch: **`main`**
   - Folder: **`/ (root)`**
   - Click **"Save"**

5. **Wait 1-2 minutes**, then your site will be live at:
   ```
   https://YOUR_USERNAME.github.io/sop-tool/
   ```

### Step 4: Update Your Live Site

**If using GitHub Desktop:**
- Make changes
- Write commit message
- Click "Commit to main"
- Click "Push origin"

**If using command line:**

Whenever you make changes:

```bash
git add .
git commit -m "Description of changes"
git push
```

GitHub Pages will automatically update your site in 1-2 minutes!

---

## Option 2: Render (You Already Have Account) 🎨

### Step 1: Push to GitHub First

Follow Steps 1-3 from Option 1 to get your code on GitHub.

### Step 2: Deploy on Render

1. **Go to [render.com](https://render.com)** and log in

2. **Click "New +"** → **"Static Site"**

3. **Connect your repository:**
   - Click "Connect GitHub"
   - Authorize Render
   - Select your `sop-tool` repository

4. **Configure:**
   - **Name:** `sop-tool` (or your choice)
   - **Branch:** `main`
   - **Build Command:** (leave empty - no build needed)
   - **Publish Directory:** (leave empty - root is fine)

5. **Click "Create Static Site"**

6. **Wait for deployment** (1-2 minutes)

7. **Your site will be at:**
   ```
   https://sop-tool.onrender.com
   ```
   (or similar URL provided by Render)

---

## Option 3: Netlify (Also Free & Easy) 🌐

### Step 1: Push to GitHub

Follow Steps 1-3 from Option 1 first.

### Step 2: Deploy on Netlify

1. **Go to [netlify.com](https://netlify.com)** and sign up (free)

2. **Click "Add new site"** → **"Import an existing project"**

3. **Connect to GitHub:**
   - Click "Deploy with GitHub"
   - Authorize Netlify
   - Select your `sop-tool` repository

4. **Deploy settings:**
   - **Branch to deploy:** `main`
   - **Build command:** (leave empty)
   - **Publish directory:** (leave empty)

5. **Click "Deploy site"**

6. **Your site will be at:**
   ```
   https://random-name.netlify.app
   ```
   (you can change the name in site settings)

---

## Option 4: Vercel (Free & Fast) ⚡

### Step 1: Push to GitHub

Follow Steps 1-3 from Option 1 first.

### Step 2: Deploy on Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign up (free)

2. **Click "Add New..."** → **"Project"**

3. **Import from GitHub:**
   - Select your `sop-tool` repository
   - Click "Import"

4. **Deploy settings:**
   - Framework Preset: **"Other"**
   - Root Directory: **`./`**
   - Build Command: (leave empty)
   - Output Directory: (leave empty)

5. **Click "Deploy"**

6. **Your site will be at:**
   ```
   https://sop-tool.vercel.app
   ```

---

## 🔧 After Deployment - Configure EmailJS

Once your site is live:

1. **Go to your live site** (the URL you got from deployment)

2. **Click the "📧 Email" button** in the header

3. **Set up EmailJS:**
   - Go to [emailjs.com](https://emailjs.com) and sign up (free tier available)
   - Create an email service (Gmail works great)
   - Create an email template with these variables:
     - `{{to_email}}`
     - `{{sop_title}}`
     - `{{sop_id}}`
     - `{{pdf_content}}`
     - `{{message}}`
   - Copy your Service ID, Template ID, and Public Key

4. **Enter settings in the app:**
   - Service ID: (from EmailJS)
   - Template ID: (from EmailJS)
   - Public Key: (from EmailJS)
   - Holding Email: `recorpproduction@gmail.com`

5. **Click "Save Settings"** and test with "Test Email"

---

## 📱 Mobile Access

Your site is now accessible from:
- **Desktop browsers**
- **Mobile phones** (Safari, Chrome, etc.)
- **Tablets**

Users can add it to their home screen for app-like experience!

---

## ✅ Quick Checklist

- [ ] Code pushed to GitHub
- [ ] Site deployed (GitHub Pages / Render / Netlify / Vercel)
- [ ] Tested on desktop browser
- [ ] Tested on mobile phone
- [ ] EmailJS configured
- [ ] Test email sent successfully
- [ ] PDF generation tested
- [ ] Logo appears in PDFs

---

## 🆘 Need Help?

**Common Issues:**

1. **"Git not found"** - Install Git: [git-scm.com](https://git-scm.com)

2. **"Authentication failed"** - Use Personal Access Token instead of password:
   - GitHub → Settings → Developer settings → Personal access tokens → Generate

3. **"Site not updating"** - Wait 1-2 minutes, clear browser cache

4. **"Logo not showing"** - Should work fine online! Check browser console (F12) for errors

---

## 🎉 You're Done!

Your SOP Tool is now live and accessible from anywhere! Share the URL with your team.

**Recommended:** GitHub Pages is simplest since you already have GitHub account.

