# GitHub Storage Setup Guide

## Overview

The SOP tool now supports **GitHub Gists** for cloud storage! This allows you to:
- ✅ Backup SOPs to the cloud
- ✅ Sync across devices
- ✅ Access SOPs from anywhere
- ✅ Version history (GitHub tracks changes)

## How It Works

1. **LocalStorage** - SOPs save instantly to your browser (fast, always works)
2. **GitHub Gists** - Optional cloud sync (backup, cross-device access)

## Setup Instructions

### Step 1: Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `SOP Tool Sync`
4. Select scope: **`gist`** (check the box)
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Connect in SOP Tool

1. Open the SOP tool
2. Click the **☁️ Sync** button in the header
3. Paste your GitHub token
4. Click **"Save Token"**
5. Click **"Test Connection"** to verify

### Step 3: Start Syncing

- When you **Save SOP**, it will:
  1. Save to LocalStorage (instant)
  2. Sync to GitHub Gist (background)
- Your SOPs are now backed up to the cloud!

## Viewing Your SOPs on GitHub

1. Go to: https://gist.github.com
2. You'll see all your SOPs as private gists
3. Each SOP is stored as: `SOP-ID.json`
4. Click any gist to view/edit the JSON

## Benefits

### Cloud Backup
- Your SOPs are safe even if you clear browser data
- Can recover from any device

### Cross-Device Sync
- Create SOP on computer
- Access from tablet/phone
- All devices stay in sync

### Version History
- GitHub tracks all changes
- Can see edit history
- Can revert to previous versions

### Sharing (Optional)
- Can make gists public
- Share SOP links with team
- Collaborate on SOPs

## Security

- ✅ Tokens are stored in browser LocalStorage
- ✅ Gists are **private by default**
- ✅ Only you can access your gists
- ✅ Token only has `gist` scope (limited permissions)

## Troubleshooting

### "Invalid token" error
- Check token is correct
- Ensure `gist` scope is selected
- Token might be expired (create new one)

### "Connection failed"
- Check internet connection
- Verify token hasn't been revoked
- Try creating a new token

### SOPs not syncing
- Check sync status in settings
- Verify token is still valid
- Check browser console for errors

## Disconnecting

1. Click **☁️ Sync** button
2. Click **"Disconnect"**
3. LocalStorage still works (no cloud sync)

## File Structure on GitHub

Each SOP is stored as a Gist:
```
Gist Name: SOP: [SOP Title]
File: [SOP-ID].json
Content: Full SOP JSON data
```

Example:
- Gist: `SOP: Safety Procedure for Machine Operation`
- File: `PROD-2024-01-15-001.json`
- Private: Yes (by default)

## Next Steps

1. ✅ Create GitHub token
2. ✅ Connect in SOP tool
3. ✅ Save a test SOP
4. ✅ Verify it appears on gist.github.com
5. ✅ Enjoy cloud backup!

---

## Alternative: Manual Export/Import

If you don't want to use GitHub sync:
- Export JSON files manually
- Upload to GitHub repository
- Download when needed
- More manual but simpler setup

