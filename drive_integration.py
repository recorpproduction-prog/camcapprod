"""
Google Drive Integration
Uploads captured images to Drive in date-based folders (7am-7am day blocks).
"""

from datetime import datetime
from pathlib import Path
import io
import os

def get_date_folder_name():
    """
    Get folder name for current 7am-7am day block.
    Day runs 7:00 AM to 6:59:59 AM next day.
    E.g. 3am Jan 31 -> Jan 30 folder (still in yesterday's block)
    E.g. 10am Jan 31 -> Jan 31 folder
    """
    now = datetime.now()
    if now.hour < 7:
        # Before 7am: we're in the block that started yesterday 7am
        from datetime import timedelta
        day_start = now.date() - timedelta(days=1)
    else:
        day_start = now.date()
    return day_start.strftime('%Y-%m-%d')


def get_credentials(credentials_file=None, credentials_json=None):
    """Build credentials from file or JSON string."""
    from google.oauth2.service_account import Credentials
    scope = ['https://www.googleapis.com/auth/drive']  # Create folders, upload, set permissions
    if credentials_json and credentials_json.strip():
        import json as _json
        raw = credentials_json.strip()
        data = _json.loads(raw)
        creds = Credentials.from_service_account_info(data, scopes=scope)
        return creds
    if credentials_file and os.path.exists(credentials_file):
        return Credentials.from_service_account_file(credentials_file, scopes=scope)
    return None


def upload_to_drive(
    file_path,
    filename,
    root_folder_id=None,
    credentials_file=None,
    credentials_json=None
):
    """
    Upload image to Google Drive in a date-named folder (YYYY-MM-DD).
    Creates the folder if it doesn't exist.
    Returns (drive_url, error). drive_url is viewable link for img src.
    """
    try:
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaFileUpload
        from googleapiclient.errors import HttpError
    except ImportError:
        return None, "Install google-api-python-client: pip install google-api-python-client"

    creds = get_credentials(credentials_file, credentials_json)
    if not creds:
        return None, "No Drive credentials"

    try:
        service = build('drive', 'v3', credentials=creds)
        folder_name = get_date_folder_name()

        # Find or create date folder
        parent_id = root_folder_id or 'root'
        query = f"name='{folder_name}' and '{parent_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false"
        results = service.files().list(q=query, spaces='drive', fields='files(id, name)').execute()
        folders = results.get('files', [])

        if folders:
            folder_id = folders[0]['id']
        else:
            folder_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            if root_folder_id:
                folder_metadata['parents'] = [root_folder_id]
            folder = service.files().create(body=folder_metadata, fields='id').execute()
            folder_id = folder['id']

        # Check if file already exists (avoid duplicates by filename)
        file_query = f"name='{filename}' and '{folder_id}' in parents and trashed=false"
        existing = service.files().list(q=file_query, spaces='drive', fields='files(id)').execute()
        if existing.get('files'):
            file_id = existing['files'][0]['id']
        else:
            file_metadata = {
                'name': filename,
                'parents': [folder_id]
            }
            media = MediaFileUpload(file_path, mimetype='image/jpeg', resumable=True)
            file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
            file_id = file['id']

        # Make viewable by anyone with link
        try:
            service.permissions().create(
                fileId=file_id,
                body={'type': 'anyone', 'role': 'reader'}
            ).execute()
        except HttpError as e:
            if 'insufficient' in str(e).lower() or '403' in str(e):
                pass  # May already have permission
            else:
                print(f"[WARN] Could not set Drive permission: {e}")

        view_url = f"https://drive.google.com/uc?export=view&id={file_id}"
        return view_url, None

    except Exception as e:
        return None, str(e)
