# SOP (Standard Operating Procedure) Creation Tool

A production-ready, web-based application for creating, editing, saving, and exporting Standard Operating Procedures as professional PDFs.

## Features

- **Complete SOP Management**: Create, edit, save, and load SOPs
- **Structured Data Model**: All mandatory SOP sections included
- **Image Capture**: Browser camera API with file upload fallback
- **Multiple Images per Step**: Capture or upload multiple images for each step
- **PDF Export**: Professional PDF generation with embedded images
- **Local Storage**: Automatic saving and persistence across sessions
- **Modern UI**: Clean, responsive interface

## SOP Structure

Each SOP includes:

### Metadata
- SOP Title
- SOP ID / Reference Number
- Department / Area
- Version
- Author
- Reviewer
- Approval Status
- Effective Date
- Review Date

### Content Sections
- **Description**: Purpose and description
- **Safety**: Warnings, PPE requirements, safety notes
- **Tools & Materials**: Required tools and consumables
- **Step-by-Step Instructions**: Detailed steps with images

### Step Features
- Auto-incrementing step numbers
- Step title and detailed description
- Optional safety notes per step
- Multiple images per step
- Add step below current step functionality

## File Structure

```
sop-tool/
├── index.html          # Main HTML file
├── styles.css          # All styling
├── app.js              # Application logic
└── README.md           # This file
```

## How to Run Locally

### Option 1: Simple HTTP Server (Recommended)

1. **Using Python** (if installed):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

2. **Using Node.js** (if installed):
   ```bash
   npx http-server -p 8000
   ```

3. **Using PHP** (if installed):
   ```bash
   php -S localhost:8000
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

### Option 2: Direct File Opening

**Note**: Some features (like camera access) may require HTTPS or localhost. For full functionality, use a local server.

1. Simply open `index.html` in your web browser
2. Some browsers may block camera access when opening files directly

### Option 3: VS Code Live Server

If you use Visual Studio Code:

1. Install the "Live Server" extension
2. Right-click on `index.html`
3. Select "Open with Live Server"

## Browser Requirements

- **Modern browser** (Chrome, Firefox, Edge, Safari - latest versions)
- **Camera access** (for image capture feature)
- **JavaScript enabled**
- **LocalStorage support** (standard in all modern browsers)

## Usage Guide

### Creating a New SOP

1. Click **"New SOP"** to start fresh
2. Fill in all required metadata fields (marked with *)
3. Add description, safety information, tools, and materials
4. Click **"+ Add First Step"** to begin adding steps

### Adding Steps

1. Click **"+ Add Step Below"** button under any step
2. Enter step title and description
3. Add optional safety notes
4. Click **"+ Add Image"** to capture or upload images

### Capturing Images

1. Click **"+ Add Image"** on any step
2. Choose:
   - **Use Camera**: Access device camera (requires permission)
   - **Upload File**: Select image files from your computer
3. Preview and confirm selection

### Saving SOPs

1. Click **"Save SOP"** button
   - Automatically saves to browser LocalStorage
   - Also downloads a JSON backup file
2. SOPs are auto-saved as you type

### Loading SOPs

1. Click **"Load SOP"** button
2. Choose from saved SOPs in the list, or
3. Upload a JSON file from your computer

### Exporting to PDF

1. Ensure all required fields are filled
2. Add at least one step
3. Click **"Generate PDF"**
4. Wait for PDF generation (indicator will show)
5. PDF will download automatically

## Data Storage

The application uses **browser LocalStorage** for persistence:

- SOPs are automatically saved as you edit
- Data persists across browser sessions
- Each SOP is keyed by its SOP ID
- JSON files can be exported/imported for backup

### Storage Location

- **Browser**: LocalStorage (browser-specific)
- **Export**: JSON files saved to your Downloads folder
- **PDF**: Generated PDFs saved to your Downloads folder

## How to Deploy Online

### Option 1: GitHub Pages (Free)

1. Create a GitHub repository
2. Upload all files to the repository
3. Go to repository Settings → Pages
4. Select source branch (usually `main` or `master`)
5. Your site will be available at: `https://yourusername.github.io/repository-name`

**Note**: GitHub Pages serves over HTTPS, which is required for camera access.

### Option 2: Netlify (Free)

1. Create account at [netlify.com](https://netlify.com)
2. Drag and drop the project folder to Netlify dashboard, or
3. Connect your GitHub repository
4. Site will be automatically deployed with HTTPS

### Option 3: Vercel (Free)

1. Create account at [vercel.com](https://vercel.com)
2. Import your project (GitHub/GitLab/Bitbucket)
3. Deploy automatically with HTTPS

### Option 4: Traditional Web Hosting

1. Upload all files to your web server via FTP/SFTP
2. Ensure files are in the root directory or a subdirectory
3. Access via: `https://yourdomain.com` or `https://yourdomain.com/sop-tool`

### Option 5: AWS S3 + CloudFront

1. Create an S3 bucket
2. Enable static website hosting
3. Upload files to bucket
4. Configure CloudFront for HTTPS
5. Point your domain to CloudFront

## Important Notes for Deployment

### HTTPS Requirement

- **Camera access requires HTTPS** (or localhost)
- Ensure your hosting provider supports HTTPS
- Most modern hosting services provide free SSL certificates

### Browser Compatibility

- Tested on Chrome, Firefox, Edge, Safari
- Camera API may vary by browser
- File upload works on all browsers

### Performance

- PDF generation may take a few seconds for SOPs with many images
- Large images are automatically compressed
- LocalStorage has size limits (~5-10MB depending on browser)

## Troubleshooting

### Camera Not Working

- Ensure you're using HTTPS or localhost
- Check browser permissions for camera access
- Use file upload as fallback

### PDF Generation Fails

- Check browser console for errors
- Ensure all images are loaded
- Try with fewer images first

### Data Not Persisting

- Check browser LocalStorage is enabled
- Clear browser cache and try again
- Export JSON backup regularly

### Images Not Showing

- Check image file format (JPEG, PNG supported)
- Ensure images are not corrupted
- Try re-uploading images

## Technical Details

### Dependencies (CDN)

- **jsPDF 2.5.1**: PDF generation
- **html2canvas 1.4.1**: HTML to canvas conversion (for PDF)

### Browser APIs Used

- **getUserMedia**: Camera access
- **FileReader**: File upload handling
- **LocalStorage**: Data persistence
- **Canvas API**: Image processing

### Data Format

SOPs are stored as JSON with the following structure:

```json
{
  "meta": {
    "title": "",
    "sopId": "",
    "department": "",
    "version": "",
    "author": "",
    "reviewer": "",
    "status": "",
    "effectiveDate": "",
    "reviewDate": ""
  },
  "description": "",
  "safety": {
    "warnings": [],
    "ppe": [],
    "notes": ""
  },
  "tools": [],
  "materials": [],
  "steps": [
    {
      "id": "",
      "title": "",
      "description": "",
      "safetyNote": "",
      "images": []
    }
  ]
}
```

## Security Considerations

- All data is stored locally in the browser
- No data is sent to external servers
- Camera access requires user permission
- PDF generation happens client-side

## License

This project is provided as-is for use in creating Standard Operating Procedures.

## Support

For issues or questions:
1. Check browser console for errors
2. Verify all required fields are filled
3. Ensure browser supports required APIs
4. Try in a different browser

---

**Success Criteria**: You should be able to run the application, create an SOP, add steps, capture photos, save, reload, and export a PDF with zero errors.
