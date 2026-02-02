# 🔑 How to Create GitHub Personal Access Token

## Step-by-Step Instructions

### Step 1: Go to Token Settings

1. **Open your browser**
2. **Go to:** https://github.com/settings/tokens
3. **Sign in** if you're not already signed in

---

### Step 2: Generate New Token

1. **You'll see a page with "Personal access tokens"**
2. **Click "Tokens (classic)"** tab (if not already selected)
3. **Click the button:** **"Generate new token"**
4. **Click:** **"Generate new token (classic)"**
   - (Not "Generate new token (fine-grained)" - use classic)

---

### Step 3: Configure Token

1. **Note (name):** 
   - Type: `Recorp SOP Tool`
   - (This is just a label to remember what it's for)

2. **Expiration:**
   - Choose **"No expiration"** (or set a date far in the future)
   - For team use, "No expiration" is easiest

3. **Select scopes (permissions):**
   - Scroll down to find **"repo"**
   - ✅ **Check the box next to "repo"**
   - This gives full control of private repositories
   - You'll see it automatically checks sub-options like:
     - ✅ repo:status
     - ✅ repo_deployment
     - ✅ public_repo
     - ✅ repo:invite
     - ✅ security_events

---

### Step 4: Generate and Copy

1. **Scroll to the bottom**
2. **Click green button:** **"Generate token"**
3. **⚠️ IMPORTANT: Copy the token immediately!**
   - It will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - You'll see a green banner saying "Your new personal access token has been created"
   - **You can only see it ONCE** - if you leave the page, you can't see it again!

4. **Copy the entire token** (click the copy icon or select all and copy)

---

### Step 5: Save Token Safely

1. **Paste it somewhere safe** (like a text file or password manager)
2. **Don't share it publicly** - it gives access to your repositories
3. **You'll use this token in your app code**

---

## What the Token Looks Like:

```
ghp_1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ
```

- Starts with `ghp_`
- Followed by a long string of letters and numbers
- About 40-50 characters total

---

## Troubleshooting

### Can't find "Generate new token"?
- Make sure you're signed in to GitHub
- Check the URL is: https://github.com/settings/tokens
- Look for "Tokens (classic)" tab

### Token doesn't work?
- Make sure you checked the **"repo"** scope
- Make sure you copied the entire token (including `ghp_`)
- Check if token expired (if you set an expiration date)

### Lost the token?
- You can't recover it - you'll need to create a new one
- Go back to Step 1 and create a new token
- Revoke the old one if you want (click the token → Revoke)

---

## Next Steps:

Once you have your token:

1. **Create a repository** for SOPs (if you haven't already)
   - Name: `recorp-sops-data` (or your choice)
   - Make it Private

2. **Add token to your code:**
   - Open `index.html`
   - Find the config section
   - Paste your token there

3. **You're done!** 🎉

---

## Security Tips:

✅ **Keep token private** - don't share it publicly
✅ **Use "repo" scope only** - gives access to repositories
✅ **Revoke if compromised** - you can revoke anytime
✅ **Repository is private** - only you/your team can access

**That's it! You now have a GitHub token ready to use!**

