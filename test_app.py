"""
Quick test script to verify the app starts properly
"""

import tkinter as tk
from app import PalletTicketApp

if __name__ == "__main__":
    print("Starting Pallet Ticket Capture...")
    print("Checking imports...")
    
    try:
        import cv2
        print("✓ OpenCV imported")
    except ImportError as e:
        print(f"✗ OpenCV import failed: {e}")
    
    try:
        import requests
        print("✓ Requests imported")
    except ImportError as e:
        print(f"✗ Requests import failed: {e}")
    
    try:
        from ocr_processor import OCRProcessor
        print("✓ OCR processor imported")
        ocr = OCRProcessor(api_provider='ocrspace', api_key=None)
        print("✓ OCR processor initialized")
    except Exception as e:
        print(f"✗ OCR processor failed: {e}")
    
    print("\nStarting GUI...")
    root = tk.Tk()
    app = PalletTicketApp(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.deiconify()
    root.lift()
    root.mainloop()


