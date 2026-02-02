# GitHub Repository Storage Fix Plan

## Current Problem
- 401 Unauthorized errors when trying to access GitHub repository
- Token authentication failing
- SOPs cannot be saved to GitHub

## Root Cause Analysis

The 401 error means one of these:
1. **Token doesn't have `repo` scope** (most likely)
2. **Token is invalid/expired**
3. **Repository doesn't exist or is private without access**
4. **Token format issue in the code**

## Fix Plan

### Step 1: Verify Token Has Correct Permissions

1. Go to: https://github.com/settings/tokens
2. Find your token OR create a new one:
   - Click "Generate new token (classic)"
   - Name: `SOP Tool Repository Access`
   - Expiration: Your choice
   - **CRITICAL: Check `repo` scope** (this gives full repository access)
   - Click "Generate token"
3. Copy the token immediately

### Step 2: Verify Repository Exists

1. Go to: https://github.com/recorpproduction-prog/recorp-sops-data
2. If it doesn't exist:
   - Click "New" repository
   - Name: `recorp-sops-data`
   - Make it **Private** (recommended) or Public
   - Click "Create repository"

### Step 3: Test Token Manually

Open browser console (F12) and run:
```javascript
const token = "YOUR_TOKEN_HERE";
fetch('https://api.github.com/repos/recorpproduction-prog/recorp-sops-data', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
    }
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

If this works, the token is good. If not, check token permissions.

### Step 4: Update Token in Code

1. Open `index.html`
2. Find line 641: `token: "github_pat_..."`
3. Replace with your new token
4. Save and refresh

## Alternative: Use LocalStorage Fallback

If GitHub continues to be problematic, we can:
1. Keep using localStorage for now
2. Add a manual "Export to GitHub" button
3. Or use a different cloud storage solution

## Next Steps

1. **Immediate**: Test the token manually (Step 3)
2. **If token works**: Update it in index.html
3. **If token doesn't work**: Create new token with `repo` scope
4. **If still failing**: We'll implement localStorage fallback or alternative solution



