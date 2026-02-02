// Google Drive Storage - Shared Database for All SOPs
// Uses Google Drive API to store SOPs as JSON files
// All users see all SOPs (shared database)
console.log('📁 Google Drive Storage module loaded at', new Date().toISOString());

let googleDriveStorage = {
    clientId: null,
    apiKey: null,
    folderId: null,
    isEnabled: false,
    isAuthenticated: false,
    accessToken: null
};

// Google Drive API configuration
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Initialize Google Drive Storage
function initGoogleDriveStorage() {
    // Load config from localStorage or use defaults
    const savedConfig = localStorage.getItem('googleDriveConfig');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            googleDriveStorage.clientId = config.clientId || null;
            googleDriveStorage.apiKey = config.apiKey || null;
            googleDriveStorage.folderId = config.folderId || null;
            googleDriveStorage.isEnabled = !!(config.clientId && config.apiKey);
            
            console.log('📁 Loading Google Drive config from localStorage');
            console.log('Client ID present:', !!config.clientId);
            console.log('API Key present:', !!config.apiKey);
            console.log('Is Enabled:', googleDriveStorage.isEnabled);
        } catch (e) {
            console.error('Error loading Google Drive config:', e);
            googleDriveStorage.isEnabled = false;
        }
    } else {
        console.log('⚠️ No Google Drive config found in localStorage');
        googleDriveStorage.isEnabled = false;
    }
    
    // Load access token if available
    const savedToken = localStorage.getItem('googleDriveToken');
    if (savedToken) {
        try {
            const tokenData = JSON.parse(savedToken);
            if (tokenData.expires_at > Date.now()) {
                googleDriveStorage.accessToken = tokenData.access_token;
                googleDriveStorage.isAuthenticated = true;
            } else {
                // Token expired, clear it
                localStorage.removeItem('googleDriveToken');
                googleDriveStorage.isAuthenticated = false;
            }
        } catch (e) {
            console.error('Error loading Google Drive token:', e);
            googleDriveStorage.isAuthenticated = false;
        }
    } else {
        googleDriveStorage.isAuthenticated = false;
    }
    
    // Only log once per session to avoid spam
    if (!googleDriveStorage._initialized) {
        if (googleDriveStorage.isEnabled) {
            console.log('✅ Google Drive Storage initialized');
            console.log('Client ID:', googleDriveStorage.clientId ? googleDriveStorage.clientId.substring(0, 20) + '...' : 'Not set');
            console.log('API Key:', googleDriveStorage.apiKey ? googleDriveStorage.apiKey.substring(0, 10) + '...' : 'Not set');
            console.log('Folder ID:', googleDriveStorage.folderId || 'Not set');
            console.log('Authenticated:', googleDriveStorage.isAuthenticated);
        } else {
            console.log('⚠️ Google Drive Storage not configured');
        }
        googleDriveStorage._initialized = true;
    }
    
    return googleDriveStorage.isEnabled;
}

// Save Google Drive configuration
// IMPORTANT: This function must NOT call window.saveGoogleDriveConfig to avoid recursion
function saveGoogleDriveConfigToStorage(clientId, apiKey, folderId) {
    // Prevent recursion - check if we're being called recursively
    if (saveGoogleDriveConfigToStorage._saving) {
        console.error('❌ RECURSION DETECTED in saveGoogleDriveConfigToStorage!');
        return false;
    }
    
    saveGoogleDriveConfigToStorage._saving = true;
    
    try {
        console.log('💾 saveGoogleDriveConfigToStorage called with:');
        console.log('  - clientId:', clientId ? clientId.substring(0, 30) + '...' : 'EMPTY');
        console.log('  - apiKey:', apiKey ? apiKey.substring(0, 15) + '...' : 'EMPTY');
        console.log('  - folderId:', folderId || 'null');
        
        if (!clientId || !apiKey) {
            console.error('❌ Cannot save: clientId or apiKey is empty');
            return false;
        }
        
        googleDriveStorage.clientId = clientId;
        googleDriveStorage.apiKey = apiKey;
        googleDriveStorage.folderId = folderId || null;
        googleDriveStorage.isEnabled = !!(clientId && apiKey);
        
        const config = {
            clientId: clientId,
            apiKey: apiKey,
            folderId: folderId || null
        };
        
        localStorage.setItem('googleDriveConfig', JSON.stringify(config));
        console.log('✅ Google Drive config saved to localStorage');
        console.log('✅ Config saved - Client ID length:', clientId.length);
        console.log('✅ Config saved - API Key length:', apiKey.length);
        
        // Verify it was saved
        const verify = localStorage.getItem('googleDriveConfig');
        if (verify) {
            const parsed = JSON.parse(verify);
            console.log('✅ Verification: Config in localStorage - Client ID present:', !!parsed.clientId);
            console.log('✅ Verification: Config in localStorage - API Key present:', !!parsed.apiKey);
        } else {
            console.error('❌ ERROR: Config not found in localStorage after save!');
        }
        
        return true;
    } catch (e) {
        console.error('❌ Error saving to localStorage:', e);
        return false;
    } finally {
        saveGoogleDriveConfigToStorage._saving = false;
    }
}

// Token client from Google Identity Services (replaces deprecated gapi.auth2)
let gisTokenClient = null;

// Initialize Google API Client (gapi.client only; auth via GIS token client)
async function initGoogleAPI() {
    if (window.gapi && window.gapi.client && window.gapi.client.drive) {
        return;
    }
    return new Promise((resolve, reject) => {
        const checkGapi = () => {
            if (!window.gapi) return false;
            window.gapi.load('client', () => {
                window.gapi.client.init({ apiKey: googleDriveStorage.apiKey })
                    .then(() => window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'))
                    .then(() => {
                        if (googleDriveStorage.accessToken && window.gapi.client.setToken) {
                            window.gapi.client.setToken({ access_token: googleDriveStorage.accessToken });
                        }
                        resolve();
                    })
                    .catch(reject);
            });
            return true;
        };
        const id = setInterval(() => {
            if (checkGapi()) clearInterval(id);
        }, 100);
        setTimeout(() => {
            clearInterval(id);
            if (!window.gapi || !window.gapi.client) {
                reject(new Error('Google API failed to load. Make sure the Google API script is included in index.html'));
            }
        }, 15000);
    });
}

// Wait for GIS script to be available; load it dynamically if missing
function waitForGIS(timeoutMs) {
    timeoutMs = timeoutMs || 15000;
    return new Promise((resolve, reject) => {
        const check = () => {
            if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2 && typeof google.accounts.oauth2.initTokenClient === 'function') {
                resolve();
                return true;
            }
            return false;
        };
        if (check()) return;
        // If GIS not in page, load it now
        if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
            const s = document.createElement('script');
            s.src = 'https://accounts.google.com/gsi/client';
            s.async = true;
            s.defer = true;
            let resolved = false;
            const done = () => {
                if (resolved) return;
                resolved = true;
                resolve();
            };
            const fail = () => {
                if (resolved) return;
                resolved = true;
                reject(new Error('Google Identity Services script did not load in time. Check your connection and refresh the page.'));
            };
            s.onload = () => {
                const id = setInterval(() => {
                    if (check()) {
                        clearInterval(id);
                        done();
                    }
                }, 50);
                setTimeout(() => {
                    clearInterval(id);
                    if (!resolved) fail();
                }, timeoutMs);
            };
            s.onerror = () => reject(new Error('Failed to load Google Identity Services script. Check your connection.'));
            document.head.appendChild(s);
            return;
        }
        const start = Date.now();
        const id = setInterval(() => {
            if (check()) {
                clearInterval(id);
                resolve();
                return;
            }
            if (Date.now() - start >= timeoutMs) {
                clearInterval(id);
                reject(new Error('Google Identity Services (GIS) script did not load in time. Check your connection and refresh the page.'));
            }
        }, 200);
    });
}

function getOrCreateTokenClient() {
    if (gisTokenClient) return gisTokenClient;
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.oauth2 || !google.accounts.oauth2.initTokenClient) {
        throw new Error('Google Identity Services (GIS) script not loaded. Please refresh the page.');
    }
    gisTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: googleDriveStorage.clientId,
        scope: SCOPES,
        callback: () => {},
        error_callback: (err) => {
            console.error('GIS token error:', err);
        }
    });
    return gisTokenClient;
}

// Authenticate with Google Drive (Google Identity Services token model)
async function authenticateGoogleDrive() {
    initGoogleDriveStorage();
    
    if (!googleDriveStorage.isEnabled || !googleDriveStorage.clientId || !googleDriveStorage.apiKey) {
        throw new Error('Google Drive not configured. Please set Client ID and API Key in settings.');
    }
    
    try {
        await initGoogleAPI();
        await waitForGIS();
        const tokenClient = getOrCreateTokenClient();
        
        return new Promise((resolve, reject) => {
            tokenClient.callback = (tokenResponse) => {
                if (tokenResponse.error) {
                    const msg = tokenResponse.error_description || tokenResponse.error || 'Failed to get access token';
                    googleDriveStorage.isAuthenticated = false;
                    reject(new Error(msg));
                    return;
                }
                const accessToken = tokenResponse.access_token;
                const expiresIn = tokenResponse.expires_in || 3600;
                googleDriveStorage.accessToken = accessToken;
                googleDriveStorage.isAuthenticated = true;
                window.gapi.client.setToken({ access_token: accessToken });
                const tokenData = {
                    access_token: accessToken,
                    expires_at: Date.now() + (expiresIn * 1000)
                };
                localStorage.setItem('googleDriveToken', JSON.stringify(tokenData));
                console.log('✅ Google Drive authenticated (GIS)');
                resolve(true);
            };
            tokenClient.error_callback = (err) => {
                const msg = (err && (err.message || err.type)) ? (err.message || err.type) : 'Authorization was cancelled or failed.';
                googleDriveStorage.isAuthenticated = false;
                reject(new Error(msg));
            };
            tokenClient.requestAccessToken({ prompt: 'consent' });
        });
    } catch (error) {
        const msg = (error && (error.details || error.message || (typeof error.error === 'string' ? error.error : null))) || (typeof error === 'string' ? error : JSON.stringify(error));
        console.error('Error authenticating with Google Drive:', msg, error);
        googleDriveStorage.isAuthenticated = false;
        throw new Error(msg);
    }
}

// Sign out from Google Drive (revoke token via GIS)
async function signOutGoogleDrive() {
    try {
        const token = googleDriveStorage.accessToken;
        if (token && typeof google !== 'undefined' && google.accounts && google.accounts.oauth2 && google.accounts.oauth2.revoke) {
            google.accounts.oauth2.revoke(token, () => {});
        }
        if (window.gapi && window.gapi.client && window.gapi.client.setToken) {
            window.gapi.client.setToken(null);
        }
        googleDriveStorage.accessToken = null;
        googleDriveStorage.isAuthenticated = false;
        localStorage.removeItem('googleDriveToken');
        console.log('✅ Signed out from Google Drive');
        return true;
    } catch (error) {
        console.error('Error signing out:', error);
        return false;
    }
}

// Get or create SOPs folder in Google Drive
async function getSopsFolder() {
    if (!googleDriveStorage.isAuthenticated) {
        await authenticateGoogleDrive();
    }
    
    // If folder ID is already set, verify it exists
    if (googleDriveStorage.folderId) {
        try {
            const response = await window.gapi.client.drive.files.get({
                fileId: googleDriveStorage.folderId,
                fields: 'id, name'
            });
            return response.result.id;
        } catch (error) {
            // Folder doesn't exist or is inaccessible, create new one
            console.log('Folder not found, creating new one...');
        }
    }
    
    // Create new folder
    const folderMetadata = {
        name: 'SOPs',
        mimeType: 'application/vnd.google-apps.folder'
    };
    
    try {
        const response = await window.gapi.client.drive.files.create({
            resource: folderMetadata,
            fields: 'id'
        });
        
        googleDriveStorage.folderId = response.result.id;
        
        // Save folder ID to config
        const config = JSON.parse(localStorage.getItem('googleDriveConfig') || '{}');
        config.folderId = response.result.id;
        localStorage.setItem('googleDriveConfig', JSON.stringify(config));
        
        console.log('✅ Created SOPs folder:', response.result.id);
        return response.result.id;
    } catch (error) {
        console.error('Error creating folder:', error);
        throw error;
    }
}

// Save SOP to Google Drive
async function saveSopToGoogleDrive(sop) {
    if (!googleDriveStorage.isEnabled) {
        return false;
    }
    
    try {
        if (!googleDriveStorage.isAuthenticated) {
            await authenticateGoogleDrive();
        }
        
        const folderId = await getSopsFolder();
        const sopId = sop.meta.sopId || `sop-${Date.now()}`;
        const fileName = `${sopId}.json`;
        
        // Check if file already exists
        let existingFileId = null;
        try {
            const listResponse = await window.gapi.client.drive.files.list({
                q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
                fields: 'files(id, name)',
                spaces: 'drive'
            });
            
            if (listResponse.result.files && listResponse.result.files.length > 0) {
                existingFileId = listResponse.result.files[0].id;
            }
        } catch (error) {
            console.warn('Error checking for existing file:', error);
        }
        
        // Convert SOP to JSON
        const jsonContent = JSON.stringify(sop, null, 2);
        
        if (existingFileId) {
            // Update existing file - first update metadata, then content
            await window.gapi.client.drive.files.update({
                fileId: existingFileId,
                resource: {
                    name: fileName
                }
            });
            
            // Update file content using resumable upload
            const updateResponse = await fetch(
                `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${googleDriveStorage.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: jsonContent
                }
            );
            
            if (!updateResponse.ok) {
                throw new Error(`Failed to update file: ${updateResponse.statusText}`);
            }
            
            console.log('✅ SOP updated in Google Drive:', fileName);
        } else {
            // Create new file - first create metadata, then upload content
            const createResponse = await window.gapi.client.drive.files.create({
                resource: {
                    name: fileName,
                    parents: [folderId]
                },
                fields: 'id'
            });
            
            const newFileId = createResponse.result.id;
            
            // Upload file content
            const uploadResponse = await fetch(
                `https://www.googleapis.com/upload/drive/v3/files/${newFileId}?uploadType=media`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${googleDriveStorage.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: jsonContent
                }
            );
            
            if (!uploadResponse.ok) {
                throw new Error(`Failed to upload file: ${uploadResponse.statusText}`);
            }
            
            console.log('✅ SOP saved to Google Drive:', fileName);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving to Google Drive:', error);
        throw error;
    }
}

// Load all SOPs from Google Drive
async function loadAllSopsFromGoogleDrive() {
    if (!googleDriveStorage.isEnabled) {
        return null;
    }
    
    try {
        if (!googleDriveStorage.isAuthenticated) {
            await authenticateGoogleDrive();
        }
        
        const folderId = await getSopsFolder();
        
        // List all JSON files in the folder
        const response = await window.gapi.client.drive.files.list({
            q: `'${folderId}' in parents and trashed=false`,
            fields: 'files(id, name, mimeType)',
            spaces: 'drive'
        });
        
        const files = response.result.files || [];
        const sops = {};
        
        // Load each SOP file
        for (const file of files) {
            if (file.name.endsWith('.json')) {
                try {
                    // Use fetch to get file content
                    const fileResponse = await fetch(
                        `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
                        {
                            headers: {
                                'Authorization': `Bearer ${googleDriveStorage.accessToken}`
                            }
                        }
                    );
                    
                    if (!fileResponse.ok) {
                        throw new Error(`Failed to load file: ${fileResponse.statusText}`);
                    }
                    
                    const jsonText = await fileResponse.text();
                    const sop = JSON.parse(jsonText);
                    
                    if (sop && sop.meta) {
                        const sopKey = sop.meta.sopId || file.name.replace('.json', '');
                        sops[sopKey] = sop;
                    }
                } catch (error) {
                    console.warn('Error loading SOP file:', file.name, error);
                }
            }
        }
        
        console.log(`✅ Loaded ${Object.keys(sops).length} SOPs from Google Drive`);
        return sops;
    } catch (error) {
        console.error('Error loading from Google Drive:', error);
        return null;
    }
}

// Delete SOP from Google Drive
async function deleteSopFromGoogleDrive(sopId) {
    if (!googleDriveStorage.isEnabled || !googleDriveStorage.isAuthenticated) {
        return false;
    }
    
    try {
        const folderId = await getSopsFolder();
        const fileName = `${sopId}.json`;
        
        // Find the file
        const listResponse = await window.gapi.client.drive.files.list({
            q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
            fields: 'files(id)',
            spaces: 'drive'
        });
        
        if (listResponse.result.files && listResponse.result.files.length > 0) {
            const fileId = listResponse.result.files[0].id;
            
            // Delete the file
            await window.gapi.client.drive.files.delete({
                fileId: fileId
            });
            
            console.log('✅ SOP deleted from Google Drive:', fileName);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error deleting from Google Drive:', error);
        return false;
    }
}

// Check if Google Drive is enabled and authenticated
function useGoogleDrive() {
    return googleDriveStorage.isEnabled && googleDriveStorage.isAuthenticated;
}

// Initialize on load
if (typeof window !== 'undefined') {
    window.googleDriveStorage = googleDriveStorage;
    window.saveSopToGoogleDrive = saveSopToGoogleDrive;
    window.loadAllSopsFromGoogleDrive = loadAllSopsFromGoogleDrive;
    window.deleteSopFromGoogleDrive = deleteSopFromGoogleDrive;
    window.authenticateGoogleDrive = authenticateGoogleDrive;
    window.signOutGoogleDrive = signOutGoogleDrive;
    window.saveGoogleDriveConfig = saveGoogleDriveConfigToStorage;
    window.useGoogleDrive = useGoogleDrive;
    window.initGoogleDriveStorage = initGoogleDriveStorage;
    window.getSopsFolder = getSopsFolder;
    
    // Auto-initialize when DOM is ready (only once)
    if (!googleDriveStorage._autoInitDone) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function() {
                if (!googleDriveStorage._autoInitDone) {
                    initGoogleDriveStorage();
                    googleDriveStorage._autoInitDone = true;
                }
            });
        } else {
            initGoogleDriveStorage();
            googleDriveStorage._autoInitDone = true;
        }
    }
}

