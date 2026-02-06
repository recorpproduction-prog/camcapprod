"""
Data Parser
Extracts data from Brix & Co / Recorp labels - only the headings that appear on the label
"""

import re

class DataParser:
    def __init__(self):
        """Fields that match the label headings exactly"""
        self.field_configs = {
            'item_number': {
                'keywords': ['ITEM NUMBER'],
                'patterns': [r'ITEM\s*NUMBER[\s:]+([A-Z0-9\-]+)']
            },
            'item_description': {
                'keywords': ['ITEM DESCRIPTION'],
                'patterns': [r'ITEM\s*DESCRIPTION[\s:]+(.+?)(?=\n|BATCH|QUANTITY|DATE|$)']
            },
            'batch_no': {
                'keywords': ['BATCH NO'],
                'patterns': [r'BATCH\s*NO\.?[\s:]+(\d+)']
            },
            'quantity': {
                'keywords': ['QUANTITY'],
                'patterns': [r'QUANTITY[\s:]+(\d+(?:\.\d+)?)']
            },
            'date': {
                'keywords': ['DATE'],
                'patterns': [r'\bDATE[\s:]+(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})']
            },
            'time': {
                'keywords': ['TIME'],
                'patterns': [r'TIME[\s:]+(\d{1,2}:\d{2})']
            },
            'customer_item_number': {
                'keywords': ['CUSTOMER ITEM NUMBER'],
                'patterns': [r'CUSTOMER\s*ITEM\s*NUMBER[\s:]+(.+?)(?=\n|$)']
            },
            'ean_number': {
                'keywords': ['EAN NUMBER'],
                'patterns': [r'EAN\s*NUMBER[\s:]+(.+?)(?=\n|$)']
            },
            'sscc': {
                'keywords': ['6SCC', 'SSCC'],
                'patterns': [
                    r'6SCC\s*\(?\s*00\s*\)?\s*([0-9]{16,22})',
                    r'\(00\)\s*([0-9]{16,22})',
                    r'SSCC[\s:]*([0-9]{18})'
                ]
            },
            'handwritten_number': {
                'keywords': [],
                'patterns': []  # Extracted in unstructured parse - standalone 1-3 digit
            }
        }
    
    def normalize_text(self, text):
        if not text or not text.strip():
            return ''
        normalized = text.upper()
        normalized = re.sub(r'[ \t]+', ' ', normalized)
        normalized = re.sub(r'[^\w\s:/\-\.,()]', ' ', normalized)
        return normalized.strip()
    
    def parse(self, ocr_text):
        normalized = self.normalize_text(ocr_text)
        parsed = {}
        confidence = {}
        warnings = []
        
        for field_name, config in self.field_configs.items():
            value, conf_level = self._parse_field(normalized, ocr_text, config['patterns'], config['keywords'])
            if field_name == 'sscc' and value:
                # Store only the numeric part (e.g. 000000000000222051), not "6SCC(00)..."
                digits = re.sub(r'[^0-9]', '', str(value))
                value = digits if len(digits) >= 16 else value
            if field_name == 'item_number' and value and not self._valid_item_number(value):
                value = ''
                conf_level = 'low'
            if field_name == 'date' and value and not self._valid_date(value):
                value = ''
                conf_level = 'low'
            if field_name == 'time' and value and not self._valid_time(value):
                value = ''
                conf_level = 'low'
            if field_name == 'quantity' and value and not self._valid_quantity(value):
                value = ''
                conf_level = 'low'
            parsed[field_name] = value
            confidence[field_name] = conf_level
            if not value:
                warnings.append(f"'{field_name}' not found")
        
        # Fallback: "Heading: Value" on same line
        lines = [l.strip() for l in ocr_text.split('\n') if l.strip()]
        for line in lines:
            if ':' not in line:
                continue
            parts = line.split(':', 1)
            if len(parts) != 2:
                continue
            key = parts[0].strip().upper()
            value = parts[1].strip()
            if not value or value.upper() == 'N/A':
                continue
            
            if 'ITEM NUMBER' in key and 'CUSTOMER' not in key and not parsed.get('item_number'):
                val = re.sub(r'[^\w\-]', '', value).strip()
                if val and self._valid_item_number(val):
                    parsed['item_number'] = val[:40]
                    confidence['item_number'] = 'high'
            elif 'ITEM DESCRIPTION' in key and not parsed.get('item_description'):
                parsed['item_description'] = value[:100]
                confidence['item_description'] = 'high'
            elif 'BATCH NO' in key and not parsed.get('batch_no'):
                parsed['batch_no'] = re.sub(r'[^\w]', '', value)[:20]
                confidence['batch_no'] = 'high'
            elif 'QUANTITY' in key and not parsed.get('quantity'):
                m = re.search(r'(\d+(?:\.\d+)?)', value)
                if m and self._valid_quantity(m.group(1)):
                    parsed['quantity'] = m.group(1)
                    confidence['quantity'] = 'high'
            elif key == 'DATE' and not parsed.get('date'):
                m = re.search(r'(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})', value)
                if m and not re.search(r'\d{1,2}:\d{2}', value) and self._valid_date(m.group(1)):
                    parsed['date'] = m.group(1)
                    confidence['date'] = 'high'
            elif key == 'TIME' and not parsed.get('time'):
                m = re.search(r'(\d{1,2}:\d{2}(?::\d{2})?)', value)
                if m and not re.search(r'\d{1,2}/\d{1,2}/\d{2,4}', value) and self._valid_time(m.group(1)):
                    parsed['time'] = m.group(1)
                    confidence['time'] = 'high'
            elif 'CUSTOMER ITEM NUMBER' in key and not parsed.get('customer_item_number'):
                parsed['customer_item_number'] = value[:40]
                confidence['customer_item_number'] = 'high'
            elif 'EAN NUMBER' in key and not parsed.get('ean_number'):
                parsed['ean_number'] = value[:30]
                confidence['ean_number'] = 'high'
        
        # SSCC: store only the numeric part (no "6SCC(00)" prefix)
        if not parsed.get('sscc'):
            m = re.search(r'\(00\)\s*([0-9]{16,22})', ocr_text)
            if m:
                parsed['sscc'] = m.group(1)
                confidence['sscc'] = 'high'
            else:
                m = re.search(r'6SCC\s*\(?\s*00\s*\)?\s*([0-9]{16,22})', ocr_text)
                if m:
                    parsed['sscc'] = m.group(1)
                    confidence['sscc'] = 'high'
        
        # When OCR returns unstructured text (no "Heading: Value"), use content heuristics
        self._parse_unstructured(ocr_text, parsed, confidence)
        
        return {'parsed': parsed, 'confidence': confidence, 'warnings': warnings}
    
    def _parse_unstructured(self, ocr_text, parsed, confidence):
        """Extract from OCR text when headings are missing (values only, line by line)"""
        lines = [l.strip() for l in ocr_text.split('\n') if l.strip()]
        
        for line in lines:
            line_clean = re.sub(r'["\']', '', line).strip()
            if not line_clean:
                continue
            
            # Item Number: BRI023A250SM200BMHP style (2-3 letters + numbers + alphanumeric, 15+ chars)
            code = re.sub(r'\s+', '', line_clean)
            if not parsed.get('item_number') and re.match(r'^[A-Z]{2,3}\d+[A-Z0-9\-]{8,}$', code, re.I) and len(code) >= 15:
                parsed['item_number'] = code[:40]
                confidence['item_number'] = 'medium'
            
            # Item Description: "Brix & Co" product name (e.g. BRIX & CO ALBA RASPBERRY 5.9% 250ML)
            elif not parsed.get('item_description') and ('BRIX' in line_clean.upper() or ('RIX' in line_clean.upper() and 'CO' in line_clean.upper())):
                parsed['item_description'] = line_clean[:100]
                confidence['item_description'] = 'medium'
            
            # Item Description: product-style line with ML, %, or descriptive text
            elif not parsed.get('item_description') and len(line_clean) > 10:
                if re.search(r'\d+%|\d+\s*ML|RASPBERRY|LAGER|ALE|BEER|JUICE', line_clean, re.I):
                    parsed['item_description'] = line_clean[:100]
                    confidence['item_description'] = 'medium'
                elif re.search(r'[A-Z]+\s+[A-Z]', line_clean) and not re.match(r'^\d+$', line_clean) and 'RECORP' not in line_clean.upper():
                    parsed['item_description'] = line_clean[:100]
                    confidence['item_description'] = 'low'
            
            # Batch No: 6-digit number
            elif not parsed.get('batch_no') and re.match(r'^\d{6}$', line_clean):
                parsed['batch_no'] = line_clean
                confidence['batch_no'] = 'medium'
            
            # Quantity: 3-5 digit number (standalone)
            elif not parsed.get('quantity') and re.match(r'^\d{3,5}$', line_clean):
                parsed['quantity'] = line_clean
                confidence['quantity'] = 'medium'
            
            # Date: DD/MM/YYYY only (no time format, no "TIME" text)
            elif not parsed.get('date'):
                m = re.search(r'(\d{1,2}/\d{1,2}/\d{2,4})', line_clean)
                if m and not re.search(r'\d{1,2}:\d{2}', line_clean):
                    parsed['date'] = m.group(1)
                    confidence['date'] = 'medium'
            
            # Time: HH:MM only (no date format)
            elif not parsed.get('time'):
                m = re.search(r'(\d{1,2}:\d{2})', line_clean)
                if m and not re.search(r'\d{1,2}/\d{1,2}/\d{2,4}', line_clean):
                    parsed['time'] = m.group(1)
                    confidence['time'] = 'medium'
            
            # SSCC: store only the numeric part
            elif not parsed.get('sscc'):
                m = re.search(r'6SCC\s*\(?\s*00\s*\)?\s*([0-9]{16,22})', line_clean, re.I)
                if m:
                    parsed['sscc'] = m.group(1)
                    confidence['sscc'] = 'high'
                else:
                    m = re.search(r'\(00\)\s*([0-9]{16,22})', line_clean)
                    if m:
                        parsed['sscc'] = m.group(1)
                        confidence['sscc'] = 'high'
            
            # Handwritten number: standalone 1-2 digit (e.g. "29" written on label)
            elif not parsed.get('handwritten_number') and re.match(r'^\d{1,2}$', line_clean):
                parsed['handwritten_number'] = line_clean
                confidence['handwritten_number'] = 'medium'
    
    def _parse_field(self, normalized_text, original_text, patterns, keywords):
        for pattern in patterns:
            try:
                match = re.search(pattern, normalized_text, re.IGNORECASE)
                if match and match.group(1):
                    value = self._clean(match.group(1))
                    if value and value.upper() != 'N/A':
                        return value, 'high'
            except re.error:
                continue
        
        for keyword in keywords:
            pat = rf'{re.escape(keyword)}[\s:]+([^\n\r]+)'
            match = re.search(pat, normalized_text, re.IGNORECASE)
            if match and match.group(1):
                value = self._clean(match.group(1))
                if value and value.upper() != 'N/A':
                    return value, 'medium'
        
        return '', 'low'
    
    def _valid_date(self, value):
        """Date must be DD/MM/YYYY format, not TIME or time format"""
        val = value.strip().upper()
        if val in ('DATE', 'TIME'):
            return False
        if re.search(r'\d{1,2}:\d{2}', val):
            return False
        return bool(re.search(r'\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}', val))
    
    def _valid_time(self, value):
        """Time must be HH:MM format, not DATE or date format"""
        val = value.strip().upper()
        if val in ('DATE', 'TIME'):
            return False
        if re.search(r'\d{1,2}/\d{1,2}/\d{2,4}', val):
            return False
        return bool(re.search(r'\d{1,2}:\d{2}', val))
    
    def _valid_quantity(self, value):
        """Quantity must be numeric only - reject DATE, TIME, or other labels"""
        if not value:
            return False
        val = str(value).strip().upper()
        if val in ('DATE', 'TIME', 'N/A', 'EA', 'ES'):
            return False
        return bool(re.match(r'^\d+(\.\d+)?$', val))

    def _valid_item_number(self, value):
        """Reject units (ea, es, etc.) and require proper item code format"""
        if not value or value.upper() == 'N/A':
            return False
        val = re.sub(r'[^\w]', '', value).strip().upper()
        if val in ('EA', 'ES', 'CS', 'CT', 'PC', 'KG', 'LB', 'BAG', 'BOX'):
            return False
        if len(val) < 10:
            return False
        if not re.search(r'[A-Z]', val) or not re.search(r'\d', val):
            return False
        return True
    
    def _clean(self, value):
        if not value:
            return ''
        cleaned = ' '.join(value.split()).strip(' -:;,.')
        return cleaned[:100] if len(cleaned) > 100 else cleaned
