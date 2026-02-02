# Shared Database Setup - Firebase (Free)

## Overview

We'll use **Firebase** (Google's free platform) to provide:
- ✅ **Shared database** - All users see all SOPs
- ✅ **Login system** - Control access
- ✅ **Free tier** - Perfect for Recorp users
- ✅ **Real-time sync** - Updates instantly
- ✅ **Secure** - Google's infrastructure

---

## Step 1: Create Firebase Project

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Click "Add Project"**
3. **Project name:** `recorp-sop-tool` (or your choice)
4. **Disable Google Analytics** (optional, to keep it simple)
5. **Click "Create Project"**

---

## Step 2: Enable Authentication

1. **In Firebase Console, click "Authentication"** (left sidebar)
2. **Click "Get Started"**
3. **Click "Sign-in method" tab**
4. **Enable "Email/Password":**
   - Click "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

---

## Step 3: Create Firestore Database

1. **Click "Firestore Database"** (left sidebar)
2. **Click "Create Database"**
3. **Start in production mode** (we'll add rules)
4. **Choose location** (closest to your users)
5. **Click "Enable"**

---

## Step 4: Set Up Security Rules

1. **In Firestore, click "Rules" tab**
2. **Replace with these rules:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write
    match /sops/{sopId} {
      allow read, write: if request.auth != null;
    }
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. **Click "Publish"**

---

## Step 5: Get Firebase Config

1. **Click the gear icon** (⚙️) next to "Project Overview"
2. **Click "Project settings"**
3. **Scroll to "Your apps"**
4. **Click the web icon** (</>)
5. **App nickname:** `SOP Tool Web`
6. **Click "Register app"**
7. **Copy the config object** - looks like:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "recorp-sop-tool.firebaseapp.com",
  projectId: "recorp-sop-tool",
  storageBucket: "recorp-sop-tool.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**Save this - you'll need it!**

---

## Step 6: Add Firebase to Your App

The code will be updated to:
1. Add Firebase SDK
2. Add login page
3. Replace localStorage with Firestore
4. Make all SOPs shared

---

## Step 7: Create User Accounts

### Option A: Let Users Register
- Users click "Sign Up" on login page
- They create their own accounts
- Free and easy

### Option B: Admin Creates Users
- You create accounts in Firebase Console
- Share credentials with users
- More control

---

## Benefits:

✅ **Shared Database** - All SOPs visible to all users
✅ **Login System** - Control who can access
✅ **Free** - Firebase free tier is generous
✅ **Real-time** - Updates instantly across all devices
✅ **Secure** - Google's security
✅ **Scalable** - Handles hundreds of users

---

## Firebase Free Tier Limits:

- **50,000 reads/day** - Plenty for SOP tool
- **20,000 writes/day** - More than enough
- **1 GB storage** - Lots of SOPs
- **Unlimited users** - Perfect!

---

## Next Steps:

After setup, the app will:
1. Show login page first
2. Require email/password to access
3. Store all SOPs in shared Firestore
4. All users see all SOPs
5. Review workflow works across users

