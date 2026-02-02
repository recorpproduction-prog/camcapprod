/**
 * SUPERVISOR REVIEW PAGE
 * Auto-refreshing review interface for pallet tickets
 */

let autoRefreshInterval = null;
let currentRecords = [];
let currentReviewRecord = null;

/**
 * Initialize page
 */
window.onload = function() {
  loadRecords();
  
  // Set up status filter change handler
  document.getElementById('statusFilter').addEventListener('change', loadRecords);
  
  // Start auto-refresh (every 5 seconds)
  startAutoRefresh();
};

/**
 * Start auto-refresh
 */
function startAutoRefresh() {
  // Clear existing interval
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  // Set new interval
  autoRefreshInterval = setInterval(() => {
    loadRecords(true); // Silent refresh
  }, 5000);
  
  updateAutoRefreshStatus(true);
}

/**
 * Stop auto-refresh
 */
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    updateAutoRefreshStatus(false);
  }
}

/**
 * Update auto-refresh status indicator
 */
function updateAutoRefreshStatus(isActive) {
  const statusEl = document.getElementById('autoRefreshStatus');
  if (isActive) {
    statusEl.textContent = 'Auto-refresh: ON';
    statusEl.style.color = '#28a745';
  } else {
    statusEl.textContent = 'Auto-refresh: OFF';
    statusEl.style.color = '#999';
  }
}

/**
 * Load records from backend
 */
function loadRecords(silent = false) {
  const statusFilter = document.getElementById('statusFilter').value;
  
  google.script.run
    .withSuccessHandler((records) => {
      if (records.error) {
        showError('Error loading records: ' + records.error);
        return;
      }
      
      currentRecords = records || [];
      displayRecords(currentRecords);
      
      if (!silent) {
        showMessage('Records loaded');
      }
    })
    .withFailureHandler((error) => {
      showError('Failed to load records: ' + error.message);
    })
    .getRecords(statusFilter || null);
}

/**
 * Display records in table
 */
function displayRecords(records) {
  const tbody = document.getElementById('recordsBody');
  
  if (records.length === 0) {
    tbody.innerHTML = '<div class="empty-state">No records found</div>';
    return;
  }
  
  tbody.innerHTML = records.map((record, index) => {
    const timestamp = record.timestamp ? 
      new Date(record.timestamp).toLocaleString() : 'N/A';
    const palletId = record.pallet_id || 'N/A';
    const product = record.product || 'N/A';
    const status = record.status || 'PENDING';
    
    return `
      <div class="table-row" onclick="openReviewPanel(${index})" data-index="${index}">
        <div>
          ${record.image_drive_url ? 
            `<img src="${record.image_drive_url}" class="thumbnail" alt="Pallet ticket" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'60\\' height=\\'60\\'%3E%3Crect fill=\\'%23ddd\\' width=\\'60\\' height=\\'60\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' dy=\\'.3em\\' fill=\\'%23999\\'%3ENo Image%3C/text%3E%3C/svg%3E'">` : 
            '<div class="thumbnail" style="background: #ddd; display: flex; align-items: center; justify-content: center; color: #999; font-size: 10px;">No Image</div>'
          }
        </div>
        <div>${timestamp}</div>
        <div>${palletId}</div>
        <div>${product}</div>
        <div><span class="status-badge status-${status.toLowerCase()}">${status}</span></div>
      </div>
    `;
  }).join('');
}

/**
 * Open review panel for a record
 */
function openReviewPanel(index) {
  if (index < 0 || index >= currentRecords.length) {
    return;
  }
  
  currentReviewRecord = currentRecords[index];
  
  const panel = document.getElementById('reviewPanel');
  const content = document.getElementById('reviewContent');
  
  // Build review content
  const record = currentReviewRecord;
  
  // Parse confidence from notes if available
  const confidenceMap = parseConfidenceFromNotes(record.notes || '');
  
  content.innerHTML = `
    <img src="${record.image_drive_url || ''}" class="review-image" alt="Pallet ticket" 
         onerror="this.style.display='none'">
    
    <div class="review-fields">
      ${renderField('Pallet ID', record.pallet_id, confidenceMap.pallet_id)}
      ${renderField('Product', record.product, confidenceMap.product)}
      ${renderField('SKU', record.sku, confidenceMap.sku)}
      ${renderField('Batch/Lot', record.batch_lot, confidenceMap.batch_lot)}
      ${renderField('Quantity', record.quantity, confidenceMap.quantity)}
      ${renderField('Unit', record.unit, confidenceMap.unit)}
      ${renderField('Best Before', record.best_before, confidenceMap.best_before)}
      ${renderField('Manufacture Date', record.manufacture_date, confidenceMap.manufacture_date)}
      ${renderField('Line', record.line, confidenceMap.line)}
      ${renderField('Shift', record.shift, confidenceMap.shift)}
      ${renderField('Location', record.location, confidenceMap.location)}
      ${renderField('Operator', record.operator, 'high')}
      ${renderField('Timestamp', record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A', 'high')}
    </div>
    
    <div class="ocr-section">
      <div class="field-label">Raw OCR Text</div>
      <div class="ocr-text">${escapeHtml(record.raw_ocr_text || 'No OCR text available')}</div>
    </div>
    
    <div class="review-actions">
      <button class="btn-approve" onclick="approveCurrentRecord()">✓ APPROVE</button>
      <button class="btn-reject" onclick="showRejectReason()">✗ REJECT</button>
    </div>
    
    <textarea id="rejectReason" class="reject-reason" placeholder="Enter rejection reason..."></textarea>
    <button id="confirmRejectBtn" class="btn-reject" style="display: none; margin-top: 10px;" onclick="rejectCurrentRecord()">
      Confirm Rejection
    </button>
  `;
  
  panel.classList.add('active');
}

/**
 * Close review panel
 */
function closeReviewPanel() {
  const panel = document.getElementById('reviewPanel');
  panel.classList.remove('active');
  currentReviewRecord = null;
  
  // Hide reject reason if shown
  const rejectReason = document.getElementById('rejectReason');
  const confirmBtn = document.getElementById('confirmRejectBtn');
  if (rejectReason) {
    rejectReason.classList.remove('active');
    rejectReason.style.display = 'none';
  }
  if (confirmBtn) {
    confirmBtn.style.display = 'none';
  }
}

/**
 * Render a field with confidence coloring
 */
function renderField(label, value, confidence) {
  const confClass = confidence ? ` ${confidence}-confidence` : '';
  return `
    <div class="field-group">
      <div class="field-label">${label}</div>
      <div class="field-value${confClass}">${value || 'N/A'}</div>
    </div>
  `;
}

/**
 * Parse confidence from notes field
 */
function parseConfidenceFromNotes(notes) {
  const confidenceMap = {};
  
  // Look for "Confidence: field1:level1, field2:level2" pattern
  const confidenceMatch = notes.match(/Confidence:\s*([^|]+)/);
  if (confidenceMatch) {
    const pairs = confidenceMatch[1].split(',');
    pairs.forEach(pair => {
      const [field, level] = pair.split(':').map(s => s.trim());
      if (field && level) {
        confidenceMap[field] = level;
      }
    });
  }
  
  return confidenceMap;
}

/**
 * Approve current record
 */
function approveCurrentRecord() {
  if (!currentReviewRecord) {
    return;
  }
  
  // Use row number from record
  const rowNumber = currentReviewRecord._rowNumber;
  
  if (!rowNumber) {
    showError('Unable to determine row number');
    return;
  }
  
  google.script.run
    .withSuccessHandler((response) => {
      if (response.success) {
        showMessage('Record approved');
        closeReviewPanel();
        loadRecords();
      } else {
        showError('Failed to approve: ' + (response.error || 'Unknown error'));
      }
    })
    .withFailureHandler((error) => {
      showError('Failed to approve: ' + error.message);
    })
    .approveRecord(rowNumber);
}

/**
 * Show reject reason input
 */
function showRejectReason() {
  const rejectReason = document.getElementById('rejectReason');
  const confirmBtn = document.getElementById('confirmRejectBtn');
  
  if (rejectReason && confirmBtn) {
    rejectReason.style.display = 'block';
    rejectReason.classList.add('active');
    confirmBtn.style.display = 'block';
    rejectReason.focus();
  }
}

/**
 * Reject current record
 */
function rejectCurrentRecord() {
  if (!currentReviewRecord) {
    return;
  }
  
  const rejectReason = document.getElementById('rejectReason');
  const reason = rejectReason ? rejectReason.value.trim() : '';
  
  if (!reason) {
    showError('Please enter a rejection reason');
    return;
  }
  
  // Use row number from record
  const rowNumber = currentReviewRecord._rowNumber;
  
  if (!rowNumber) {
    showError('Unable to determine row number');
    return;
  }
  
  google.script.run
    .withSuccessHandler((response) => {
      if (response.success) {
        showMessage('Record rejected');
        closeReviewPanel();
        loadRecords();
      } else {
        showError('Failed to reject: ' + (response.error || 'Unknown error'));
      }
    })
    .withFailureHandler((error) => {
      showError('Failed to reject: ' + error.message);
    })
    .rejectRecord(rowNumber, reason);
}

/**
 * Utility: Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show error message
 */
function showError(message) {
  alert('Error: ' + message);
}

/**
 * Show success message
 */
function showMessage(message) {
  // Simple alert for now - could be replaced with toast notification
  console.log(message);
}

