/**
 * PALLET TICKET CAPTURE SYSTEM - BACKEND
 * Google Apps Script Web App Backend
 */

// ============================================
// CONFIGURATION
// ============================================

const SHEET_ID = "PASTE_SHEET_ID_HERE"; // Replace with your Google Sheet ID

const SUPERVISORS = [
  "supervisor@company.com" // Add supervisor emails here
];

const COLUMNS = [
  "timestamp",
  "status",
  "pallet_id",
  "product",
  "sku",
  "batch_lot",
  "quantity",
  "unit",
  "best_before",
  "manufacture_date",
  "line",
  "shift",
  "operator",
  "location",
  "notes",
  "image_drive_url",
  "raw_ocr_text",
  "reviewed_by",
  "reviewed_timestamp"
];

// ============================================
// WEB APP ENTRY POINTS
// ============================================

/**
 * Serves the operator capture page
 */
function doGet(e) {
  const path = e.parameter.path || 'capture';
  
  if (path === 'review') {
    return HtmlService.createTemplateFromFile('Review')
      .evaluate()
      .setTitle('Pallet Ticket Review')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  
  // Default: operator capture page
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Pallet Ticket Capture')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Include HTML/CSS/JS files
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================
// AUTHENTICATION
// ============================================

/**
 * Get current user email
 */
function getCurrentUser() {
  try {
    const email = Session.getActiveUser().getEmail();
    return { email: email, authenticated: true };
  } catch (e) {
    return { email: null, authenticated: false };
  }
}

/**
 * Check if user is supervisor
 */
function isSupervisor(email) {
  return SUPERVISORS.includes(email);
}

/**
 * Check supervisor access
 */
function checkSupervisorAccess() {
  const user = getCurrentUser();
  if (!user.authenticated || !isSupervisor(user.email)) {
    throw new Error("Supervisor access required");
  }
  return user.email;
}

// ============================================
// SHEET MANAGEMENT
// ============================================

/**
 * Get or create spreadsheet
 */
function getSpreadsheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  return ss;
}

/**
 * Get or create sheet by name
 */
function getOrCreateSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Add headers
    sheet.getRange(1, 1, 1, COLUMNS.length).setValues([COLUMNS]);
    sheet.getRange(1, 1, 1, COLUMNS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  
  return sheet;
}

/**
 * Add record to sheet
 */
function addRecordToSheet(sheetName, record) {
  const sheet = getOrCreateSheet(sheetName);
  const row = COLUMNS.map(col => record[col] || '');
  sheet.appendRow(row);
  
  // Return row number
  return sheet.getLastRow();
}

// ============================================
// IMAGE STORAGE (GOOGLE DRIVE)
// ============================================

/**
 * Save image to Google Drive
 */
function saveImageToDrive(imageBlob, filename) {
  try {
    // Create folder structure: Pallet_Tickets/YYYY/MM
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const rootFolder = DriveApp.getRootFolder();
    let ticketsFolder = getOrCreateFolder(rootFolder, 'Pallet_Tickets');
    let yearFolder = getOrCreateFolder(ticketsFolder, year);
    let monthFolder = getOrCreateFolder(yearFolder, month);
    
    // Save image
    const file = monthFolder.createFile(imageBlob);
    file.setName(filename);
    
    // Set sharing to anyone with link (for web app viewing)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (e) {
    Logger.log('Error saving image: ' + e.toString());
    throw new Error('Failed to save image: ' + e.toString());
  }
}

/**
 * Get or create folder
 */
function getOrCreateFolder(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

// ============================================
// OCR PROCESSING
// ============================================

/**
 * Process image with OCR
 */
function processImageWithOCR(imageBlob) {
  try {
    // Try Google Vision API first
    if (hasVisionAPI()) {
      return processWithVisionAPI(imageBlob);
    }
    
    // Fallback to Drive OCR
    return processWithDriveOCR(imageBlob);
  } catch (e) {
    Logger.log('OCR Error: ' + e.toString());
    throw new Error('OCR processing failed: ' + e.toString());
  }
}

/**
 * Check if Vision API is available
 */
function hasVisionAPI() {
  // Try to enable Vision API - user must enable in GCP console
  // For now, we'll use Drive OCR as primary
  return false; // Set to true after enabling Vision API
}

/**
 * Process with Google Vision API
 */
function processWithVisionAPI(imageBlob) {
  // Implementation for Vision API
  // Requires Vision API to be enabled in GCP console
  // This is the preferred method but requires API setup
  
  const imageBase64 = Utilities.base64Encode(imageBlob.getBytes());
  
  const request = {
    requests: [{
      image: {
        content: imageBase64
      },
      features: [{
        type: 'TEXT_DETECTION',
        maxResults: 1
      }]
    }]
  };
  
  try {
    const response = UrlFetchApp.fetch(
      'https://vision.googleapis.com/v1/images:annotate?key=' + getVisionAPIKey(),
      {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(request)
      }
    );
    
    const result = JSON.parse(response.getContentText());
    if (result.responses && result.responses[0].fullTextAnnotation) {
      return result.responses[0].fullTextAnnotation.text;
    }
  } catch (e) {
    Logger.log('Vision API error: ' + e.toString());
    throw e;
  }
  
  throw new Error('Vision API did not return text');
}

/**
 * Process with Drive OCR (fallback)
 */
function processWithDriveOCR(imageBlob) {
  // Save temp file
  const tempFile = DriveApp.createFile(imageBlob);
  tempFile.setName('temp_ocr_' + Date.now() + '.png');
  
  try {
    // Convert to Google Doc for OCR
    const resource = {
      title: 'temp_ocr_' + Date.now()
    };
    
    const ocrFile = Drive.Files.insert(
      resource,
      tempFile.getBlob(),
      {
        ocr: true,
        ocrLanguage: 'en'
      }
    );
    
    // Extract text from OCR doc
    const ocrDoc = DocumentApp.openById(ocrFile.id);
    const text = ocrDoc.getBody().getText();
    
    // Clean up temp files
    DriveApp.getFileById(tempFile.getId()).setTrashed(true);
    DriveApp.getFileById(ocrFile.id).setTrashed(true);
    
    return text;
  } catch (e) {
    // Clean up on error
    try {
      DriveApp.getFileById(tempFile.getId()).setTrashed(true);
    } catch (cleanupError) {
      Logger.log('Cleanup error: ' + cleanupError.toString());
    }
    throw e;
  }
}

/**
 * Get Vision API key (if using Vision API)
 */
function getVisionAPIKey() {
  // Store API key in Script Properties
  // Script Properties > Add > key: VISION_API_KEY, value: YOUR_KEY
  return PropertiesService.getScriptProperties().getProperty('VISION_API_KEY') || '';
}

// ============================================
// DATA PARSING
// ============================================

/**
 * Parse OCR text into structured data
 */
function parsePalletTicket(ocrText, imageUrl) {
  const normalized = normalizeText(ocrText);
  const parsed = {};
  const confidence = {};
  const warnings = [];
  
  // Parse each field
  parsed.pallet_id = parseField(normalized, ['PALLET', 'PALLET ID', 'PAL ID', 'PALLET#'], confidence, 'pallet_id');
  parsed.product = parseField(normalized, ['PRODUCT', 'ITEM', 'ITEM NAME', 'DESCRIPTION'], confidence, 'product');
  parsed.sku = parseField(normalized, ['SKU', 'ITEM CODE', 'PRODUCT CODE', 'CODE'], confidence, 'sku');
  parsed.batch_lot = parseField(normalized, ['BATCH', 'LOT', 'LOT#', 'BATCH#', 'BATCH/LOT'], confidence, 'batch_lot');
  parsed.quantity = parseField(normalized, ['QTY', 'QUANTITY', 'QTY.', 'AMOUNT'], confidence, 'quantity');
  parsed.unit = parseField(normalized, ['UNIT', 'UOM', 'U/M'], confidence, 'unit');
  parsed.best_before = parseField(normalized, ['BEST BEFORE', 'EXPIRY', 'EXP DATE', 'USE BY'], confidence, 'best_before');
  parsed.manufacture_date = parseField(normalized, ['MFG DATE', 'MANUFACTURE', 'MADE ON', 'PRODUCED'], confidence, 'manufacture_date');
  parsed.line = parseField(normalized, ['LINE', 'LINE#', 'LINE NO'], confidence, 'line');
  parsed.shift = parseField(normalized, ['SHIFT', 'SHIFT#'], confidence, 'shift');
  parsed.location = parseField(normalized, ['LOCATION', 'LOC', 'WAREHOUSE', 'WH'], confidence, 'location');
  
  // Set confidence levels based on matches
  Object.keys(parsed).forEach(key => {
    if (!confidence[key]) {
      confidence[key] = parsed[key] ? 'medium' : 'low';
    }
  });
  
  return {
    parsed: parsed,
    confidence: confidence,
    warnings: warnings,
    raw_ocr_text: ocrText
  };
}

/**
 * Normalize text for parsing
 */
function normalizeText(text) {
  return text
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s:]/g, '')
    .trim();
}

/**
 * Parse a specific field from normalized text
 */
function parseField(normalized, keywords, confidence, fieldName) {
  for (const keyword of keywords) {
    const pattern = new RegExp(keyword + '[\\s:]+([^\\n\\r]+)', 'i');
    const match = normalized.match(pattern);
    if (match && match[1]) {
      const value = match[1].trim();
      if (value) {
        confidence[fieldName] = 'high';
        return cleanValue(value);
      }
    }
  }
  
  // Try broader search
  for (const keyword of keywords) {
    const index = normalized.indexOf(keyword);
    if (index !== -1) {
      const after = normalized.substring(index + keyword.length, index + keyword.length + 50).trim();
      const value = after.split(/[\n\r]/)[0].trim();
      if (value && value.length > 0) {
        confidence[fieldName] = 'medium';
        return cleanValue(value);
      }
    }
  }
  
  confidence[fieldName] = 'low';
  return '';
}

/**
 * Clean parsed value
 */
function cleanValue(value) {
  return value
    .replace(/[^\w\s\-:.\/]/g, '')
    .trim()
    .substring(0, 100); // Limit length
}

// ============================================
// MAIN API ENDPOINTS
// ============================================

/**
 * Submit captured ticket (operator endpoint)
 */
function submitCapturedTicket(base64Image, metadata) {
  try {
    const user = getCurrentUser();
    if (!user.authenticated) {
      throw new Error("Authentication required");
    }
    
    // Convert base64 to blob
    const imageBytes = Utilities.base64Decode(base64Image.split(',')[1] || base64Image);
    const imageBlob = Utilities.newBlob(imageBytes, 'image/png', 'pallet_ticket.png');
    
    // Save image to Drive
    const timestamp = new Date();
    const filename = 'pallet_' + timestamp.getTime() + '_' + user.email.replace('@', '_') + '.png';
    const imageUrl = saveImageToDrive(imageBlob, filename);
    
    // Run OCR
    const ocrText = processImageWithOCR(imageBlob);
    
    // Parse data
    const parsed = parsePalletTicket(ocrText, imageUrl);
    
    // Create record
    const record = {
      timestamp: timestamp.toISOString(),
      status: 'PENDING',
      operator: user.email,
      image_drive_url: imageUrl,
      raw_ocr_text: ocrText,
      ...parsed.parsed
    };
    
    // Add confidence data as notes
    const confidenceNotes = Object.entries(parsed.confidence)
      .filter(([k, v]) => v !== 'high')
      .map(([k, v]) => `${k}:${v}`)
      .join(', ');
    record.notes = (record.notes || '') + (confidenceNotes ? ' | Confidence: ' + confidenceNotes : '');
    
    // Add to pending review
    const rowNum = addRecordToSheet('PENDING_REVIEW', record);
    
    return {
      success: true,
      rowNum: rowNum,
      record: record,
      parsed: parsed
    };
  } catch (e) {
    Logger.log('Submit error: ' + e.toString());
    return {
      success: false,
      error: e.toString()
    };
  }
}

/**
 * Get pending records (supervisor endpoint)
 */
function getPendingRecords() {
  try {
    checkSupervisorAccess();
    
    const sheet = getOrCreateSheet('PENDING_REVIEW');
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = row[idx];
      });
      
      // Only return pending records
      if (record.status === 'PENDING') {
        records.push(record);
      }
    }
    
    return records;
  } catch (e) {
    Logger.log('Get pending error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Get all records with status filter
 */
function getRecords(statusFilter) {
  try {
    checkSupervisorAccess();
    
    const sheet = getOrCreateSheet('PENDING_REVIEW');
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return [];
    }
    
    const headers = data[0];
    const records = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const record = {};
      headers.forEach((header, idx) => {
        record[header] = row[idx];
      });
      
      // Add row number (1-based, +1 for header row)
      record._rowNumber = i + 1;
      
      if (!statusFilter || record.status === statusFilter) {
        records.push(record);
      }
    }
    
    return records;
  } catch (e) {
    Logger.log('Get records error: ' + e.toString());
    return { error: e.toString() };
  }
}

/**
 * Approve record (supervisor endpoint)
 */
function approveRecord(rowNumber) {
  try {
    const supervisorEmail = checkSupervisorAccess();
    
    const sheet = getOrCreateSheet('PENDING_REVIEW');
    const row = sheet.getRange(rowNumber, 1, 1, COLUMNS.length).getValues()[0];
    
    // Create record object
    const record = {};
    COLUMNS.forEach((col, idx) => {
      record[col] = row[idx];
    });
    
    // Update status
    record.status = 'APPROVED';
    record.reviewed_by = supervisorEmail;
    record.reviewed_timestamp = new Date().toISOString();
    
    // Update pending sheet
    const statusCol = COLUMNS.indexOf('status') + 1;
    const reviewedByCol = COLUMNS.indexOf('reviewed_by') + 1;
    const reviewedTimeCol = COLUMNS.indexOf('reviewed_timestamp') + 1;
    
    sheet.getRange(rowNumber, statusCol).setValue('APPROVED');
    sheet.getRange(rowNumber, reviewedByCol).setValue(supervisorEmail);
    sheet.getRange(rowNumber, reviewedTimeCol).setValue(new Date().toISOString());
    
    // Add to approved records
    addRecordToSheet('APPROVED_RECORDS', record);
    
    return { success: true };
  } catch (e) {
    Logger.log('Approve error: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Reject record (supervisor endpoint)
 */
function rejectRecord(rowNumber, reason) {
  try {
    const supervisorEmail = checkSupervisorAccess();
    
    const sheet = getOrCreateSheet('PENDING_REVIEW');
    const row = sheet.getRange(rowNumber, 1, 1, COLUMNS.length).getValues()[0];
    
    // Create record object
    const record = {};
    COLUMNS.forEach((col, idx) => {
      record[col] = row[idx];
    });
    
    // Update status
    record.status = 'REJECTED';
    record.reviewed_by = supervisorEmail;
    record.reviewed_timestamp = new Date().toISOString();
    record.notes = (record.notes || '') + ' | REJECTION REASON: ' + (reason || 'Not specified');
    
    // Update pending sheet
    const statusCol = COLUMNS.indexOf('status') + 1;
    const reviewedByCol = COLUMNS.indexOf('reviewed_by') + 1;
    const reviewedTimeCol = COLUMNS.indexOf('reviewed_timestamp') + 1;
    const notesCol = COLUMNS.indexOf('notes') + 1;
    
    sheet.getRange(rowNumber, statusCol).setValue('REJECTED');
    sheet.getRange(rowNumber, reviewedByCol).setValue(supervisorEmail);
    sheet.getRange(rowNumber, reviewedTimeCol).setValue(new Date().toISOString());
    sheet.getRange(rowNumber, notesCol).setValue(record.notes);
    
    // Add to rejected records
    addRecordToSheet('REJECTED_RECORDS', record);
    
    return { success: true };
  } catch (e) {
    Logger.log('Reject error: ' + e.toString());
    return { success: false, error: e.toString() };
  }
}

/**
 * Check for duplicate submissions (cooldown check)
 */
function checkDuplicate(hash, operatorEmail) {
  // Store hash in Properties (simple in-memory check)
  // In production, store in sheet for persistence
  const key = 'last_hash_' + operatorEmail;
  const lastHash = PropertiesService.getScriptProperties().getProperty(key);
  
  if (lastHash === hash) {
    return true; // Duplicate
  }
  
  // Store new hash
  PropertiesService.getScriptProperties().setProperty(key, hash);
  return false;
}

