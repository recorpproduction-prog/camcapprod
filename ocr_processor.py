"""
OCR Processor with Online API Support
Supports multiple OCR APIs (no local Tesseract required)
"""

import base64
import requests
import json
from PIL import Image
import io

class OCRProcessor:
    def __init__(self, api_provider='ocrspace', api_key=None):
        """
        Initialize OCR processor with online API
        
        Args:
            api_provider: 'ocrspace', 'tesseractspace', 'google', or 'local'
            api_key: API key for the service (optional for some free services)
        """
        self.api_provider = api_provider.lower()
        self.api_key = api_key
        
        # OCR.space free API endpoint (no key required)
        self.ocrspace_url = "https://api.ocr.space/parse/image"
        
        # Tesseract.space API (requires free account)
        self.tesseractspace_url = "https://api.tesseract.space/v1/ocr"
        
        # Google Cloud Vision API
        self.google_vision_url = "https://vision.googleapis.com/v1/images:annotate"
    
    def process_image(self, image_path, preprocess=False):
        """
        Process image using online OCR API
        
        Args:
            image_path: Path to image file
            preprocess: Ignored for API-based OCR (not needed)
            
        Returns:
            Extracted text string
        """
        if self.api_provider == 'local':
            return self._process_local(image_path)
        elif self.api_provider == 'ocrspace':
            return self._process_ocrspace(image_path)
        elif self.api_provider == 'tesseractspace':
            return self._process_tesseractspace(image_path)
        elif self.api_provider == 'google':
            return self._process_google_vision(image_path)
        else:
            raise ValueError(f"Unknown API provider: {self.api_provider}")
    
    def _process_ocrspace(self, image_path):
        """
        Process using OCR.space API (FREE - no key required)
        25,000 requests/month free
        """
        # OCR.space can be slow; use 90s timeout + retry on transient timeouts
        timeout = 90

        for attempt in range(3):  # try up to 3 times
            try:
                with open(image_path, 'rb') as image_file:
                    payload = {
                        'apikey': self.api_key or 'helloworld',
                        'language': 'eng',
                        'isOverlayRequired': False,
                        'detectOrientation': True,
                        'OCREngine': 2,
                        'scale': True,
                    }
                    files = {'image': image_file}

                    response = requests.post(
                        self.ocrspace_url,
                        files=files,
                        data=payload,
                        timeout=timeout
                    )

                result = response.json()

                if result.get('OCRExitCode') == 1:
                    text_parts = []
                    for parsed_result in result.get('ParsedResults', []):
                        text_parts.append(parsed_result.get('ParsedText', ''))
                    return '\n'.join(text_parts).strip()
                else:
                    error_message = result.get('ErrorMessage', 'Unknown error')
                    raise Exception(f"OCR.space API error: {error_message}")

            except requests.exceptions.Timeout as e:
                if attempt < 2:
                    continue  # retry
                raise Exception(f"OCR.space API request failed: Read timed out after {timeout}s (tried 3 times)")
            except requests.exceptions.RequestException as e:
                raise Exception(f"OCR.space API request failed: {str(e)}")
            except Exception as e:
                if 'OCR.space API error' in str(e):
                    raise
                raise Exception(f"OCR.space processing failed: {str(e)}")
    
    def _process_tesseractspace(self, image_path):
        """
        Process using Tesseract.space API (requires free API key)
        Sign up at: https://tesseract.space
        """
        if not self.api_key:
            raise Exception("Tesseract.space requires an API key. Get one at: https://tesseract.space")
        
        try:
            with open(image_path, 'rb') as image_file:
                files = {'image': image_file}
                headers = {'Authorization': f'Bearer {self.api_key}'}
                
                response = requests.post(
                    self.tesseractspace_url,
                    files=files,
                    headers=headers,
                    timeout=90
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get('text', '').strip()
                else:
                    raise Exception(f"Tesseract.space API error: {response.status_code} - {response.text}")
                    
        except requests.exceptions.RequestException as e:
            raise Exception(f"Tesseract.space API request failed: {str(e)}")
    
    def _process_google_vision(self, image_path):
        """
        Process using Google Cloud Vision API
        Requires API key and billing enabled (free tier: 1000 requests/month)
        """
        if not self.api_key:
            raise Exception("Google Vision API requires an API key. Get one from Google Cloud Console")
        
        try:
            # Read and encode image
            with open(image_path, 'rb') as image_file:
                image_content = base64.b64encode(image_file.read()).decode('utf-8')
            
            # Prepare request
            request_data = {
                "requests": [{
                    "image": {
                        "content": image_content
                    },
                    "features": [{
                        "type": "TEXT_DETECTION",
                        "maxResults": 1
                    }]
                }]
            }
            
            # Make API call
            url = f"{self.google_vision_url}?key={self.api_key}"
            response = requests.post(
                url,
                json=request_data,
                timeout=90
            )
            
            if response.status_code == 200:
                result = response.json()
                if 'responses' in result and len(result['responses']) > 0:
                    if 'fullTextAnnotation' in result['responses'][0]:
                        return result['responses'][0]['fullTextAnnotation'].get('text', '').strip()
                    elif 'textAnnotations' in result['responses'][0]:
                        # Fallback to textAnnotations
                        annotations = result['responses'][0]['textAnnotations']
                        if annotations:
                            return annotations[0].get('description', '').strip()
                
                return ''
            else:
                error = response.json() if response.content else {'error': {'message': 'Unknown error'}}
                raise Exception(f"Google Vision API error: {error.get('error', {}).get('message', 'Unknown error')}")
                
        except requests.exceptions.RequestException as e:
            raise Exception(f"Google Vision API request failed: {str(e)}")
    
    def _process_local(self, image_path):
        """
        Fallback to local Tesseract (if installed)
        """
        try:
            import pytesseract
            from PIL import Image
            
            # Try to set tesseract path (Windows)
            try:
                pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
            except:
                pass
            
            img = Image.open(image_path)
            text = pytesseract.image_to_string(img, config='--oem 3 --psm 6')
            return text.strip()
            
        except ImportError:
            raise Exception("pytesseract not installed. Install with: pip install pytesseract")
        except Exception as e:
            raise Exception(f"Local Tesseract OCR failed: {str(e)}")
    
    def get_confidence_data(self, image_path):
        """
        Get OCR data with confidence scores (if API supports it)
        """
        # Most free APIs don't provide confidence scores
        # This is a placeholder - returns text with default confidence
        text = self.process_image(image_path)
        return {
            'text': text,
            'confidence': 85,  # Default confidence for API results
            'provider': self.api_provider
        }
