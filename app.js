// DIAGNOSTIC: Script loading started
// VERSION 4 - Cache busting - If you see this, new code is loaded!
console.log('🔍 DIAG: app.js VERSION 4 script started loading at', new Date().toISOString());

// SOP Application State
let currentSop = {
    meta: {
        title: "",
        sopId: "",
        department: "",
        version: "",
        author: "",
        status: "",
        effectiveDate: "",
        reviewDate: "",
        reviewer: "",
        reviewComments: ""
    },
    description: "",
    safety: {
        warnings: [],
        ppe: [],
        notes: ""
    },
    tools: [],
    materials: [],
    steps: []
};

let stepCounter = 0;
let currentStepId = null;
let selectedImages = [];
let stream = null;

// Global logo cache - preload logo on page load
let cachedLogoImage = null;
let cachedLogoAspectRatio = null; // width/height for PDF so logo is not distorted

// Flag to track when loading SOP from register (to prevent clearing editor)
let isLoadingFromRegister = false;

// Preload logo image when page loads - HANDLE FILE:// PROTOCOL
async function preloadLogo() {
    console.log('=== PRELOADING LOGO ===');
    
    // For file:// protocol, we MUST use the already-loaded img element
    // because fetch and canvas.toDataURL are blocked by CORS
    const logoElement = document.querySelector('.header-logo');
    
    if (!logoElement) {
        console.error('Logo element not found in DOM');
        return;
    }
    
    // Wait for logo element to load if not ready
    if (!logoElement.complete || logoElement.naturalWidth === 0) {
        console.log('Waiting for logo element to load...');
        await new Promise((resolve) => {
            const timeout = setTimeout(resolve, 3000);
            logoElement.onload = () => {
                clearTimeout(timeout);
                resolve();
            };
            logoElement.onerror = () => {
                clearTimeout(timeout);
                console.error('Logo element failed to load');
                resolve();
            };
            if (logoElement.complete) {
                clearTimeout(timeout);
                resolve();
            }
        });
    }
    
    // Now try to convert to canvas - this works if image is already loaded
    try {
        if (logoElement.complete && logoElement.naturalWidth > 0) {
            // Create a new image with the same src to avoid CORS taint
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // Use the absolute path if available, or relative
            let logoSrc = logoElement.src;
            // If it's a file:// URL with space, it might be encoded
            if (logoSrc.includes('file://') && logoSrc.includes('%20')) {
                // Try to decode and use the actual path
                try {
                    const decodedPath = decodeURIComponent(logoSrc);
                    img.src = decodedPath;
                } catch (e) {
                    img.src = logoSrc;
                }
            } else {
                img.src = logoSrc;
            }
            
            cachedLogoImage = await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    console.log('Logo load timeout - trying direct canvas method');
                    // Fallback: try converting directly from loaded element
                    try {
                        if (logoElement.naturalWidth > 0 && logoElement.naturalHeight > 0) {
                            cachedLogoAspectRatio = logoElement.naturalWidth / logoElement.naturalHeight;
                        }
                        const canvas = document.createElement('canvas');
                        canvas.width = logoElement.naturalWidth;
                        canvas.height = logoElement.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        // This might fail with CORS, but it's worth trying
                        ctx.drawImage(logoElement, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png');
                        console.log('✓ Logo preloaded via direct canvas (element)');
                        resolve(dataUrl);
                    } catch (err) {
                        console.error('Direct canvas method failed:', err.message);
                        resolve(null);
                    }
                }, 2000);
                
                img.onload = () => {
                    clearTimeout(timeout);
                    try {
                        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                            cachedLogoAspectRatio = img.naturalWidth / img.naturalHeight;
                        }
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png');
                        console.log('✓ Logo preloaded via canvas (length:', dataUrl.length + ')');
                        resolve(dataUrl);
                    } catch (err) {
                        console.error('Canvas conversion failed:', err.message);
                        // Try direct method as fallback
                        try {
                            if (logoElement.naturalWidth > 0 && logoElement.naturalHeight > 0) {
                                cachedLogoAspectRatio = logoElement.naturalWidth / logoElement.naturalHeight;
                            }
                            const canvas = document.createElement('canvas');
                            canvas.width = logoElement.naturalWidth;
                            canvas.height = logoElement.naturalHeight;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(logoElement, 0, 0);
                            const dataUrl = canvas.toDataURL('image/png');
                            console.log('✓ Logo preloaded via direct canvas fallback');
                            resolve(dataUrl);
                        } catch (err2) {
                            resolve(null);
                        }
                    }
                };
                
                img.onerror = () => {
                    clearTimeout(timeout);
                    console.error('Image load error - trying direct method');
                    try {
                        if (logoElement.naturalWidth > 0 && logoElement.naturalHeight > 0) {
                            cachedLogoAspectRatio = logoElement.naturalWidth / logoElement.naturalHeight;
                        }
                        const canvas = document.createElement('canvas');
                        canvas.width = logoElement.naturalWidth;
                        canvas.height = logoElement.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(logoElement, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png');
                        console.log('✓ Logo preloaded via error fallback');
                        resolve(dataUrl);
                    } catch (err) {
                        console.error('All logo loading methods failed');
                        resolve(null);
                    }
                };
                
                // If already loaded
                if (img.complete && img.naturalWidth > 0) {
                    img.onload();
                }
            });
        } else {
            console.error('Logo element not loaded properly');
        }
    } catch (e) {
        console.error('Logo preload error:', e);
    }
    
    if (cachedLogoImage) {
        console.log('✓✓✓ LOGO SUCCESSFULLY PRELOADED ✓✓✓');
        console.log('Logo data URL length:', cachedLogoImage.length);
        console.log('Logo starts with:', cachedLogoImage.substring(0, 50));
    } else {
        console.error('✗✗✗ LOGO PRELOAD FAILED ✗✗✗');
        console.error('Note: If using file:// protocol, you may need to run from a local server.');
        console.error('Try: python -m http.server 8000 or use Live Server extension');
    }
}

// Make critical functions available immediately (before DOMContentLoaded)
// DIAGNOSTIC: Making critical functions available immediately
console.log('🔍 DIAG: Setting up global function stubs');

// These are stubs that will be replaced with full implementations below
window.switchTab = function(tabName) {
    console.warn('⚠️ switchTab stub called - implementation not loaded yet');
    // Try to call implementation if it exists
    if (typeof window._switchTabImpl === 'function') {
        return window._switchTabImpl(tabName);
    }
};

// Stub for updateAuthorFromUser - will be replaced with full implementation
window.updateAuthorFromUser = function() {
    console.warn('⚠️ updateAuthorFromUser stub called - implementation not loaded yet');
    // Try to call implementation if it exists
    if (typeof window._updateAuthorFromUserImpl === 'function') {
        return window._updateAuthorFromUserImpl();
    }
};

window.submitSopRequest = function(event) {
    console.warn('⚠️ submitSopRequest stub called - implementation not loaded yet');
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
    // Try to call implementation if it exists
    if (typeof window._submitSopRequestImpl === 'function') {
        return window._submitSopRequestImpl(event);
    }
    return false;
};

window.openEmailSettings = async function() {
    console.warn('⚠️ openEmailSettings stub called - checking for implementation...');
    // Try to call implementation if it exists
    if (typeof window._openEmailSettingsImpl === 'function') {
        console.log('✅ Found implementation, calling it');
        return await window._openEmailSettingsImpl();
    }
    console.error('❌ Implementation not found yet');
};

console.log('🔍 DIAG: Global function stubs set');

// Cloud SOPs: shared API (no OAuth for staff) or Google Drive (Connect per device)
function useCloudSops() {
    return (typeof window.useSharedAccess === 'function' && window.useSharedAccess()) ||
           (typeof window.useGoogleDrive === 'function' && window.useGoogleDrive());
}
async function loadAllSopsFromCloud() {
    if (typeof window.useSharedAccess === 'function' && window.useSharedAccess())
        return await window.loadAllSopsFromSharedAPI();
    if (typeof window.useGoogleDrive === 'function' && window.useGoogleDrive())
        return await window.loadAllSopsFromGoogleDrive();
    return null;
}
async function saveSopToCloud(sop) {
    if (typeof window.useSharedAccess === 'function' && window.useSharedAccess())
        return await window.saveSopToSharedAPI(sop);
    if (typeof window.useGoogleDrive === 'function' && window.useGoogleDrive())
        return await window.saveSopToGoogleDrive(sop);
    return false;
}
async function deleteSopFromCloud(sopId) {
    if (typeof window.useSharedAccess === 'function' && window.useSharedAccess())
        return await window.deleteSopFromSharedAPI(sopId);
    if (typeof window.useGoogleDrive === 'function' && window.useGoogleDrive())
        return await window.deleteSopFromGoogleDrive(sopId);
    return false;
}

async function testBackendConnection() {
    let base = typeof window !== 'undefined' && (window.SOP_SHARED_API_URL || window.sopSharedApiUrl || '');
    if (!base && typeof location !== 'undefined' && /github\.io$/i.test(location.hostname))
        base = 'https://sop-backend-1065392834988.us-central1.run.app';
    if (!base) return true;
    try {
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeout = setTimeout(() => ctrl && ctrl.abort(), 10000);
        const res = await fetch(base.replace(/\/$/, '') + '/sops', { method: 'GET', mode: 'cors', credentials: 'omit', headers: { Accept: 'application/json' }, signal: ctrl ? ctrl.signal : undefined });
        clearTimeout(timeout);
        return res.ok;
    } catch (_) { return false; }
}

async function retryConnectionAndRefresh() {
    const banner = document.getElementById('connectionErrorBanner');
    const textEl = document.getElementById('connectionErrorText');
    if (textEl) textEl.textContent = 'Checking connection...';
    const ok = await testBackendConnection();
    if (banner) banner.style.display = ok ? 'none' : '';
    if (textEl && !ok) textEl.textContent = 'Cannot reach SOP server. Check internet and try again.';
    if (ok) {
        if (typeof refreshRegister === 'function') refreshRegister();
        if (typeof refreshReviewList === 'function') refreshReviewList();
    }
}

/** Load SOPs from cloud + localStorage merge. Single source of truth for all data loading. */
async function loadAllSopsMerged() {
    let savedSops = {};
    let cloudError = null;
    if (typeof loadAllSopsFromCloud === 'function' && useCloudSops()) {
        try {
            const loaded = await loadAllSopsFromCloud();
            savedSops = loaded || {};
        } catch (e) {
            cloudError = e;
            console.warn('Cloud load failed:', e.message);
        }
        const local = JSON.parse(localStorage.getItem('savedSops') || '{}');
        Object.keys(local).forEach(key => { if (local[key] && local[key].meta && !savedSops[key]) savedSops[key] = local[key]; });
        if (cloudError && Object.keys(savedSops).length === 0) throw cloudError;
    } else {
        savedSops = JSON.parse(localStorage.getItem('savedSops') || '{}');
    }
    return savedSops;
}

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
    initializeEventListeners();
    
    // Preload logo immediately
    preloadLogo();
    
    // Test backend connection on startup when using shared access
    if (typeof useSharedAccess === 'function' && useSharedAccess()) {
        testBackendConnection().then(ok => {
            const banner = document.getElementById('connectionErrorBanner');
            if (banner) banner.style.display = ok ? 'none' : '';
        }).catch(() => {
            const banner = document.getElementById('connectionErrorBanner');
            if (banner) banner.style.display = '';
        });
    }
    
    // Hide Drive/cloud settings when using shared access (backend URL) - staff should not access it
    const driveBtn = document.getElementById('googleDriveSettingsBtn');
    if (driveBtn && typeof useSharedAccess === 'function' && useSharedAccess()) {
        driveBtn.style.display = 'none';
    }
    
    // Preload shared users when using shared access
    if (typeof loadUsersMerged === 'function' && typeof useSharedAccess === 'function' && useSharedAccess()) {
        loadUsersMerged().catch(() => {});
    }
    
    // Load last draft SOP from storage on page load (only on initial page load, not when switching tabs)
    loadSopFromStorage();
    
    // Initialize requests list (front page) and switch to requests tab
    refreshRequestsList();
    switchTab('requests'); // Set SOP Requests as the default active tab
    
    // Show floating save button if editor tab is active
    const editorTab = document.getElementById('sopEditor');
    const floatingSaveBtn = document.querySelector('.editor-footer-actions');
    if (floatingSaveBtn && editorTab && editorTab.classList.contains('active')) {
        floatingSaveBtn.style.display = 'block';
    }
});

// Event Listeners
function initializeEventListeners() {
    document.getElementById('newSopBtn').addEventListener('click', createNewSop);
    document.getElementById('saveSopBtn').addEventListener('click', saveSop);
    const saveSopBtnBottom = document.getElementById('saveSopBtnBottom');
    if (saveSopBtnBottom) {
        saveSopBtnBottom.addEventListener('click', saveSop);
    }
    
    // Confirmation dialog buttons
    document.getElementById('confirmationOk').addEventListener('click', () => confirmAction(true));
    document.getElementById('confirmationCancel').addEventListener('click', () => confirmAction(false));
    document.getElementById('loadSopBtn').addEventListener('click', showLoadSection);
    
    // Auto-save on input changes
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('change', updateSopData);
        input.addEventListener('input', updateSopData);
    });
}

// Inline confirmation and notification system
let confirmationResolve = null;

function showConfirmation(title, message) {
    return new Promise((resolve) => {
        confirmationResolve = resolve;
        document.getElementById('confirmationTitle').textContent = title;
        document.getElementById('confirmationMessage').textContent = message;
        document.getElementById('confirmationDialog').classList.remove('hidden');
    });
}

function confirmAction(result) {
    if (confirmationResolve) {
        confirmationResolve(result);
        confirmationResolve = null;
    }
    document.getElementById('confirmationDialog').classList.add('hidden');
}

function showNotification(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const messageEl = document.getElementById('notificationMessage');
    
    messageEl.textContent = message;
    toast.className = `notification-toast ${type}`;
    toast.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        closeNotification();
    }, 5000);
}

function closeNotification() {
    document.getElementById('notificationToast').classList.add('hidden');
}

// Create new SOP
async function createNewSop() {
    const confirmed = await showConfirmation('Create New SOP', 'Create a new SOP? Unsaved changes will be lost.');
    if (confirmed) {
        currentSop = {
            meta: {
                title: "",
                sopId: "",
                department: "",
                version: "1.0",
                author: "",
                status: "Draft",
                effectiveDate: "",
                reviewDate: ""
            },
            description: "",
            safety: {
                warnings: [],
                ppe: [],
                notes: ""
            },
            tools: [],
            materials: [],
            steps: []
        };
        stepCounter = 0;
        renderSop();
        // Auto-generate SOP ID for new SOP
        autoGenerateSopId();
        // Switch to editor tab
        switchTab('editor');
        // Scroll to top of page after creating new SOP
        window.scrollTo(0, 0);
    }
}

// Auto-generate SOP Reference Number
async function autoGenerateSopId(forceGenerate = false) {
    const department = document.getElementById('department').value;
    const sopIdField = document.getElementById('sopId');
    
    if (!department) {
        return; // Can't generate without department
    }
    
    // Only auto-generate if field is empty or if forced
    if (!forceGenerate && sopIdField.value.trim() !== '') {
        return; // Don't overwrite existing SOP ID
    }
    
    // Department code mapping
    const deptCodes = {
        'Production': 'PROD',
        'Engineering': 'ENG',
        'Compliance': 'COMP',
        'Health and Safety': 'H&S'
    };
    
    const deptCode = deptCodes[department] || 'GEN';
    
    // Get current date
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const dateStr = String(now.getDate()).padStart(2, '0');
    
    // Get sequence number for this department and month (from GitHub)
    const sequence = await getNextSequenceNumber(deptCode, year, month);
    
    // Format: DEPT-YYYY-MM-DD-NNN (e.g., PROD-2024-01-15-001)
    const sopId = `${deptCode}-${year}-${month}-${dateStr}-${String(sequence).padStart(3, '0')}`;
    
    sopIdField.value = sopId;
    updateSopData();
}

// Get next sequence number for a department/month combination
async function getNextSequenceNumber(deptCode, year, month) {
    try {
        const savedSops = await loadAllSopsMerged();
        const prefix = `${deptCode}-${year}-${month}`;
        
        let maxSequence = 0;
        
        Object.keys(savedSops).forEach(key => {
            // Check if SOP ID matches the pattern
            if (key.startsWith(prefix)) {
                // Extract sequence number from format: DEPT-YYYY-MM-DD-NNN
                const parts = key.split('-');
                if (parts.length >= 5) {
                    const seq = parseInt(parts[parts.length - 1]);
                    if (!isNaN(seq) && seq > maxSequence) {
                        maxSequence = seq;
                    }
                }
            }
        });
        
        return maxSequence + 1;
    } catch (e) {
        console.error('Error getting sequence number:', e);
        return 1;
    }
}

// Update SOP data from form
function updateSopData() {
    // Update metadata
    currentSop.meta.title = document.getElementById('sopTitle').value;
    currentSop.meta.sopId = document.getElementById('sopId').value;
    currentSop.meta.department = document.getElementById('department').value;
    currentSop.meta.version = document.getElementById('version').value;
    currentSop.meta.author = document.getElementById('author').value;
    // Status is now automated - don't update from form
    // If status is empty or Draft, keep it as is (will be set by saveSop)
    // Effective Date and Review Date are set automatically
    
    // Update description
    currentSop.description = document.getElementById('description').value;
    
    // Update safety notes
    currentSop.safety.notes = document.getElementById('safetyNotes').value;
    
    // Update PPE
    const ppeCheckboxes = document.querySelectorAll('.ppe-checkboxes input[type="checkbox"]:checked');
    currentSop.safety.ppe = Array.from(ppeCheckboxes).map(cb => cb.value);
    const ppeOther = document.getElementById('ppeOther').value.trim();
    if (ppeOther) {
        const otherItems = ppeOther.split(',').map(item => item.trim()).filter(item => item);
        currentSop.safety.ppe = [...currentSop.safety.ppe, ...otherItems];
    }
}

// Render SOP to UI
function renderSop() {
    // Render metadata
    document.getElementById('sopTitle').value = currentSop.meta.title || "";
    document.getElementById('sopId').value = currentSop.meta.sopId || "";
    document.getElementById('department').value = currentSop.meta.department || "";
    document.getElementById('version').value = currentSop.meta.version || "";
    
    // Populate user dropdown first, then set author
    populateUserDropdown();
    document.getElementById('author').value = currentSop.meta.author || "";
    
    updateStatusDisplay();
    // Effective Date and Review Date are handled automatically, not displayed in form
    
    // Render description
    document.getElementById('description').value = currentSop.description || "";
    
    // Render warnings
    renderWarnings();
    
    // Render PPE checkboxes
    const ppeCheckboxes = document.querySelectorAll('.ppe-checkboxes input[type="checkbox"]');
    ppeCheckboxes.forEach(cb => {
        cb.checked = currentSop.safety.ppe.includes(cb.value);
    });
    
    // Separate other PPE
    const standardPpe = ['Safety Glasses', 'Hard Hat', 'Safety Boots', 'Gloves', 'Hearing Protection', 'Respirator', 'Safety Vest'];
    const otherPpe = currentSop.safety.ppe.filter(item => !standardPpe.includes(item));
    document.getElementById('ppeOther').value = otherPpe.join(', ');
    
    // Render safety notes
    document.getElementById('safetyNotes').value = currentSop.safety.notes || "";
    
    // Render tools
    renderTools();
    
    // Render materials
    renderMaterials();
    
    // Render steps
    renderSteps();
}

// Render warnings
function renderWarnings() {
    const container = document.getElementById('warningsContainer');
    container.innerHTML = '';
    
    if (currentSop.safety.warnings.length === 0) {
        addWarning();
    } else {
        currentSop.safety.warnings.forEach((warning, index) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <input type="text" class="warning-input" value="${escapeHtml(warning)}" placeholder="Enter safety warning" onchange="updateWarning(${index}, this.value)">
                <button type="button" class="btn-remove" onclick="removeWarning(this)">×</button>
            `;
            container.appendChild(div);
        });
    }
}

// Add warning
function addWarning() {
    const container = document.getElementById('warningsContainer');
    if (!container) {
        console.error('warningsContainer not found');
        return;
    }
    
    // Add empty string to warnings array to reserve the index
    const index = currentSop.safety.warnings.length;
    currentSop.safety.warnings.push('');
    
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
        <input type="text" class="warning-input" placeholder="Enter safety warning" onchange="updateWarning(${index}, this.value)">
        <button type="button" class="btn-remove" onclick="removeWarning(this)">×</button>
    `;
    container.appendChild(div);
    
    // Focus on the new input
    const newInput = div.querySelector('.warning-input');
    if (newInput) {
        newInput.focus();
    }
}

// Update warning
function updateWarning(index, value) {
    if (index >= 0 && index < currentSop.safety.warnings.length) {
        if (value.trim()) {
            currentSop.safety.warnings[index] = value.trim();
        } else {
            // Don't remove empty warnings immediately, allow user to type
            currentSop.safety.warnings[index] = '';
        }
        saveSopToStorage();
    }
}

// Remove warning
function removeWarning(button) {
    const container = button.closest('.list-item');
    if (!container) return;
    
    const input = container.querySelector('.warning-input');
    if (!input) return;
    
    const allInputs = Array.from(document.querySelectorAll('#warningsContainer .warning-input'));
    const index = allInputs.indexOf(input);
    
    if (index >= 0 && index < currentSop.safety.warnings.length) {
        currentSop.safety.warnings.splice(index, 1);
    }
    container.remove();
    saveSopToStorage();
}

// Render tools
function renderTools() {
    const container = document.getElementById('toolsContainer');
    container.innerHTML = '';
    
    if (currentSop.tools.length === 0) {
        addTool();
    } else {
        currentSop.tools.forEach((tool, index) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <input type="text" class="tool-input" value="${escapeHtml(tool)}" placeholder="Enter tool name" onchange="updateTool(${index}, this.value)">
                <button type="button" class="btn-remove" onclick="removeTool(this)">×</button>
            `;
            container.appendChild(div);
        });
    }
}

// Add tool
function addTool() {
    const container = document.getElementById('toolsContainer');
    if (!container) {
        console.error('toolsContainer not found');
        return;
    }
    
    // Add empty string to tools array to reserve the index
    const index = currentSop.tools.length;
    currentSop.tools.push('');
    
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
        <input type="text" class="tool-input" placeholder="Enter tool name" onchange="updateTool(${index}, this.value)">
        <button type="button" class="btn-remove" onclick="removeTool(this)">×</button>
    `;
    container.appendChild(div);
    
    // Focus on the new input
    const newInput = div.querySelector('.tool-input');
    if (newInput) {
        newInput.focus();
    }
}

// Update tool
function updateTool(index, value) {
    if (index >= 0 && index < currentSop.tools.length) {
        if (value.trim()) {
            currentSop.tools[index] = value.trim();
        } else {
            // Don't remove empty tools immediately, allow user to type
            currentSop.tools[index] = '';
        }
        saveSopToStorage();
    }
}

// Remove tool
function removeTool(button) {
    const container = button.closest('.list-item');
    if (!container) return;
    
    const input = container.querySelector('.tool-input');
    if (!input) return;
    
    const allInputs = Array.from(document.querySelectorAll('#toolsContainer .tool-input'));
    const index = allInputs.indexOf(input);
    
    if (index >= 0 && index < currentSop.tools.length) {
        currentSop.tools.splice(index, 1);
    }
    container.remove();
    saveSopToStorage();
}

// Render materials
function renderMaterials() {
    const container = document.getElementById('materialsContainer');
    container.innerHTML = '';
    
    if (currentSop.materials.length === 0) {
        addMaterial();
    } else {
        currentSop.materials.forEach((material, index) => {
            const div = document.createElement('div');
            div.className = 'list-item';
            div.innerHTML = `
                <input type="text" class="material-input" value="${escapeHtml(material)}" placeholder="Enter material name" onchange="updateMaterial(${index}, this.value)">
                <button type="button" class="btn-remove" onclick="removeMaterial(this)">×</button>
            `;
            container.appendChild(div);
        });
    }
}

// Add material
function addMaterial() {
    const container = document.getElementById('materialsContainer');
    if (!container) {
        console.error('materialsContainer not found');
        return;
    }
    
    // Add empty string to materials array to reserve the index
    const index = currentSop.materials.length;
    currentSop.materials.push('');
    
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
        <input type="text" class="material-input" placeholder="Enter material name" onchange="updateMaterial(${index}, this.value)">
        <button type="button" class="btn-remove" onclick="removeMaterial(this)">×</button>
    `;
    container.appendChild(div);
    
    // Focus on the new input
    const newInput = div.querySelector('.material-input');
    if (newInput) {
        newInput.focus();
    }
}

// Update material
function updateMaterial(index, value) {
    if (index >= 0 && index < currentSop.materials.length) {
        if (value.trim()) {
            currentSop.materials[index] = value.trim();
        } else {
            // Don't remove empty materials immediately, allow user to type
            currentSop.materials[index] = '';
        }
        saveSopToStorage();
    }
}

// Remove material
function removeMaterial(button) {
    const container = button.closest('.list-item');
    if (!container) return;
    
    const input = container.querySelector('.material-input');
    if (!input) return;
    
    const allInputs = Array.from(document.querySelectorAll('#materialsContainer .material-input'));
    const index = allInputs.indexOf(input);
    
    if (index >= 0 && index < currentSop.materials.length) {
        currentSop.materials.splice(index, 1);
    }
    container.remove();
    saveSopToStorage();
}

// Render steps
function renderSteps() {
    const container = document.getElementById('stepsContainer');
    const addFirstStepBtn = document.getElementById('addFirstStepBtn');
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (currentSop.steps.length === 0) {
        if (addFirstStepBtn) {
            addFirstStepBtn.style.display = 'block';
        }
    } else {
        if (addFirstStepBtn) {
            addFirstStepBtn.style.display = 'none';
        }
        
        currentSop.steps.forEach((step, index) => {
            renderStep(step, index);
        });
        
        // Add "Add Step" button at the bottom - always visible when there are steps
        const addStepDiv = document.createElement('div');
        addStepDiv.className = 'add-step-bottom';
        addStepDiv.style.textAlign = 'center';
        addStepDiv.style.marginTop = '30px';
        addStepDiv.style.marginBottom = '20px';
        addStepDiv.style.padding = '20px';
        addStepDiv.style.borderTop = '2px solid #ecf0f1';
        addStepDiv.innerHTML = `
            <button type="button" class="btn btn-primary" style="font-size: 16px; padding: 12px 24px;" onclick="addStep(null)">+ Add Step</button>
        `;
        container.appendChild(addStepDiv);
    }
}

// Render single step
function renderStep(step, index) {
    const container = document.getElementById('stepsContainer');
    const stepDiv = document.createElement('div');
    stepDiv.className = 'step-container';
    stepDiv.id = `step-${step.id}`;
    
    const stepNumber = index + 1;
    
    stepDiv.innerHTML = `
        <div class="step-header">
            <div class="step-number">${stepNumber}</div>
            <input type="text" class="step-title-input" value="${escapeHtml(step.title)}" placeholder="Step Title" onchange="updateStepTitle('${step.id}', this.value)">
        </div>
        <div class="step-content-wrapper">
            <div class="step-content-left">
                <textarea class="step-description" placeholder="Detailed description of this step..." onchange="updateStepDescription('${step.id}', this.value)">${escapeHtml(step.description)}</textarea>
                <textarea class="step-safety-note" placeholder="Optional safety note for this step..." onchange="updateStepSafetyNote('${step.id}', this.value)">${escapeHtml(step.safetyNote || '')}</textarea>
            </div>
            <div class="step-content-right">
                <div class="step-images" id="images-${step.id}"></div>
                <button class="btn btn-primary btn-small" onclick="openImageModal('${step.id}')" style="margin-top: 10px;">+ Add Image</button>
            </div>
        </div>
        <div class="step-actions">
            <button class="btn btn-secondary btn-small" onclick="addStep('${step.id}')">+ Add Step Below</button>
        </div>
    `;
    
    container.appendChild(stepDiv);
    
    // Render images for this step
    renderStepImages(step.id, step.images);
}

// Render step images
function renderStepImages(stepId, images) {
    const container = document.getElementById(`images-${stepId}`);
    container.innerHTML = '';
    
    images.forEach((imageData, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'step-image-wrapper';
        wrapper.innerHTML = `
            <img src="${imageData}" alt="Step image">
            <button class="step-image-remove" onclick="removeStepImage('${stepId}', ${index})">×</button>
        `;
        container.appendChild(wrapper);
    });
}

// Add step
function addStep(insertAfterStepId) {
    updateSopData();
    
    const newStep = {
        id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: "",
        description: "",
        safetyNote: "",
        images: []
    };
    
    if (insertAfterStepId === null) {
        // Add at the end (or as first step if no steps exist)
        currentSop.steps.push(newStep);
    } else {
        // Find index of step to insert after
        const index = currentSop.steps.findIndex(s => s.id === insertAfterStepId);
        if (index !== -1) {
            currentSop.steps.splice(index + 1, 0, newStep);
        } else {
            currentSop.steps.push(newStep);
        }
    }
    
    renderSteps();
    saveSopToStorage();
    
    // Scroll to the new step
    setTimeout(() => {
        const newStepElement = document.querySelector(`#step-${newStep.id}`);
        if (newStepElement) {
            newStepElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Focus on the step title input
            const titleInput = newStepElement.querySelector('.step-title-input');
            if (titleInput) {
                titleInput.focus();
            }
        }
    }, 100);
}

// Update step title
function updateStepTitle(stepId, value) {
    const step = currentSop.steps.find(s => s.id === stepId);
    if (step) {
        step.title = value;
        saveSopToStorage();
    }
}

// Update step description
function updateStepDescription(stepId, value) {
    const step = currentSop.steps.find(s => s.id === stepId);
    if (step) {
        step.description = value;
        saveSopToStorage();
    }
}

// Update step safety note
function updateStepSafetyNote(stepId, value) {
    const step = currentSop.steps.find(s => s.id === stepId);
    if (step) {
        step.safetyNote = value;
        saveSopToStorage();
    }
}

// Remove step image
function removeStepImage(stepId, imageIndex) {
    const step = currentSop.steps.find(s => s.id === stepId);
    if (step && step.images[imageIndex]) {
        step.images.splice(imageIndex, 1);
        renderStepImages(stepId, step.images);
        saveSopToStorage();
    }
}

// Image Modal Functions
function openImageModal(stepId) {
    currentStepId = stepId;
    selectedImages = [];
    document.getElementById('imageModal').classList.remove('hidden');
    document.getElementById('cameraContainer').classList.add('hidden');
    document.getElementById('fileUploadContainer').classList.add('hidden');
    document.getElementById('previewContainer').classList.add('hidden');
    
    // Show camera controls initially
    const cameraControls = document.querySelector('.camera-controls');
    if (cameraControls) {
        cameraControls.style.display = 'flex';
        const useCameraBtn = cameraControls.querySelector('button[onclick="startCamera()"]');
        if (useCameraBtn) {
            useCameraBtn.style.display = 'inline-block';
        }
    }
    
    // Automatically start camera when modal opens
    setTimeout(() => {
        startCamera();
    }, 100); // Small delay to ensure modal is fully visible
}

function closeImageModal() {
    document.getElementById('imageModal').classList.add('hidden');
    stopCamera();
    currentStepId = null;
    selectedImages = [];
}

function startCamera() {
    document.getElementById('fileUploadContainer').classList.add('hidden');
    document.getElementById('previewContainer').classList.add('hidden');
    
    const video = document.getElementById('videoElement');
    const cameraContainer = document.getElementById('cameraContainer');
    
    // Hide "Use Camera" button - hide the entire camera-controls div so container is top layer
    const cameraControls = document.querySelector('.camera-controls');
    if (cameraControls) {
        cameraControls.style.display = 'none';
    }
    
    // Camera constraints for portrait orientation
    const constraints = {
        video: {
            facingMode: 'environment',
            width: { ideal: 1080 },
            height: { ideal: 1920 },
            aspectRatio: { ideal: 9/16 } // Portrait aspect ratio
        }
    };
    
    navigator.mediaDevices.getUserMedia(constraints)
        .then(function(mediaStream) {
            stream = mediaStream;
            video.srcObject = stream;
            
            // Show camera container AFTER stream is received - make it the top visible element
            cameraContainer.classList.remove('hidden');
            // Force display and ensure visibility
            cameraContainer.style.display = 'flex';
            cameraContainer.style.visibility = 'visible';
            cameraContainer.style.opacity = '1';
            
            // Scroll container into view if needed
            setTimeout(() => {
                const rect = cameraContainer.getBoundingClientRect();
                if (rect.top < 0 || rect.bottom > window.innerHeight) {
                    cameraContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
            
            // Wait for video metadata to ensure proper orientation, then play
            video.onloadedmetadata = function() {
                video.play().then(() => {
                    console.log('Camera started successfully');
                }).catch(function(playError) {
                    console.error('Error playing video:', playError);
                });
            };
        })
        .catch(function(err) {
            // Show camera-controls again if camera fails
            const cameraControls = document.querySelector('.camera-controls');
            if (cameraControls) {
                cameraControls.style.display = 'flex';
            }
            
            console.error('Camera error:', err);
            useFileUpload();
        });
}

function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    document.getElementById('videoElement').srcObject = null;
    document.getElementById('cameraContainer').classList.add('hidden');
    
    // Show "Use Camera" button again when camera is stopped
    const cameraControls = document.querySelector('.camera-controls');
    if (cameraControls) {
        const useCameraBtn = cameraControls.querySelector('button[onclick="startCamera()"]');
        if (useCameraBtn) {
            useCameraBtn.style.display = 'inline-block';
        }
    }
}

function capturePhoto() {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('canvasElement');
    const context = canvas.getContext('2d');
    
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    
    // Determine if we need to rotate for portrait
    const isLandscape = videoWidth > videoHeight;
    
    if (isLandscape) {
        // Rotate 90 degrees clockwise for portrait
        canvas.width = videoHeight;
        canvas.height = videoWidth;
        context.translate(canvas.width / 2, canvas.height / 2);
        context.rotate(Math.PI / 2);
        context.drawImage(video, -videoWidth / 2, -videoHeight / 2);
    } else {
        // Already portrait, use as is
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        context.drawImage(video, 0, 0);
    }
    
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    selectedImages = [imageData];
    
    stopCamera();
    showImagePreview();
}

function useFileUpload() {
    stopCamera();
    document.getElementById('fileUploadContainer').classList.remove('hidden');
    
    // Show "Use Camera" button again
    const cameraControls = document.querySelector('.camera-controls');
    if (cameraControls) {
        const useCameraBtn = cameraControls.querySelector('button[onclick="startCamera()"]');
        if (useCameraBtn) {
            useCameraBtn.style.display = 'inline-block';
        }
    }
    
    document.getElementById('fileInput').click();
}

function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length === 0) return;
    
    selectedImages = [];
    Array.from(files).forEach(file => {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const imageData = e.target.result;
                // Process image to ensure portrait orientation
                processImageForPortrait(imageData, function(processedImage) {
                    selectedImages.push(processedImage);
                    if (selectedImages.length === files.length) {
                        showImagePreview();
                    }
                });
            };
            reader.readAsDataURL(file);
        }
    });
}

function processImageForPortrait(imageData, callback) {
    const img = new Image();
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const imgWidth = img.width;
        const imgHeight = img.height;
        const isLandscape = imgWidth > imgHeight;
        
        // Target portrait dimensions: 3:4 aspect ratio
        const targetAspectRatio = 3 / 4;
        let outputWidth, outputHeight;
        
        if (isLandscape) {
            // Rotate 90 degrees clockwise for portrait
            const rotatedWidth = imgHeight;
            const rotatedHeight = imgWidth;
            
            // Calculate dimensions to fit 3:4 ratio
            if (rotatedWidth / rotatedHeight > targetAspectRatio) {
                // Image is wider than 3:4, fit to height
                outputHeight = rotatedHeight;
                outputWidth = outputHeight * targetAspectRatio;
            } else {
                // Image is taller than 3:4, fit to width
                outputWidth = rotatedWidth;
                outputHeight = outputWidth / targetAspectRatio;
            }
            
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            
            // Center and rotate
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(Math.PI / 2);
            
            // Draw centered and scaled
            const scale = Math.min(outputWidth / rotatedHeight, outputHeight / rotatedWidth);
            const scaledWidth = rotatedWidth * scale;
            const scaledHeight = rotatedHeight * scale;
            ctx.drawImage(img, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight);
        } else {
            // Already portrait, but ensure 3:4 ratio
            if (imgWidth / imgHeight > targetAspectRatio) {
                // Image is wider than 3:4, fit to height
                outputHeight = imgHeight;
                outputWidth = outputHeight * targetAspectRatio;
            } else {
                // Image is taller than 3:4, fit to width
                outputWidth = imgWidth;
                outputHeight = outputWidth / targetAspectRatio;
            }
            
            canvas.width = outputWidth;
            canvas.height = outputHeight;
            
            // Draw centered and cropped to 3:4
            const scale = Math.max(outputWidth / imgWidth, outputHeight / imgHeight);
            const scaledWidth = imgWidth * scale;
            const scaledHeight = imgHeight * scale;
            const x = (canvas.width - scaledWidth) / 2;
            const y = (canvas.height - scaledHeight) / 2;
            ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        }
        
        const processedData = canvas.toDataURL('image/jpeg', 0.85);
        callback(processedData);
    };
    img.onerror = function() {
        // If processing fails, use original
        callback(imageData);
    };
    img.src = imageData;
}

function showImagePreview() {
    document.getElementById('cameraContainer').classList.add('hidden');
    document.getElementById('fileUploadContainer').classList.add('hidden');
    
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = '';
    
    selectedImages.forEach((imageData, index) => {
        const img = document.createElement('img');
        img.src = imageData;
        img.className = 'preview-image';
        preview.appendChild(img);
    });
    
    document.getElementById('previewContainer').classList.remove('hidden');
}

function confirmImageSelection() {
    if (currentStepId && selectedImages.length > 0) {
        const step = currentSop.steps.find(s => s.id === currentStepId);
        if (step) {
            step.images = [...step.images, ...selectedImages];
            renderStepImages(currentStepId, step.images);
            saveSopToStorage();
        }
    }
    closeImageModal();
}

// Save/Load Functions
async function saveSop() {
    updateSopData();
    
    if (!currentSop.meta.title || !currentSop.meta.sopId) {
        showNotification('Please fill in at least SOP Title and SOP ID before saving.', 'warning');
        return;
    }
    
    // Automatically set Effective Date to today if not set
    if (!currentSop.meta.effectiveDate) {
        const today = new Date().toISOString().split('T')[0];
        currentSop.meta.effectiveDate = today;
    }
    
    // Automatically set status to "Under Review" when saving
    currentSop.meta.status = "Under Review";
    updateStatusDisplay();
    
    await saveSopToStorage();
    
    // Send PDF to user if user is selected and email is configured
    if (currentSop.meta.author) {
        try {
            const users = getUsers();
            const user = users.find(u => {
                const fullName = `${u.firstName} ${u.lastName}`;
                return fullName === currentSop.meta.author;
            });
            
            if (user && user.email) {
                // Generate PDF and send to user - PRESERVE STATUS (keep as "Under Review")
                showNotification('Generating PDF to send to user...', 'info');
                const originalSop = { ...currentSop };
                const pdfBlob = await exportToPdf(true, true); // preserveStatus = true
                
                // Send PDF to user's email
                await sendPdfEmailToUser(pdfBlob, currentSop, user);
                
                showNotification(`SOP saved and PDF sent to ${user.email}!`, 'success');
            }
        } catch (e) {
            console.error('Error sending PDF to user:', e);
            // Don't block save if email fails
            showNotification('SOP saved! (Email sending failed)', 'warning');
        }
    }
    
    // Save JSON file to a dedicated exports storage for easy access
    const jsonStr = JSON.stringify(currentSop, null, 2);
    const fileName = `${currentSop.meta.sopId || 'sop'}-${Date.now()}.json`;
    
    // Store export metadata only (not full data) in localStorage for easy access
    // Full data is stored in savedSops, so we don't need to duplicate it
    try {
        const exports = JSON.parse(localStorage.getItem('sopExports') || '[]');
        exports.push({
            fileName: fileName,
            sopId: currentSop.meta.sopId,
            title: currentSop.meta.title,
            exportedAt: new Date().toISOString()
            // Don't store full data here - it's already in savedSops
        });
        // Keep only last 50 exports to prevent quota issues
        if (exports.length > 50) {
            exports.splice(0, exports.length - 50);
        }
        localStorage.setItem('sopExports', JSON.stringify(exports));
    } catch (e) {
        // If exports storage fails, just log it - don't block save
        console.warn('Could not save export metadata:', e);
    }
    
    // Also download the file
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification(`SOP saved successfully! Status changed to "Under Review". JSON file: ${fileName}`, 'success');
}

async function saveSopToStorage() {
    updateSopData();
    
    // CRITICAL: Ensure status is set to "Under Review" if not already approved
    // Only set to Under Review if it's currently Draft or empty, and hasn't been reviewed
    if ((!currentSop.meta.status || currentSop.meta.status === '' || currentSop.meta.status === 'Draft') && !currentSop.meta.reviewer) {
        currentSop.meta.status = 'Under Review';
    }
    
    try {
        const key = currentSop.meta.sopId || `sop-${Date.now()}`;
        currentSop.meta.sopId = key; // Ensure SOP ID is set
        
        // SAVE TO GOOGLE DRIVE with localStorage fallback
        let savedToGoogleDrive = false;
        if (typeof saveSopToCloud === 'function' && useCloudSops()) {
            try {
                await saveSopToCloud(currentSop);
                console.log('✅ SOP saved to Google Drive');
                savedToGoogleDrive = true;
            } catch (error) {
                console.error('❌ Error saving to cloud/Drive:', error);
                let errorMsg = error.message || 'Unknown error';
                if (errorMsg.includes('401') || errorMsg.includes('unauthorized'))
                    errorMsg = 'Auth failed – check service account.';
                else if (errorMsg.includes('403'))
                    errorMsg = 'Access denied – share Drive folder with service account.';
                else if (errorMsg.includes('SOP_FOLDER_ID') || errorMsg.includes('not configured'))
                    errorMsg = 'Backend not configured – set SOP_FOLDER_ID and GOOGLE_SERVICE_ACCOUNT_JSON in Cloud Run.';
                showNotification('Did NOT save to Drive: ' + errorMsg + ' Saved locally only.', 'error');
                // Continue to localStorage fallback - don't throw
            }
        }
        
        // FALLBACK: Always save to localStorage (works even if Google Drive fails)
        const savedSops = JSON.parse(localStorage.getItem('savedSops') || '{}');
        savedSops[key] = {
            ...currentSop,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('savedSops', JSON.stringify(savedSops));
        console.log('✅ SOP saved to localStorage' + (savedToGoogleDrive ? ' and Google Drive' : ' (Google Drive unavailable)'));
        
        showNotification('SOP saved successfully!', 'success');
        
        // Refresh lists after save
        if (document.getElementById('sopRegister').classList.contains('active')) {
            await refreshRegister();
        }
        if (document.getElementById('sopReview').classList.contains('active')) {
            await refreshReviewList();
        }
        
        // Lists already refreshed above after Google Drive save
    } catch (e) {
        if (e.name === 'QuotaExceededError') {
            // Storage is full - show user-friendly error with cleanup options
            showNotification('Storage is full! Please clear old exports or SOPs. Go to the Exports section to clear old data.', 'error');
            console.error('Storage quota exceeded. Please clear old data.');
        } else {
            console.error('Error saving to storage:', e);
            showNotification('Error saving: ' + e.message, 'error');
        }
    }
}

function loadSopFromStorage() {
    try {
        const saved = localStorage.getItem('currentSop');
        if (saved) {
            currentSop = JSON.parse(saved);
            renderSop();
        }
    } catch (e) {
        console.error('Error loading from storage:', e);
    }
}

async function showLoadSection() {
    const section = document.getElementById('loadSopSection');
    const list = document.getElementById('savedSopsList');
    
    if (!section || !list) return;
    
    list.innerHTML = '<p>Loading SOPs...</p>';
    section.classList.remove('hidden');
    
    try {
        let savedSops;
        try {
            savedSops = await loadAllSopsMerged();
        } catch (error) {
            const msg = error.message || 'Check connection.';
            list.innerHTML = '<p>Error loading SOPs: ' + escapeHtml(msg) + '</p>';
            const banner = document.getElementById('connectionErrorBanner');
            const textEl = document.getElementById('connectionErrorText');
            if (banner && textEl) { textEl.textContent = msg; banner.style.display = ''; }
            return;
        }
        if (Object.keys(savedSops).length === 0 && !useCloudSops()) {
            list.innerHTML = '<p>No SOPs saved yet. Create and save an SOP first.</p>';
            return;
        }
        
        list.innerHTML = '';
        
        const sopKeys = Object.keys(savedSops);
        if (sopKeys.length === 0) {
            list.innerHTML = '<p>No saved SOPs found.</p>';
        } else {
            sopKeys.forEach(key => {
                const sop = savedSops[key];
                const item = document.createElement('div');
                item.className = 'saved-sop-item';
                item.innerHTML = `
                    <h4>${escapeHtml(sop.meta.title || 'Untitled SOP')}</h4>
                    <p>SOP ID: ${escapeHtml(sop.meta.sopId || 'N/A')} | Saved: ${sop.savedAt ? new Date(sop.savedAt).toLocaleString() : 'N/A'}</p>
                `;
                item.onclick = () => {
                    loadSop(sop);
                    closeLoadSection();
                };
                list.appendChild(item);
            });
        }
    } catch (e) {
        list.innerHTML = '<p>Error loading saved SOPs.</p>';
        console.error('Error:', e);
    }
}

function closeLoadSection() {
    const section = document.getElementById('loadSopSection');
    if (section) section.classList.add('hidden');
}

function showExportsSection() {
    const section = document.getElementById('exportsSection');
    const list = document.getElementById('exportsList');
    
    if (!section || !list) return;
    
    try {
        const exports = JSON.parse(localStorage.getItem('sopExports') || '[]');
        list.innerHTML = '';
        
        if (exports.length === 0) {
            list.innerHTML = '<p>No exported JSON files found. Export files will appear here after saving SOPs.</p>';
        } else {
            // Sort by most recent first
            exports.sort((a, b) => new Date(b.exportedAt) - new Date(a.exportedAt));
            
            exports.forEach((exportItem, index) => {
                const item = document.createElement('div');
                item.className = 'saved-sop-item';
                const exportDate = new Date(exportItem.exportedAt);
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; gap: 10px;">
                        <div style="flex: 1;">
                            <h4>${escapeHtml(exportItem.title || 'Untitled SOP')}</h4>
                            <p><strong>SOP ID:</strong> ${escapeHtml(exportItem.sopId || 'N/A')}</p>
                            <p><strong>File:</strong> ${escapeHtml(exportItem.fileName)}</p>
                            <p><strong>Exported:</strong> ${exportDate.toLocaleString()}</p>
                        </div>
                        <div style="display: flex; gap: 5px; flex-direction: column;">
                            <button class="btn btn-primary btn-small" onclick="downloadExport(${index})">Download</button>
                            <button class="btn btn-secondary btn-small" onclick="loadFromExport(${index})">Load</button>
                            <button class="btn btn-danger btn-small" onclick="deleteExport(${index})">Delete</button>
                        </div>
                    </div>
                `;
                list.appendChild(item);
            });
        }
    } catch (e) {
        list.innerHTML = '<p>Error loading exports.</p>';
        console.error('Error:', e);
    }
    
    section.classList.remove('hidden');
}

function closeExportsSection() {
    const section = document.getElementById('exportsSection');
    if (section) section.classList.add('hidden');
}

async function downloadExport(index) {
    try {
        const exports = JSON.parse(localStorage.getItem('sopExports') || '[]');
        if (index >= 0 && index < exports.length) {
            const exportItem = exports[index];
            const savedSops = await loadAllSopsMerged();
            const sop = savedSops[exportItem.sopId];
            if (sop) {
                const jsonStr = JSON.stringify(sop, null, 2);
                const blob = new Blob([jsonStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = exportItem.fileName;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                showNotification('SOP data not found. It may have been deleted.', 'error');
            }
        }
    } catch (e) {
        showNotification('Error downloading file: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

async function loadFromExport(index) {
    try {
        const exports = JSON.parse(localStorage.getItem('sopExports') || '[]');
        if (index >= 0 && index < exports.length) {
            const exportItem = exports[index];
            const savedSops = await loadAllSopsMerged();
            const sop = savedSops[exportItem.sopId];
            if (sop) {
                const sopData = { ...sop };
                delete sopData.savedAt;
                loadSop(sopData);
                closeExportsSection();
            } else {
                showNotification('SOP data not found. It may have been deleted.', 'error');
            }
        }
    } catch (e) {
        showNotification('Error loading file: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

async function deleteExport(index) {
    const confirmed = await showConfirmation('Delete Export', 'Are you sure you want to delete this export from the list?');
    if (!confirmed) {
        return;
    }
    
    try {
        const exports = JSON.parse(localStorage.getItem('sopExports') || '[]');
        if (index >= 0 && index < exports.length) {
            exports.splice(index, 1);
            localStorage.setItem('sopExports', JSON.stringify(exports));
            showExportsSection(); // Refresh the list
        }
    } catch (e) {
        showNotification('Error deleting export: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

async function downloadAllExports() {
    try {
        const exports = JSON.parse(localStorage.getItem('sopExports') || '[]');
        if (exports.length === 0) {
            showNotification('No exports to download.', 'info');
            return;
        }
        
        const confirmed = await showConfirmation('Download All Exports', `Download all ${exports.length} exported JSON files?`);
        if (!confirmed) {
            return;
        }
        
        const savedSops = await loadAllSopsMerged();
        exports.forEach((exportItem, index) => {
            setTimeout(() => {
                const sop = savedSops[exportItem.sopId];
                if (sop) {
                    const jsonStr = JSON.stringify(sop, null, 2);
                    const blob = new Blob([jsonStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = exportItem.fileName;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            }, index * 200); // Stagger downloads to avoid browser blocking
        });
        
        showNotification(`Downloading ${exports.length} files...`, 'info');
    } catch (e) {
        showNotification('Error downloading files: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

async function clearExports() {
    const confirmed = await showConfirmation('Clear Exports', 'Are you sure you want to clear all exports from the list? This will not delete the files from your Downloads folder.');
    if (!confirmed) {
        return;
    }
    
    try {
        localStorage.removeItem('sopExports');
        showExportsSection(); // Refresh the list
        showNotification('Export list cleared.', 'success');
    } catch (e) {
        showNotification('Error clearing exports: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

function loadSop(sopData) {
    // Set flag to prevent switchTab from clearing the editor if switching to editor tab
    isLoadingFromRegister = true;
    currentSop = { ...sopData };
    delete currentSop.savedAt;
    renderSop();
    closeLoadSection();
    showNotification('SOP loaded successfully!', 'success');
}

function loadFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const sopData = JSON.parse(e.target.result);
            loadSop(sopData);
        } catch (err) {
            showNotification('Error loading file. Please ensure it is a valid JSON file.', 'error');
            console.error('Error:', err);
        }
    };
    reader.readAsText(file);
}

// Update status display
function updateStatusDisplay() {
    const statusField = document.getElementById('status');
    if (statusField) {
        statusField.value = currentSop.meta.status || "Draft";
    }
}

function getJsPDF() {
    const lib = window.jspdf || window.jsPDF;
    const jsPDF = (lib && lib.jsPDF) || (typeof lib === 'function' ? lib : null);
    if (!jsPDF || typeof jsPDF !== 'function') throw new Error('PDF library not loaded. If Tracking Prevention is on, try a different browser or disable it for this site.');
    return jsPDF;
}

// PDF Export (returns blob if returnBlob is true, otherwise downloads)
// preserveStatus: if true, don't change status to "Approved" (used when saving and sending to user)
async function exportToPdf(returnBlob = false, preserveStatus = false, skipFormSync = false) {
    return new Promise(async (resolve, reject) => {
    // Only sync from form when editor is active; when exporting from Register/approval, currentSop is already set
    if (!skipFormSync && document.getElementById('sopEditor')?.classList.contains('active')) {
        updateSopData();
    }
    
    if (!currentSop.meta.title || !currentSop.meta.sopId) {
        showNotification('Please fill in at least SOP Title and SOP ID before exporting.', 'warning');
        document.getElementById('loadingIndicator').classList.add('hidden');
        resolve(); return;
    }
    
    if (currentSop.steps.length === 0) {
        showNotification('Please add at least one step before exporting.', 'warning');
        document.getElementById('loadingIndicator').classList.add('hidden');
        resolve(); return;
    }
    
    // Only set status to "Approved" if not preserving status (i.e., when explicitly approving)
    if (!preserveStatus) {
        // Automatically set status to "Approved" when generating PDF (only when not preserving)
        currentSop.meta.status = "Approved";
        updateStatusDisplay();
        saveSopToStorage(); // Save the status change
    }
    
    document.getElementById('loadingIndicator').classList.remove('hidden');
    
    // CRITICAL: FORCE LOAD LOGO BEFORE PDF GENERATION - BLOCKING
    console.log('🚨🚨🚨 FORCING LOGO LOAD - THIS WILL BLOCK UNTIL LOGO IS READY 🚨🚨🚨');
    let logoImage = null;
    let logoLoadAttempts = 0;
    const maxAttempts = 10;
    
    // Try to load logo with retries until successful
    while (!logoImage && logoLoadAttempts < maxAttempts) {
        logoLoadAttempts++;
        console.log(`Logo load attempt ${logoLoadAttempts}/${maxAttempts}`);
        
        // First try cached logo
        if (cachedLogoImage && cachedLogoImage.startsWith('data:image')) {
            logoImage = cachedLogoImage;
            console.log('✓ Logo loaded from cache');
            break;
        }
        
        // Method 1: Try fetch API (works on http:// or https://)
        if (window.location.protocol !== 'file:') {
            try {
                const response = await fetch('Recorp_logo.png');
                if (response.ok) {
                    const blob = await response.blob();
                    const reader = new FileReader();
                    logoImage = await new Promise((resolve) => {
                        reader.onloadend = () => {
                            const dataUrl = reader.result;
                            if (dataUrl && dataUrl.startsWith('data:image')) {
                                console.log('✓✓✓ Logo loaded via FETCH API ✓✓✓');
                                cachedLogoImage = dataUrl;
                                resolve(dataUrl);
                            } else {
                                resolve(null);
                            }
                        };
                        reader.onerror = () => resolve(null);
                        reader.readAsDataURL(blob);
                    });
                    if (logoImage) break;
                }
            } catch (e) {
                console.log('Fetch method failed:', e.message);
            }
        }
        
        // Method 2: Try DOM element with canvas
        try {
            const logoElement = document.querySelector('.header-logo');
            if (logoElement) {
                // Force reload the image
                if (logoLoadAttempts > 1) {
                    const originalSrc = logoElement.src;
                    logoElement.src = '';
                    logoElement.src = originalSrc;
                }
                
                // Wait for it to load
                await new Promise((resolve) => {
                    if (logoElement.complete && logoElement.naturalWidth > 0) {
                        resolve();
                    } else {
                        const timeout = setTimeout(resolve, 1000);
                        const onload = () => {
                            clearTimeout(timeout);
                            logoElement.removeEventListener('load', onload);
                            logoElement.removeEventListener('error', onerror);
                            resolve();
                        };
                        const onerror = () => {
                            clearTimeout(timeout);
                            logoElement.removeEventListener('load', onload);
                            logoElement.removeEventListener('error', onerror);
                            resolve();
                        };
                        logoElement.addEventListener('load', onload);
                        logoElement.addEventListener('error', onerror);
                        if (logoElement.complete) {
                            onload();
                        }
                    }
                });
                
                if (logoElement.complete && logoElement.naturalWidth > 0) {
                    try {
                        cachedLogoAspectRatio = logoElement.naturalWidth / logoElement.naturalHeight;
                        const canvas = document.createElement('canvas');
                        canvas.width = logoElement.naturalWidth;
                        canvas.height = logoElement.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(logoElement, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png');
                        if (dataUrl && dataUrl.startsWith('data:image')) {
                            logoImage = dataUrl;
                            console.log('✓✓✓ Logo loaded via CANVAS from DOM element ✓✓✓');
                            cachedLogoImage = logoImage;
                            break;
                        }
                    } catch (e) {
                        console.log('Canvas method failed:', e.message);
                    }
                }
            }
        } catch (e) {
            console.log('DOM method failed:', e.message);
        }
        
        // Method 3: Try new Image object
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            // Get the source from DOM element or use direct path
            const logoElement = document.querySelector('.header-logo');
            const logoSrc = logoElement ? logoElement.src : 'Recorp_logo.png';
            img.src = logoSrc;
            
            logoImage = await new Promise((resolve) => {
                const timeout = setTimeout(() => resolve(null), 2000);
                img.onload = () => {
                    clearTimeout(timeout);
                    try {
                        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                            cachedLogoAspectRatio = img.naturalWidth / img.naturalHeight;
                        }
                        const canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        const dataUrl = canvas.toDataURL('image/png');
                        if (dataUrl && dataUrl.startsWith('data:image')) {
                            console.log('✓✓✓ Logo loaded via NEW IMAGE object ✓✓✓');
                            cachedLogoImage = dataUrl;
                            resolve(dataUrl);
                        } else {
                            resolve(null);
                        }
                    } catch (e) {
                        resolve(null);
                    }
                };
                img.onerror = () => {
                    clearTimeout(timeout);
                    resolve(null);
                };
                if (img.complete) {
                    img.onload();
                }
            });
            if (logoImage) break;
        } catch (e) {
            console.log('New Image method failed:', e.message);
        }
        
        // Wait a bit before retry
        if (!logoImage && logoLoadAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }
    
    // FINAL VALIDATION - LOGO MUST BE LOADED
    if (!logoImage || !logoImage.startsWith('data:image')) {
        const errorMsg = '❌❌❌ CRITICAL ERROR: LOGO COULD NOT BE LOADED AFTER ' + maxAttempts + ' ATTEMPTS ❌❌❌';
        console.error(errorMsg);
        console.error('PDF generation is blocked. Logo is REQUIRED.');
        console.error('Please ensure:');
        console.error('1. Recorp_logo.png exists in the same directory as index.html');
        console.error('2. You are running from a local server (http://localhost) not file://');
        console.error('3. The logo file is not corrupted');
        
        document.getElementById('loadingIndicator').classList.add('hidden');
        showNotification('CRITICAL: Logo could not be loaded. PDF generation aborted. Check console for details.', 'error');
        reject(new Error('Logo could not be loaded - PDF generation aborted'));
        return;
    }
    
    console.log('✅✅✅ LOGO SUCCESSFULLY LOADED AND VALIDATED ✅✅✅');
    console.log('Logo data URL length:', logoImage.length);
    console.log('Logo format:', logoImage.substring(0, 50));
    
    try {
        const jsPDF = getJsPDF();
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        let yPos = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - (2 * margin);
        const maxHeight = pageHeight - 50; // Reduced to leave room for footer
        
        // Helper function to add footer to current page
        function addFooter() {
            const footerY = pageHeight - 10;
            const footerFontSize = 8;
            
            doc.setFontSize(footerFontSize);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100, 100, 100); // Gray color
            
            // Footer content: SOP Name | Version | Date Produced
            const sopName = currentSop.meta.title || 'Untitled SOP';
            const version = currentSop.meta.version || 'N/A';
            const dateProduced = currentSop.meta.effectiveDate || new Date().toISOString().split('T')[0];
            
            // Format date nicely
            let formattedDate = dateProduced;
            try {
                const date = new Date(dateProduced);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                }
            } catch (e) {
                // Use original date if parsing fails
            }
            
            const footerText = `${sopName} | Version ${version} | Date Produced: ${formattedDate}`;
            
            // Center the footer text
            const textWidth = doc.getTextWidth(footerText);
            const footerX = (pageWidth - textWidth) / 2;
            
            doc.text(footerText, footerX, footerY);
            doc.setTextColor(0, 0, 0); // Reset to black
        }
        
        console.log('=== USING LOGO FOR PDF ===');
        console.log('Cached logo available:', logoImage ? 'YES' : 'NO');
        if (logoImage) {
            console.log('Logo data URL length:', logoImage.length);
            console.log('Logo starts with:', logoImage.substring(0, 50));
            console.log('Logo format check:', logoImage.startsWith('data:image') ? 'PASS' : 'FAIL');
        } else {
            console.error('⚠️ NO CACHED LOGO - LOGO WILL NOT APPEAR IN PDF');
            console.error('Logo may not have preloaded. Check console for preload errors.');
            console.error('Make sure you are running from a local server (http://localhost) not file://');
        }
        
        // Helper function to add logo to first page only (header - top right), smaller and correct proportions
        let logoAddedToPageOne = false;
        function addLogoToPageOneOnly() {
            if (logoAddedToPageOne) return;
            if (!logoImage || !logoImage.startsWith('data:image')) {
                console.error('❌ FATAL: Logo not available for page - this should never happen!');
                throw new Error('Logo not available - PDF generation should have been blocked');
            }
            logoAddedToPageOne = true;
            const maxLogoWidth = 25;
            const maxLogoHeight = 10;
            let logoWidth, logoHeight;
            if (cachedLogoAspectRatio != null && cachedLogoAspectRatio > 0) {
                if (cachedLogoAspectRatio >= 1) {
                    logoWidth = maxLogoWidth;
                    logoHeight = maxLogoWidth / cachedLogoAspectRatio;
                } else {
                    logoHeight = maxLogoHeight;
                    logoWidth = maxLogoHeight * cachedLogoAspectRatio;
                }
            } else {
                logoWidth = 25;
                logoHeight = 9;
            }
            const logoX = pageWidth - margin - logoWidth;
            const logoY = 10;
            
            // Try multiple format detection methods
            let format = 'PNG'; // Default to PNG
            const formatMatch1 = logoImage.match(/data:image\/([^;]+);base64/);
            const formatMatch2 = logoImage.match(/data:image\/([^;]+)/);
            if (formatMatch1) {
                format = formatMatch1[1].toUpperCase();
            } else if (formatMatch2) {
                format = formatMatch2[1].toUpperCase();
            }
            
            // Try primary format first
            try {
                doc.addImage(logoImage, format, logoX, logoY, logoWidth, logoHeight);
                console.log('✓ Logo added to page 1 header (format: ' + format + ', size ' + logoWidth.toFixed(1) + 'x' + logoHeight.toFixed(1) + 'mm)');
                return true;
            } catch (e) {
                console.warn('Primary format (' + format + ') failed, trying PNG fallback:', e.message);
                try {
                    doc.addImage(logoImage, 'PNG', logoX, logoY, logoWidth, logoHeight);
                    console.log('✓ Logo added to page 1 header (PNG fallback)');
                    return true;
                } catch (e2) {
                    console.error('PNG fallback failed, trying JPEG:', e2.message);
                    try {
                        doc.addImage(logoImage, 'JPEG', logoX, logoY, logoWidth, logoHeight);
                        console.log('✓ Logo added to page 1 header (JPEG fallback)');
                        return true;
                    } catch (e3) {
                        console.error('❌ ALL LOGO ADD METHODS FAILED ❌');
                        console.error('Error:', e3);
                        throw new Error('Failed to add logo to PDF page: ' + e3.message);
                    }
                }
            }
        }
        
        // Helper function to add new page if needed (logo only on page 1)
        function checkNewPage(requiredHeight) {
            if (yPos + requiredHeight > maxHeight) {
                addFooter();
                doc.addPage();
                yPos = 20;
                return true;
            }
            return false;
        }
        
        // Logo only on first page (smaller, correct proportions)
        addLogoToPageOneOnly();
        
        // Header with title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        const titleText = currentSop.meta.title || 'Untitled SOP';
        doc.text(titleText, margin, yPos);
        
        yPos += 10;
        
        // Metadata
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        const metadata = [
            `SOP ID: ${currentSop.meta.sopId || 'N/A'}`,
            `Department: ${currentSop.meta.department || 'N/A'}`,
            `Version: ${currentSop.meta.version || 'N/A'}`,
            `Author: ${currentSop.meta.author || 'N/A'}`,
            `Status: ${currentSop.meta.status || 'N/A'}`,
            `Effective Date: ${currentSop.meta.effectiveDate || 'N/A'}`,
            `Review Date: ${currentSop.meta.reviewDate || 'N/A'}`
        ];
        
        metadata.forEach(line => {
            checkNewPage(5);
            doc.text(line, margin, yPos);
            yPos += 5;
        });
        
        yPos += 5;
        checkNewPage(10);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 10;
        
        // Description
        if (currentSop.description) {
            checkNewPage(15);
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Description', margin, yPos);
            yPos += 7;
            
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const descLines = doc.splitTextToSize(currentSop.description, contentWidth);
            descLines.forEach(line => {
                checkNewPage(5);
                doc.text(line, margin, yPos);
                yPos += 5;
            });
            yPos += 5;
        }
        
        // Safety
        checkNewPage(15);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Safety', margin, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        if (currentSop.safety.warnings.length > 0) {
            doc.setFont(undefined, 'bold');
            doc.text('Safety Warnings:', margin, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            currentSop.safety.warnings.forEach(warning => {
                checkNewPage(5);
                doc.text(`• ${warning}`, margin + 5, yPos);
                yPos += 5;
            });
        }
        
        if (currentSop.safety.ppe.length > 0) {
            checkNewPage(5);
            doc.setFont(undefined, 'bold');
            doc.text('PPE Required:', margin, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            const ppeText = currentSop.safety.ppe.join(', ');
            const ppeLines = doc.splitTextToSize(ppeText, contentWidth);
            ppeLines.forEach(line => {
                checkNewPage(5);
                doc.text(`• ${line}`, margin + 5, yPos);
                yPos += 5;
            });
        }
        
        if (currentSop.safety.notes) {
            checkNewPage(5);
            doc.setFont(undefined, 'bold');
            doc.text('Safety Notes:', margin, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            const notesLines = doc.splitTextToSize(currentSop.safety.notes, contentWidth);
            notesLines.forEach(line => {
                checkNewPage(5);
                doc.text(line, margin, yPos);
                yPos += 5;
            });
        }
        
        yPos += 5;
        
        // Tools & Materials
        checkNewPage(15);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Tools & Materials', margin, yPos);
        yPos += 7;
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        
        if (currentSop.tools.length > 0) {
            doc.setFont(undefined, 'bold');
            doc.text('Tools Required:', margin, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            currentSop.tools.forEach(tool => {
                checkNewPage(5);
                doc.text(`• ${tool}`, margin + 5, yPos);
                yPos += 5;
            });
        }
        
        if (currentSop.materials.length > 0) {
            checkNewPage(5);
            doc.setFont(undefined, 'bold');
            doc.text('Materials Required:', margin, yPos);
            yPos += 5;
            doc.setFont(undefined, 'normal');
            currentSop.materials.forEach(material => {
                checkNewPage(5);
                doc.text(`• ${material}`, margin + 5, yPos);
                yPos += 5;
            });
        }
        
        yPos += 5;
        
        // Steps - first step directly under heading when possible
        checkNewPage(15);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Step-by-Step Instructions', margin, yPos);
        yPos += 5;
        
        // Debug: Log steps count
        console.log('=== PDF GENERATION: STEPS ===');
        console.log('Total steps in currentSop:', currentSop.steps.length);
        console.log('Steps array:', currentSop.steps);
        
        // Ensure we process ALL steps - use a more robust loop
        const totalSteps = currentSop.steps.length;
        for (let i = 0; i < totalSteps; i++) {
            const step = currentSop.steps[i];
            
            if (!step) {
                console.warn(`Step ${i + 1} is undefined, skipping`);
                continue;
            }
            
            console.log(`Processing step ${i + 1}/${totalSteps}:`, step.title || 'Untitled');
            
            // Calculate description height first (using 65% of content width)
            let descHeight = 0;
            const descColumnWidth = contentWidth * 0.65;
            if (step.description) {
                const descLines = doc.splitTextToSize(step.description, descColumnWidth);
                descHeight = descLines.length * 5;
            }
            if (step.safetyNote) {
                descHeight += 10;
            }
            
            // Get image dimensions if exists - portrait and larger
            let imageHeight = 0;
            let imageWidth = 0;
            let hasImage = false;
            if (step.images && step.images.length > 0) {
                try {
                    const img = new Image();
                    img.src = step.images[0]; // Use first image
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            // Timeout after 2 seconds - continue without image
                            console.log('Image load timeout for step', i + 1);
                            resolve();
                        }, 2000);
                        
                        img.onload = function() {
                            clearTimeout(timeout);
                            // Larger portrait images - 50% of content width (was 30%)
                            // Portrait aspect ratio: 3:4
                            imageWidth = contentWidth * 0.45; // 45% of content width
                            imageHeight = imageWidth * (4/3); // Maintain 3:4 portrait ratio
                            // Limit to reasonable page size
                            if (imageHeight > 80) {
                                imageHeight = 80;
                                imageWidth = imageHeight * (3/4);
                            }
                            hasImage = true;
                            resolve();
                        };
                        img.onerror = () => {
                            clearTimeout(timeout);
                            console.log('Image load error for step', i + 1);
                            resolve(); // Continue without image
                        };
                        if (img.complete && img.naturalWidth > 0) {
                            clearTimeout(timeout);
                            // Larger portrait images - 50% of content width
                            imageWidth = contentWidth * 0.45; // 45% of content width
                            imageHeight = imageWidth * (4/3); // Maintain 3:4 portrait ratio
                            if (imageHeight > 80) {
                                imageHeight = 80;
                                imageWidth = imageHeight * (3/4);
                            }
                            hasImage = true;
                            resolve();
                        }
                    });
                } catch (e) {
                    console.log('Error loading image for step', i + 1, ':', e);
                    // Continue without image
                }
            }
            
            // Calculate total step height BEFORE drawing anything
            const stepContentHeight = Math.max(descHeight, imageHeight) + 10;
            const totalStepHeight = 15 + stepContentHeight; // Header (15) + content
            
            // Check if entire step fits on page BEFORE drawing
            if (yPos + totalStepHeight > maxHeight) {
                // Step doesn't fit, add footer to current page and create new page
                addFooter();
                doc.addPage();
                yPos = 20;
            }
            
            // Now draw step header (only once)
            checkNewPage(15); // Reserve space for header
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.text(`Step ${i + 1}: ${step.title || 'Untitled Step'}`, margin, yPos);
            yPos += 7;
            
            // Step content - side by side layout
            // Description on left, larger portrait image on right
            const leftX = margin + 2; // Slight indent inside box
            const columnWidth = contentWidth * 0.52; // Description gets 52% of width
            const rightX = margin + columnWidth + 10; // Image positioned after description with gap
            
            // Left column: Description
            let leftY = yPos;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            
            if (step.description) {
                const descLines = doc.splitTextToSize(step.description, columnWidth - 4);
                descLines.forEach(line => {
                    doc.text(line, leftX, leftY);
                    leftY += 5;
                });
            }
            
            // Safety note
            if (step.safetyNote) {
                leftY += 2;
                doc.setFont(undefined, 'italic');
                doc.setTextColor(200, 150, 0);
                const safetyLines = doc.splitTextToSize(`⚠ ${step.safetyNote}`, columnWidth - 4);
                safetyLines.forEach(line => {
                    doc.text(line, leftX, leftY);
                    leftY += 5;
                });
                doc.setTextColor(0, 0, 0);
            }
            
            // Right column: Image (portrait orientation, larger)
            if (hasImage && step.images && step.images.length > 0) {
                try {
                    doc.addImage(step.images[0], 'JPEG', rightX, yPos, imageWidth, imageHeight);
                } catch (err) {
                    console.error('Error adding image to PDF:', err);
                    doc.text('[Image]', rightX, yPos);
                }
            }
            
            // Move yPos to the bottom of the step (whichever is lower)
            const stepEndY = Math.max(leftY, yPos + imageHeight) + 3;
            yPos = stepEndY;
            
            // Draw horizontal line to separate steps (instead of box)
            if (i < totalSteps - 1) {
                checkNewPage(10);
                yPos += 3; // Small gap before line
                doc.setDrawColor(150, 150, 150); // Gray line
                doc.setLineWidth(0.5);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 5; // Space after line before next step
            }
            
            console.log(`Step ${i + 1}/${totalSteps} completed, yPos: ${yPos}`);
        }
        
        console.log(`=== ALL ${totalSteps} STEPS PROCESSED ===`);
        
        // CRITICAL: Add footer to EVERY page (including first and last)
        // Get current page number and add footer to all pages
        const totalPages = doc.internal.pages.length - 1; // jsPDF uses 1-indexed pages, but has a base page
        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            doc.setPage(pageNum);
            addFooter();
        }
        // Set back to last page for final operations
        doc.setPage(totalPages);
        
        // Save PDF or return blob - include SOP title in filename
        const titleSlug = (currentSop.meta.title || 'Untitled').replace(/[^a-z0-9]/gi, '_').substring(0, 50);
        const fileName = `${currentSop.meta.sopId || 'sop'}_${titleSlug}_${Date.now()}.pdf`;
        
        // Always hide loading indicator when PDF generation completes
        document.getElementById('loadingIndicator').classList.add('hidden');
        
        if (returnBlob) {
            const pdfBlob = doc.output('blob');
            resolve(pdfBlob);
        } else {
            doc.save(fileName);
            showNotification('PDF generated successfully! Status changed to "Approved".', 'success');
            resolve();
        }
    } catch (error) {
        document.getElementById('loadingIndicator').classList.add('hidden');
        showNotification('Error generating PDF: ' + error.message, 'error');
        console.error('PDF generation error:', error);
        reject(error);
    }
    });
}

// Tab Management - Make available globally immediately
// Tab Management - Store implementation
window._switchTabImpl = function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    let contentId = 'sopRequests'; // Default to requests tab
    if (tabName === 'editor') {
        contentId = 'sopEditor';
        
        // If switching to editor and NOT loading from register, create blank SOP
        if (!isLoadingFromRegister) {
            // Create a blank SOP
            currentSop = {
                meta: {
                    title: "",
                    sopId: "",
                    department: "",
                    version: "1.0",
                    author: "",
                    status: "Draft",
                    effectiveDate: "",
                    reviewDate: ""
                },
                description: "",
                safety: {
                    warnings: [],
                    ppe: [],
                    notes: ""
                },
                tools: [],
                materials: [],
                steps: []
            };
            stepCounter = 0;
            renderSop();
            // Scroll to top when creating blank SOP
            window.scrollTo(0, 0);
        }
        // Reset the flag after handling
        isLoadingFromRegister = false;
    } else if (tabName === 'register') {
        contentId = 'sopRegister';
    } else if (tabName === 'review') {
        contentId = 'sopReview';
    } else if (tabName === 'tasks') {
        contentId = 'sopTasks';
    } else if (tabName === 'requests') {
        contentId = 'sopRequests';
    } else if (tabName === 'users') {
        contentId = 'sopUsers';
    }
    document.getElementById(contentId).classList.add('active');
    
    // Refresh when switching tabs
    if (tabName === 'requests') {
        refreshRequestsList();
    } else if (tabName === 'register') {
        refreshRegister();
    } else if (tabName === 'review') {
        refreshReviewList();
        // Populate reviewer dropdowns after list is rendered
        setTimeout(() => {
            populateAllReviewerDropdowns();
        }, 100);
    } else if (tabName === 'tasks') {
        refreshProgressTracker();
        refreshTasksList();
    } else if (tabName === 'users') {
        loadUsersMerged().then(() => {
            refreshUsersList();
            populateUserDropdown();
            populateAllReviewerDropdowns();
        });
    } else if (tabName === 'editor') {
        loadUsersMerged().then(() => populateUserDropdown());
    }
    
    // Show/hide floating save button
    const floatingSaveBtn = document.querySelector('.editor-footer-actions');
    if (floatingSaveBtn) {
        if (tabName === 'editor') {
            floatingSaveBtn.style.display = 'block';
        } else {
            floatingSaveBtn.style.display = 'none';
        }
    }
}

// SOP Register Functions
let allSops = [];
let filteredSops = [];

async function refreshRegister() {
    try {
        // LOAD FROM GITHUB ONLY
        let savedSops;
        try {
            savedSops = await loadAllSopsMerged();
        } catch (error) {
            renderRegisterTable([]);
            const msg = error.message || 'Check connection.';
            showNotification('Could not load SOPs: ' + msg, 'error');
            const banner = document.getElementById('connectionErrorBanner');
            const textEl = document.getElementById('connectionErrorText');
            if (banner && textEl) { textEl.textContent = msg; banner.style.display = ''; }
            return;
        }
        allSops = [];
        
        Object.keys(savedSops).forEach(key => {
            const sop = savedSops[key];
            if (sop && sop.meta) {
                allSops.push({
                    key: key,
                    ...sop
                });
            }
        });
        
        // Sort by last saved (newest first)
        allSops.sort((a, b) => {
            const dateA = new Date(a.savedAt || 0);
            const dateB = new Date(b.savedAt || 0);
            return dateB - dateA;
        });
        
        // Update department filter
        updateDepartmentFilter();
        
        // Apply filters
        filterRegister();
    } catch (e) {
        console.error('Error refreshing register:', e);
        renderRegisterTable([]);
    }
}

function updateDepartmentFilter() {
    const departments = new Set();
    allSops.forEach(sop => {
        if (sop.meta.department) {
            departments.add(sop.meta.department);
        }
    });
    
    const filter = document.getElementById('departmentFilter');
    const currentValue = filter.value;
    
    // Clear and rebuild options
    filter.innerHTML = '<option value="">All Departments</option>';
    Array.from(departments).sort().forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        filter.appendChild(option);
    });
    
    // Restore previous selection
    filter.value = currentValue;
}

function filterRegister() {
    const searchTerm = document.getElementById('registerSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    
    filteredSops = allSops.filter(sop => {
        const matchesSearch = !searchTerm || 
            (sop.meta.title && sop.meta.title.toLowerCase().includes(searchTerm)) ||
            (sop.meta.sopId && sop.meta.sopId.toLowerCase().includes(searchTerm)) ||
            (sop.meta.author && sop.meta.author.toLowerCase().includes(searchTerm));
        
        const matchesStatus = !statusFilter || sop.meta.status === statusFilter;
        const matchesDepartment = !departmentFilter || sop.meta.department === departmentFilter;
        
        return matchesSearch && matchesStatus && matchesDepartment;
    });
    
    renderRegisterTable(filteredSops);
}

function renderRegisterTable(sops) {
    const tbody = document.getElementById('registerTableBody');
    const empty = document.getElementById('registerEmpty');
    
    if (sops.length === 0) {
        tbody.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    
    empty.classList.add('hidden');
    tbody.innerHTML = '';
    
    sops.forEach(sop => {
        const row = document.createElement('tr');
        const savedDate = sop.savedAt ? new Date(sop.savedAt) : new Date();
        
        const statusClass = sop.meta.status ? sop.meta.status.toLowerCase().replace(/\s+/g, '-') : '';
        
        row.innerHTML = `
            <td><strong>${escapeHtml(sop.meta.sopId || 'N/A')}</strong></td>
            <td>${escapeHtml(sop.meta.title || 'Untitled SOP')}</td>
            <td>${escapeHtml(sop.meta.department || 'N/A')}</td>
            <td>${escapeHtml(sop.meta.version || 'N/A')}</td>
            <td>${escapeHtml(sop.meta.author || 'N/A')}</td>
            <td><span class="status-badge ${statusClass}">${escapeHtml(sop.meta.status || 'N/A')}</span></td>
            <td>${escapeHtml(sop.meta.effectiveDate || 'N/A')}</td>
            <td>${escapeHtml(sop.meta.reviewDate || 'N/A')}</td>
            <td>${savedDate.toLocaleDateString()} ${savedDate.toLocaleTimeString()}</td>
            <td class="register-actions-cell">
                <button class="btn btn-primary btn-small" onclick="loadSopFromRegister('${sop.key}')" title="Edit">Edit</button>
                <button class="btn btn-success btn-small" onclick="exportSopPdfFromRegister('${sop.key}')" title="Export PDF">PDF</button>
                <button class="btn btn-secondary btn-small" onclick="deleteSopFromRegister('${sop.key}')" title="Delete">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function loadSopFromRegister(key) {
    try {
        const savedSops = await loadAllSopsMerged();
        const sop = savedSops[key];
        
        if (sop) {
            // Set flag to prevent switchTab from clearing the editor
            isLoadingFromRegister = true;
            currentSop = { ...sop };
            delete currentSop.savedAt;
            renderSop();
            switchTab('editor');
            showNotification('SOP loaded successfully!', 'success');
        } else {
            showNotification('SOP not found.', 'error');
        }
    } catch (e) {
        showNotification('Error loading SOP: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

async function exportSopPdfFromRegister(key) {
    try {
        const savedSops = await loadAllSopsMerged();
        const sop = savedSops[key];
        
        if (!sop) {
            showNotification('SOP not found.', 'error');
            return;
        }
        
        // Temporarily set current SOP for PDF export
        const originalSop = { ...currentSop };
        currentSop = { ...sop };
        delete currentSop.savedAt;
        
        document.getElementById('loadingIndicator').classList.remove('hidden');
        
        // Skip form sync – currentSop is already set from Register; form may be empty/wrong tab
        await exportToPdf(false, false, true);
        
        // Restore original SOP
        currentSop = originalSop;
        
        document.getElementById('loadingIndicator').classList.add('hidden');
    } catch (e) {
        document.getElementById('loadingIndicator').classList.add('hidden');
        showNotification('Error exporting PDF: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

async function deleteSopFromRegister(key) {
    const confirmed = await showConfirmation('Delete SOP', 'Are you sure you want to delete this SOP? This action cannot be undone.');
    if (!confirmed) {
        return;
    }
    
    try {
        if (typeof deleteSopFromCloud === 'function' && useCloudSops()) {
            await deleteSopFromCloud(key);
            console.log('✅ SOP deleted from cloud:', key);
        }
        // Always remove from localStorage so it doesn't reappear when we merge cloud + local
        try {
            const saved = JSON.parse(localStorage.getItem('savedSops') || '{}');
            if (saved[key]) {
                delete saved[key];
                localStorage.setItem('savedSops', JSON.stringify(saved));
            }
        } catch (_) {}
        
        // Optimistic UI: remove from in-memory list and re-render so the row disappears immediately
        allSops = allSops.filter(sop => sop.key !== key);
        filterRegister();
        
        if (currentSop.meta && currentSop.meta.sopId === key) {
            createNewSop();
        }
        
        await refreshRegister();
        showNotification('SOP deleted successfully.', 'success');
    } catch (e) {
        showNotification('Error deleting SOP: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

function exportRegister() {
    try {
        const jsPDF = getJsPDF();
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        let yPos = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 15;
        const maxHeight = doc.internal.pageSize.getHeight() - 20;
        
        // Title
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('SOP Register', margin, yPos);
        yPos += 10;
        
        // Date
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, yPos);
        yPos += 10;
        
        // Table headers
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        const headers = ['SOP ID', 'Title', 'Department', 'Version', 'Status', 'Effective Date'];
        const colWidths = [25, 50, 30, 20, 30, 35];
        let xPos = margin;
        
        headers.forEach((header, i) => {
            doc.text(header, xPos, yPos);
            xPos += colWidths[i];
        });
        
        yPos += 7;
        doc.setDrawColor(0, 0, 0);
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 5;
        
        // Table rows
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        
        filteredSops.forEach(sop => {
            if (yPos > maxHeight) {
                doc.addPage();
                yPos = 20;
            }
            
            const row = [
                sop.meta.sopId || 'N/A',
                sop.meta.title || 'Untitled',
                sop.meta.department || 'N/A',
                sop.meta.version || 'N/A',
                sop.meta.status || 'N/A',
                sop.meta.effectiveDate || 'N/A'
            ];
            
            xPos = margin;
            row.forEach((cell, i) => {
                const text = doc.splitTextToSize(String(cell), colWidths[i] - 2);
                doc.text(text[0] || '', xPos, yPos);
                xPos += colWidths[i];
            });
            
            yPos += 7;
        });
        
        // Summary
        yPos += 5;
        if (yPos > maxHeight) {
            doc.addPage();
            yPos = 20;
        }
        
        doc.setFont(undefined, 'bold');
        doc.text(`Total SOPs: ${filteredSops.length}`, margin, yPos);
        
        const fileName = `SOP-Register-${Date.now()}.pdf`;
        doc.save(fileName);
        showNotification('Register exported successfully!', 'success');
    } catch (error) {
        showNotification('Error exporting register: ' + error.message, 'error');
        console.error('Export error:', error);
    }
}

// Utility Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible
window.addWarning = addWarning;
window.removeWarning = removeWarning;
window.addTool = addTool;
window.removeTool = removeTool;
window.addMaterial = addMaterial;
window.removeMaterial = removeMaterial;
window.addStep = addStep;
window.updateStepTitle = updateStepTitle;
window.updateStepDescription = updateStepDescription;
window.updateStepSafetyNote = updateStepSafetyNote;
window.removeStepImage = removeStepImage;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.startCamera = startCamera;
window.stopCamera = stopCamera;
window.capturePhoto = capturePhoto;
window.useFileUpload = useFileUpload;
window.handleFileUpload = handleFileUpload;
window.confirmImageSelection = confirmImageSelection;
window.loadFromFile = loadFromFile;
// SOP Requests Functions
let sopRequests = [];

// Store implementation
window._submitSopRequestImpl = function submitSopRequest(event) {
    // Prevent default form submission if event is provided
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
    
    console.log('=== SUBMIT SOP REQUEST ===');
    
    const title = document.getElementById('requestTitle');
    const department = document.getElementById('requestDepartment');
    const submitter = document.getElementById('requestSubmitter');
    const priority = document.getElementById('requestPriority');
    const description = document.getElementById('requestDescription');
    
    if (!title || !department || !submitter || !priority) {
        console.error('Form elements not found!');
        showNotification('Form error: Please refresh the page.', 'error');
        return;
    }
    
    const titleValue = title.value.trim();
    const departmentValue = department.value;
    const submitterValue = submitter.value.trim();
    const priorityValue = priority.value;
    const descriptionValue = description ? description.value.trim() : '';
    
    console.log('Form values:', { titleValue, departmentValue, submitterValue, priorityValue });
    
    if (!titleValue || !departmentValue || !submitterValue || !priorityValue) {
        showNotification('Please fill in all required fields (Title, Department, Requested By, Priority).', 'warning');
        return;
    }
    
    const request = {
        id: 'req-' + Date.now(),
        title: titleValue,
        department: departmentValue,
        submitter: submitterValue,
        priority: priorityValue,
        description: descriptionValue,
        status: 'Pending',
        submittedAt: new Date().toISOString()
    };
    
    console.log('Creating request:', request);
    
    try {
        let requests = JSON.parse(localStorage.getItem('sopRequests') || '[]');
        console.log('Current requests in storage:', requests.length);
        requests.push(request);
        localStorage.setItem('sopRequests', JSON.stringify(requests));
        console.log('Request saved. Total requests:', requests.length);
        
        clearRequestForm();
        refreshRequestsList();
        showNotification('SOP request submitted successfully!', 'success');
        console.log('✓ Request submitted successfully');
    } catch (e) {
        console.error('Error submitting request:', e);
        showNotification('Error submitting request: ' + e.message, 'error');
    }
}

function clearRequestForm() {
    document.getElementById('sopRequestForm').reset();
}

function refreshRequestsList() {
    try {
        sopRequests = JSON.parse(localStorage.getItem('sopRequests') || '[]');
        filterRequests();
    } catch (e) {
        console.error('Error loading requests:', e);
        renderRequestsList([]);
    }
}

function filterRequests() {
    const priorityFilterEl = document.getElementById('requestFilter');
    const deptFilterEl = document.getElementById('requestDeptFilter');
    
    const priorityFilter = priorityFilterEl ? priorityFilterEl.value : 'all';
    const deptFilter = deptFilterEl ? deptFilterEl.value : 'all';
    
    console.log('Filtering requests - Priority:', priorityFilter, 'Dept:', deptFilter);
    console.log('Total requests to filter:', sopRequests.length);
    
    let filtered = sopRequests.filter(req => req.status === 'Pending');
    console.log('Pending requests:', filtered.length);
    
    if (priorityFilter !== 'all') {
        filtered = filtered.filter(req => {
            const reqPriority = parseInt(req.priority) || 3;
            const filterPriority = parseInt(priorityFilter);
            return reqPriority === filterPriority;
        });
        console.log('After priority filter:', filtered.length);
    }
    
    if (deptFilter !== 'all') {
        filtered = filtered.filter(req => req.department === deptFilter);
        console.log('After department filter:', filtered.length);
    }
    
    // Sort by priority (5 = highest, 1 = lowest)
    filtered.sort((a, b) => {
        const priorityA = parseInt(a.priority) || 3;
        const priorityB = parseInt(b.priority) || 3;
        // Higher priority number first (5 before 1)
        const priorityDiff = priorityB - priorityA;
        if (priorityDiff !== 0) return priorityDiff;
        // If same priority, sort by date (newest first)
        return new Date(b.submittedAt) - new Date(a.submittedAt);
    });
    
    console.log('Rendering', filtered.length, 'requests');
    renderRequestsList(filtered);
}

function renderRequestsList(requests) {
    console.log('=== RENDER REQUESTS LIST ===');
    console.log('Requests to render:', requests.length);
    
    const container = document.getElementById('requestsListContainer');
    const empty = document.getElementById('requestsEmpty');
    
    if (!container) {
        console.error('ERROR: requestsListContainer element not found!');
        return;
    }
    if (!empty) {
        console.error('ERROR: requestsEmpty element not found!');
    }
    
    if (requests.length === 0) {
        container.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        console.log('No requests - showing empty state');
        return;
    }
    
    if (empty)     empty.classList.add('hidden');
    console.log('Rendering', requests.length, 'request items');
    
    // Create table structure
    let html = `
        <table class="requests-table">
            <thead>
                <tr>
                    <th>Priority</th>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Requested By</th>
                    <th>Submitted Date</th>
                    <th>Description</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    requests.forEach(req => {
        const submittedDate = new Date(req.submittedAt);
        const priorityNum = parseInt(req.priority) || 3;
        // Get priority class and label based on number (1-5)
        let priorityClass, priorityLabel;
        if (priorityNum === 5) {
            priorityClass = 'urgent';
            priorityLabel = '5 - Urgent';
        } else if (priorityNum === 4) {
            priorityClass = 'high';
            priorityLabel = '4 - High';
        } else if (priorityNum === 3) {
            priorityClass = 'medium';
            priorityLabel = '3 - Medium';
        } else if (priorityNum === 2) {
            priorityClass = 'low';
            priorityLabel = '2 - Low';
        } else {
            priorityClass = 'lowest';
            priorityLabel = '1 - Lowest';
        }
        
        html += `
            <tr class="request-row priority-${priorityClass}">
                <td><span class="priority-badge priority-${priorityClass}">${priorityNum}</span></td>
                <td><strong>${escapeHtml(req.title)}</strong></td>
                <td>${escapeHtml(req.department)}</td>
                <td>${escapeHtml(req.submitter)}</td>
                <td>${submittedDate.toLocaleDateString()} ${submittedDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                <td>${escapeHtml(req.description || 'No description')}</td>
                <td class="request-actions-cell">
                    <button class="btn btn-primary btn-small" onclick="startSopFromRequest('${req.id}')" title="Start Creating SOP">Start</button>
                    <button class="btn btn-secondary btn-small" onclick="deleteRequest('${req.id}')" title="Delete Request">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

function startSopFromRequest(requestId) {
    const request = sopRequests.find(r => r.id === requestId);
    if (!request) {
        showNotification('Request not found.', 'error');
        return;
    }
    
    // Set flag to prevent switchTab from clearing the editor
    isLoadingFromRegister = true;
    
    // Create new SOP with request details
    currentSop = {
        meta: {
            title: request.title,
            sopId: "",
            department: request.department,
            version: "1.0",
            author: request.submitter,
            status: "Draft",
            effectiveDate: "",
            reviewDate: ""
        },
        description: request.description || "",
        safety: {
            warnings: [],
            ppe: [],
            notes: ""
        },
        tools: [],
        materials: [],
        steps: []
    };
    
    stepCounter = 0;
    renderSop();
    autoGenerateSopId();
    
    // Mark request as in progress
    markRequestStatus(requestId, 'In Progress');
    
    // Switch to editor tab
    switchTab('editor');
    showNotification('SOP started from request. Fill in the details and save.', 'success');
}

function markRequestStatus(requestId, status) {
    try {
        const requests = JSON.parse(localStorage.getItem('sopRequests') || '[]');
        const index = requests.findIndex(r => r.id === requestId);
        if (index !== -1) {
            requests[index].status = status;
            localStorage.setItem('sopRequests', JSON.stringify(requests));
            refreshRequestsList();
        }
    } catch (e) {
        console.error('Error updating request status:', e);
    }
}

function deleteRequest(requestId) {
    showConfirmation('Delete Request', 'Are you sure you want to delete this request?').then(confirmed => {
        if (confirmed) {
            try {
                const requests = JSON.parse(localStorage.getItem('sopRequests') || '[]');
                const filtered = requests.filter(r => r.id !== requestId);
                localStorage.setItem('sopRequests', JSON.stringify(filtered));
                refreshRequestsList();
                showNotification('Request deleted.', 'success');
            } catch (e) {
                showNotification('Error deleting request: ' + e.message, 'error');
                console.error('Error:', e);
            }
        }
    });
}

// DIAGNOSTIC: Replacing stubs with full implementations
console.log('🔍 DIAG: Replacing function stubs with implementations');

// Update the global functions to point to implementations
if (typeof window._switchTabImpl === 'function') {
    window.switchTab = window._switchTabImpl;
    console.log('✅ DIAG: switchTab implementation loaded');
} else {
    console.error('❌ DIAG: switchTab implementation NOT FOUND');
}

if (typeof window._submitSopRequestImpl === 'function') {
    window.submitSopRequest = window._submitSopRequestImpl;
    console.log('✅ DIAG: submitSopRequest implementation loaded');
} else {
    console.error('❌ DIAG: submitSopRequest implementation NOT FOUND');
}

// Assign updateAuthorFromUser implementation
if (typeof updateAuthorFromUser === 'function') {
    window._updateAuthorFromUserImpl = updateAuthorFromUser;
    window.updateAuthorFromUser = updateAuthorFromUser;
    console.log('✅ DIAG: updateAuthorFromUser implementation loaded');
} else {
    console.error('❌ DIAG: updateAuthorFromUser implementation NOT FOUND');
}

console.log('🔍 DIAG: Function replacement complete');
window.refreshRegister = refreshRegister;
window.clearRequestForm = clearRequestForm;
window.filterRequests = filterRequests;
window.refreshRequestsList = refreshRequestsList;
window.startSopFromRequest = startSopFromRequest;
window.deleteRequest = deleteRequest;
window.filterRegister = filterRegister;
window.exportRegister = exportRegister;
window.loadSopFromRegister = loadSopFromRegister;
window.exportSopPdfFromRegister = exportSopPdfFromRegister;
window.deleteSopFromRegister = deleteSopFromRegister;
window.retryConnectionAndRefresh = retryConnectionAndRefresh;
window.autoGenerateSopId = autoGenerateSopId;

// Review Functions
let reviewSops = [];
let filteredReviewSops = [];
let currentReviewSopKey = null;

async function refreshReviewList() {
    try {
        const savedSops = await loadAllSopsMerged();
        
        reviewSops = [];
        
        console.log('=== REFRESH REVIEW LIST DEBUG ===');
        console.log('Total SOPs in storage:', Object.keys(savedSops).length);
        
        Object.keys(savedSops).forEach(key => {
            const sop = savedSops[key];
            
            if (sop && sop.meta) {
                // Check status - be flexible with matching
                const status = String(sop.meta.status || '').trim();
                console.log(`Checking SOP ${key}: status="${status}"`);
                
                if (status === 'Under Review') {
                    reviewSops.push({
                        key: key,
                        ...sop
                    });
                    console.log(`✓ Added ${key} to review list`);
                }
            } else {
                console.log(`Skipping SOP ${key}: missing meta`);
            }
        });
        
        console.log(`Total SOPs found for review: ${reviewSops.length}`);
        
        // Sort by last saved (newest first)
        reviewSops.sort((a, b) => {
            const dateA = new Date(a.savedAt || 0);
            const dateB = new Date(b.savedAt || 0);
            return dateB - dateA;
        });
        
        // Update department filter
        updateReviewDepartmentFilter();
        
        // Apply filters
        filterReviewList();
    } catch (e) {
        console.error('Error refreshing review list:', e);
        renderReviewList([]);
        const msg = e.message || 'Check connection.';
        showNotification('Could not load SOPs: ' + msg, 'error');
        const banner = document.getElementById('connectionErrorBanner');
        const textEl = document.getElementById('connectionErrorText');
        if (banner && textEl) { textEl.textContent = msg; banner.style.display = ''; }
    }
}

function updateReviewDepartmentFilter() {
    const departments = new Set();
    reviewSops.forEach(sop => {
        if (sop.meta.department) {
            departments.add(sop.meta.department);
        }
    });
    
    const filter = document.getElementById('reviewDepartmentFilter');
    if (!filter) return;
    
    const currentValue = filter.value;
    
    filter.innerHTML = '<option value="">All Departments</option>';
    Array.from(departments).sort().forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        filter.appendChild(option);
    });
    
    filter.value = currentValue;
}

function filterReviewList() {
    const searchInput = document.getElementById('reviewSearch');
    const departmentFilter = document.getElementById('reviewDepartmentFilter');
    
    if (!searchInput || !departmentFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const deptFilter = departmentFilter.value;
    
    filteredReviewSops = reviewSops.filter(sop => {
        const matchesSearch = !searchTerm || 
            (sop.meta.title && sop.meta.title.toLowerCase().includes(searchTerm)) ||
            (sop.meta.sopId && sop.meta.sopId.toLowerCase().includes(searchTerm)) ||
            (sop.meta.author && sop.meta.author.toLowerCase().includes(searchTerm));
        
        const matchesDepartment = !deptFilter || sop.meta.department === deptFilter;
        
        return matchesSearch && matchesDepartment;
    });
    
    renderReviewList(filteredReviewSops);
}

function renderReviewList(sops) {
    const container = document.getElementById('reviewListContainer');
    const empty = document.getElementById('reviewEmpty');
    
    if (!container || !empty) return;
    
    if (sops.length === 0) {
        container.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    
    empty.classList.add('hidden');
    
    // Create table structure
    let tableHTML = `
        <table class="review-table">
            <thead>
                <tr>
                    <th>SOP ID</th>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Version</th>
                    <th>Author</th>
                    <th>Submitted</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    sops.forEach(sop => {
        const savedDate = sop.savedAt ? new Date(sop.savedAt) : new Date();
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        const defaultReviewDate = oneYearFromNow.toISOString().split('T')[0];
        
        tableHTML += `
            <tr id="review-row-${sop.key}">
                <td>${escapeHtml(sop.meta.sopId || 'N/A')}</td>
                <td>${escapeHtml(sop.meta.title || 'Untitled SOP')}</td>
                <td>${escapeHtml(sop.meta.department || 'N/A')}</td>
                <td>${escapeHtml(sop.meta.version || 'N/A')}</td>
                <td>${escapeHtml(sop.meta.author || 'N/A')}</td>
                <td>${savedDate.toLocaleDateString()} ${savedDate.toLocaleTimeString()}</td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="viewSopForReview('${sop.key}')">View</button>
                </td>
            </tr>
            <tr class="review-expanded-row" id="review-expanded-${sop.key}" style="display: none;">
                <td colspan="7">
                    <div class="review-expanded-content">
                        <div class="review-form-inline" id="review-form-${sop.key}">
                            <div class="review-form-grid">
                                <div class="form-group">
                                    <label>Reviewer Name *</label>
                                    <select id="reviewerName-${sop.key}" required>
                                        <option value="">Select Reviewer</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>Next Annual Review Date *</label>
                                    <input type="date" id="reviewDateInput-${sop.key}" value="${defaultReviewDate}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Review Comments</label>
                                <textarea id="reviewComments-${sop.key}" rows="3" placeholder="Enter any comments or feedback..."></textarea>
                            </div>
                            <div class="review-actions-inline">
                                <button class="btn btn-success" onclick="approveSopInline('${sop.key}')">Approve & Generate PDF</button>
                                <button class="btn btn-secondary" onclick="rejectSopInline('${sop.key}')">Request Changes</button>
                            </div>
                        </div>
                        <div id="pdf-viewer-${sop.key}" class="pdf-viewer-container" style="display: none;">
                            <div class="pdf-viewer-header">
                                <h4>Generated PDF Preview</h4>
                                <button class="btn btn-primary btn-small" onclick="downloadPdfFromReview('${sop.key}')">Download PDF</button>
                            </div>
                            <iframe id="pdf-iframe-${sop.key}" class="pdf-iframe" frameborder="0"></iframe>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = tableHTML;
    
    // Populate reviewer dropdowns after rendering
    setTimeout(() => {
        populateAllReviewerDropdowns();
    }, 50);
}

function toggleReviewForm(sopKey) {
    const expandedRow = document.getElementById(`review-expanded-${sopKey}`);
    if (!expandedRow) return;
    
    // Toggle display
    if (expandedRow.style.display === 'none') {
        expandedRow.style.display = 'table-row';
        // Close other expanded rows
        document.querySelectorAll('.review-expanded-row').forEach(row => {
            if (row.id !== `review-expanded-${sopKey}`) {
                row.style.display = 'none';
            }
        });
    } else {
        expandedRow.style.display = 'none';
    }
}

// Inline review functions (no modal)
async function approveSopInline(sopKey) {
    const reviewerNameEl = document.getElementById(`reviewerName-${sopKey}`);
    const reviewCommentsEl = document.getElementById(`reviewComments-${sopKey}`);
    const reviewDateEl = document.getElementById(`reviewDateInput-${sopKey}`);
    
    if (!reviewerNameEl || !reviewCommentsEl || !reviewDateEl) return;
    
    const reviewerName = reviewerNameEl.value.trim();
    const reviewComments = reviewCommentsEl.value.trim();
    const reviewDate = reviewDateEl.value;
    
    if (!reviewerName) {
        showNotification('Please enter reviewer name.', 'warning');
        return;
    }
    
    if (!reviewDate) {
        showNotification('Please select a review date.', 'warning');
        return;
    }
    
    try {
        const savedSops = await loadAllSopsMerged();
        const sop = savedSops[sopKey];
        
        if (!sop) {
            showNotification('SOP not found.', 'error');
            return;
        }
        
        // Update SOP with review information
        sop.meta.reviewer = reviewerName;
        sop.meta.reviewComments = reviewComments;
        sop.meta.status = 'Approved';
        sop.meta.reviewDate = reviewDate;
        sop.reviewedAt = new Date().toISOString();
        
        if (typeof saveSopToCloud === 'function' && useCloudSops()) {
            try {
                await saveSopToCloud(sop);
                console.log('✅ SOP approved and saved to GitHub');
            } catch (error) {
                console.error('❌ Error saving to GitHub:', error);
                showNotification('Error saving to GitHub: ' + error.message, 'error');
                throw error;
            }
        } else {
            showNotification('GitHub storage not available', 'error');
            throw new Error('GitHub storage not available');
        }
        
        showNotification('SOP approved! Generating PDF...', 'info');
        
        // Automatically generate PDF after approval and display inline
        try {
            // Temporarily set current SOP for PDF export
            const originalSop = { ...currentSop };
            currentSop = { ...sop };
            delete currentSop.savedAt;
            if (currentSop.reviewedAt) delete currentSop.reviewedAt;
            
            // Generate PDF as blob and display inline (skip form sync – currentSop already set)
            const pdfBlob = await exportToPdf(true, false, true);
            
            // Display PDF in iframe
            const pdfViewer = document.getElementById(`pdf-viewer-${sopKey}`);
            const pdfIframe = document.getElementById(`pdf-iframe-${sopKey}`);
            
            if (pdfViewer && pdfIframe) {
                const pdfUrl = URL.createObjectURL(pdfBlob);
                pdfIframe.src = pdfUrl;
                pdfViewer.style.display = 'block';
                
                // Store blob URL for download
                pdfIframe.dataset.blobUrl = pdfUrl;
                
                // Send PDF via email if configured - to holding email (recorpproduction@gmail.com)
                try {
                    await sendPdfEmail(pdfBlob, sop);
                    console.log('Email sent to holding address');
                } catch (emailError) {
                    console.error('Email sending failed:', emailError);
                    showNotification('PDF generated, but email failed: ' + emailError.message, 'warning');
                    // Don't block approval if email fails
                }
                
                // Show success notification
                showNotification('SOP approved and PDF generated successfully!', 'success');
            } else {
                showNotification('PDF viewer not found.', 'error');
            }
            
            // Restore original SOP
            currentSop = originalSop;
            
            // Refresh list to show approved status
            refreshReviewList();
        } catch (pdfError) {
            console.error('PDF generation error:', pdfError);
            showNotification('SOP approved, but PDF generation failed: ' + pdfError.message, 'warning');
            // SOP is still approved even if PDF fails
        }
    } catch (e) {
        showNotification('Error approving SOP: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

async function rejectSopInline(sopKey) {
    const reviewerNameEl = document.getElementById(`reviewerName-${sopKey}`);
    const reviewCommentsEl = document.getElementById(`reviewComments-${sopKey}`);
    const reviewDateEl = document.getElementById(`reviewDateInput-${sopKey}`);
    
    if (!reviewerNameEl || !reviewCommentsEl || !reviewDateEl) return;
    
    const reviewerName = reviewerNameEl.value.trim();
    const reviewComments = reviewCommentsEl.value.trim();
    const reviewDate = reviewDateEl.value;
    
    if (!reviewerName) {
        showNotification('Please enter reviewer name.', 'warning');
        return;
    }
    
    if (!reviewDate) {
        showNotification('Please select a review date.', 'warning');
        return;
    }
    
    if (!reviewComments) {
        const confirmed = await showConfirmation('No Comments', 'No comments provided. Continue with rejection?');
        if (!confirmed) {
            return;
        }
    }
    
    try {
        const savedSops = await loadAllSopsMerged();
        const sop = savedSops[sopKey];
        
        if (!sop) {
            showNotification('SOP not found.', 'error');
            return;
        }
        
        // Update SOP with review information
        sop.meta.reviewer = reviewerName;
        sop.meta.reviewComments = reviewComments;
        sop.meta.status = 'Draft';
        sop.meta.reviewDate = reviewDate;
        sop.reviewedAt = new Date().toISOString();
        
        if (typeof saveSopToCloud === 'function' && useCloudSops()) {
            try {
                await saveSopToCloud(sop);
                console.log('✅ SOP rejected and saved');
                showNotification('SOP returned to Draft status. Author can make changes based on your comments.', 'success');
                await refreshReviewList();
            } catch (error) {
                console.error('❌ Error saving to GitHub:', error);
                showNotification('Error saving to GitHub: ' + error.message, 'error');
            }
        } else {
            showNotification('GitHub storage not available', 'error');
        }
    } catch (e) {
        showNotification('Error rejecting SOP: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

async function generatePdfFromReviewKey(sopKey) {
    try {
        const savedSops = await loadAllSopsMerged();
        const sop = savedSops[sopKey];
        
        if (!sop) {
            showNotification('SOP not found.', 'error');
            return;
        }
        
        // Temporarily set current SOP for PDF export
        const originalSop = { ...currentSop };
        currentSop = { ...sop };
        delete currentSop.savedAt;
        if (currentSop.reviewedAt) delete currentSop.reviewedAt;
        
        // Generate PDF (skip form sync – currentSop already set from review)
        exportToPdf(false, false, true).catch((error) => {
            console.error('PDF generation error:', error);
        }).finally(() => {
            // Restore original SOP
            currentSop = originalSop;
        });
    } catch (e) {
        showNotification('Error generating PDF: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

function downloadPdfFromReview(sopKey) {
    const pdfIframe = document.getElementById(`pdf-iframe-${sopKey}`);
    if (!pdfIframe || !pdfIframe.dataset.blobUrl) {
        showNotification('PDF not available for download.', 'warning');
        return;
    }
    
    // Create download link
    const link = document.createElement('a');
    link.href = pdfIframe.dataset.blobUrl;
    link.download = `${sopKey}-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function viewSopForReview(sopKey) {
    try {
        const savedSops = await loadAllSopsMerged();
        const sop = savedSops[sopKey];
        
        if (!sop) {
            showNotification('SOP not found.', 'error');
            return;
        }
        
        currentReviewSopKey = sopKey;
        
        // Hide review list and show review view
        document.getElementById('reviewListContainer').style.display = 'none';
        document.getElementById('reviewEmpty').classList.add('hidden');
        document.querySelector('.review-header').style.display = 'none';
        document.querySelector('.review-filters').style.display = 'none';
        
        const reviewViewContainer = document.getElementById('reviewViewContainer');
        reviewViewContainer.classList.remove('hidden');
        
        // Populate and clear reviewer dropdown
        populateReviewerDropdown('reviewViewerName', sop.meta.reviewer || '');
        
        // Render SOP content in review view
        renderSopForReview(sop);
        
    } catch (e) {
        showNotification('Error loading SOP: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

function closeReviewView() {
    // Hide review view and show review list
    document.getElementById('reviewViewContainer').classList.add('hidden');
    document.getElementById('reviewListContainer').style.display = '';
    document.querySelector('.review-header').style.display = '';
    document.querySelector('.review-filters').style.display = '';
    currentReviewSopKey = null;
}

function renderSopForReview(sop) {
    const container = document.getElementById('reviewViewSopContent');
    if (!container) return;
    
    let html = `
        <div class="sop-review-display">
            <!-- SOP Metadata -->
            <section class="sop-section">
                <h1 class="sop-review-title">${escapeHtml(sop.meta.title || 'Untitled SOP')}</h1>
                <div class="review-metadata-list">
                    <div><strong>SOP ID:</strong> ${escapeHtml(sop.meta.sopId || 'N/A')}</div>
                    <div><strong>Department:</strong> ${escapeHtml(sop.meta.department || 'N/A')}</div>
                    <div><strong>Version:</strong> ${escapeHtml(sop.meta.version || 'N/A')}</div>
                    <div><strong>Author:</strong> ${escapeHtml(sop.meta.author || 'N/A')}</div>
                    <div><strong>Status:</strong> ${escapeHtml(sop.meta.status || 'N/A')}</div>
                    ${sop.meta.effectiveDate ? `<div><strong>Effective Date:</strong> ${escapeHtml(sop.meta.effectiveDate)}</div>` : ''}
                    ${sop.meta.reviewDate ? `<div><strong>Review Date:</strong> ${escapeHtml(sop.meta.reviewDate)}</div>` : ''}
                </div>
                <hr class="sop-metadata-divider">
            </section>
            
            <!-- Description -->
            <section class="sop-section">
                <h2>Description</h2>
                <p class="review-text">${escapeHtml(sop.description || 'N/A').replace(/\n/g, '<br>')}</p>
            </section>
            
            <!-- Safety -->
            <section class="sop-section">
                <h2>Safety</h2>
                ${sop.safety.warnings && sop.safety.warnings.length > 0 ? `
                    <div class="review-warnings">
                        <strong>Safety Warnings:</strong>
                        <ul>
                            ${sop.safety.warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${sop.safety.ppe && sop.safety.ppe.length > 0 ? `
                    <div class="review-ppe">
                        <strong>PPE Required:</strong> ${escapeHtml(sop.safety.ppe.join(', '))}
                    </div>
                ` : ''}
                ${sop.safety.notes ? `
                    <div class="review-safety-notes">
                        <strong>Hazard / Safety Notes:</strong>
                        <p>${escapeHtml(sop.safety.notes).replace(/\n/g, '<br>')}</p>
                    </div>
                ` : ''}
            </section>
            
            <!-- Tools & Materials -->
            <section class="sop-section">
                <h2>Tools & Materials</h2>
                ${sop.tools && sop.tools.length > 0 ? `
                    <div class="review-tools">
                        <strong>Tools Required:</strong>
                        <ul>
                            ${sop.tools.map(t => `<li>${escapeHtml(t)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
                ${sop.materials && sop.materials.length > 0 ? `
                    <div class="review-materials">
                        <strong>Materials / Consumables:</strong>
                        <ul>
                            ${sop.materials.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </section>
            
            <!-- Steps -->
            <section class="sop-section">
                <h2>Step-by-Step Instructions</h2>
                ${sop.steps && sop.steps.length > 0 ? sop.steps.map((step, index) => `
                    <div class="review-step">
                        <div class="review-step-header">
                            <span class="review-step-number">${index + 1}</span>
                            <strong>${escapeHtml(step.title || 'Untitled Step')}</strong>
                        </div>
                        <div class="review-step-content">
                            <div class="review-step-description">
                                <p>${escapeHtml(step.description || '').replace(/\n/g, '<br>')}</p>
                                ${step.safetyNote ? `
                                    <div class="review-step-safety">
                                        <strong>⚠ Safety Note:</strong> ${escapeHtml(step.safetyNote)}
                                    </div>
                                ` : ''}
                            </div>
                            ${step.images && step.images.length > 0 ? `
                                <div class="review-step-images">
                                    ${step.images.map(img => `<img src="${escapeHtml(img)}" alt="Step ${index + 1}" class="review-step-image">`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `).join('') : '<p>No steps defined.</p>'}
            </section>
        </div>
    `;
    
    container.innerHTML = html;
}

async function approveSopFromReviewView() {
    const reviewerName = document.getElementById('reviewViewerName').value.trim();
    
    if (!reviewerName) {
        showNotification('Please enter reviewer name.', 'warning');
        return;
    }
    
    if (!currentReviewSopKey) {
        showNotification('No SOP selected for review.', 'error');
        return;
    }
    
    try {
        const savedSops = await loadAllSopsMerged();
        const sop = savedSops[currentReviewSopKey];
        
        if (!sop) {
            showNotification('SOP not found.', 'error');
            return;
        }
        
        // Set review date to 1 year from now (annual review)
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        const reviewDate = oneYearFromNow.toISOString().split('T')[0];
        
        // Update SOP with review information
        sop.meta.reviewer = reviewerName;
        sop.meta.status = 'Approved';
        sop.meta.reviewDate = reviewDate;
        sop.reviewedAt = new Date().toISOString();
        
        // SAVE TO GITHUB ONLY - NO LOCALSTORAGE
        if (typeof saveSopToCloud === 'function' && useCloudSops()) {
            try {
                await saveSopToCloud(sop);
                console.log('✅ SOP approved and saved to GitHub');
            } catch (error) {
                console.error('❌ Error saving to GitHub:', error);
                showNotification('Error saving to GitHub: ' + error.message, 'error');
                throw error;
            }
        } else {
            showNotification('GitHub storage not available', 'error');
            throw new Error('GitHub storage not available');
        }
        
        showNotification('SOP approved! Generating PDF...', 'info');
        
        // Generate PDF
        const originalSop = { ...currentSop };
        currentSop = { ...sop };
        delete currentSop.savedAt;
        if (currentSop.reviewedAt) delete currentSop.reviewedAt;
        
        const pdfBlob = await exportToPdf(true, false, true);
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `${sop.meta.sopId || 'sop'}-approved.pdf`;
        a.click();
        
        // Send PDF via email to holding address (recorpproduction@gmail.com)
        try {
            console.log('Attempting to send PDF email to holding address...');
            await sendPdfEmail(pdfBlob, sop);
            console.log('✓ Email sent to holding address (recorpproduction@gmail.com)');
        } catch (emailError) {
            console.error('✗ Email sending failed:', emailError);
            showNotification('PDF generated, but email failed: ' + (emailError.text || emailError.message), 'warning');
            // Don't block approval if email fails
        }
        
        URL.revokeObjectURL(pdfUrl);
        
        currentSop = originalSop;
        
        showNotification('SOP approved and PDF generated!', 'success');
        
        // Close review view and refresh list
        closeReviewView();
        refreshReviewList();
        
    } catch (e) {
        showNotification('Error approving SOP: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

function rejectSopFromReviewView() {
    if (!currentReviewSopKey) {
        showNotification('No SOP selected for review.', 'error');
        return;
    }
    
    showNotification('SOP marked for changes. Status remains "Under Review".', 'info');
    closeReviewView();
}

// Make review functions globally accessible
window.refreshReviewList = refreshReviewList;
window.filterReviewList = filterReviewList;
window.approveSopInline = approveSopInline;
window.rejectSopInline = rejectSopInline;
window.viewSopForReview = viewSopForReview;
window.generatePdfFromReviewKey = generatePdfFromReviewKey;
window.showLoadSection = showLoadSection;
window.closeLoadSection = closeLoadSection;
window.showExportsSection = showExportsSection;
window.closeExportsSection = closeExportsSection;
window.downloadExport = downloadExport;
window.loadFromExport = loadFromExport;
window.deleteExport = deleteExport;
window.downloadAllExports = downloadAllExports;
window.clearExports = clearExports;
window.closeNotification = closeNotification;
window.closeReviewView = closeReviewView;
window.approveSopFromReviewView = approveSopFromReviewView;
window.rejectSopFromReviewView = rejectSopFromReviewView;

// Tasks & Progress Tracker Functions
let sopTasks = [];

async function refreshProgressTracker() {
    try {
        const savedSops = await loadAllSopsMerged();
        const progressData = calculateMonthlyProgress(savedSops);
        renderProgressTracker(progressData);
    } catch (e) {
        console.error('Error refreshing progress tracker:', e);
    }
}

function calculateMonthlyProgress(savedSops) {
    const monthlyData = {};
    
    Object.values(savedSops).forEach(sop => {
        if (!sop.meta || !sop.savedAt) return;
        
        const savedDate = new Date(sop.savedAt);
        const monthKey = `${savedDate.getFullYear()}-${String(savedDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                month: monthKey,
                entered: 0,
                closed: 0
            };
        }
        
        monthlyData[monthKey].entered++;
        
        // Count as closed if status is "Approved"
        if (sop.meta.status === 'Approved' && sop.meta.reviewDate) {
            const reviewDate = new Date(sop.meta.reviewDate);
            const reviewMonthKey = `${reviewDate.getFullYear()}-${String(reviewDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[reviewMonthKey]) {
                monthlyData[reviewMonthKey] = {
                    month: reviewMonthKey,
                    entered: 0,
                    closed: 0
                };
            }
            
            monthlyData[reviewMonthKey].closed++;
        }
    });
    
    // Convert to array and sort by month (newest first)
    return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month));
}

function renderProgressTracker(progressData) {
    const container = document.getElementById('progressTracker');
    if (!container) return;
    
    if (progressData.length === 0) {
        container.innerHTML = '<p>No progress data available yet.</p>';
        return;
    }
    
    let html = `
        <div class="progress-table-container">
            <table class="progress-table">
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>SOPs Entered</th>
                        <th>SOPs Closed</th>
                        <th>Completion Rate</th>
                        <th>Outstanding</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    progressData.forEach(data => {
        const monthDate = new Date(data.month + '-01');
        const monthName = monthDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
        const completionRate = data.entered > 0 ? ((data.closed / data.entered) * 100).toFixed(1) : 0;
        const outstanding = data.entered - data.closed;
        
        html += `
            <tr>
                <td><strong>${escapeHtml(monthName)}</strong></td>
                <td>${data.entered}</td>
                <td>${data.closed}</td>
                <td>${completionRate}%</td>
                <td>${outstanding}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function refreshTasksList() {
    try {
        sopTasks = JSON.parse(localStorage.getItem('sopTasks') || '[]');
        renderTasksList(sopTasks);
    } catch (e) {
        console.error('Error refreshing tasks list:', e);
        sopTasks = [];
        renderTasksList([]);
    }
}

function renderTasksList(tasks) {
    const container = document.getElementById('tasksListContainer');
    if (!container) return;
    
    if (tasks.length === 0) {
        container.innerHTML = '<p class="tasks-empty">No tasks submitted yet.</p>';
        return;
    }
    
    // Sort by date (newest first)
    const sortedTasks = [...tasks].sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
    
    let html = '<div class="tasks-list">';
    
    sortedTasks.forEach((task, index) => {
        const submittedDate = new Date(task.submittedAt);
        const statusClass = task.status === 'Completed' ? 'completed' : task.status === 'In Progress' ? 'in-progress' : 'pending';
        const priorityClass = task.priority.toLowerCase();
        
        html += `
            <div class="task-item ${statusClass}">
                <div class="task-header">
                    <div class="task-title-section">
                        <h4>${escapeHtml(task.title)}</h4>
                        <div class="task-meta">
                            <span class="task-department">${escapeHtml(task.department)}</span>
                            <span class="task-priority priority-${priorityClass}">${escapeHtml(task.priority)}</span>
                            <span class="task-status status-${statusClass}">${escapeHtml(task.status)}</span>
                        </div>
                    </div>
                    <div class="task-actions">
                        ${task.status !== 'Completed' ? `
                            <button class="btn btn-success btn-small" onclick="completeTask(${index})">Mark Complete</button>
                            <button class="btn btn-secondary btn-small" onclick="startTask(${index})">Start</button>
                        ` : ''}
                        <button class="btn btn-danger btn-small" onclick="deleteTask(${index})">Delete</button>
                    </div>
                </div>
                <div class="task-body">
                    <p><strong>Submitted by:</strong> ${escapeHtml(task.submittedBy)}</p>
                    <p><strong>Submitted on:</strong> ${submittedDate.toLocaleDateString()} ${submittedDate.toLocaleTimeString()}</p>
                    ${task.description ? `<p><strong>Description:</strong> ${escapeHtml(task.description).replace(/\n/g, '<br>')}</p>` : ''}
                    ${task.sopId ? `<p><strong>Linked SOP:</strong> ${escapeHtml(task.sopId)}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function showTaskForm() {
    const container = document.getElementById('taskFormContainer');
    if (container) {
        container.classList.remove('hidden');
        // Clear form
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDepartment').value = '';
        document.getElementById('taskSubmitter').value = '';
        document.getElementById('taskPriority').value = 'Medium';
        document.getElementById('taskDescription').value = '';
    }
}

function cancelTaskForm() {
    const container = document.getElementById('taskFormContainer');
    if (container) {
        container.classList.add('hidden');
    }
}

function submitTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const department = document.getElementById('taskDepartment').value;
    const submitter = document.getElementById('taskSubmitter').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const description = document.getElementById('taskDescription').value.trim();
    
    if (!title || !department || !submitter) {
        showNotification('Please fill in all required fields (Title, Department, Submitted By).', 'warning');
        return;
    }
    
    try {
        const task = {
            id: Date.now().toString(),
            title: title,
            department: department,
            submittedBy: submitter,
            priority: priority,
            description: description,
            status: 'Pending',
            submittedAt: new Date().toISOString(),
            sopId: null
        };
        
        sopTasks.push(task);
        localStorage.setItem('sopTasks', JSON.stringify(sopTasks));
        
        showNotification('Task submitted successfully!', 'success');
        cancelTaskForm();
        refreshTasksList();
    } catch (e) {
        showNotification('Error submitting task: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

function completeTask(index) {
    try {
        const tasks = JSON.parse(localStorage.getItem('sopTasks') || '[]');
        if (index >= 0 && index < tasks.length) {
            tasks[index].status = 'Completed';
            tasks[index].completedAt = new Date().toISOString();
            localStorage.setItem('sopTasks', JSON.stringify(tasks));
            refreshTasksList();
            refreshProgressTracker();
            showNotification('Task marked as completed!', 'success');
        }
    } catch (e) {
        showNotification('Error updating task: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

function startTask(index) {
    try {
        const tasks = JSON.parse(localStorage.getItem('sopTasks') || '[]');
        if (index >= 0 && index < tasks.length) {
            tasks[index].status = 'In Progress';
            localStorage.setItem('sopTasks', JSON.stringify(tasks));
            refreshTasksList();
            showNotification('Task marked as in progress!', 'success');
        }
    } catch (e) {
        showNotification('Error updating task: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

async function deleteTask(index) {
    const confirmed = await showConfirmation('Delete Task', 'Are you sure you want to delete this task?');
    if (!confirmed) return;
    
    try {
        const tasks = JSON.parse(localStorage.getItem('sopTasks') || '[]');
        if (index >= 0 && index < tasks.length) {
            tasks.splice(index, 1);
            localStorage.setItem('sopTasks', JSON.stringify(tasks));
            refreshTasksList();
            showNotification('Task deleted!', 'success');
        }
    } catch (e) {
        showNotification('Error deleting task: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

// Make tasks functions globally accessible
window.showTaskForm = showTaskForm;
window.cancelTaskForm = cancelTaskForm;
window.submitTask = submitTask;
window.completeTask = completeTask;
window.startTask = startTask;
window.deleteTask = deleteTask;
window.refreshProgressTracker = refreshProgressTracker;
window.refreshTasksList = refreshTasksList;

// GitHub Storage Functions
async function openGitHubSettings() {
    const modal = document.getElementById('githubSettingsModal');
    if (!modal) return;
    
    // Initialize GitHub storage silently - don't show errors
    if (typeof githubStorage !== 'undefined') {
        try {
            await githubStorage.initialize();
            updateGitHubStatus();
        } catch (e) {
            // Silently handle - GitHub is optional
            console.log('GitHub storage optional feature');
        }
    }
    
    modal.classList.remove('hidden');
}

function closeGitHubSettings() {
    const modal = document.getElementById('githubSettingsModal');
    if (modal) modal.classList.add('hidden');
}

async function saveGitHubToken() {
    const tokenInput = document.getElementById('githubToken');
    const token = tokenInput.value.trim();
    
    if (!token) {
        showNotification('Please enter a GitHub Personal Access Token', 'warning');
        return;
    }
    
    if (typeof githubStorage === 'undefined') {
        showNotification('GitHub storage module not loaded', 'error');
        return;
    }
    
    try {
        githubStorage.setAccessToken(token);
        const isValid = await githubStorage.testToken();
        
        if (isValid) {
            showNotification('GitHub token saved and verified!', 'success');
            updateGitHubStatus();
            tokenInput.value = ''; // Clear for security
        } else {
            showNotification('Invalid token. Please check your token and try again.', 'error');
            githubStorage.disconnect();
        }
    } catch (e) {
        showNotification('Error saving token: ' + e.message, 'error');
    }
}

async function testGitHubConnection() {
    if (typeof githubStorage === 'undefined' || !githubStorage.isEnabled) {
        showNotification('GitHub storage not enabled. Please save a token first.', 'warning');
        return;
    }
    
    try {
        const isValid = await githubStorage.testToken();
        if (isValid) {
            showNotification('GitHub connection successful!', 'success');
            updateGitHubStatus();
        } else {
            showNotification('Connection failed. Please check your token.', 'error');
        }
    } catch (e) {
        showNotification('Error testing connection: ' + e.message, 'error');
    }
}

function disconnectGitHub() {
    if (typeof githubStorage !== 'undefined') {
        githubStorage.disconnect();
        showNotification('GitHub sync disconnected', 'info');
        updateGitHubStatus();
        document.getElementById('githubToken').value = '';
    }
}

function updateGitHubStatus() {
    const statusText = document.getElementById('githubStatusText');
    const syncInfo = document.getElementById('githubSyncInfo');
    
    if (typeof githubStorage !== 'undefined' && githubStorage.isEnabled) {
        statusText.textContent = 'Connected';
        statusText.style.color = '#27ae60';
        syncInfo.style.display = 'block';
    } else {
        statusText.textContent = 'Not connected';
        statusText.style.color = '#e74c3c';
        syncInfo.style.display = 'none';
    }
}

// Google Drive Settings Functions
async function openGoogleDriveSettings() {
    const modal = document.getElementById('googleDriveSettingsModal');
    if (!modal) return;
    
    // Initialize Google Drive storage
    if (typeof window.initGoogleDriveStorage === 'function') {
        window.initGoogleDriveStorage();
    }
    
    // Load current config from localStorage
    const savedConfig = localStorage.getItem('googleDriveConfig');
    const clientIdInput = document.getElementById('googleDriveClientId');
    const apiKeyInput = document.getElementById('googleDriveApiKey');
    const folderIdInput = document.getElementById('googleDriveFolderId');
    
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            
            if (clientIdInput) clientIdInput.value = config.clientId || '';
            // Show API key (it's password field so it will be masked)
            if (apiKeyInput) apiKeyInput.value = config.apiKey || '';
            if (folderIdInput) folderIdInput.value = config.folderId || '';
        } catch (e) {
            console.error('Error loading Google Drive config:', e);
            if (clientIdInput) clientIdInput.value = '';
            if (apiKeyInput) apiKeyInput.value = '';
            if (folderIdInput) folderIdInput.value = '';
        }
    } else {
        // Clear inputs if no config
        if (clientIdInput) clientIdInput.value = '';
        if (apiKeyInput) apiKeyInput.value = '';
        if (folderIdInput) folderIdInput.value = '';
    }
    
    updateGoogleDriveStatus();
    const originHint = document.getElementById('googleDriveOriginHint');
    if (originHint && typeof window.location !== 'undefined') {
        originHint.textContent = window.location.origin;
    }
    modal.classList.remove('hidden');
}

function closeGoogleDriveSettings() {
    const modal = document.getElementById('googleDriveSettingsModal');
    if (modal) modal.classList.add('hidden');
}

async function saveGoogleDriveConfigFromUI() {
    // Save path v2: writes directly to localStorage (no window.saveGoogleDriveConfig)
    if (saveGoogleDriveConfigFromUI._saving) {
        return;
    }
    saveGoogleDriveConfigFromUI._saving = true;

    const clientIdInput = document.getElementById('googleDriveClientId');
    const apiKeyInput = document.getElementById('googleDriveApiKey');
    const folderIdInput = document.getElementById('googleDriveFolderId');

    if (!clientIdInput || !apiKeyInput) {
        saveGoogleDriveConfigFromUI._saving = false;
        showNotification('Configuration form not found', 'error');
        return;
    }

    const clientId = clientIdInput.value.trim();
    const apiKey = apiKeyInput.value.trim();
    const folderId = folderIdInput ? folderIdInput.value.trim() : '';

    if (!clientId || !apiKey) {
        saveGoogleDriveConfigFromUI._saving = false;
        showNotification('Please enter both Client ID and API Key', 'warning');
        return;
    }

    if (!clientId.includes('.apps.googleusercontent.com')) {
        saveGoogleDriveConfigFromUI._saving = false;
        showNotification('Invalid Client ID format. Should end with .apps.googleusercontent.com', 'warning');
        return;
    }

    if (!apiKey.startsWith('AIza')) {
        saveGoogleDriveConfigFromUI._saving = false;
        showNotification('Invalid API Key format. Should start with AIza', 'warning');
        return;
    }

    try {
        const config = {
            clientId: clientId,
            apiKey: apiKey,
            folderId: folderId || null
        };
        localStorage.setItem('googleDriveConfig', JSON.stringify(config));

        if (window.googleDriveStorage) {
            window.googleDriveStorage.clientId = clientId;
            window.googleDriveStorage.apiKey = apiKey;
            window.googleDriveStorage.folderId = folderId || null;
            window.googleDriveStorage.isEnabled = true;
        }

        if (typeof window.initGoogleDriveStorage === 'function') {
            window.initGoogleDriveStorage();
        }

        showNotification('Google Drive configuration saved successfully!', 'success');
        updateGoogleDriveStatus();
    } catch (e) {
        console.error('Error saving Google Drive config:', e);
        showNotification('Error saving configuration: ' + e.message, 'error');
    } finally {
        saveGoogleDriveConfigFromUI._saving = false;
    }
}

async function connectGoogleDrive() {
    // Check if config is saved first
    const savedConfig = localStorage.getItem('googleDriveConfig');
    if (!savedConfig) {
        showNotification('Please save configuration first (Client ID and API Key)', 'warning');
        return;
    }
    
    // Parse config to verify it's valid
    let config;
    try {
        config = JSON.parse(savedConfig);
        if (!config.clientId || !config.apiKey) {
            showNotification('Configuration is incomplete. Please save Client ID and API Key again.', 'warning');
            return;
        }
    } catch (e) {
        showNotification('Invalid configuration. Please save configuration again.', 'error');
        return;
    }
    
    // Re-initialize to ensure config is loaded into the storage module
    if (typeof initGoogleDriveStorage === 'function') {
        initGoogleDriveStorage();
    }
    
    // Wait a moment for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check if storage module is available and enabled
    if (typeof window.googleDriveStorage === 'undefined') {
        showNotification('Google Drive storage module not loaded. Please refresh the page.', 'error');
        return;
    }
    
    // Use the global storage object from window
    const storage = window.googleDriveStorage;
    
    // Ensure it's initialized
    if (typeof initGoogleDriveStorage === 'function') {
        initGoogleDriveStorage();
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Check if enabled after initialization
    if (!storage || !storage.isEnabled) {
        // Try to manually apply config and re-initialize
        if (config.clientId && config.apiKey) {
            try {
                localStorage.setItem('googleDriveConfig', JSON.stringify(config));
                if (typeof initGoogleDriveStorage === 'function') {
                    initGoogleDriveStorage();
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            } catch (e) {
                console.warn('Could not re-apply config:', e);
            }
        }

        // Final check
        if (!storage.isEnabled) {
            console.error('Storage not enabled after initialization. Config:', config);
            showNotification('Configuration not properly loaded. Please save configuration again.', 'warning');
            return;
        }
    }
    
    try {
        await authenticateGoogleDrive();
        showNotification('Successfully connected to Google Drive!', 'success');
        updateGoogleDriveStatus();
    } catch (e) {
        const msg = e && (e.details || e.message || (typeof e === 'string' ? e : JSON.stringify(e)));
        if (msg && (msg.includes('Not a valid origin') || msg.includes('idpiframe_initialization_failed'))) {
            showNotification('Add this site\'s URL to Google Cloud Console → APIs & Services → Credentials → your OAuth client → Authorized JavaScript origins', 'error');
        } else {
            showNotification('Error connecting to Google Drive: ' + (e && e.message ? e.message : msg), 'error');
        }
        console.error('Google Drive connection error:', e);
    }
}

async function testGoogleDriveConnection() {
    // Re-initialize to ensure config is loaded
    if (typeof initGoogleDriveStorage === 'function') {
        initGoogleDriveStorage();
    }
    
    if (!googleDriveStorage || !googleDriveStorage.isEnabled) {
        showNotification('Google Drive not configured. Please set Client ID and API Key first.', 'warning');
        return;
    }
    
    try {
        if (!googleDriveStorage.isAuthenticated) {
            await authenticateGoogleDrive();
        }
        
        // Test by trying to get the folder
        const folderId = await getSopsFolder();
        showNotification('Google Drive connection successful! Folder ID: ' + folderId, 'success');
        updateGoogleDriveStatus();
    } catch (e) {
        const msg = e && (e.details || e.message || (typeof e === 'string' ? e : (e.error ? String(e.error) + (e.details ? ': ' + e.details : '') : JSON.stringify(e))));
        showNotification('Connection test failed: ' + (msg || 'Unknown error'), 'error');
        console.error('Google Drive test error:', e);
    }
}

async function disconnectGoogleDrive() {
    try {
        await signOutGoogleDrive();
        showNotification('Disconnected from Google Drive', 'info');
        updateGoogleDriveStatus();
    } catch (e) {
        showNotification('Error disconnecting: ' + e.message, 'error');
    }
}

function updateGoogleDriveStatus() {
    const statusText = document.getElementById('googleDriveStatusText');
    const syncInfo = document.getElementById('googleDriveSyncInfo');
    
    if (!statusText) return;
    
    // Re-initialize to get latest status (only once)
    if (typeof window.initGoogleDriveStorage === 'function') {
        try {
            window.initGoogleDriveStorage();
        } catch (e) {
            console.error('Error initializing Google Drive:', e);
        }
    }
    
    // Use window object to ensure we get the right storage
    const storage = window.googleDriveStorage;
    
    const banner = document.getElementById('workspaceAccessBanner');
    if (typeof useSharedAccess === 'function' && useSharedAccess()) {
        statusText.textContent = 'Shared access (no setup required)';
        statusText.style.color = '#27ae60';
        if (syncInfo) syncInfo.style.display = 'block';
        if (banner) banner.classList.add('hidden');
    } else if (storage && storage.isEnabled && storage.isAuthenticated) {
        statusText.textContent = 'Connected and Authenticated';
        statusText.style.color = '#27ae60';
        if (syncInfo) syncInfo.style.display = 'block';
        if (banner) banner.classList.add('hidden');
    } else if (storage && storage.isEnabled) {
        statusText.textContent = 'Configured but not authenticated';
        statusText.style.color = '#f39c12';
        if (syncInfo) syncInfo.style.display = 'none';
        if (banner) banner.classList.remove('hidden');
    } else {
        statusText.textContent = 'Not configured';
        statusText.style.color = '#e74c3c';
        if (syncInfo) syncInfo.style.display = 'none';
        if (banner) banner.classList.remove('hidden');
    }
}

// Initialize GitHub storage on page load (SILENT - no errors if fails)
document.addEventListener('DOMContentLoaded', async function() {
    // GitHub storage is OPTIONAL - don't block or prompt users
    // Only initialize if user has previously set it up
    if (typeof githubStorage !== 'undefined') {
        try {
            await githubStorage.initialize();
            // Only update status if user has previously connected
            if (githubStorage.isEnabled) {
                updateGitHubStatus();
            }
        } catch (e) {
            // Silently fail - GitHub storage is optional
            console.log('GitHub storage not available (optional feature)');
        }
    }
    // Initialize email status
    updateEmailStatus();
    
    // Initialize Google Drive storage on page load (SILENT - no errors if fails)
    if (typeof initGoogleDriveStorage === 'function') {
        try {
            initGoogleDriveStorage();
            updateGoogleDriveStatus();
        } catch (e) {
            // Silently fail - Google Drive storage is optional
            console.log('Google Drive storage not available (optional feature)');
        }
    }
});

// User Management Functions
let usersCache = [];

async function loadUsersMerged() {
    let users = [];
    if (typeof loadUsersFromSharedAPI === 'function' && typeof useSharedAccess === 'function' && useSharedAccess()) {
        try {
            users = await window.loadUsersFromSharedAPI();
        } catch (e) { console.warn('Users load from cloud failed:', e.message); }
        try {
            const local = JSON.parse(localStorage.getItem('sopUsers') || '[]');
            const seen = new Set((users || []).map(u => (u.email || '').toLowerCase()));
            (local || []).forEach(u => { if (u && u.email && !seen.has((u.email || '').toLowerCase())) { users.push(u); seen.add((u.email || '').toLowerCase()); } });
        } catch (_) {}
    } else {
        try { users = JSON.parse(localStorage.getItem('sopUsers') || '[]'); } catch (_) { users = []; }
    }
    usersCache = Array.isArray(users) ? users : [];
    try { localStorage.setItem('sopUsers', JSON.stringify(usersCache)); } catch (_) {}
    return usersCache;
}

function getUsers() {
    if (usersCache.length > 0) return usersCache;
    try {
        const u = JSON.parse(localStorage.getItem('sopUsers') || '[]');
        return Array.isArray(u) ? u : [];
    } catch (e) { return []; }
}

async function saveUsers(users) {
    const arr = Array.isArray(users) ? users : [];
    if (typeof saveUsersToSharedAPI === 'function' && typeof useSharedAccess === 'function' && useSharedAccess()) {
        try {
            await window.saveUsersToSharedAPI(arr);
        } catch (e) {
            showNotification('Users not synced to cloud: ' + (e.message || 'Check connection'), 'warning');
        }
    }
    try {
        localStorage.setItem('sopUsers', JSON.stringify(arr));
        usersCache = arr;
        return true;
    } catch (e) {
        showNotification('Error saving users: ' + e.message, 'error');
        return false;
    }
}

function refreshUsersList() {
    const container = document.getElementById('usersListContainer');
    if (!container) return;
    
    const users = getUsers();
    
    if (users.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">No users added yet. Click "Add User" to get started.</p>';
        return;
    }
    
    let html = `
        <table class="register-table" style="margin-top: 20px;">
            <thead>
                <tr>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Email</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    users.forEach((user, index) => {
        html += `
            <tr>
                <td>${escapeHtml(user.firstName)}</td>
                <td>${escapeHtml(user.lastName)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>
                    <button class="btn btn-secondary btn-small" onclick="editUser(${index})" title="Edit">Edit</button>
                    <button class="btn btn-danger btn-small" onclick="deleteUser(${index})" title="Delete">Delete</button>
                </td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    container.innerHTML = html;
}

function showAddUserForm() {
    document.getElementById('userFormTitle').textContent = 'Add New User';
    document.getElementById('userFirstName').value = '';
    document.getElementById('userLastName').value = '';
    document.getElementById('userEmail').value = '';
    document.getElementById('userFormContainer').classList.remove('hidden');
    currentEditingUserIndex = null;
}

function cancelUserForm() {
    document.getElementById('userFormContainer').classList.add('hidden');
    currentEditingUserIndex = null;
}

let currentEditingUserIndex = null;

function editUser(index) {
    const users = getUsers();
    if (index < 0 || index >= users.length) return;
    
    const user = users[index];
    document.getElementById('userFormTitle').textContent = 'Edit User';
    document.getElementById('userFirstName').value = user.firstName;
    document.getElementById('userLastName').value = user.lastName;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userFormContainer').classList.remove('hidden');
    currentEditingUserIndex = index;
}

async function deleteUser(index) {
    const users = getUsers();
    if (index < 0 || index >= users.length) return;
    
    const user = users[index];
    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName} (${user.email})?`)) {
        users.splice(index, 1);
        if (await saveUsers(users)) {
            refreshUsersList();
            populateUserDropdown();
            populateAllReviewerDropdowns();
            showNotification('User deleted successfully!', 'success');
        }
    }
}

async function saveUser() {
    const firstName = document.getElementById('userFirstName').value.trim();
    const lastName = document.getElementById('userLastName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    
    if (!firstName || !lastName || !email) {
        showNotification('Please fill in all fields.', 'warning');
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address.', 'warning');
        return;
    }
    
    const users = getUsers();
    
    const existingUserIndex = users.findIndex((u, idx) => {
        return u.email.toLowerCase() === email.toLowerCase() && idx !== currentEditingUserIndex;
    });
    
    if (existingUserIndex !== -1) {
        showNotification('A user with this email already exists.', 'warning');
        return;
    }
    
    const user = {
        firstName,
        lastName,
        email: email.toLowerCase(),
        id: currentEditingUserIndex !== null && users[currentEditingUserIndex] 
            ? users[currentEditingUserIndex].id 
            : Date.now().toString()
    };
    
    if (currentEditingUserIndex !== null) {
        users[currentEditingUserIndex] = user;
        showNotification('User updated successfully!', 'success');
    } else {
        users.push(user);
        showNotification('User added successfully!', 'success');
    }
    
    if (await saveUsers(users)) {
        refreshUsersList();
        populateUserDropdown();
        populateAllReviewerDropdowns();
        cancelUserForm();
    }
}

function populateUserDropdown() {
    const authorSelect = document.getElementById('author');
    if (!authorSelect) return;
    
    const users = getUsers();
    const currentAuthor = authorSelect.value;
    
    // Clear existing options except the first one
    authorSelect.innerHTML = '<option value="">Select User</option>';
    
    users.forEach(user => {
        const fullName = `${user.firstName} ${user.lastName}`;
        const option = document.createElement('option');
        option.value = fullName;
        option.textContent = `${fullName} (${user.email})`;
        if (fullName === currentAuthor) {
            option.selected = true;
        }
        authorSelect.appendChild(option);
    });
}

function updateAuthorFromUser() {
    const authorSelect = document.getElementById('author');
    if (!authorSelect || !currentSop) return;
    
    const selectedAuthor = authorSelect.value;
    if (selectedAuthor) {
        currentSop.meta.author = selectedAuthor;
        console.log('Author updated to:', selectedAuthor);
    }
}

function populateReviewerDropdown(dropdownId, currentReviewer = '') {
    const reviewerSelect = document.getElementById(dropdownId);
    if (!reviewerSelect) return;
    
    const users = getUsers();
    
    // Clear existing options except the first one
    reviewerSelect.innerHTML = '<option value="">Select Reviewer</option>';
    
    users.forEach(user => {
        const fullName = `${user.firstName} ${user.lastName}`;
        const option = document.createElement('option');
        option.value = fullName;
        option.textContent = `${fullName} (${user.email})`;
        if (fullName === currentReviewer) {
            option.selected = true;
        }
        reviewerSelect.appendChild(option);
    });
}

function populateAllReviewerDropdowns() {
    // Populate reviewer dropdown in review view
    populateReviewerDropdown('reviewViewerName');
    
    // Populate all inline reviewer dropdowns in the review list
    // Note: This will be populated when review list is refreshed from GitHub
    // For now, just populate the main review view dropdown
}

async function sendPdfEmailToUser(pdfBlob, sop, user) {
    const settings = getEmailSettings();
    if (!settings || typeof emailjs === 'undefined') {
        console.log('Email not configured or EmailJS not loaded');
        return;
    }
    
    if (!user || !user.email) {
        console.log('User email not available');
        return;
    }
    
    try {
        // Convert PDF blob to base64
        const reader = new FileReader();
        reader.onloadend = async function() {
            const base64data = reader.result.split(',')[1];
            
            emailjs.init(settings.publicKey);
            
            await emailjs.send(settings.serviceId, settings.templateId, {
                to_email: user.email,
                sop_title: sop.meta.title || 'Untitled SOP',
                sop_id: sop.meta.sopId || 'N/A',
                sop_department: sop.meta.department || 'N/A',
                sop_author: sop.meta.author || 'N/A',
                sop_reviewer: sop.meta.reviewer || 'N/A',
                sop_version: sop.meta.version || 'N/A',
                pdf_content: base64data,
                message: `Your SOP "${sop.meta.title}" (${sop.meta.sopId}) has been saved. Please find the PDF attached.`
            });
            
            console.log('PDF email sent to user successfully');
        };
        reader.onerror = function(error) {
            console.error('Error reading PDF blob:', error);
        };
        reader.readAsDataURL(pdfBlob);
    } catch (e) {
        console.error('Error sending email to user:', e);
        throw e;
    }
}

// Initialize users list and populate dropdowns on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        refreshUsersList();
        populateUserDropdown();
        populateAllReviewerDropdowns();
    }, 100);
});

window.showAddUserForm = showAddUserForm;
window.cancelUserForm = cancelUserForm;
window.saveUser = saveUser;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.updateAuthorFromUser = updateAuthorFromUser;

// Email Functions - Store implementation
window._openEmailSettingsImpl = async function openEmailSettings() {
    const modal = document.getElementById('emailSettingsModal');
    if (!modal) return;
    
    // Load saved email settings
    const settings = getEmailSettings();
    if (settings) {
        document.getElementById('emailServiceId').value = settings.serviceId || '';
        document.getElementById('emailTemplateId').value = settings.templateId || '';
        document.getElementById('emailPublicKey').value = settings.publicKey || '';
        document.getElementById('holdingEmail').value = settings.holdingEmail || 'recorpproduction@gmail.com';
    } else {
        // Set default holding email if no settings saved
        document.getElementById('holdingEmail').value = 'recorpproduction@gmail.com';
    }
    
    updateEmailStatus();
    modal.classList.remove('hidden');
}

function closeEmailSettings() {
    const modal = document.getElementById('emailSettingsModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function getEmailSettings() {
    try {
        const settings = localStorage.getItem('emailSettings');
        return settings ? JSON.parse(settings) : null;
    } catch (e) {
        return null;
    }
}

function saveEmailSettings() {
    try {
        const serviceId = document.getElementById('emailServiceId').value.trim();
        const templateId = document.getElementById('emailTemplateId').value.trim();
        const publicKey = document.getElementById('emailPublicKey').value.trim();
        let holdingEmail = document.getElementById('holdingEmail').value.trim();
        
        // Default to recorpproduction@gmail.com if empty
        if (!holdingEmail) {
            holdingEmail = 'recorpproduction@gmail.com';
            document.getElementById('holdingEmail').value = holdingEmail;
        }
        
        if (!serviceId || !templateId || !publicKey) {
            showNotification('Please fill in Service ID, Template ID, and Public Key.', 'warning');
            return;
        }
        
        const settings = {
            serviceId,
            templateId,
            publicKey,
            holdingEmail
        };
        
        localStorage.setItem('emailSettings', JSON.stringify(settings));
        
        // Initialize EmailJS
        if (typeof emailjs !== 'undefined') {
            emailjs.init(publicKey);
        }
        
        updateEmailStatus();
        showNotification('Email settings saved!', 'success');
    } catch (e) {
        showNotification('Error saving email settings: ' + e.message, 'error');
        console.error('Error:', e);
    }
}

async function testEmailConnection() {
    const settings = getEmailSettings();
    if (!settings) {
        showNotification('Please save email settings first.', 'warning');
        return;
    }
    
    try {
        showNotification('Sending test email...', 'info');
        
        if (typeof emailjs === 'undefined') {
            showNotification('EmailJS library not loaded. Please refresh the page.', 'error');
            return;
        }
        
        emailjs.init(settings.publicKey);
        
        // Convert a test blob to base64
        const testPdfBlob = new Blob(['Test PDF'], { type: 'application/pdf' });
        const reader = new FileReader();
        reader.onloadend = async function() {
            const base64data = reader.result.split(',')[1];
            
            await emailjs.send(settings.serviceId, settings.templateId, {
                to_email: settings.holdingEmail,
                sop_title: 'Test SOP',
                sop_id: 'TEST-001',
                pdf_content: base64data,
                message: 'This is a test email from the SOP tool.'
            });
            
            showNotification('Test email sent successfully!', 'success');
        };
        reader.readAsDataURL(testPdfBlob);
    } catch (e) {
        showNotification('Test email failed: ' + e.message, 'error');
        console.error('Email test error:', e);
    }
}

async function sendPdfEmail(pdfBlob, sop) {
    const settings = getEmailSettings();
    if (!settings || typeof emailjs === 'undefined') {
        const errorMsg = 'Email not configured or EmailJS not loaded. Please configure email settings.';
        console.error('✗', errorMsg);
        throw new Error(errorMsg);
    }
    
    // Ensure holding email is set (default to recorpproduction@gmail.com)
    const holdingEmail = settings.holdingEmail || 'recorpproduction@gmail.com';
    
    console.log('=== SENDING PDF EMAIL ===');
    console.log('To:', holdingEmail);
    console.log('SOP:', sop.meta.title, sop.meta.sopId);
    
    return new Promise((resolve, reject) => {
        // Convert PDF blob to base64
        const reader = new FileReader();
        
        reader.onloadend = async function() {
            try {
                const base64data = reader.result.split(',')[1];
                
                if (!base64data) {
                    throw new Error('Failed to convert PDF to base64');
                }
                
                emailjs.init(settings.publicKey);
                
                console.log('Sending email via EmailJS to:', holdingEmail);
                const result = await emailjs.send(settings.serviceId, settings.templateId, {
                    to_email: holdingEmail,
                    sop_title: sop.meta.title || 'Untitled SOP',
                    sop_id: sop.meta.sopId || 'N/A',
                    sop_department: sop.meta.department || 'N/A',
                    sop_author: sop.meta.author || 'N/A',
                    sop_reviewer: sop.meta.reviewer || 'N/A',
                    sop_version: sop.meta.version || 'N/A',
                    pdf_content: base64data,
                    message: `Approved SOP: ${sop.meta.title} (${sop.meta.sopId})`
                });
                
                console.log('✓✓✓ PDF EMAIL SENT SUCCESSFULLY TO:', holdingEmail, '✓✓✓');
                console.log('EmailJS result:', result);
                resolve(result);
            } catch (emailError) {
                console.error('✗✗✗ EMAIL SEND ERROR ✗✗✗');
                console.error('Error details:', emailError);
                console.error('Error text:', emailError.text || emailError.message);
                reject(emailError);
            }
        };
        
        reader.onerror = function(error) {
            console.error('Error reading PDF blob:', error);
            reject(new Error('Failed to read PDF file: ' + error.message));
        };
        
        reader.readAsDataURL(pdfBlob);
    });
}

function updateEmailStatus() {
    const statusDiv = document.getElementById('emailStatus');
    const statusText = document.getElementById('emailStatusText');
    
    if (!statusDiv || !statusText) return;
    
    const settings = getEmailSettings();
    if (settings && settings.serviceId && settings.templateId && settings.publicKey && settings.holdingEmail) {
        statusDiv.style.display = 'block';
        statusText.textContent = 'Configured';
        statusText.style.color = '#27ae60';
    } else {
        statusDiv.style.display = 'block';
        statusText.textContent = 'Not configured';
        statusText.style.color = '#e74c3c';
    }
}

// openEmailSettings already assigned above as _openEmailSettingsImpl
if (typeof window._openEmailSettingsImpl === 'function') {
    window.openEmailSettings = window._openEmailSettingsImpl;
    console.log('✅ DIAG: openEmailSettings replaced with implementation');
}
window.closeEmailSettings = closeEmailSettings;
window.saveEmailSettings = saveEmailSettings;
window.testEmailConnection = testEmailConnection;
window.openGitHubSettings = openGitHubSettings;
window.closeGitHubSettings = closeGitHubSettings;
window.saveGitHubToken = saveGitHubToken;
window.openGoogleDriveSettings = openGoogleDriveSettings;
window.closeGoogleDriveSettings = closeGoogleDriveSettings;
window.saveGoogleDriveConfigFromUI = saveGoogleDriveConfigFromUI; // Renamed to avoid conflict with storage module
window.connectGoogleDrive = connectGoogleDrive;
window.testGoogleDriveConnection = testGoogleDriveConnection;
window.disconnectGoogleDrive = disconnectGoogleDrive;
window.testGitHubConnection = testGitHubConnection;
window.disconnectGitHub = disconnectGitHub;
