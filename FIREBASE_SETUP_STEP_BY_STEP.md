# 🔥 Firebase Setup - Step-by-Step Visual Guide

## Complete Setup Instructions for Firebase Console

---

## STEP 1: Go to Firebase Console

1. Open your browser
2. Go to: **https://console.firebase.google.com/**
3. Sign in with your Google account (or create one if needed)

---

## STEP 2: Create a Project

1. **Look for one of these:**
   - Big button that says **"Create a project"** (center of page)
   - Or **"Add project"** button (top right)
   - Click it

2. **Enter Project Name:**
   - Type: `recorp-sop-tool` (or any name you like)
   - Click **"Continue"**

3. **Google Analytics (Optional):**
   - You'll see a toggle for Google Analytics
   - **Toggle it OFF** (or leave ON if you want)
   - Click **"Continue"**

4. **Create Project:**
   - Click **"Create project"** button
   - Wait 30-60 seconds for setup
   - When done, click **"Continue"**

---

## STEP 3: Enable Authentication

1. **In the left sidebar, click "Authentication"**
   - If you see "Get started", click it

2. **Click the "Sign-in method" tab** (at the top)

3. **Find "Email/Password" in the list:**
   - Click on it

4. **Enable Email/Password:**
   - Toggle the "Enable" switch to **ON**
   - Click **"Save"**

5. **Done!** Authentication is now enabled

---

## STEP 4: Create Firestore Database

1. **In the left sidebar, click "Firestore Database"**
   - If you see "Create database", click it

2. **Choose mode:**
   - Select **"Start in production mode"**
   - Click **"Next"**

3. **Choose location:**
   - Pick a location closest to your users
   - Example: `us-central` (United States)
   - Click **"Enable"**

4. **Wait 30-60 seconds** for database creation

5. **Database is ready!**

---

## STEP 5: Set Security Rules

1. **Still in Firestore Database:**
   - Click the **"Rules" tab** (at the top)

2. **You'll see default rules like:**
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```

3. **Replace ALL of it with this:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Only authenticated users can read/write SOPs
       match /sops/{sopId} {
         allow read, write: if request.auth != null;
       }
       // Users can read all user profiles, but only edit their own
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

4. **Click "Publish"** button

5. **Done!** Rules are now active

---

## STEP 6: Add Web App and Get Config

1. **Click the gear icon** (⚙️) in the top left
   - Next to "Project Overview"

2. **Click "Project settings"** from the dropdown

3. **Scroll down** to find **"Your apps"** section

4. **Look for web apps:**
   - You'll see icons: `</>` (web), `📱` (iOS), `🤖` (Android)
   - Click the **web icon** (`</>`)

5. **Register your app:**
   - **App nickname:** Type `SOP Tool Web` (or any name)
   - **Firebase Hosting:** Leave unchecked (we're not using it)
   - Click **"Register app"**

6. **Copy your config:**
   - You'll see a code block that looks like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyC...",
     authDomain: "recorp-sop-tool.firebaseapp.com",
     projectId: "recorp-sop-tool",
     storageBucket: "recorp-sop-tool.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123def456"
   };
   ```

7. **Copy this entire config object**
   - Click the copy icon or select all and copy

---

## STEP 7: Add Config to Your App

1. **Open `index.html`** in your code editor

2. **Find this section** (around line 637-645):
   ```javascript
   const firebaseConfig = {
       apiKey: "YOUR_API_KEY_HERE",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID"
   };
   ```

3. **Replace it with your actual config** from Step 6
   - Paste your copied config
   - Make sure all the values are correct

4. **Save the file**

---

## STEP 8: Test It!

1. **Open your app** (locally or deployed)

2. **You should see a login page**

3. **Click "Create Account"**

4. **Fill in:**
   - Email: `test@recorp.com` (or your email)
   - Password: `test123` (min 6 characters)
   - Name: `Test User`

5. **Click "Create Account"**

6. **If successful, you'll see the main app!** 🎉

---

## Troubleshooting

### Can't find "Create a project"?
- Make sure you're signed in
- Try refreshing the page
- Look for "Add project" instead

### Can't find Authentication?
- Make sure you're in your project (check top left)
- Click the menu icon (☰) if sidebar is hidden
- Look for "Build" section in sidebar

### Can't find Firestore Database?
- It might be called "Firestore" or "Cloud Firestore"
- Look in the left sidebar under "Build" section
- If you don't see it, click "Get started" on the main page

### Can't find "Your apps" section?
- Make sure you clicked the gear icon (⚙️)
- Scroll down in Project settings
- It's below "Project ID" and "Project name"

### Config not working?
- Double-check you copied the entire config
- Make sure all quotes are correct
- Check browser console (F12) for errors

---

## What You Should Have Now:

✅ Firebase project created
✅ Authentication enabled (Email/Password)
✅ Firestore database created
✅ Security rules set
✅ Web app registered
✅ Config added to your code

**You're ready to go!** 🚀

---

## Next: Deploy Your App

1. Deploy to GitHub Pages, Netlify, or Vercel
2. Visit your live site
3. Create your first account
4. Start creating SOPs!

All SOPs will now be **shared** - all users can see and review them!

