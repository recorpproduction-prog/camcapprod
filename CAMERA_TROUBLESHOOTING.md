# Camera Troubleshooting Guide

## Common Camera Issues

### 1. Camera Access Denied

**Error:** "Camera access denied" or "NotAllowedError"

**Solutions:**
- Click the camera/lock icon in browser address bar
- Allow camera permissions
- Check browser settings:
  - Chrome: Settings > Privacy > Site Settings > Camera
  - Firefox: Preferences > Privacy & Security > Permissions > Camera
  - Safari: Preferences > Websites > Camera

### 2. HTTPS Required

**Error:** "Camera API not supported"

**Cause:** Camera access requires HTTPS (secure connection) or localhost

**Solutions:**
- **For local testing:** Use `http://localhost:5000` (localhost is allowed)
- **For production:** Deploy with HTTPS enabled
- All deployment platforms (PythonAnywhere, Render, Heroku) provide HTTPS automatically

### 3. No Camera Found

**Error:** "No camera found" or "NotFoundError"

**Solutions:**
- Check camera is connected (USB or built-in)
- Check camera is not being used by another app (Zoom, Teams, etc.)
- Close other applications using the camera
- Restart browser
- Try different browser (Chrome recommended)

### 4. Camera Already in Use

**Error:** "Camera is being used by another application"

**Solutions:**
- Close Zoom, Teams, Skype, or other video apps
- Close other browser tabs using camera
- Restart browser
- Restart computer if needed

### 5. Browser Not Supported

**Error:** "getUserMedia is not defined"

**Cause:** Old browser or browser without camera API

**Solutions:**
- Use modern browser:
  - Chrome 53+ (recommended)
  - Firefox 36+
  - Safari 11+
  - Edge 12+
- Update browser to latest version

### 6. Mobile Camera Issues

**Problems on phones/tablets:**

**Solutions:**
- Ensure HTTPS is enabled (required on mobile)
- Allow camera permissions in mobile browser
- Use Chrome or Safari (best support)
- Try landscape orientation
- Close other apps using camera

## Testing Camera Access

### Quick Test

1. **Check browser console** (F12) for errors
2. **Try test page:**
   ```html
   <!DOCTYPE html>
   <html>
   <body>
       <video id="video" autoplay></video>
       <script>
           navigator.mediaDevices.getUserMedia({video: true})
               .then(stream => {
                   document.getElementById('video').srcObject = stream;
                   console.log('Camera works!');
               })
               .catch(err => console.error('Camera error:', err));
       </script>
   </body>
   </html>
   ```

### Local Testing

If testing locally, use:
```
http://localhost:5000
```

NOT:
```
http://127.0.0.1:5000
```
(Some browsers don't allow camera on 127.0.0.1)

## Deployment Platforms & HTTPS

All recommended platforms provide HTTPS automatically:

- **PythonAnywhere:** Free tier includes HTTPS
- **Render:** All deployments use HTTPS
- **Heroku:** All apps use HTTPS
- **Google Cloud Run:** All services use HTTPS

## Browser-Specific Notes

### Chrome (Recommended)
- Best camera support
- Best error messages
- Works on all platforms

### Firefox
- Good camera support
- Slightly different permissions UI

### Safari
- Requires HTTPS (even on localhost for some versions)
- Good on Mac/iOS

### Edge
- Good camera support
- Similar to Chrome

## Still Not Working?

1. **Check browser console** (F12) for detailed errors
2. **Try different browser** (Chrome recommended)
3. **Test with simple HTML page** (see above)
4. **Check camera works in other apps** (like Zoom)
5. **Try on different device** to isolate issue
6. **Check deployment platform logs** for server errors

## Common Error Messages

| Error | Solution |
|-------|----------|
| `NotAllowedError` | Allow camera permissions |
| `NotFoundError` | Connect camera or close other apps |
| `NotReadableError` | Close other apps using camera |
| `OverconstrainedError` | Browser will try simpler constraints |
| `getUserMedia is not defined` | Update browser or use HTTPS |

## Need More Help?

1. Open browser console (F12)
2. Check for error messages
3. Try the test HTML page
4. Test on different browser/device
5. Check camera works in other applications


