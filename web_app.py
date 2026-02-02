"""
Pallet Ticket Capture - Web Application
Complete rewrite for online deployment
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import base64
import io
from datetime import datetime
from pathlib import Path
from PIL import Image
import numpy as np

# Import modules
from ocr_processor import OCRProcessor
from sheets_integration import SheetsIntegration
from data_parser import DataParser

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Configuration - works for local and cloud (Render, Railway, etc.)
CONFIG = {
    'images_folder': 'static/captured_images',
    'ocr_provider': os.getenv('OCR_PROVIDER', 'ocrspace'),
    'ocr_api_key': os.getenv('OCR_API_KEY'),
    'sheets_id': os.getenv('GOOGLE_SHEET_ID'),
    'credentials_file': os.getenv('GOOGLE_CREDENTIALS_FILE', 'credentials.json'),
    'credentials_json': os.getenv('GOOGLE_CREDENTIALS_JSON'),  # Alt: paste JSON as env var
}

# Initialize components
ocr = None
parser = None
sheets = None

def init_components():
    """Initialize OCR, parser, and Sheets"""
    global ocr, parser, sheets
    
    # Initialize parser
    parser = DataParser()
    
    # Initialize OCR
    try:
        ocr = OCRProcessor(api_provider=CONFIG['ocr_provider'], api_key=CONFIG['ocr_api_key'])
        print(f"[OK] OCR initialized: {CONFIG['ocr_provider']}")
    except Exception as e:
        print(f"[ERROR] OCR initialization error: {e}")
        ocr = None
    
    # Initialize Sheets if configured
    creds_available = (
        (CONFIG.get('credentials_json') and CONFIG['credentials_json'].strip()) or
        (CONFIG.get('credentials_file') and os.path.exists(CONFIG['credentials_file']))
    )
    if CONFIG.get('sheets_id') and creds_available:
        try:
            if CONFIG.get('credentials_json') and CONFIG['credentials_json'].strip():
                import tempfile
                with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                    f.write(CONFIG['credentials_json'].strip())
                    cred_path = f.name
                sheets = SheetsIntegration(CONFIG['sheets_id'], cred_path)
                sheets.connect(cred_path)
                try:
                    os.unlink(cred_path)
                except Exception:
                    pass
            else:
                sheets = SheetsIntegration(CONFIG['sheets_id'], CONFIG['credentials_file'])
                sheets.connect(CONFIG['credentials_file'])
            print(f"[OK] Google Sheets connected: {CONFIG['sheets_id']}")
        except Exception as e:
            print(f"[ERROR] Sheets connection error: {e}")
            sheets = None
    else:
        print("[INFO] Google Sheets not configured - records will be saved locally only")
    
    # Create directories
    Path(CONFIG['images_folder']).mkdir(parents=True, exist_ok=True)
    Path('local_records').mkdir(exist_ok=True)
    print("[OK] Directories created")

def resize_for_ocr(img, max_size_kb=900):
    """
    Resize and compress image to stay under OCR.space 1MB limit.
    img: PIL Image. Returns jpeg_bytes guaranteed under limit.
    """
    target_bytes = max_size_kb * 1024
    width, height = img.size
    
    for max_dim in [800, 720, 600, 480, 400]:
        for quality in [85, 80, 75, 65, 55]:
            if width > max_dim or height > max_dim:
                scale = max_dim / max(width, height)
                new_w = int(width * scale)
                new_h = int(height * scale)
                resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
            else:
                resized = img
            buf = io.BytesIO()
            resized.convert('RGB').save(buf, 'JPEG', quality=quality, optimize=True)
            buf_bytes = buf.getvalue()
            if len(buf_bytes) < target_bytes:
                return buf_bytes
    
    resized = img.resize((480, 360), Image.Resampling.LANCZOS)
    buf = io.BytesIO()
    resized.convert('RGB').save(buf, 'JPEG', quality=50)
    return buf.getvalue()


# Initialize on startup (wrap to avoid blocking deploy)
try:
    print("=" * 60)
    print("Starting Pallet Ticket Capture Web Application")
    print("=" * 60)
    init_components()
    print("=" * 60)
except Exception as e:
    print(f"[WARN] Init error (app will start anyway): {e}")
    import traceback
    traceback.print_exc()

@app.route('/health')
def health():
    """Quick health check - use this to verify deploy"""
    return jsonify({'status': 'ok', 'ocr': ocr is not None, 'sheets': sheets is not None})

@app.route('/')
def index():
    """Main capture page"""
    return render_template('capture.html')

@app.route('/review')
def review():
    """Supervisor review page"""
    return render_template('review.html')

def check_duplicate_sscc(sscc):
    """Check if SSCC exists in Sheets or local records"""
    if not sscc or not str(sscc).strip():
        return False
    sscc_clean = str(sscc).strip()
    if sheets:
        if sheets.sscc_exists(sscc_clean):
            return True
    records_dir = Path('local_records')
    if records_dir.exists():
        for json_file in records_dir.glob('record_*.json'):
            try:
                with open(json_file, 'r') as f:
                    record = json.load(f)
                    if str(record.get('sscc', '')).strip() == sscc_clean:
                        return True
            except Exception:
                pass
    return False


@app.route('/api/submit', methods=['POST'])
def submit_ticket():
    """Submit captured ticket"""
    try:
        data = request.json
        image_data = data.get('image')
        test_mode = data.get('test_mode', False)
        
        if not image_data:
            return jsonify({'success': False, 'error': 'No image data'}), 400
        
        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        except Exception as e:
            return jsonify({'success': False, 'error': f'Invalid image: {e}'}), 400
        
        timestamp = datetime.now()
        images_dir = Path(CONFIG['images_folder'])
        filename = f"pallet_{timestamp.strftime('%Y%m%d_%H%M%S')}.jpg"
        image_path = images_dir / filename
        jpeg_bytes = resize_for_ocr(img, max_size_kb=900)
        with open(image_path, 'wb') as f:
            f.write(jpeg_bytes)
        
        print(f"[OK] Image saved: {filename}")
        
        # Run OCR
        if not ocr:
            return jsonify({'success': False, 'error': 'OCR not initialized'}), 500
        
        print("Running OCR...")
        ocr_text = ocr.process_image(str(image_path))
        print(f"[OK] OCR completed: {len(ocr_text)} characters")
        
        # Parse data
        if not parser:
            return jsonify({'success': False, 'error': 'Parser not initialized'}), 500
        parsed_data = parser.parse(ocr_text)
        print(f"[OK] Parsed {len(parsed_data['parsed'])} fields")
        
        # Create record
        record = {
            'timestamp': timestamp.isoformat(),
            'status': 'PENDING',
            'operator': 'Web-User',
            'image_path': f'/captured_images/{filename}',  # Updated to .jpg
            'raw_ocr_text': ocr_text,
            **parsed_data['parsed']
        }
        
        # Add confidence notes
        confidence_notes = []
        for field, level in parsed_data['confidence'].items():
            if level != 'high':
                confidence_notes.append(f"{field}:{level}")
        
        if confidence_notes:
            record['notes'] = ' | Confidence: ' + ', '.join(confidence_notes)
        
        # Duplication check (skip if test_mode)
        sscc_val = record.get('sscc', '')
        if not test_mode and sscc_val and check_duplicate_sscc(sscc_val):
            return jsonify({
                'success': False,
                'duplicate': True,
                'error': f'Duplicate label - SSCC {sscc_val} already captured',
                'record': record
            }), 200
        
        # Submit to Google Sheets
        result = {'success': False}
        if sheets:
            try:
                result = sheets.add_pending_record(record)
                if result.get('success'):
                    print(f"[OK] Submitted to Google Sheets (Row {result.get('row_num')})")
            except Exception as e:
                print(f"[ERROR] Sheets error: {e}")
                result = {'success': False, 'error': str(e)}
        
        # Always save locally
        records_dir = Path('local_records')
        record_file = records_dir / f"record_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
        with open(record_file, 'w') as f:
            json.dump(record, f, indent=2)
        print(f"[OK] Saved locally: {record_file.name}")
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'row_num': result.get('row_num'),
                'record': record,
                'message': 'Submitted to Google Sheets successfully'
            })
        else:
            return jsonify({
                'success': True,  # Still success if saved locally
                'row_num': None,
                'record': record,
                'message': 'Saved locally (Google Sheets not connected)',
                'warning': result.get('error', 'Sheets not configured')
            })
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"[ERROR] Submit error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/pending', methods=['GET'])
def get_pending():
    """Get pending records"""
    try:
        records = []
        
        # Get from Sheets if available
        if sheets:
            try:
                records = sheets.get_pending_records()
                print(f"[OK] Loaded {len(records)} records from Sheets")
            except Exception as e:
                print(f"[ERROR] Sheets error: {e}")
        
        # Also check local records
        records_dir = Path('local_records')
        if records_dir.exists():
            for json_file in records_dir.glob('record_*.json'):
                try:
                    with open(json_file, 'r') as f:
                        record = json.load(f)
                        if record.get('status') == 'PENDING':
                            # Avoid duplicates
                            if not any(r.get('timestamp') == record.get('timestamp') for r in records):
                                records.append(record)
                except:
                    pass
        
        return jsonify({'records': records})
    except Exception as e:
        print(f"[ERROR] Get pending error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/approve', methods=['POST'])
def approve_record():
    """Approve a record"""
    try:
        data = request.json
        row_number = data.get('row_number')
        
        if not sheets:
            return jsonify({'success': False, 'error': 'Google Sheets not configured'}), 400
        
        result = sheets.approve_record(row_number)
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] Approve error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/reject', methods=['POST'])
def reject_record():
    """Reject a record"""
    try:
        data = request.json
        row_number = data.get('row_number')
        reason = data.get('reason', '')
        
        if not sheets:
            return jsonify({'success': False, 'error': 'Google Sheets not configured'}), 400
        
        result = sheets.reject_record(row_number, reason)
        return jsonify(result)
    except Exception as e:
        print(f"[ERROR] Reject error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/captured_images/<filename>')
def serve_image(filename):
    """Serve captured images"""
    return send_from_directory(CONFIG['images_folder'], filename)

if __name__ == '__main__':
    import webbrowser
    import threading
    import time
    
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '0.0.0.0')
    debug = os.getenv('DEBUG', 'False').lower() == 'true'
    
    print(f"\nStarting server on {host}:{port}")
    print(f"Open: http://localhost:{port}")
    print("\nPress Ctrl+C to stop\n")
    
    # Open browser automatically after a delay
    def open_browser():
        time.sleep(2)  # Wait for server to start
        webbrowser.open(f'http://localhost:{port}')
    
    browser_thread = threading.Thread(target=open_browser, daemon=True)
    browser_thread.start()
    
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        print("\n\nServer stopped by user")

