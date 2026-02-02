# Pallet Ticket Capture System

An automated Google Apps Script Web App that captures pallet tickets using a phone/tablet camera, performs OCR, and submits records for supervisor review. **NO manual buttons required** - fully automatic detection and processing.

## Features

✅ **Automatic Camera Detection**
- Camera starts automatically on page load
- Frame sampling every 500-1000ms
- Detects tickets based on sharpness, text density, and frame analysis

✅ **Automatic OCR & Parsing**
- Google Vision API (preferred) or Drive OCR (fallback)
- Intelligent field parsing with confidence levels
- Supports multiple label variants

✅ **Supervisor Review Interface**
- Auto-refreshing table (every 5 seconds)
- Full image preview with editable parsed fields
- Approve/Reject workflow
- Confidence-based field coloring (Green/Amber/Red)

✅ **Google Sheets Integration**
- `PENDING_REVIEW` - New submissions
- `APPROVED_RECORDS` - Supervisor-approved entries
- `REJECTED_RECORDS` - Rejected with reasons

✅ **Security**
- Google Sign-In required
- Supervisor whitelist access control
- Role-based permissions

---

## Setup Instructions

### 1. Create Google Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **"New Project"**
3. Copy all files from this repository into the project:
   - `Code.gs`
   - `Index.html`
   - `Review.html`
   - `app.js` (create as HTML file, paste JS content inside `<script>` tags)
   - `review.js` (create as HTML file, paste JS content inside `<script>` tags)
   - `styles.css` (create as HTML file, paste CSS content inside `<style>` tags)

**Note:** In Google Apps Script, `.js` and `.css` files must be created as HTML files. The `include()` function in `Code.gs` will extract their content.

### 2. Create Google Sheet

1. Create a new Google Sheet
2. Copy the **Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```
3. Open `Code.gs` and replace `PASTE_SHEET_ID_HERE` with your Sheet ID:
   ```javascript
   const SHEET_ID = "your_sheet_id_here";
   ```

The system will automatically create three sheets:
- `PENDING_REVIEW`
- `APPROVED_RECORDS`
- `REJECTED_RECORDS`

### 3. Configure Supervisor Emails

In `Code.gs`, update the supervisor list:

```javascript
const SUPERVISORS = [
  "supervisor1@company.com",
  "supervisor2@company.com"
];
```

### 4. Set Up Google Drive Folder Structure

The system automatically creates:
```
Google Drive/
  └── Pallet_Tickets/
      └── YYYY/
          └── MM/
              └── pallet_timestamp_email.png
```

Ensure the Apps Script has permission to create folders in Drive.

### 5. Enable Required APIs

#### Option A: Google Vision API (Recommended for better OCR)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create or select a project
3. Enable **Cloud Vision API**
4. Create an API key:
   - Go to **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **API Key**
   - Copy the API key
5. Store the API key in Apps Script:
   - In Apps Script editor, go to **Project Settings** (gear icon)
   - Under **Script Properties**, click **Add script property**
   - Key: `VISION_API_KEY`
   - Value: `your_api_key_here`
6. In `Code.gs`, set `hasVisionAPI()` to return `true`:
   ```javascript
   function hasVisionAPI() {
     return true; // Set to true after enabling Vision API
   }
   ```

#### Option B: Drive OCR (Default Fallback)

Works automatically but requires:
- **Drive API** enabled in Apps Script (usually enabled by default)
- **Advanced Drive Service** enabled:
  - In Apps Script editor: **Extensions** > **Advanced Google services**
  - Enable **Drive API**

### 6. Deploy as Web App

1. In Apps Script editor, click **Deploy** > **New deployment**
2. Click the gear icon ⚙️ next to **Select type** > **Web app**
3. Configure:
   - **Description**: "Pallet Ticket Capture System"
   - **Execute as**: "Me" (your account)
   - **Who has access**: 
     - **Anyone** (for testing) or
     - **Anyone with Google account** (recommended)
4. Click **Deploy**
5. Copy the **Web App URL**
6. Click **Authorize access** and grant permissions:
   - Google Sheets (read/write)
   - Google Drive (read/write)
   - User info (email)

### 7. Test the System

1. **Operator Page**: Open the Web App URL
   - Camera should start automatically
   - Point at a pallet ticket
   - Wait for automatic detection and processing

2. **Supervisor Page**: Open `[WEB_APP_URL]?path=review`
   - Should show pending records
   - Auto-refreshes every 5 seconds

---

## Column Configuration

Edit the `COLUMNS` array in `Code.gs` to customize fields:

```javascript
const COLUMNS = [
  "timestamp",
  "status",
  "pallet_id",
  "product",
  "sku",
  "batch_lot",
  "quantity",
  "unit",
  "best_before",
  "manufacture_date",
  "line",
  "shift",
  "operator",
  "location",
  "notes",
  "image_drive_url",
  "raw_ocr_text",
  "reviewed_by",
  "reviewed_timestamp"
];
```

Sheets will auto-create with these headers.

---

## Detection Tuning

Adjust detection parameters in `app.js`:

```javascript
// Frame sampling interval (ms)
const FRAME_SAMPLE_INTERVAL = 800; // Default: 800ms

// Cooldown between submissions (ms)
const COOLDOWN_PERIOD = 30000; // Default: 30 seconds

// Minimum sharpness threshold
const SHARPNESS_THRESHOLD = 50; // Increase for stricter detection

// Minimum text density (0.0 - 1.0)
const TEXT_DENSITY_THRESHOLD = 0.1; // Increase to require more text
```

**To tune:**

1. **Too many false detections?**
   - Increase `SHARPNESS_THRESHOLD`
   - Increase `TEXT_DENSITY_THRESHOLD`
   - Increase `COOLDOWN_PERIOD`

2. **Missing tickets?**
   - Decrease `SHARPNESS_THRESHOLD`
   - Decrease `TEXT_DENSITY_THRESHOLD`
   - Decrease `FRAME_SAMPLE_INTERVAL`

---

## Parsing Rule Customization

Edit the `parsePalletTicket()` function in `Code.gs` to customize field parsing.

### Add New Fields

```javascript
parsed.your_field = parseField(normalized, 
  ['KEYWORD1', 'KEYWORD2', 'LABEL'], 
  confidence, 
  'your_field'
);
```

### Customize Keywords

Each field can have multiple keyword variants:

```javascript
parsed.pallet_id = parseField(normalized, 
  ['PALLET', 'PALLET ID', 'PAL ID', 'PALLET#', 'PALLET NO'], 
  confidence, 
  'pallet_id'
);
```

The parser searches for patterns like:
- `PALLET ID: ABC123`
- `PALLET : XYZ789`
- `PALLET# 456`

### Confidence Levels

- **High**: Exact keyword match with colon/separator
- **Medium**: Keyword found nearby
- **Low**: Field not found

Fields with medium/low confidence are highlighted in the supervisor review panel.

---

## URL Routes

- **Operator Capture**: `[WEB_APP_URL]` or `[WEB_APP_URL]?path=capture`
- **Supervisor Review**: `[WEB_APP_URL]?path=review`

---

## Troubleshooting

### Camera Not Starting

- **Check browser permissions**: Ensure camera access is allowed
- **HTTPS required**: Web App must be accessed via HTTPS (Google handles this)
- **Mobile devices**: Ensure using HTTPS and modern browser (Chrome, Safari)

### OCR Not Working

- **Vision API**: Verify API key is set in Script Properties
- **Drive OCR**: Ensure Drive API is enabled
- **Image quality**: Ensure good lighting and focus
- **Check logs**: View execution logs in Apps Script editor

### Permissions Errors

- **Sheets access**: Ensure Sheet ID is correct and Sheet is shared with script owner
- **Drive access**: Ensure Drive API is enabled
- **User access**: Re-authorize Web App if permissions changed

### Duplicate Submissions

- Increase `COOLDOWN_PERIOD` in `app.js`
- Check frame hash detection is working (see browser console)

### Supervisor Access Denied

- Verify email is in `SUPERVISORS` array in `Code.gs`
- Ensure user is signed in with correct Google account
- Check execution logs for authentication errors

---

## Architecture Notes

### File Structure in Google Apps Script

```
Code.gs          - Backend server functions
Index.html       - Operator capture page
Review.html      - Supervisor review page
app.js           - Operator page JavaScript (as HTML file)
review.js        - Supervisor page JavaScript (as HTML file)
styles.css       - Shared CSS (as HTML file)
```

### How Include Works

The `include()` function in `Code.gs` extracts content from HTML files:

```javascript
<?!= include('app.js'); ?>  // Inserts app.js content
<?!= include('styles.css'); ?>  // Inserts styles.css content
```

### Data Flow

1. **Operator Page** (`Index.html` + `app.js`)
   - Camera → Frame Analysis → Detection → Capture → Submit

2. **Backend** (`Code.gs`)
   - Save Image (Drive) → OCR → Parse → Write to `PENDING_REVIEW`

3. **Supervisor Page** (`Review.html` + `review.js`)
   - Auto-refresh → Display Pending → Review → Approve/Reject

4. **Approval Flow**
   - Approve → Write to `APPROVED_RECORDS` + Update status
   - Reject → Write to `REJECTED_RECORDS` + Add reason

---

## Security Considerations

1. **Supervisor Whitelist**: Only emails in `SUPERVISORS` array can approve/reject
2. **Google Sign-In**: Required for all operations
3. **Drive Sharing**: Images are set to "Anyone with link" for viewing - adjust if needed:
   ```javascript
   // In saveImageToDrive(), change:
   file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
   // To:
   file.setSharing(DriveApp.Access.DOMAIN, DriveApp.Permission.VIEW);
   ```
4. **Web App Access**: Set to "Anyone with Google account" for production

---

## Performance Optimization

- **Frame Sampling**: Adjust `FRAME_SAMPLE_INTERVAL` based on device performance
- **Image Resolution**: Camera resolution controlled in `app.js` constraints
- **OCR Caching**: Consider caching OCR results for duplicate images
- **Sheet Queries**: Supervisor page auto-refreshes every 5s - adjust as needed

---

## Support

For issues or questions:
1. Check execution logs in Apps Script editor
2. Check browser console for frontend errors
3. Verify all APIs are enabled
4. Ensure Sheet ID and supervisor emails are correct

---

## License

This system is provided as-is for internal use.


