# Complete GitHub Token Setup - Step by Step

## IMPORTANT: GitHub Has Two Token Types

GitHub now has **Fine-grained tokens** (new) and **Classic tokens** (old). We need a **CLASSIC token** with `repo` scope.

---

## Method 1: Classic Token (RECOMMENDED - EASIER)

### Step 1: Go to Token Settings
1. Go to: https://github.com/settings/tokens
2. You'll see a page with two sections:
   - **"Fine-grained tokens"** (at the top - DON'T USE THIS)
   - **"Personal access tokens"** (scroll down - USE THIS)

### Step 2: Create Classic Token
1. Scroll down past the "Fine-grained tokens" section
2. Look for **"Personal access tokens"** section
3. Click the dropdown that says **"Tokens (classic)"**
4. Click **"Generate new token"** → **"Generate new token (classic)"**

### Step 3: Configure Token
1. **Note:** Enter `SOP Tool Repository Access`
2. **Expiration:** Choose your preference (90 days, 1 year, or no expiration)
3. **Scopes:** Scroll down and find the **"repo"** section
4. **Check the box next to "repo"** - this selects ALL repo permissions:
   - ✅ repo (Full control of private repositories)
   - This automatically checks: repo:status, repo_deployment, public_repo, repo:invite, security_events

### Step 4: Generate and Copy
1. Scroll to bottom
2. Click **"Generate token"** (green button)
3. **COPY THE TOKEN IMMEDIATELY** - you won't see it again!
4. It will look like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 5: Update Your Code
1. Open `index.html`
2. Find line 641: `token: "github_pat_..."`
3. Replace with your new token: `token: "ghp_YOUR_NEW_TOKEN_HERE",`
4. Save the file
5. Refresh the page

---

## Method 2: Fine-Grained Token (If Classic Doesn't Work)

If you can't find "Tokens (classic)", use fine-grained:

### Step 1: Create Fine-Grained Token
1. Go to: https://github.com/settings/tokens/new?type=beta
2. Or go to: https://github.com/settings/tokens and click **"Generate new token"** → **"Generate new token (fine-grained)"**

### Step 2: Configure Token
1. **Token name:** `SOP Tool`
2. **Expiration:** Your choice
3. **Repository access:** Select **"All repositories"** OR select **"Only select repositories"** and choose `recorpproduction-prog/recorp-sops-data`

### Step 3: Set Permissions
1. Under **"Repository permissions"**, find **"Contents"**
2. Set **"Contents"** to **"Read and write"**
3. Set **"Metadata"** to **"Read-only"** (should be default)

### Step 4: Generate and Use
1. Click **"Generate token"**
2. Copy the token (starts with `github_pat_`)
3. Update `index.html` line 641 with this token

---

## Direct Link to Classic Token

**Direct link:** https://github.com/settings/tokens/new

**If this shows fine-grained tokens:**
1. Look for text that says **"Personal access tokens"** or **"Tokens (classic)"**
2. Click the dropdown/button to switch to classic tokens
3. Then click **"Generate new token (classic)"**

---

## Verify Token Works

1. Open `test-github-token.html` in your browser
2. Paste your token
3. Click "Test Token"
4. Should show: ✅ SUCCESS!

---

## Troubleshooting

**"I don't see 'repo' scope"**
- You're looking at fine-grained tokens
- Scroll down to find "Personal access tokens (classic)"
- OR use the direct link above

**"I only see fine-grained tokens"**
- Use Method 2 (fine-grained) above
- Set Contents to "Read and write"

**"Still getting 401 error"**
- Token might be expired
- Create a new token
- Make sure repository exists: https://github.com/recorpproduction-prog/recorp-sops-data

---

## Quick Test Command

After updating your token, open browser console (F12) and run:

```javascript
fetch('https://api.github.com/repos/recorpproduction-prog/recorp-sops-data', {
    headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Accept': 'application/vnd.github.v3+json'
    }
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

If you see repository info = SUCCESS!
If you see 401 = Token needs repo scope
If you see 404 = Repository doesn't exist



