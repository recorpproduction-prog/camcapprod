# 🔥 Firebase Setup Instructions - Shared Database

## Quick Setup Guide

Your SOP tool now has **shared database** with **login system**! All users can see, review, and retrieve all SOPs.

---

## Step 1: Create Firebase Project (5 minutes)

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Sign in** with your Google account (or create one)
3. **Click "Create a project"** button (big button in center, or top right)
4. **Enter project name:** `recorp-sop-tool` (or your choice)
5. **Click "Continue"**
6. **Google Analytics:** 
   - Toggle OFF (or leave ON if you want analytics)
   - Click "Continue"
7. **Click "Create Project"**
8. **Wait for setup** (30-60 seconds)
9. **Click "Continue"** when project is ready

---

## Step 2: Enable Authentication

1. **In Firebase Console, click "Authentication"** (left sidebar)
2. **Click "Get Started"**
3. **Click "Sign-in method" tab**
4. **Enable "Email/Password":**
   - Click "Email/Password"
   - Toggle "Enable" to **ON**
   - Click "Save"

---

## Step 3: Create Firestore Database

1. **Click "Firestore Database"** (left sidebar)
2. **Click "Create Database"**
3. **Start in production mode** (we'll add rules next)
4. **Choose location** (pick closest to your users, e.g., `us-central`)
5. **Click "Enable"**
6. **Wait for database creation** (30 seconds)

---

## Step 4: Set Security Rules

1. **In Firestore, click "Rules" tab**
2. **Replace the rules with this:**

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

3. **Click "Publish"**

---

## Step 5: Add Web App and Get Config

1. **In Firebase Console, click the gear icon** (⚙️) next to "Project Overview"
2. **Click "Project settings"**
3. **Scroll down to "Your apps" section**
4. **If you see apps already listed:**
   - Click the web icon (`</>`) to add a new web app
5. **If no apps shown:**
   - Look for "Add app" or web icon (`</>`)
   - Click it
6. **App nickname:** `SOP Tool Web` (or any name)
7. **Click "Register app"**
8. **You'll see your Firebase config** - it looks like:

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

---

## Step 6: Add Config to Your App

1. **Open `index.html`** in your code editor
2. **Find this section** (around line 637):

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    ...
};
```

3. **Replace with your actual config** from Step 5
4. **Save the file**

---

## Step 7: Deploy and Test

1. **Deploy your app** (GitHub Pages, Netlify, etc.)
2. **Visit your live site**
3. **You should see the login page**
4. **Click "Create Account"**
5. **Enter email and password** (min 6 characters)
6. **Enter your name**
7. **Click "Create Account"**
8. **You're in!** 🎉

---

## Creating User Accounts

### Option A: Let Users Register (Recommended)
- Users click "Create Account" on login page
- They create their own accounts
- Free and easy
- No admin work needed

### Option B: Admin Creates Users
1. Go to Firebase Console → Authentication
2. Click "Add user"
3. Enter email and password
4. Click "Add user"
5. Share credentials with user

---

## How It Works Now

✅ **Login Required** - Users must sign in to access
✅ **Shared Database** - All SOPs visible to all authenticated users
✅ **Real-time Updates** - Changes appear instantly for all users
✅ **Review Workflow** - User A creates, User B reviews - works perfectly!
✅ **Secure** - Only authenticated users can access

---

## Firebase Free Tier Limits

- ✅ **50,000 reads/day** - Plenty for SOP tool
- ✅ **20,000 writes/day** - More than enough
- ✅ **1 GB storage** - Lots of SOPs
- ✅ **Unlimited users** - Perfect for Recorp!

**You won't hit these limits with normal use!**

---

## Troubleshooting

### "Firebase not initialized"
- Check that you added your config to `index.html`
- Check browser console (F12) for errors
- Make sure Firebase project is created

### "Permission denied"
- Check Firestore security rules (Step 4)
- Make sure user is logged in
- Rules should allow `request.auth != null`

### "Email already in use"
- User already has account
- They should use "Sign In" instead

### Login page not showing
- Check browser console for errors
- Make sure `firebase-auth.js` is loaded
- Check that Firebase config is correct

---

## Next Steps

1. ✅ Set up Firebase (Steps 1-6)
2. ✅ Deploy your app
3. ✅ Create your first account
4. ✅ Test creating an SOP
5. ✅ Test review workflow with another user
6. ✅ Share login page URL with Recorp users

---

## Support

If you need help:
1. Check browser console (F12) for errors
2. Verify Firebase config is correct
3. Check Firestore rules are published
4. Make sure Authentication is enabled

**Your SOP tool is now ready for team use!** 🚀

