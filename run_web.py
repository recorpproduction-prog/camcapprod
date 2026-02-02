"""
Quick start script for web application
"""

import os
import sys

# Set environment variables if not set
if not os.getenv('GOOGLE_SHEET_ID'):
    print("⚠ GOOGLE_SHEET_ID not set - records will be saved locally only")
    print("   Set it with: export GOOGLE_SHEET_ID=your_sheet_id")
    print("   Or Windows: set GOOGLE_SHEET_ID=your_sheet_id\n")

if not os.path.exists('credentials.json'):
    print("⚠ credentials.json not found - Google Sheets won't work")
    print("   Create Google Service Account and download credentials.json\n")

# Import and run web app
from web_app import app

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"\n{'='*60}")
    print(f"Starting server on http://localhost:{port}")
    print(f"{'='*60}\n")
    app.run(host='0.0.0.0', port=port, debug=True)


