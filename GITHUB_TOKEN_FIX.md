# Fix GitHub 401 Authentication Error

## Problem
You're getting: `401 Bad credentials` - This means your GitHub token is not authenticating properly.

## Solution

### Step 1: Check Your Token
Your token in `index.html` is:
```
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
```

### Step 2: Verify Token Permissions
Your token MUST have the `repo` scope to access repositories. 

**To check/fix:**
1. Go to: https://github.com/settings/tokens
2. Find your token (or create a new one)
3. Make sure it has **`repo`** scope checked
4. If it doesn't, create a new token with `repo` scope

### Step 3: Create New Token (if needed)
1. Go to: https://github.com/settings/tokens/new
2. Name: `SOP Tool Access`
3. Expiration: Choose your preference
4. **Scopes:** Check **`repo`** (this gives full repository access)
5. Click "Generate token"
6. Copy the new token
7. Replace the token in `index.html` line 641

### Step 4: Verify Repository Exists
Make sure the repository exists:
- Owner: `recorpproduction-prog`
- Repository: `recorp-sops-data`
- URL: https://github.com/recorpproduction-prog/recorp-sops-data

If it doesn't exist, create it on GitHub.

## After Fixing
1. Refresh the page
2. Check browser console (F12) - should see: `✅ GitHub Repository Storage initialized`
3. Buttons should work now
4. Try creating an SOP - it should save to GitHub

## Current Status
- ✅ App now works even if GitHub fails (buttons will work)
- ⚠️ GitHub authentication needs to be fixed for saving SOPs
- ✅ Better error messages will guide you

