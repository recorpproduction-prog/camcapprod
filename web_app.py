"""
Pallet Ticket Capture - Web Application
Complete rewrite for online deployment
"""

from flask import Flask, render_template, render_template_string, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
from jinja2 import TemplateNotFound
import os
import json
import base64
import io
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

NZ_TZ = ZoneInfo("Pacific/Auckland")  # NZ Wellington time
from pathlib import Path
from PIL import Image
import numpy as np

# Import modules
from ocr_processor import OCRProcessor
from sheets_integration import SheetsIntegration
from data_parser import DataParser
try:
    from drive_integration import upload_to_drive, get_date_folder_name
    _DRIVE_AVAILABLE = True
except ImportError as e:
    _DRIVE_AVAILABLE = False
    def upload_to_drive(*a, **kw):
        return None, str(e)
    def get_date_folder_name():
        now = datetime.now(NZ_TZ)
        return now.strftime('%Y-%m-%d')

# Use paths relative to this file so templates are found on Render
_BASE = Path(__file__).resolve().parent
app = Flask(__name__, static_folder=str(_BASE / 'static'), template_folder=str(_BASE / 'templates'))

# Embedded templates - used when templates/ folder is not deployed (e.g. missing from repo)
try:
    from embedded_templates import CAPTURE_HTML, REVIEW_HTML, REPORT_HTML
    _HAS_EMBEDDED = True
except ImportError:
    _HAS_EMBEDDED = False
    REPORT_HTML = None
CORS(app)

# Return JSON for 500 errors so we can see the actual error message
@app.errorhandler(500)
def handle_500(err):
    import traceback
    tb = traceback.format_exc()
    msg = getattr(err, 'description', None) or str(err)
    if os.getenv('FLASK_DEBUG', '').lower() == 'true':
        return jsonify({'error': 'Internal Server Error', 'message': msg, 'traceback': tb}), 500
    return jsonify({'error': 'Internal Server Error', 'message': msg}), 500

# Configuration - works for local and cloud (Render, Railway, etc.)
# Set IMAGES_FOLDER and LOCAL_RECORDS_DIR to persistent disk paths (e.g. /data/...) on Render
CONFIG = {
    'images_folder': os.getenv('IMAGES_FOLDER', 'captured_images'),
    'local_records_dir': os.getenv('LOCAL_RECORDS_DIR', 'local_records'),
    'ocr_provider': os.getenv('OCR_PROVIDER', 'ocrspace'),
    'ocr_api_key': os.getenv('OCR_API_KEY'),
    'sheets_id': os.getenv('GOOGLE_SHEET_ID'),
    'credentials_file': os.getenv('GOOGLE_CREDENTIALS_FILE', 'credentials.json'),
    'credentials_json': os.getenv('GOOGLE_CREDENTIALS_JSON'),  # Alt: paste JSON as env var
    'drive_root_folder_id': os.getenv('GOOGLE_DRIVE_ROOT_FOLDER_ID'),  # Optional: date folders created inside this
    'report_email_to': os.getenv('REPORT_EMAIL_TO', 'recropproduction@gmail.com'),  # Comma-separated
    'smtp_host': os.getenv('SMTP_HOST'),
    'smtp_port': os.getenv('SMTP_PORT', '587'),
    'smtp_user': os.getenv('SMTP_USER'),
    'smtp_password': os.getenv('SMTP_PASSWORD'),
    'report_secret': os.getenv('REPORT_SECRET'),  # Optional: require ?secret=X to trigger auto-report
}

# Initialize components
ocr = None
parser = None
sheets = None


def _log(msg):
    """Log and flush so it appears in Render logs immediately."""
    print(msg)
    try:
        import sys
        sys.stdout.flush()
    except Exception:
        pass


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
            err_msg = str(e) or repr(e)
            print(f"[ERROR] Sheets connection error: {err_msg}")
            import traceback
            traceback.print_exc()
            sheets = None
    else:
        print("[INFO] Google Sheets not configured - records will be saved locally only")
    
    # Create directories (use persistent paths when IMAGES_FOLDER/LOCAL_RECORDS_DIR set)
    Path(CONFIG['images_folder']).mkdir(parents=True, exist_ok=True)
    Path(CONFIG['local_records_dir']).mkdir(parents=True, exist_ok=True)
    img_resolved = str(Path(CONFIG['images_folder']).resolve())
    rec_resolved = str(Path(CONFIG['local_records_dir']).resolve())
    _log(f"[Init] Storage: images={img_resolved}, records={rec_resolved}")

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

@app.route('/api/diagnostics')
@app.route('/diagnostics')  # Simpler URL in case /api/ has issues
def diagnostics():
    """Check Google config (no secrets). Use this to see why Sheets/Drive might not work."""
    has_creds = bool(
        (CONFIG.get('credentials_json') and CONFIG['credentials_json'].strip()) or
        (CONFIG.get('credentials_file') and os.path.exists(CONFIG.get('credentials_file', '')))
    )
    return jsonify({
        'sheets_connected': sheets is not None,
        'sheets_id_set': bool(CONFIG.get('sheets_id')),
        'drive_creds_available': has_creds,
        'drive_root_folder_id_set': bool(CONFIG.get('drive_root_folder_id')),
        'ocr_ready': ocr is not None,
    })


@app.route('/api/storage-diagnostics')
@app.route('/storage-diagnostics')
def storage_diagnostics():
    """Check if disk storage is working - paths, dirs, writability, file counts."""
    images_dir = Path(CONFIG['images_folder']).resolve()
    records_dir = Path(CONFIG['local_records_dir']).resolve()
    images_exists = images_dir.exists()
    records_exists = records_dir.exists()

    def _writable(p):
        if not p.exists():
            return False
        try:
            test = p / '.write_test'
            test.write_text('ok')
            test.unlink()
            return True
        except Exception:
            return False

    n_images = len(list(images_dir.glob('*.jpg')) + list(images_dir.glob('*.jpeg')) + list(images_dir.glob('*.png'))) if images_exists else 0
    n_records = len(list(records_dir.glob('record_*.json'))) if records_exists else 0

    cwd = str(Path.cwd())
    return jsonify({
        'images_folder': str(images_dir),
        'local_records_dir': str(records_dir),
        'images_dir_exists': images_exists,
        'records_dir_exists': records_exists,
        'images_dir_writable': _writable(images_dir) if images_exists else False,
        'records_dir_writable': _writable(records_dir) if records_exists else False,
        'images_count': n_images,
        'records_count': n_records,
        'cwd': cwd,
        'using_persistent_disk': str(images_dir).startswith('/data') or str(records_dir).startswith('/data'),
    })

def _render_page(template_name, embedded_html):
    """Render template from file if exists, else use embedded HTML (for when templates/ not in repo)."""
    try:
        return render_template(template_name)
    except TemplateNotFound:
        if _HAS_EMBEDDED and embedded_html:
            return render_template_string(embedded_html)
        raise

@app.route('/')
def index():
    """Main capture page"""
    return _render_page('capture.html', CAPTURE_HTML if _HAS_EMBEDDED else None)

def check_duplicate_sscc(sscc):
    """Check if SSCC exists in Sheets or local records"""
    if not sscc or not str(sscc).strip():
        return False
    sscc_clean = str(sscc).strip()
    if sheets:
        if sheets.sscc_exists(sscc_clean):
            return True
    records_dir = Path(CONFIG['local_records_dir'])
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
        _log("[Submit] Request received")
        data = request.json
        image_data = data.get('image')
        test_mode = data.get('test_mode', False)
        
        if not image_data:
            _log("[Submit] ERROR: No image data")
            return jsonify({'success': False, 'error': 'No image data'}), 400
        
        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        try:
            img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        except Exception as e:
            _log(f"[Submit] ERROR: Invalid image: {e}")
            return jsonify({'success': False, 'error': f'Invalid image: {e}'}), 400
        
        timestamp = datetime.now(NZ_TZ)  # Capture time in NZ Wellington
        images_dir = Path(CONFIG['images_folder'])
        records_dir = Path(CONFIG['local_records_dir'])
        images_dir.mkdir(parents=True, exist_ok=True)
        records_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"pallet_{timestamp.strftime('%Y%m%d_%H%M%S')}.jpg"
        image_path = images_dir / filename
        jpeg_bytes = resize_for_ocr(img, max_size_kb=900)
        with open(image_path, 'wb') as f:
            f.write(jpeg_bytes)
        
        _log(f"[Submit] Image saved: {filename} -> {image_path}")
        
        # Run OCR
        if not ocr:
            _log("[Submit] ERROR: OCR not initialized")
            return jsonify({'success': False, 'error': 'OCR not initialized'}), 500
        
        _log("[Submit] Running OCR...")
        ocr_text = ocr.process_image(str(image_path))
        _log(f"[Submit] OCR completed: {len(ocr_text)} characters")
        
        # Parse data
        if not parser:
            _log("[Submit] ERROR: Parser not initialized")
            return jsonify({'success': False, 'error': 'Parser not initialized'}), 500
        parsed_data = parser.parse(ocr_text)
        _log(f"[Submit] Parsed {len(parsed_data['parsed'])} fields")
        
        # Upload to Google Drive (date folder YYYY-MM-DD, 7am-7am blocks)
        image_drive_url = None
        drive_error_msg = None
        creds_available = (
            (CONFIG.get('credentials_json') and CONFIG['credentials_json'].strip()) or
            (CONFIG.get('credentials_file') and os.path.exists(CONFIG.get('credentials_file', '')))
        )
        if creds_available:
            try:
                drive_url, drive_err = upload_to_drive(
                    str(image_path),
                    filename,
                    root_folder_id=CONFIG.get('drive_root_folder_id'),
                    credentials_file=CONFIG.get('credentials_file'),
                    credentials_json=CONFIG.get('credentials_json')
                )
                if drive_url:
                    image_drive_url = drive_url
                    _log(f"[Submit] Uploaded to Drive folder {get_date_folder_name()}")
                elif drive_err:
                    drive_error_msg = str(drive_err)
                    _log(f"[Submit] WARN Drive upload skipped: {drive_err}")
            except Exception as e:
                drive_error_msg = str(e)
                _log(f"[Submit] WARN Drive upload error: {e}")

        # Create record - use Drive URL for display when available
        display_url = image_drive_url or f'/captured_images/{filename}'
        record = {
            'timestamp': timestamp.isoformat(),
            'status': 'CAPTURED',
            'operator': 'Web-User',
            'image_path': display_url,
            'image_drive_url': image_drive_url or '',
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
        
        # Submit to Google Sheets (directly to APPROVED_RECORDS as CAPTURED - no review)
        result = {'success': False}
        if sheets:
            try:
                result = sheets.add_captured_record(record)
                if result.get('success'):
                    _log(f"[Submit] Submitted to Google Sheets (Row {result.get('row_num')})")
            except Exception as e:
                _log(f"[Submit] ERROR Sheets: {e}")
                result = {'success': False, 'error': str(e)}
        
        # Always save locally
        record_file = records_dir / f"record_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
        with open(record_file, 'w') as f:
            json.dump(record, f, indent=2)
        _log(f"[Submit] Saved locally: {record_file.name} -> {record_file}")
        
        # Build response with diagnostics so user can see what worked/failed
        resp = {
            'success': True,
            'row_num': result.get('row_num'),
            'record': record,
            'drive_uploaded': bool(image_drive_url),
            'sheets_submitted': result.get('success', False),
        }
        if result.get('success'):
            resp['message'] = 'Submitted to Google Sheets successfully'
            if image_drive_url:
                resp['message'] += '; image uploaded to Drive.'
        else:
            resp['message'] = 'Saved locally.'
            resp['sheets_error'] = result.get('error', 'Sheets not connected')
        # Do not expose Drive errors to user (e.g. service account quota - requires Shared Drive)
        return jsonify(resp)
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        _log(f"[Submit] ERROR: {e}")
        try:
            import sys
            sys.stdout.flush()
        except Exception:
            pass
        return jsonify({'success': False, 'error': str(e)}), 500

def _record_key(r):
    """Unique key for dedup: SSCC if present, else timestamp."""
    sscc = (r.get('sscc') or '').strip()
    if sscc:
        return ('sscc', sscc)
    return ('ts', r.get('timestamp', ''))


@app.route('/api/pending', methods=['GET'])
def get_pending():
    """Get pending records - merge local (prioritized) with Sheets, dedupe by SSCC or timestamp."""
    try:
        seen = {}
        records = []
        
        # Load local records first (newest captures may be local-only before Sheets sync)
        records_dir = Path(CONFIG['local_records_dir'])
        if records_dir.exists():
            for json_file in sorted(records_dir.glob('record_*.json')):
                try:
                    with open(json_file, 'r') as f:
                        record = json.load(f)
                        st = record.get('status', '')
                        if st in ('CAPTURED', 'PENDING'):
                            k = _record_key(record)
                            if k not in seen:
                                seen[k] = len(records)
                                records.append(record)
                except Exception:
                    pass
        
        # Add Sheets records not already present
        if sheets:
            try:
                for record in sheets.get_pending_records():
                    k = _record_key(record)
                    if k not in seen:
                        seen[k] = len(records)
                        records.append(record)
                print(f"[OK] Loaded {len(records)} records (local + Sheets)")
            except Exception as e:
                print(f"[ERROR] Sheets error: {e}")
        
        # Sort by timestamp descending (newest first) - ISO strings sort correctly
        def _ts(r):
            return (r.get('timestamp') or '')[:26] or '0000'
        records.sort(key=_ts, reverse=True)

        # Ensure image_path is set for display (prefer Drive URL)
        for r in records:
            if not r.get('image_path') and r.get('image_drive_url'):
                r['image_path'] = r['image_drive_url']
        
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

@app.route('/report')
def report_page():
    """Daily report page - generate PDF with images"""
    return _render_page('report.html', REPORT_HTML if _HAS_EMBEDDED else None)

def _parse_report_range():
    """Parse from_date, from_time, to_date, to_time from query params. Returns (start_dt, end_dt) or None for default."""
    from report_generator import get_7am_7am_window
    from datetime import time as dt_time

    from_date = request.args.get('from_date') or request.args.get('fromDate')
    from_time = request.args.get('from_time') or request.args.get('fromTime', '07:00')
    to_date = request.args.get('to_date') or request.args.get('toDate')
    to_time = request.args.get('to_time') or request.args.get('toTime', '07:00')

    if not from_date or not to_date:
        return None

    def parse_time(s):
        parts = str(s).strip().split(':')
        h = int(parts[0]) if parts else 0
        m = int(parts[1]) if len(parts) > 1 else 0
        return dt_time(h, m, 0)

    try:
        start_d = datetime.strptime(from_date.strip(), '%Y-%m-%d').date()
        end_d = datetime.strptime(to_date.strip(), '%Y-%m-%d').date()
        start_t = parse_time(from_time)
        end_t = parse_time(to_time)
        start_dt = datetime.combine(start_d, start_t)
        end_dt = datetime.combine(end_d, end_t)
        if end_dt <= start_dt:
            end_dt += timedelta(days=1)  # Assume 24h block
        return start_dt, end_dt
    except (ValueError, TypeError):
        return None


@app.route('/api/generate-report')
def generate_report():
    """Generate PDF report. Uses from_date, from_time, to_date, to_time for custom range. ?days=N or ?all=1 for server-time range."""
    try:
        from report_generator import (
            get_records_last_24h, get_records_last_n_days, get_records_in_range,
            generate_pdf, cleanup_images_older_than_days
        )
        records_dir = Path(CONFIG['local_records_dir'])
        images_dir = Path(CONFIG['images_folder'])
        records_dir = records_dir.resolve()
        images_dir = images_dir.resolve()

        filter_by = request.args.get('filter_by', 'capture').lower()
        if filter_by not in ('capture', 'label'):
            filter_by = 'capture'

        # ?all=1 or ?days=N: use server time (avoids timezone/form mismatch)
        days_param = request.args.get('days', '').strip()
        all_param = request.args.get('all', '').lower() in ('1', 'true', 'yes')
        if all_param:
            items = get_records_last_n_days(str(records_dir), str(images_dir), days=365, filter_by=filter_by)
            start_dt, end_dt = None, None
        elif days_param.isdigit():
            items = get_records_last_n_days(str(records_dir), str(images_dir), days=int(days_param), filter_by=filter_by)
            start_dt, end_dt = None, None
        else:
            start_end = _parse_report_range()
            if start_end:
                start_dt, end_dt = start_end
                items = get_records_in_range(str(records_dir), str(images_dir), start_dt, end_dt, filter_by=filter_by)
            else:
                items = get_records_last_24h(str(records_dir), str(images_dir), filter_by=filter_by)
                start_dt, end_dt = None, None

        # Diagnostics (visible in server logs)
        n_files = len(list(records_dir.glob('record_*.json'))) if records_dir.exists() else 0
        print(f"[Report] records_dir={records_dir} exists={records_dir.exists()}, json_files={n_files}, "
              f"images_dir={images_dir} exists={images_dir.exists()}, items={len(items)}, filter_by={filter_by}")

        buf = io.BytesIO()
        generate_pdf(items, buf)
        buf.seek(0)

        do_cleanup = request.args.get('cleanup', '').lower() in ('1', 'true', 'yes')
        if do_cleanup:
            deleted = cleanup_images_older_than_days(str(images_dir), days=7)
            print(f"[OK] Cleaned up {deleted} images older than 7 days")

        filename = f"pallet_report_{datetime.now().strftime('%Y%m%d_%H%M')}.pdf"
        return send_file(buf, mimetype='application/pdf', as_attachment=True, download_name=filename)
    except ImportError as e:
        return jsonify({'error': 'reportlab not installed', 'detail': str(e)}), 500
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/api/auto-report')
def auto_report():
    """Generate PDF report (7am-7am window), email it, optionally clean up. Call Tue-Fri 7am via cron."""
    secret = request.args.get('secret')
    if CONFIG.get('report_secret') and secret != CONFIG['report_secret']:
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        from report_generator import get_records_last_24h, generate_pdf, send_report_email, cleanup_images_older_than_days
        records_dir = Path(CONFIG['local_records_dir'])
        images_dir = Path(CONFIG['images_folder'])
        items = get_records_last_24h(str(records_dir), str(images_dir))
        buf = io.BytesIO()
        generate_pdf(items, buf)
        buf.seek(0)
        pdf_bytes = buf.getvalue()

        to_emails = CONFIG.get('report_email_to', '').strip()
        if not to_emails:
            to_emails = 'recropproduction@gmail.com'
        success, err = send_report_email(
            pdf_bytes, to_emails,
            smtp_host=CONFIG.get('smtp_host'),
            smtp_port=CONFIG.get('smtp_port'),
            smtp_user=CONFIG.get('smtp_user'),
            smtp_password=CONFIG.get('smtp_password'),
        )
        if not success:
            return jsonify({'error': f'Email failed: {err}', 'pdf_generated': True}), 500

        do_cleanup = request.args.get('cleanup', '1').lower() in ('1', 'true', 'yes')
        deleted = 0
        if do_cleanup:
            deleted = cleanup_images_older_than_days(str(images_dir), days=7)
        emails_list = [e.strip() for e in to_emails.split(',')] if isinstance(to_emails, str) else to_emails
        return jsonify({
            'success': True,
            'records': len(items),
            'emailed_to': emails_list,
            'images_cleaned': deleted,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

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

