# OCR API Configuration Guide

The app now uses **online OCR APIs** by default - **no Tesseract installation required!**

## Default: OCR.space (FREE - No Setup Required)

✅ **25,000 requests/month FREE**  
✅ **No API key needed** (works out of the box)  
✅ **Good accuracy**  
✅ **No installation** - just works!

**This is the default and requires no configuration.**

---

## Alternative OCR Providers

### 1. Tesseract.space (FREE with Account)

**Setup:**
1. Sign up at: https://tesseract.space
2. Get your free API key
3. In app settings: Select "tesseractspace" provider
4. Enter your API key

**Limits:** Free tier available, check website for limits

---

### 2. Google Cloud Vision API (Paid with Free Tier)

**Free Tier:** 1,000 requests/month

**Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable "Cloud Vision API"
3. Create API key: **APIs & Services** > **Credentials** > **Create API Key**
4. In app settings: Select "google" provider
5. Enter your API key

**Note:** Requires billing account (but free tier is generous)

---

### 3. Local Tesseract (Optional - Not Recommended)

If you want to use local Tesseract instead:

1. Install Tesseract:
   - **Windows**: https://github.com/UB-Mannheim/tesseract/wiki
   - **Mac**: `brew install tesseract`
   - **Linux**: `sudo apt-get install tesseract-ocr`

2. Install Python package:
   ```bash
   pip install pytesseract
   ```

3. In app settings: Select "local" provider

**Not recommended** - online APIs are easier and work better!

---

## Recommended Setup

**Just use the default (OCR.space)** - it works immediately with no configuration!

- No API keys needed
- No account signup
- 25,000 free requests/month
- Good accuracy

Only configure alternatives if:
- You need more than 25k requests/month (upgrade OCR.space or use Google)
- You want the absolute best accuracy (Google Vision)
- You need offline capability (local Tesseract)

---

## Configuration in App

1. Start the app
2. Click **Settings**
3. Select **OCR Provider**:
   - `ocrspace` (default - FREE, no key)
   - `tesseractspace` (FREE with account)
   - `google` (requires API key)
   - `local` (requires Tesseract installation)
4. Enter **API Key** (only needed for tesseractspace/google)
5. Click **Save Config**

---

## Comparison

| Provider | Cost | Setup | Monthly Limit | Accuracy |
|----------|------|-------|---------------|----------|
| OCR.space | FREE | None | 25,000 | Good |
| Tesseract.space | FREE | Account | Varies | Good |
| Google Vision | FREE* | API Key | 1,000* | Excellent |
| Local Tesseract | FREE | Install | Unlimited | Good |

*Free tier, paid after

---

## Troubleshooting

### "OCR API request failed"

- Check internet connection
- Try a different provider
- Verify API key is correct (if using tesseractspace/google)

### "OCR.space API error"

- May have hit free tier limit (25k/month)
- Try using a different provider
- Wait until next month for limit reset

### Want better accuracy?

- Use Google Vision API (best accuracy)
- Ensure good image quality (lighting, focus)
- Use higher resolution images

---

## Summary

**Just run the app - OCR.space works by default with zero configuration!**

No installation, no API keys, no setup needed. 🎉


