# Deployment Guide - SOP Tool Online

This guide will help you deploy the SOP Tool online so it can be accessed from phones and other devices.

## Option 1: Netlify (Recommended - Free & Easy)

### Steps:
1. **Prepare your files:**
   - Ensure all files are in the project folder:
     - `index.html`
     - `app.js`
     - `styles.css`
     - `Recorp_logo.png`
     - `github-storage.js` (if using)

2. **Create Netlify account:**
   - Go to [https://www.netlify.com](https://www.netlify.com)
   - Sign up for a free account

3. **Deploy:**
   - Drag and drop your entire project folder onto Netlify's dashboard
   - Or connect to GitHub and deploy from there
   - Your site will be live in seconds!

4. **Custom domain (optional):**
   - Netlify provides a free subdomain (e.g., `your-site.netlify.app`)
   - You can add a custom domain in settings

## Option 2: GitHub Pages (Free)

### Steps:
1. **Create GitHub repository:**
   - Create a new repository on GitHub
   - Upload all your files

2. **Enable GitHub Pages:**
   - Go to repository Settings > Pages
   - Select main branch as source
   - Your site will be at: `https://username.github.io/repository-name`

3. **Update paths (if needed):**
   - GitHub Pages might require paths to be relative
   - Ensure all file references are relative (they already are)

## Option 3: Vercel (Free & Fast)

### Steps:
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up for free account
3. Import your project (GitHub or upload)
4. Deploy - done!

## Option 4: Firebase Hosting (Free)

### Steps:
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Deploy: `firebase deploy`

## Mobile Optimization

The app is already mobile-responsive, but you may want to:

1. **Add to Home Screen:**
   - Users can add the web app to their phone's home screen
   - Works like a native app

2. **PWA Features (Optional):**
   - Add a `manifest.json` for Progressive Web App features
   - Users can install it like an app

## Email Configuration

After deployment, configure email settings:

1. **Set up EmailJS:**
   - Sign up at [https://www.emailjs.com](https://www.emailjs.com) (free tier available)
   - Create an email service (Gmail, Outlook, etc.)
   - Create an email template with these variables:
     - `{{to_email}}`
     - `{{sop_title}}`
     - `{{sop_id}}`
     - `{{sop_department}}`
     - `{{sop_author}}`
     - `{{sop_reviewer}}`
     - `{{sop_version}}`
     - `{{pdf_content}}` (base64 PDF attachment)
     - `{{message}}`
   - Get your Service ID, Template ID, and Public Key

2. **Configure in the app:**
   - Click the "📧 Email" button in the header
   - Enter your EmailJS settings:
     - Service ID
     - Template ID
     - Public Key
     - Holding email address
   - Click "Save Settings"
   - Test with "Test Email" button

## EmailJS Template Example

When creating your EmailJS template, include:

```
Subject: Approved SOP: {{sop_title}} ({{sop_id}})

Approved SOP Details:
- Title: {{sop_title}}
- SOP ID: {{sop_id}}
- Department: {{sop_department}}
- Author: {{sop_author}}
- Reviewer: {{sop_reviewer}}
- Version: {{sop_version}}

{{message}}

[PDF Attachment will be included if EmailJS supports it]
```

Note: EmailJS free tier may have limitations on attachment size. For large PDFs, you may need to:
- Upgrade to a paid plan
- Use a different email service
- Store PDFs in cloud storage and email links instead

## Post-Deployment Checklist

- [ ] Test on mobile device
- [ ] Configure email settings
- [ ] Test PDF generation
- [ ] Test email sending
- [ ] Verify logo appears in PDFs
- [ ] Test all tabs and features
- [ ] Share URL with users

## Troubleshooting

**Logo not appearing in PDFs:**
- Ensure `Recorp_logo.png` is in the root directory
- Check browser console for CORS errors
- Logo should work fine when hosted online (not file://)

**Email not sending:**
- Verify EmailJS settings are correct
- Check browser console for errors
- Ensure email template has correct variable names
- Test email first before using in production

**Mobile issues:**
- Test on actual device, not just browser dev tools
- Check viewport meta tag (already included)
- Ensure touch targets are large enough

## Support

If you encounter issues:
1. Check browser console (F12) for errors
2. Verify all files are uploaded
3. Check file paths are correct
4. Test email configuration separately
