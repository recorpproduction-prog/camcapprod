"""
Google Sheets Integration
Handles reading/writing to Google Sheets
"""

import gspread
from google.oauth2.service_account import Credentials
from datetime import datetime
import json

# Column configuration (matches Code.gs)
COLUMNS = [
    "timestamp",
    "status",
    "item_number",
    "item_description",
    "batch_no",
    "quantity",
    "date",
    "time",
    "customer_item_number",
    "ean_number",
    "sscc",
    "handwritten_number",
    "operator",
    "notes",
    "image_drive_url",
    "raw_ocr_text",
    "reviewed_by",
    "reviewed_timestamp"
]

class SheetsIntegration:
    def __init__(self, sheet_id=None, credentials_file=None):
        """
        Initialize Google Sheets integration
        
        Args:
            sheet_id: Google Sheet ID
            credentials_file: Path to Google service account JSON credentials
        """
        self.sheet_id = sheet_id
        self.client = None
        self.spreadsheet = None
        
        if credentials_file and sheet_id:
            self.connect(credentials_file)
    
    def connect(self, credentials_file):
        """
        Connect to Google Sheets using service account credentials
        
        Args:
            credentials_file: Path to JSON credentials file
        """
        try:
            # Define scope
            scope = [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive'
            ]
            
            # Load credentials
            creds = Credentials.from_service_account_file(
                credentials_file, 
                scopes=scope
            )
            
            # Create client
            self.client = gspread.authorize(creds)
            
            # Open spreadsheet
            if self.sheet_id:
                self.spreadsheet = self.client.open_by_key(self.sheet_id)
            
            return True
            
        except Exception as e:
            raise Exception(f"Failed to connect to Google Sheets: {str(e)}")
    
    def get_or_create_sheet(self, sheet_name):
        """Get existing sheet or create new one"""
        try:
            if not self.spreadsheet:
                raise Exception("No spreadsheet connected")
            
            try:
                sheet = self.spreadsheet.worksheet(sheet_name)
            except gspread.exceptions.WorksheetNotFound:
                # Create new sheet
                sheet = self.spreadsheet.add_worksheet(
                    title=sheet_name,
                    rows=1000,
                    cols=len(COLUMNS)
                )
                # Add headers
                sheet.append_row(COLUMNS)
                # Format header row
                sheet.format('1:1', {'textFormat': {'bold': True}})
                # Freeze header row
                sheet.freeze(rows=1)
            
            return sheet
            
        except Exception as e:
            raise Exception(f"Failed to get/create sheet '{sheet_name}': {str(e)}")
    
    def add_pending_record(self, record):
        """
        Add record to PENDING_REVIEW sheet
        
        Args:
            record: Dictionary with record data
            
        Returns:
            Dictionary with 'success' and optional 'row_num' or 'error'
        """
        try:
            if not self.spreadsheet:
                return {'success': False, 'error': 'No spreadsheet connected'}
            
            sheet = self.get_or_create_sheet('PENDING_REVIEW')
            
            # Prepare row data in column order
            row_data = []
            for col in COLUMNS:
                value = record.get(col, '')
                row_data.append(str(value) if value is not None else '')
            
            # Append row
            sheet.append_row(row_data)
            
            # Get row number
            row_num = len(sheet.get_all_values())
            
            return {'success': True, 'row_num': row_num}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def sscc_exists(self, sscc):
        """Check if SSCC (pallet ID) already exists in PENDING_REVIEW or APPROVED_RECORDS"""
        if not sscc or not self.spreadsheet:
            return False
        try:
            sscc_clean = str(sscc).strip()
            for sheet_name in ['PENDING_REVIEW', 'APPROVED_RECORDS']:
                try:
                    sheet = self.spreadsheet.worksheet(sheet_name)
                    col_idx = COLUMNS.index('sscc') + 1 if 'sscc' in COLUMNS else 0
                    if col_idx > 0:
                        col_values = sheet.col_values(col_idx)
                        if sscc_clean in [str(v).strip() for v in col_values]:
                            return True
                except gspread.exceptions.WorksheetNotFound:
                    pass
            return False
        except Exception as e:
            print(f"Error checking SSCC: {e}")
            return False
    
    def get_pending_records(self):
        """Get all pending records with _rowNumber for approve/reject"""
        try:
            if not self.spreadsheet:
                return []
            
            sheet = self.get_or_create_sheet('PENDING_REVIEW')
            all_values = sheet.get_all_values()
            if len(all_values) < 2:
                return []
            
            header = all_values[0]
            pending = []
            for i in range(1, len(all_values)):
                row = all_values[i]
                record = dict(zip(header, row + [''] * (len(header) - len(row))))
                if str(record.get('status', '')).upper() == 'PENDING':
                    record['_rowNumber'] = i + 1  # 1-based row in sheet
                    pending.append(record)
            return pending
            
        except Exception as e:
            print(f"Error getting pending records: {e}")
            return []
    
    def approve_record(self, row_number):
        """Approve a record (move to APPROVED_RECORDS)"""
        try:
            if not self.spreadsheet:
                return {'success': False, 'error': 'No spreadsheet connected'}
            
            pending_sheet = self.get_or_create_sheet('PENDING_REVIEW')
            approved_sheet = self.get_or_create_sheet('APPROVED_RECORDS')
            
            # Get record
            row_data = pending_sheet.row_values(row_number)
            
            # Update status
            status_col = COLUMNS.index('status') + 1
            pending_sheet.update_cell(row_number, status_col, 'APPROVED')
            
            # Copy to approved sheet
            approved_sheet.append_row(row_data)
            
            return {'success': True}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def reject_record(self, row_number, reason):
        """Reject a record (move to REJECTED_RECORDS)"""
        try:
            if not self.spreadsheet:
                return {'success': False, 'error': 'No spreadsheet connected'}
            
            pending_sheet = self.get_or_create_sheet('PENDING_REVIEW')
            rejected_sheet = self.get_or_create_sheet('REJECTED_RECORDS')
            
            # Get record
            row_data = pending_sheet.row_values(row_number)
            
            # Update status
            status_col = COLUMNS.index('status') + 1
            pending_sheet.update_cell(row_number, status_col, 'REJECTED')
            
            # Add rejection reason to notes
            notes_col = COLUMNS.index('notes') + 1
            current_notes = pending_sheet.cell(row_number, notes_col).value or ''
            new_notes = f"{current_notes} | REJECTION REASON: {reason}"
            pending_sheet.update_cell(row_number, notes_col, new_notes)
            
            # Update row data with rejection reason
            if len(row_data) > COLUMNS.index('notes'):
                row_data[COLUMNS.index('notes')] = new_notes
            else:
                row_data.extend([''] * (COLUMNS.index('notes') - len(row_data) + 1))
                row_data[COLUMNS.index('notes')] = new_notes
            
            # Copy to rejected sheet
            rejected_sheet.append_row(row_data)
            
            return {'success': True}
            
        except Exception as e:
            return {'success': False, 'error': str(e)}


