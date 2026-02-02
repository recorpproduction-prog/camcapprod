"""
Pallet Ticket Capture - Web Application
Flask-based web app for online deployment
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
import base64
from datetime import datetime
from pathlib import Path
import cv2
import numpy as np

# Import modules
from ocr_processor import OCRProcessor
from sheets_integration import SheetsIntegration
from data_parser import DataParser

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Configuration
CONFIG = {
    'images_folder': 'static/captured_images',
    'config_file': 'config.json',
    'ocr_provider': os.getenv('OCR_PROVIDER', 'ocrspace'),
    'ocr_api_key': os.getenv('OCR_API_KEY'),
    'sheets_id': os.getenv('GOOGLE_SHEET_ID'),
    'credentials_file': os.getenv('GOOGLE_CREDENTIALS_FILE', 'credentials.json')
}

# Initialize components
ocr = None
parser = DataParser()
sheets = None

def init_components():
    """Initialize OCR and Sheets components"""
    global ocr, sheets
    
    try:
        ocr = OCRProcessor(api_provider=CONFIG['ocr_provider'], api_key=CONFIG['ocr_api_key'])
        print(f"OCR initialized: {CONFIG['ocr_provider']}")
    except Exception as e:
        print(f"OCR initialization error: {e}")
        ocr = None
    
    # Initialize Sheets if configured
    if CONFIG.get('sheets_id') and os.path.exists(CONFIG['credentials_file']):
        try:
            sheets = SheetsIntegration(CONFIG['sheets_id'], CONFIG['credentials_file'])
            sheets.connect(CONFIG['credentials_file'])
            print("Google Sheets connected")
        except Exception as e:
            print(f"Sheets connection error: {e}")
            sheets = None
    
    # Create directories
    Path(CONFIG['images_folder']).mkdir(parents=True, exist_ok=True)
    Path('local_records').mkdir(exist_ok=True)

# Initialize on startup
init_components()

@app.route('/')
def index():
    """Main capture page"""
    # JavaScript is inline in template - no need to pass it
    return render_template('index.html')

@app.route('/review')
def review():
    """Supervisor review page"""
    return render_template('review.html')

@app.route('/api/submit', methods=['POST'])
def submit_ticket():
    """Submit captured ticket"""
    try:
        data = request.json
        image_data = data.get('image')  # Base64 encoded image
        
        if not image_data:
            return jsonify({'success': False, 'error': 'No image data'}), 400
        
        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({'success': False, 'error': 'Invalid image data'}), 400
        
        # Save image
        timestamp = datetime.now()
        images_dir = Path(CONFIG['images_folder'])
        filename = f"pallet_{timestamp.strftime('%Y%m%d_%H%M%S')}.png"
        image_path = images_dir / filename
        cv2.imwrite(str(image_path), frame)
        
        # Run OCR
        if not ocr:
            return jsonify({'success': False, 'error': 'OCR not initialized'}), 500
        
        ocr_text = ocr.process_image(str(image_path))
        
        # Parse data
        parsed_data = parser.parse(ocr_text)
        
        # Create record
        record = {
            'timestamp': timestamp.isoformat(),
            'status': 'PENDING',
            'operator': 'Web-User',
            'image_path': f'/captured_images/{filename}',
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
        
        # Submit to Google Sheets
        result = {'success': False}
        if sheets:
            result = sheets.add_pending_record(record)
        
        # Also save locally
        records_dir = Path('local_records')
        record_file = records_dir / f"record_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
        with open(record_file, 'w') as f:
            json.dump(record, f, indent=2)
        
        if result.get('success'):
            return jsonify({
                'success': True,
                'row_num': result.get('row_num'),
                'record': record
            })
        else:
            return jsonify({
                'success': True,  # Still success if saved locally
                'row_num': None,
                'record': record,
                'warning': 'Saved locally only - Sheets not connected'
            })
            
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/pending', methods=['GET'])
def get_pending():
    """Get pending records"""
    try:
        if sheets:
            records = sheets.get_pending_records()
            return jsonify({'records': records})
        else:
            # Return local records
            records_dir = Path('local_records')
            records = []
            if records_dir.exists():
                for json_file in records_dir.glob('record_*.json'):
                    try:
                        with open(json_file, 'r') as f:
                            record = json.load(f)
                            if record.get('status') == 'PENDING':
                                records.append(record)
                    except:
                        pass
            return jsonify({'records': records})
    except Exception as e:
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
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/captured_images/<filename>')
def serve_image(filename):
    """Serve captured images"""
    return send_from_directory(CONFIG['images_folder'], filename)

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

