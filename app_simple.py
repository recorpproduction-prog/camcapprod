"""
Simplified Pallet Ticket Capture App
Ensures all UI elements are visible and functional
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

# Import modules
try:
    from ocr_processor import OCRProcessor
    from sheets_integration import SheetsIntegration
    from data_parser import DataParser
except ImportError as e:
    print(f"Import error: {e}")
    print("Make sure all files are in the same directory")

# Configuration
CONFIG = {
    'frame_sample_interval': 0.8,
    'cooldown_period': 30,
    'sharpness_threshold': 50,
    'text_density_threshold': 0.1,
    'images_folder': 'captured_images',
    'config_file': 'config.json',
    'operator_name': None,
    'sheets_id': None,
    'credentials_file': None,
    'ocr_provider': 'ocrspace',
    'ocr_api_key': None
}

class SimplePalletApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Pallet Ticket Capture")
        self.root.geometry("1200x800")
        self.root.minsize(1000, 700)
        
        # State
        self.camera = None
        self.is_running = False
        self.is_processing = False
        self.last_submission_hash = None
        self.last_submission_time = 0
        
        # Initialize components
        try:
            self.ocr = OCRProcessor(api_provider=CONFIG.get('ocr_provider', 'ocrspace'), 
                                  api_key=CONFIG.get('ocr_api_key'))
        except:
            self.ocr = None
        
        self.parser = DataParser()
        self.sheets = None
        
        # Create UI - SIMPLIFIED
        self.create_simple_ui()
        
        # Setup camera
        self.root.after(500, self.setup_camera)
        
        # Start capture loop
        self.capture_thread = None
        
    def create_simple_ui(self):
        """Create simplified, reliable UI"""
        
        # TOP: Status bar
        status_frame = tk.Frame(self.root, bg="lightblue", height=40)
        status_frame.pack(fill=tk.X, side=tk.TOP)
        
        self.status_label = tk.Label(status_frame, text="Ready - Click START CAPTURE", 
                                     font=("Arial", 12, "bold"), bg="lightblue")
        self.status_label.pack(pady=5)
        
        # MIDDLE: Camera preview (takes most space)
        camera_container = tk.Frame(self.root, bg="black")
        camera_container.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.video_canvas = tk.Canvas(camera_container, bg="black", width=800, height=600)
        self.video_canvas.pack(expand=True, fill=tk.BOTH)
        
        self.video_label = tk.Label(self.video_canvas, text="Initializing camera...", 
                                    fg="white", bg="black", font=("Arial", 14))
        self.video_label.place(relx=0.5, rely=0.5, anchor="center")
        
        # BOTTOM: Controls
        control_frame = tk.Frame(self.root, bg="lightgray", height=100)
        control_frame.pack(fill=tk.X, side=tk.BOTTOM)
        
        # Buttons
        btn_frame = tk.Frame(control_frame, bg="lightgray")
        btn_frame.pack(pady=10)
        
        self.start_btn = tk.Button(btn_frame, text="START CAPTURE", 
                                   command=self.toggle_capture,
                                   font=("Arial", 14, "bold"),
                                   bg="green", fg="white",
                                   width=15, height=2)
        self.start_btn.pack(side=tk.LEFT, padx=10)
        
        view_btn = tk.Button(btn_frame, text="View Data", 
                            command=self.view_data,
                            font=("Arial", 12),
                            width=12, height=2)
        view_btn.pack(side=tk.LEFT, padx=10)
        
        exit_btn = tk.Button(btn_frame, text="Exit", 
                            command=self.on_closing,
                            font=("Arial", 12),
                            width=10, height=2)
        exit_btn.pack(side=tk.LEFT, padx=10)
        
        # Log area (small, at bottom)
        log_frame = tk.Frame(self.root, height=80, bg="white")
        log_frame.pack(fill=tk.BOTH, side=tk.BOTTOM, padx=10, pady=5)
        
        tk.Label(log_frame, text="Activity Log:", font=("Arial", 10, "bold")).pack(anchor="w")
        
        log_container = tk.Frame(log_frame)
        log_container.pack(fill=tk.BOTH, expand=True)
        
        self.log_text = tk.Text(log_container, height=3, wrap=tk.WORD, font=("Courier", 9))
        scrollbar = tk.Scrollbar(log_container, command=self.log_text.yview)
        self.log_text.config(yscrollcommand=scrollbar.set)
        
        self.log_text.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        self.log("Application started - UI loaded")
        
        # Force update
        self.root.update()
        
    def log(self, message):
        """Add log message"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_msg = f"[{timestamp}] {message}\n"
        try:
            self.log_text.insert(tk.END, log_msg)
            self.log_text.see(tk.END)
            print(log_msg.strip())
        except:
            print(log_msg.strip())
    
    def setup_camera(self):
        """Setup camera"""
        try:
            self.log("Initializing camera...")
            self.status_label.config(text="Initializing camera...", bg="orange")
            self.root.update()
            
            self.camera = cv2.VideoCapture(0)
            
            if not self.camera.isOpened():
                for i in range(1, 5):
                    self.camera = cv2.VideoCapture(i)
                    if self.camera.isOpened():
                        break
                
                if not self.camera.isOpened():
                    raise Exception("No camera found")
            
            self.camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
            self.camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
            
            ret, frame = self.camera.read()
            if ret:
                self.update_preview(frame)
                self.log("Camera ready!")
                self.status_label.config(text="Camera ready - Click START CAPTURE", bg="lightgreen")
            else:
                raise Exception("Cannot read from camera")
                
        except Exception as e:
            error_msg = f"Camera error: {e}"
            self.log(error_msg)
            self.status_label.config(text=f"Camera Error: {e}", bg="red")
            self.video_label.config(text=f"Camera Error\n\n{str(e)}\n\nClick START CAPTURE to retry")
            messagebox.showwarning("Camera", f"{error_msg}\n\nYou can still click START CAPTURE to try again.")
    
    def update_preview(self, frame):
        """Update video preview"""
        try:
            if frame is None:
                return
            
            # Resize for display
            h, w = frame.shape[:2]
            canvas_w = self.video_canvas.winfo_width()
            canvas_h = self.video_canvas.winfo_height()
            
            if canvas_w > 1 and canvas_h > 1:
                scale = min(canvas_w / w, canvas_h / h)
                new_w = int(w * scale)
                new_h = int(h * scale)
                frame = cv2.resize(frame, (new_w, new_h))
            else:
                frame = cv2.resize(frame, (800, 600))
            
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            img = Image.fromarray(frame_rgb)
            imgtk = ImageTk.PhotoImage(image=img)
            
            self.video_canvas.delete("all")
            x = (self.video_canvas.winfo_width() - img.width) // 2
            y = (self.video_canvas.winfo_height() - img.height) // 2
            self.video_canvas.create_image(x, y, anchor="nw", image=imgtk)
            self.video_canvas.image = imgtk
            
            try:
                self.video_label.place_forget()
            except:
                pass
                
        except Exception as e:
            self.log(f"Preview error: {e}")
    
    def toggle_capture(self):
        """Toggle capture on/off"""
        if not self.is_running:
            # Start
            if not self.camera:
                self.setup_camera()
            
            if self.camera and self.camera.isOpened():
                self.is_running = True
                self.start_btn.config(text="STOP CAPTURE", bg="red")
                self.status_label.config(text="Scanning for pallet ticket...", bg="lightblue")
                self.log("Capture started")
                
                # Start capture thread
                self.capture_thread = threading.Thread(target=self.capture_loop, daemon=True)
                self.capture_thread.start()
            else:
                messagebox.showerror("Error", "Camera not available. Please check camera connection.")
        else:
            # Stop
            self.is_running = False
            self.start_btn.config(text="START CAPTURE", bg="green")
            self.status_label.config(text="Stopped", bg="gray")
            self.log("Capture stopped")
    
    def capture_loop(self):
        """Main capture loop"""
        last_sample = 0
        
        while self.is_running:
            if not self.camera or not self.camera.isOpened():
                time.sleep(1)
                continue
            
            current_time = time.time()
            
            if current_time - last_sample >= CONFIG['frame_sample_interval']:
                ret, frame = self.camera.read()
                if ret:
                    self.root.after(0, lambda f=frame: self.update_preview(f))
                    self.analyze_frame(frame)
                last_sample = current_time
            
            time.sleep(0.1)
    
    def analyze_frame(self, frame):
        """Analyze frame for detection"""
        # Simple detection logic
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness = laplacian.var()
        
        if sharpness > CONFIG['sharpness_threshold']:
            current_time = time.time()
            if current_time - self.last_submission_time >= CONFIG['cooldown_period']:
                self.capture_and_process(frame)
    
    def capture_and_process(self, frame):
        """Capture and process ticket"""
        if self.is_processing:
            return
        
        self.is_processing = True
        self.last_submission_time = time.time()
        
        threading.Thread(target=self.process_ticket, args=(frame.copy(),), daemon=True).start()
    
    def process_ticket(self, frame):
        """Process ticket"""
        try:
            self.root.after(0, lambda: self.status_label.config(text="Processing ticket...", bg="orange"))
            self.log("Processing ticket...")
            
            # Save image
            timestamp = datetime.now()
            images_dir = Path(CONFIG['images_folder'])
            images_dir.mkdir(exist_ok=True)
            
            filename = f"pallet_{timestamp.strftime('%Y%m%d_%H%M%S')}.png"
            image_path = images_dir / filename
            cv2.imwrite(str(image_path), frame)
            
            self.log(f"Image saved: {filename}")
            
            # OCR
            if self.ocr:
                ocr_text = self.ocr.process_image(str(image_path))
                self.log(f"OCR: {len(ocr_text)} chars extracted")
            else:
                ocr_text = "OCR not available"
            
            # Parse
            parsed = self.parser.parse(ocr_text)
            
            # Save record
            record = {
                'timestamp': timestamp.isoformat(),
                'status': 'PENDING',
                'operator': 'Auto-System',
                'image_path': str(image_path),
                'raw_ocr_text': ocr_text,
                **parsed['parsed']
            }
            
            # Save locally
            records_dir = Path('local_records')
            records_dir.mkdir(exist_ok=True)
            record_file = records_dir / f"record_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
            with open(record_file, 'w') as f:
                json.dump(record, f, indent=2)
            
            self.log(f"✓ Record saved: {record_file.name}")
            self.root.after(0, lambda: self.status_label.config(text="Saved! Ready for next ticket", bg="lightgreen"))
            
            time.sleep(3)
            self.root.after(0, lambda: self.status_label.config(text="Scanning for pallet ticket...", bg="lightblue"))
            
        except Exception as e:
            self.log(f"Error: {e}")
            self.root.after(0, lambda: self.status_label.config(text=f"Error: {e}", bg="red"))
        finally:
            self.is_processing = False
    
    def view_data(self):
        """View captured data"""
        messagebox.showinfo("View Data", "Opening data viewer...\n\nCheck the 'local_records' folder for captured records.")
    
    def on_closing(self):
        """Cleanup"""
        self.is_running = False
        if self.camera:
            self.camera.release()
        self.root.destroy()

def main():
    try:
        root = tk.Tk()
        app = SimplePalletApp(root)
        root.protocol("WM_DELETE_WINDOW", app.on_closing)
        root.mainloop()
    except Exception as e:
        import traceback
        print(f"Error: {e}")
        traceback.print_exc()
        input("Press Enter to exit...")

if __name__ == "__main__":
    main()


