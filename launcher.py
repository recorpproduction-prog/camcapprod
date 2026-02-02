"""
One-Click Launcher for Pallet Ticket Capture
Checks dependencies and starts the application
"""

import sys
import subprocess
import os

def check_python():
    """Check if Python version is adequate"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("[ERROR] Python 3.8+ required")
        print(f"Current version: {sys.version}")
        return False
    print(f"[OK] Python {version.major}.{version.minor}.{version.micro}")
    return True

def check_dependencies():
    """Check if required packages are installed"""
    # Packages that need to be installed via pip (pytesseract is optional)
    required_pip = ['cv2', 'numpy', 'PIL', 'requests', 'gspread']
    # tkinter is built-in to Python but needs special handling
    missing = []
    
    # Check pip-installable packages
    for package in required_pip:
        try:
            if package == 'cv2':
                import cv2
            elif package == 'PIL':
                import PIL
            else:
                __import__(package)
            print(f"[OK] {package}")
        except ImportError:
            missing.append(package)
            print(f"[MISSING] {package}")
    
    # Check tkinter separately (built-in but sometimes missing)
    try:
        import tkinter
        print(f"[OK] tkinter (built-in)")
    except ImportError:
        print(f"[WARNING] tkinter not available")
        print("  tkinter comes with Python but may need:")
        print("  - Windows: Reinstall Python with 'tcl/tk' option")
        print("  - Linux: Install python3-tk package")
        print("  - Mac: Should be included by default")
        # Don't add to missing since it can't be installed via pip
        # The app will fail to start if tkinter is missing, but we'll handle that in start_app
    
    return missing

def install_dependencies():
    """Install missing dependencies"""
    print("\nInstalling missing dependencies...")
    try:
        # Install packages individually to avoid tkinter error
        packages = [
            'opencv-python>=4.8.0',
            'numpy>=1.24.0',
            'Pillow>=10.0.0',
            'requests>=2.31.0',  # For online OCR APIs
            'gspread>=5.12.0',
            'google-auth>=2.23.0',
            'google-auth-oauthlib>=1.1.0',
            'google-auth-httplib2>=0.1.1',
            'flask>=3.0.0',
            'flask-cors>=4.0.0'
        ]
        
        for package in packages:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', package], 
                                stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
        
        print("[OK] Dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print("[ERROR] Failed to install some dependencies")
        print("Trying requirements.txt...")
        try:
            # Try requirements.txt as fallback (will skip tkinter automatically)
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'],
                                stderr=subprocess.DEVNULL)
            print("[OK] Dependencies installed")
            return True
        except:
            print("[ERROR] Failed to install dependencies")
            print("Please run manually: pip install -r requirements.txt")
            return False

def check_tesseract():
    """Check if Tesseract is available (optional - online OCR is default)"""
    try:
        import pytesseract
        pytesseract.get_tesseract_version()
        print("[OK] Local Tesseract OCR found (optional)")
        return True
    except:
        print("[INFO] Local Tesseract not installed (optional)")
        print("Using online OCR APIs by default - no local installation needed!")
        print("\nOnline OCR options:")
        print("  - OCR.space (FREE, 25k/month, no key needed)")
        print("  - Tesseract.space (FREE with account)")
        print("  - Google Vision API (FREE tier: 1000/month)")
        return False

def start_app():
    """Start the main application"""
    print("\n" + "="*50)
    print("Starting Pallet Ticket Capture...")
    print("="*50 + "\n")
    
    try:
        # Import and run the main app
        from app import main
        main()
    except KeyboardInterrupt:
        print("\n\nApplication stopped by user")
    except Exception as e:
        print(f"\n[ERROR] Application crashed: {e}")
        import traceback
        traceback.print_exc()
        input("\nPress Enter to exit...")

def main():
    """Main launcher function"""
    print("="*50)
    print("Pallet Ticket Capture - Launcher")
    print("="*50 + "\n")
    
    # Check Python version
    if not check_python():
        input("\nPress Enter to exit...")
        sys.exit(1)
    
    print("\nChecking dependencies...")
    missing = check_dependencies()
    
    if missing:
        print(f"\n[WARNING] Missing packages: {', '.join(missing)}")
        
        # Auto-install if run from batch file (non-interactive)
        # Otherwise prompt user
        try:
            response = input("Install missing packages? (y/n): ").strip().lower()
        except (EOFError, KeyboardInterrupt):
            # Non-interactive mode (e.g., from batch file) - auto-install
            print("\n[Auto-installing] (non-interactive mode)")
            response = 'y'
        
        if response == 'y' or response == '':
            if not install_dependencies():
                try:
                    input("\nPress Enter to exit...")
                except (EOFError, KeyboardInterrupt):
                    pass
                sys.exit(1)
        else:
            print("Please install dependencies manually: pip install -r requirements.txt")
            try:
                input("\nPress Enter to exit...")
            except (EOFError, KeyboardInterrupt):
                pass
            sys.exit(1)
    
    # Check Tesseract (non-blocking)
    print("\nChecking Tesseract OCR...")
    check_tesseract()
    
    # Small delay before starting
    print("\nStarting in 2 seconds...")
    import time
    time.sleep(2)
    
    # Start the app
    start_app()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nLauncher stopped")
        sys.exit(0)

