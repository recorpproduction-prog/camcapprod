"""
Pallet Ticket Capture - Desktop Application
Auto-detects and captures pallet tickets using camera
"""

import cv2
import numpy as np
import time
import os
import json
from datetime import datetime
from pathlib import Path
import threading
import tkinter as tk
from tkinter import ttk, messagebox
from PIL import Image, ImageTk
import sys

from ocr_processor import OCRProcessor
from sheets_integration import SheetsIntegration
from data_parser import DataParser

# Configuration
CONFIG = {
    'frame_sample_interval': 0.8,  # seconds
    'cooldown_period': 30,  # seconds
    'sharpness_threshold': 50,
    'text_density_threshold': 0.1,
    'images_folder': 'captured_images',
    'config_file': 'config.json',
    'operator_name': None,
    'sheets_id': None,
    'credentials_file': None,
    'ocr_provider': 'ocrspace',  # 'ocrspace', 'tesseractspace', 'google', or 'local'
    'ocr_api_key': None  # Optional API key for paid services
}

class PalletTicketApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Pallet Ticket Capture")
        self.root.geometry("1200x800")
        
        # Load configuration
        self.load_config()
        
        # Initialize components
        # Use online OCR by default (no Tesseract installation needed)
        ocr_provider = CONFIG.get('ocr_provider', 'ocrspace')
        ocr_api_key = CONFIG.get('ocr_api_key')
        self.ocr = OCRProcessor(api_provider=ocr_provider, api_key=ocr_api_key)
        self.parser = DataParser()
        
        # Initialize sheets if configured
        self.sheets = None
        if CONFIG.get('sheets_id') and CONFIG.get('credentials_file'):
            try:
                self.sheets = SheetsIntegration(CONFIG.get('sheets_id'), CONFIG.get('credentials_file'))
                self.sheets.connect(CONFIG.get('credentials_file'))
                self.log("Google Sheets connected")
            except Exception as e:
                self.log(f"Warning: Could not connect to Sheets: {e}")
                self.log("Records will be saved locally only")
        
        # State
        self.camera = None
        self.is_running = False
        self.is_processing = False
        self.last_submission_hash = None
        self.last_submission_time = 0
        self.capture_thread = None
        
        # Create UI first
        print("Creating UI components...")
        self.create_ui()
        
        # Force multiple updates to ensure everything renders
        self.root.update()
        self.root.update_idletasks()
        self.root.update()
        
        # Log that UI is ready
        operator_name = CONFIG.get('operator_name', self.get_default_operator_name())
        self.log("=" * 60)
        self.log("APPLICATION STARTED")
        self.log(f"Operator: {operator_name} (auto-assigned)")
        self.log("UI components loaded")
        self.log("=" * 60)
        self.log("Ready to capture - Click 'START CAPTURE' to begin")
        
        # Setup camera after a delay to ensure UI is fully rendered
        print("Scheduling camera initialization...")
        self.root.after(1000, lambda: self.setup_camera())
        
        # Start capture loop
        print("Starting capture loop thread...")
        self.start_capture()
        
        # Final update
        self.root.update()
        self.root.update_idletasks()
        print("UI creation complete. Window should be visible now.")
    
    def get_default_operator_name(self):
        """Get default operator identifier from system"""
        import platform
        import socket
        try:
            # Use computer name as default identifier
            hostname = socket.gethostname()
            return f"System-{hostname}"
        except:
            return "Auto-Capture-System"
    
    def load_config(self):
        """Load configuration from file"""
        if os.path.exists(CONFIG['config_file']):
            try:
                with open(CONFIG['config_file'], 'r') as f:
                    saved_config = json.load(f)
                    CONFIG.update(saved_config)
            except Exception as e:
                print(f"Error loading config: {e}")
        
        # Ensure operator name is set (use default if not)
        if not CONFIG.get('operator_name'):
            CONFIG['operator_name'] = self.get_default_operator_name()
    
    def save_config(self):
        """Save configuration to file"""
        try:
            with open(CONFIG['config_file'], 'w') as f:
                json.dump(CONFIG, f, indent=2)
        except Exception as e:
            print(f"Error saving config: {e}")
    
    def create_ui(self):
        """Create user interface"""
        # Configure root window FIRST
        self.root.title("Pallet Ticket Capture")
        self.root.geometry("1200x800")
        self.root.minsize(1000, 700)
        
        # Force window to be visible
        self.root.update()
        
        # Main container
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.pack(fill=tk.BOTH, expand=True)
        main_frame.update()
        
        # Settings frame (collapsible/minimized by default)
        settings_frame = ttk.LabelFrame(main_frame, text="Settings (Optional - Click to expand)", padding="5")
        settings_frame.pack(fill=tk.X, pady=(0, 5))
        
        # Settings container (pack vertically for simplicity)
        settings_container = ttk.Frame(settings_frame)
        settings_container.pack(fill=tk.X, padx=5, pady=5)
        
        # Google Sheets row
        sheets_row = ttk.Frame(settings_container)
        sheets_row.pack(fill=tk.X, pady=2)
        ttk.Label(sheets_row, text="Google Sheet ID:").pack(side=tk.LEFT, padx=5)
        self.sheets_entry = ttk.Entry(sheets_row, width=50)
        self.sheets_entry.insert(0, CONFIG.get('sheets_id', ''))
        self.sheets_entry.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        ttk.Button(sheets_row, text="Save", command=self.save_settings).pack(side=tk.LEFT, padx=5)
        
        # OCR Settings row
        ocr_row = ttk.Frame(settings_container)
        ocr_row.pack(fill=tk.X, pady=2)
        ttk.Label(ocr_row, text="OCR:").pack(side=tk.LEFT, padx=5)
        self.ocr_provider_var = tk.StringVar(value=CONFIG.get('ocr_provider', 'ocrspace'))
        ocr_combo = ttk.Combobox(ocr_row, textvariable=self.ocr_provider_var, 
                                values=['ocrspace', 'tesseractspace', 'google', 'local'], 
                                state='readonly', width=15)
        ocr_combo.pack(side=tk.LEFT, padx=5)
        ttk.Label(ocr_row, text="Key:").pack(side=tk.LEFT, padx=5)
        self.ocr_key_entry = ttk.Entry(ocr_row, width=30)
        self.ocr_key_entry.insert(0, CONFIG.get('ocr_api_key', '') or '')
        self.ocr_key_entry.pack(side=tk.LEFT, padx=5, fill=tk.X, expand=True)
        
        # Camera frame - MUST BE VISIBLE
        camera_frame = ttk.LabelFrame(main_frame, text="Camera Preview - Point at Pallet Ticket", padding="5")
        camera_frame.pack(fill=tk.BOTH, expand=True, pady=5)
        
        # Create canvas for video - make it clearly visible
        self.video_canvas = tk.Canvas(camera_frame, bg="#000000", width=800, height=600, highlightthickness=2, highlightbackground="gray")
        self.video_canvas.pack(expand=True, fill=tk.BOTH, padx=5, pady=5)
        
        # Status label on canvas
        self.video_label = tk.Label(self.video_canvas, text="Initializing camera...\n\nPlease wait...", 
                                    foreground="white", background="black",
                                    font=("Arial", 14, "bold"), justify=tk.CENTER)
        self.video_label.place(relx=0.5, rely=0.5, anchor="center")
        
        # Control buttons - MUST BE VISIBLE AT BOTTOM
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=5)
        
        # Status label
        self.status_label = ttk.Label(
            button_frame, 
            text="Ready - Click 'Start Capture' to begin",
            font=("Arial", 12, "bold"),
            foreground="blue"
        )
        self.status_label.pack(side=tk.LEFT, padx=10, fill=tk.X, expand=True)
        
        # Buttons
        self.start_button = ttk.Button(button_frame, text="START CAPTURE", command=self.toggle_capture)
        self.start_button.pack(side=tk.LEFT, padx=5)
        
        ttk.Button(button_frame, text="View Data", command=self.view_captured_data).pack(side=tk.LEFT, padx=5)
        ttk.Button(button_frame, text="Exit", command=self.on_closing).pack(side=tk.LEFT, padx=5)
        
        # Detection overlay flag
        self.detection_active = False
        
        # Log frame (smaller, at bottom)
        log_frame = ttk.LabelFrame(main_frame, text="Activity Log", padding="5")
        log_frame.pack(fill=tk.BOTH, expand=False, pady=5)
        
        log_container = ttk.Frame(log_frame)
        log_container.pack(fill=tk.BOTH, expand=True)
        
        self.log_text = tk.Text(log_container, height=4, wrap=tk.WORD, font=("Courier", 9))
        scrollbar = ttk.Scrollbar(log_container, orient=tk.VERTICAL, command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)
        
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        operator_name = CONFIG.get('operator_name', self.get_default_operator_name())
        self.log("Application started")
        self.log(f"Operator: {operator_name} (auto-assigned)")
        self.log("Window ready - all UI components loaded")
        self.log("Ready to capture - just point camera at pallet ticket!")
        
        # Force window update
        self.root.update_idletasks()
    
    def save_settings(self):
        """Save settings from UI"""
        # Operator name auto-generated from system
        CONFIG['operator_name'] = self.get_default_operator_name()
        CONFIG['sheets_id'] = self.sheets_entry.get()
        CONFIG['ocr_provider'] = self.ocr_provider_var.get()
        CONFIG['ocr_api_key'] = self.ocr_key_entry.get() or None
        
        # Get credentials file path if not set
        if not CONFIG.get('credentials_file'):
            from tkinter import filedialog
            creds_file = filedialog.askopenfilename(
                title="Select Google Service Account Credentials JSON",
                filetypes=[("JSON files", "*.json")]
            )
            if creds_file:
                CONFIG['credentials_file'] = creds_file
        
        self.save_config()
        
        # Reinitialize OCR with new settings
        try:
            self.ocr = OCRProcessor(
                api_provider=CONFIG['ocr_provider'], 
                api_key=CONFIG.get('ocr_api_key')
            )
            self.log(f"OCR provider set to: {CONFIG['ocr_provider']}")
        except Exception as e:
            self.log(f"OCR initialization warning: {e}")
        
        # Reconnect sheets if configured
        if CONFIG.get('sheets_id') and CONFIG.get('credentials_file'):
            try:
                self.sheets = SheetsIntegration(CONFIG.get('sheets_id'), CONFIG.get('credentials_file'))
                self.sheets.connect(CONFIG.get('credentials_file'))
                self.log("Google Sheets reconnected")
                messagebox.showinfo("Settings", "Configuration saved and Sheets connected!")
            except Exception as e:
                messagebox.showerror("Error", f"Could not connect to Sheets: {e}\n\nRecords will be saved locally only.")
                self.log(f"Sheets connection error: {e}")
        else:
            messagebox.showinfo("Settings", "Configuration saved!")
    
    def setup_camera(self):
        """Initialize camera"""
        try:
            self.log("Attempting to initialize camera...")
            self.update_status("Initializing camera...", "orange")
            self.video_label.config(text="Initializing camera...\n\nPlease wait...\n\nIf this takes too long, check camera permissions.")
            self.root.update()
            
            self.camera = cv2.VideoCapture(0)
            
            if not self.camera.isOpened():
                self.log("Camera index 0 failed, trying other indices...")
                # Try different camera indices
                for i in range(1, 5):
                    self.log(f"Trying camera index {i}...")
                    self.camera = cv2.VideoCapture(i)
                    if self.camera.isOpened():
                        self.log(f"Camera found at index {i}")
                        break
                
                if not self.camera.isOpened():
                    raise Exception("No camera found. Please connect a camera and try again.")
            
            # Set camera properties
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            
            # Test camera by reading a frame
            ret, frame = self.camera.read()
            if not ret:
                raise Exception("Camera opened but cannot read frames. Try clicking 'Start Capture'.")
            
            self.log("Camera initialized successfully!")
            self.update_status("Camera ready - Click 'START CAPTURE' to begin", "green")
            
            # Show a test frame
            self.update_video_preview(frame)
            self.root.update()
            
        except Exception as e:
            error_msg = f"Camera error: {e}"
            self.log(f"ERROR: {error_msg}")
            self.update_status(f"Camera Error: {e}", "red")
            
            error_text = f"Camera Error\n\n{str(e)}\n\n"
            error_text += "Possible solutions:\n"
            error_text += "1. Check camera is connected\n"
            error_text += "2. Close other apps using camera\n"
            error_text += "3. Grant camera permissions\n"
            error_text += "4. Try clicking 'Start Capture' button\n\n"
            error_text += "App will still work - you can process saved images."
            
            self.video_label.config(text=error_text, font=("Arial", 11))
            self.root.update()
            
            # Show error but don't block - app can still work
            try:
                messagebox.showwarning("Camera Warning", 
                    f"{error_msg}\n\nThe app can still work without camera preview.\nTry clicking 'Start Capture' to test camera access.")
            except:
                pass
    
    def start_capture(self):
        """Start the capture loop"""
        self.is_running = True
        self.capture_thread = threading.Thread(target=self.capture_loop, daemon=True)
        self.capture_thread.start()
    
    def toggle_capture(self):
        """Toggle capture on/off"""
        if self.is_running:
            self.is_running = False
            self.start_button.config(text="Start Capture")
            self.update_status("Stopped", "red")
        else:
            self.is_running = True
            self.start_button.config(text="Stop Capture")
            self.update_status("Scanning for pallet ticket...", "blue")
    
    def capture_loop(self):
        """Main capture loop"""
        last_sample_time = 0
        
        while True:
            if not self.is_running or not self.camera:
                time.sleep(0.1)
                continue
            
            current_time = time.time()
            
            # Sample frame at configured interval
            if current_time - last_sample_time >= CONFIG['frame_sample_interval']:
                ret, frame = self.camera.read()
                if ret:
                    # Update video preview
                    self.update_video_preview(frame)
                    
                    # Analyze frame if not processing
                    if not self.is_processing:
                        self.analyze_frame(frame)
                    
                    last_sample_time = current_time
            
            time.sleep(0.1)
    
    def update_video_preview(self, frame):
        """Update video preview in GUI"""
        try:
            if frame is None:
                return
            
            # Draw detection overlay if active
            if self.detection_active:
                h, w = frame.shape[:2]
                cv2.rectangle(frame, (w//10, h//10), (w*9//10, h*9//10), (0, 255, 0), 3)
                # Add text
                cv2.putText(frame, "TICKET DETECTED!", (w//2 - 150, h//2), 
                           cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)
            
            # Get canvas size (with fallback)
            try:
                self.video_canvas.update_idletasks()
                canvas_width = max(self.video_canvas.winfo_width(), 800)
                canvas_height = max(self.video_canvas.winfo_height(), 600)
            except:
                canvas_width = 800
                canvas_height = 600
            
            # Resize to fit canvas
            frame_height, frame_width = frame.shape[:2]
            if canvas_width > 1 and canvas_height > 1:
                scale = min(canvas_width / frame_width, canvas_height / frame_height)
                new_width = int(frame_width * scale)
                new_height = int(frame_height * scale)
            else:
                new_width = 800
                new_height = 600
                
            display_frame = cv2.resize(frame, (new_width, new_height))
            display_frame = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
            
            # Convert to PhotoImage
            img = Image.fromarray(display_frame)
            imgtk = ImageTk.PhotoImage(image=img)
            
            # Update canvas
            self.video_canvas.delete("all")
            x = (canvas_width - img.width) // 2
            y = (canvas_height - img.height) // 2
            self.video_canvas.create_image(x, y, anchor="nw", image=imgtk)
            
            # Keep reference to prevent garbage collection
            self.video_canvas.image = imgtk
            
            # Hide text label when showing video
            try:
                self.video_label.place_forget()
            except:
                pass
            
        except Exception as e:
            error_msg = f"Preview error: {e}"
            self.log(f"Preview error: {e}")
            print(error_msg)
            import traceback
            traceback.print_exc()
    
    def analyze_frame(self, frame):
        """Analyze frame for ticket detection"""
        # Calculate sharpness
        sharpness = self.calculate_sharpness(frame)
        if sharpness < CONFIG['sharpness_threshold']:
            return
        
        # Calculate text density
        text_density = self.calculate_text_density(frame)
        if text_density < CONFIG['text_density_threshold']:
            return
        
        # Check cooldown
        current_time = time.time()
        if current_time - self.last_submission_time < CONFIG['cooldown_period']:
            return
        
        # Calculate frame hash
        frame_hash = self.calculate_frame_hash(frame)
        if frame_hash == self.last_submission_hash:
            return
        
        # All conditions met - capture and process
        self.capture_and_process(frame, frame_hash)
    
    def calculate_sharpness(self, frame):
        """Calculate image sharpness using Laplacian variance"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        variance = laplacian.var()
        return variance
    
    def calculate_text_density(self, frame):
        """Calculate text density (edge density)"""
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_pixels = np.sum(edges > 0)
        total_pixels = edges.size
        return edge_pixels / total_pixels if total_pixels > 0 else 0
    
    def calculate_frame_hash(self, frame):
        """Calculate simple hash for duplicate detection"""
        # Sample pixels for hash
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        sampled = gray[::20, ::20]  # Sample every 20th pixel
        return hash(sampled.tobytes())
    
    def capture_and_process(self, frame, frame_hash):
        """Capture frame and process"""
        if self.is_processing:
            return
        
        self.is_processing = True
        self.last_submission_hash = frame_hash
        self.last_submission_time = time.time()
        
        # Show detection overlay
        self.detection_active = True
        self.update_status("Ticket detected — processing...", "orange")
        
        # Process in separate thread to avoid blocking
        threading.Thread(target=self.process_ticket, args=(frame.copy(),), daemon=True).start()
    
    def process_ticket(self, frame):
        """Process captured ticket"""
        try:
            self.log("Processing ticket...")
            
            # Save image
            timestamp = datetime.now()
            images_dir = Path(CONFIG['images_folder'])
            images_dir.mkdir(exist_ok=True)
            
            operator_id = CONFIG.get('operator_name', self.get_default_operator_name())
            filename = f"pallet_{timestamp.strftime('%Y%m%d_%H%M%S')}_{operator_id}.png"
            image_path = images_dir / filename
            cv2.imwrite(str(image_path), frame)
            
            self.log(f"Image saved: {filename}")
            
            # Run OCR
            if not self.ocr:
                raise Exception("OCR not initialized. Please check OCR settings.")
            
            self.log("Running OCR...")
            ocr_text = self.ocr.process_image(str(image_path))
            self.log(f"OCR completed: {len(ocr_text)} characters extracted")
            
            # Parse data
            parsed_data = self.parser.parse(ocr_text)
            self.log(f"Parsed {len(parsed_data['parsed'])} fields")
            
            # Prepare record
            record = {
                'timestamp': timestamp.isoformat(),
                'status': 'PENDING',
                'operator': CONFIG.get('operator_name', self.get_default_operator_name()),
                'image_path': str(image_path),
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
            if CONFIG.get('sheets_id'):
                result = self.sheets.add_pending_record(record)
                if result['success']:
                    self.log(f"✓ Submitted to Google Sheets (Row {result.get('row_num', '?')})")
                    self.update_status("Submitted for supervisor review ✓", "green")
                else:
                    self.log(f"✗ Sheets error: {result.get('error', 'Unknown')}")
                    self.update_status(f"Error: {result.get('error', 'Submission failed')}", "red")
            else:
                self.log("⚠ No Sheet ID configured - saving locally only")
                self.save_local_record(record)
                self.update_status("Saved locally (no Sheet ID)", "orange")
            
            # Reset detection overlay after delay
            time.sleep(3)
            self.detection_active = False
            
            time.sleep(2)
            self.update_status("Ready for next pallet", "blue")
            time.sleep(1)
            self.update_status("Scanning for pallet ticket...", "blue")
            
        except Exception as e:
            self.log(f"Processing error: {e}")
            self.update_status(f"Error: {str(e)}", "red")
            self.detection_active = False
        finally:
            self.is_processing = False
    
    def save_local_record(self, record):
        """Save record locally as JSON"""
        records_dir = Path('local_records')
        records_dir.mkdir(exist_ok=True)
        
        filename = f"record_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = records_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(record, f, indent=2)
        
        self.log(f"Saved local record: {filename}")
    
    def update_status(self, message, color="black"):
        """Update status label"""
        self.root.after(0, lambda: self.status_label.config(text=message, foreground=color))
    
    def log(self, message):
        """Add message to log"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_message = f"[{timestamp}] {message}\n"
        self.root.after(0, lambda: self.log_text.insert(tk.END, log_message))
        self.root.after(0, lambda: self.log_text.see(tk.END))
    
    def open_review_page(self):
        """Open supervisor review page in browser"""
        import webbrowser
        import subprocess
        import sys
        import os
        
        # Start Flask API server for review page
        review_server_path = os.path.join(os.path.dirname(__file__), 'review_server', 'api_server.py')
        
        if not os.path.exists(review_server_path):
            messagebox.showerror("Error", "Review server not found. Please start manually:\npython review_server/api_server.py")
            return
        
        try:
            # Start server in separate process
            subprocess.Popen([
                sys.executable, 
                review_server_path
            ], cwd=os.path.dirname(__file__))
            
            # Wait a moment for server to start
            time.sleep(2)
            
            # Open browser
            url = "http://localhost:5000"
            webbrowser.open(url)
            self.log(f"Review page opened at {url}")
        except Exception as e:
            messagebox.showerror("Error", f"Could not start review server: {e}\n\nStart manually:\npython review_server/api_server.py")
    
    def on_closing(self):
        """Cleanup on exit"""
        self.is_running = False
        if self.camera:
            self.camera.release()
        self.root.destroy()

def main():
    try:
        print("Creating main window...")
        root = tk.Tk()
        
        # Set window properties first - BEFORE creating app
        root.title("Pallet Ticket Capture")
        root.geometry("1200x800")
        root.minsize(1000, 700)
        
        print("Creating application...")
        app = PalletTicketApp(root)
        
        root.protocol("WM_DELETE_WINDOW", app.on_closing)
        
        # Force window updates multiple times
        root.update()
        root.update_idletasks()
        root.deiconify()
        root.lift()
        root.focus_force()
        root.update()
        
        # Make sure window is on top initially
        root.attributes('-topmost', True)
        root.update()
        root.attributes('-topmost', False)
        root.update()
        
        print("Window ready, starting mainloop...")
        print("If you don't see all UI elements, try resizing the window.")
        root.mainloop()
    except Exception as e:
        import traceback
        print(f"Fatal error: {e}")
        traceback.print_exc()
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()

