// GitHub Repository Storage - Shared Database for All SOPs
// Uses GitHub Repository API to store SOPs as JSON files
// All users see all SOPs (shared database)
// VERSION 4 - Cache busting - If you see this, new code is loaded!
console.log('🔍 DIAG: github-repo-storage.js VERSION 4 loaded at', new Date().toISOString());

let githubRepoStorage = {
    token: null,
    owner: null,
    repo: null,
    isEnabled: false
};

// Initialize GitHub Repository Storage
function initGitHubRepoStorage() {
    if (!window.githubRepoConfig) {
        console.log('❌ GitHub repo config not found');
        console.log('🔍 DIAG: window.githubRepoConfig is:', window.githubRepoConfig);
        return false;
    }
    
    const config = window.githubRepoConfig;
    
    if (!config.token || !config.owner || !config.repo) {
        console.warn('❌ GitHub repo config incomplete. Please check index.html');
        console.log('🔍 DIAG: token exists?', !!config.token);
        console.log('🔍 DIAG: owner exists?', !!config.owner);
        console.log('🔍 DIAG: repo exists?', !!config.repo);
        return false;
    }
    
    // Replace placeholder values
    if (config.owner === 'YOUR_GITHUB_USERNAME') {
        console.error('⚠️ Please set your GitHub username in index.html (githubRepoConfig.owner)');
        return false;
    }
    
    // Trim token in case of whitespace
    const token = config.token.trim();
    console.log('🔍 DIAG: Original token length:', config.token.length);
    console.log('🔍 DIAG: Trimmed token length:', token.length);
    console.log('🔍 DIAG: Token has whitespace?', config.token !== token);
    
    githubRepoStorage.token = token;
    githubRepoStorage.owner = config.owner.trim();
    githubRepoStorage.repo = config.repo.trim();
    githubRepoStorage.isEnabled = true;
    
    console.log('✅ GitHub Repository Storage initialized');
    console.log('Repository:', `${config.owner}/${config.repo}`);
    console.log('🔍 DIAG: Token type:', config.token.startsWith('ghp_') ? 'Classic (ghp_)' : config.token.startsWith('github_pat_') ? 'Fine-grained (github_pat_)' : 'Unknown');
    console.log('🔍 DIAG: Token preview:', config.token.substring(0, 15) + '...');
    console.log('🔍 DIAG: Full token length:', config.token.length);
    console.log('🔍 DIAG: Token starts with ghp_?', config.token.startsWith('ghp_'));
    console.log('🔍 DIAG: Token starts with github_pat_?', config.token.startsWith('github_pat_'));
    console.log('🔍 DIAG: Will use auth header:', config.token.startsWith('github_pat_') ? 'Bearer' : 'token');
    console.log('🔍 DIAG: Actual token value (first 20 chars):', config.token.substring(0, 20));
    console.log('🔍 DIAG: Actual token value (last 20 chars):', config.token.substring(config.token.length - 20));
    
    return true;
}

// GitHub API helper - make authenticated request
async function githubApiRequest(endpoint, options = {}) {
    if (!githubRepoStorage.isEnabled) {
        throw new Error('GitHub storage not enabled');
    }
    
    // CRITICAL: Ensure token is trimmed and valid
    const token = githubRepoStorage.token ? githubRepoStorage.token.trim() : null;
    if (!token) {
        throw new Error('GitHub token is missing or empty');
    }
    
    const url = `https://api.github.com${endpoint}`;
    
    // Use Bearer for newer tokens, token for classic tokens
    // Classic tokens (ghp_) use 'token', fine-grained (github_pat_) use 'Bearer'
    // FORCE 'token' prefix for classic tokens - this is what test page uses
    const authHeader = token.startsWith('github_pat_')
        ? `Bearer ${token}`
        : `token ${token}`;
    
    console.log('🔍 DIAG: Making GitHub API request to:', endpoint);
    console.log('🔍 DIAG: Token stored length:', token.length);
    console.log('🔍 DIAG: Token stored preview:', token.substring(0, 20) + '...');
    console.log('🔍 DIAG: Token stored last 20 chars:', '...' + token.substring(token.length - 20));
    console.log('🔍 DIAG: Token type:', token.startsWith('ghp_') ? 'Classic (ghp_)' : token.startsWith('github_pat_') ? 'Fine-grained (github_pat_)' : 'Unknown');
    console.log('🔍 DIAG: Auth header type:', token.startsWith('github_pat_') ? 'Bearer' : 'token');
    console.log('🔍 DIAG: Auth header FULL (first 50 chars):', authHeader.substring(0, 50) + '...');
    console.log('🔍 DIAG: Full URL:', url);
    console.log('🔍 DIAG: COMPARING - Token matches config?', token === (window.githubRepoConfig ? window.githubRepoConfig.token.trim() : 'NO CONFIG'));
    
    const headers = {
        'Authorization': authHeader,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    console.log('🔍 DIAG: Request headers:', {
        'Authorization': authHeader.substring(0, 20) + '...',
        'Accept': headers['Accept'],
        'Content-Type': headers['Content-Type']
    });
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    console.log('🔍 DIAG: GitHub API response status:', response.status);
    console.log('🔍 DIAG: Response OK:', response.ok);
    
    if (!response.ok) {
        const errorText = await response.text();
        let error;
        try {
            error = JSON.parse(errorText);
        } catch {
            error = { message: errorText || response.statusText };
        }
        
        // Provide helpful error messages
        if (response.status === 401) {
            console.error('🔍 DIAG: 401 Error - Token being used:', githubRepoStorage.token ? githubRepoStorage.token.substring(0, 20) + '...' : 'NULL');
            console.error('🔍 DIAG: 401 Error - Auth header:', authHeader.substring(0, 30) + '...');
            console.error('🔍 DIAG: 401 Error - Expected token from config:', window.githubRepoConfig ? (window.githubRepoConfig.token ? window.githubRepoConfig.token.substring(0, 20) + '...' : 'MISSING') : 'CONFIG NOT FOUND');
            throw new Error(`Bad credentials (401). Your GitHub token may be invalid, expired, or missing 'repo' scope. Please check your token in index.html. Token preview: ${githubRepoStorage.token ? githubRepoStorage.token.substring(0, 20) + '...' : 'NULL'}`);
        } else if (response.status === 403) {
            throw new Error(`Forbidden (403). Your token may not have permission to access this repository.`);
        } else if (response.status === 404) {
            throw new Error(`Not found (404). Repository ${githubRepoStorage.owner}/${githubRepoStorage.repo} may not exist.`);
        }
        
        throw new Error(`GitHub API error: ${error.message || response.statusText} (${response.status})`);
    }
    
    return response.json();
}

// Get file content from repository
async function getFileFromRepo(path) {
    try {
        const content = await githubApiRequest(`/repos/${githubRepoStorage.owner}/${githubRepoStorage.repo}/contents/${path}`);
        
        if (content.encoding === 'base64') {
            const decoded = atob(content.content);
            return JSON.parse(decoded);
        }
        return JSON.parse(content.content);
    } catch (error) {
        if (error.message.includes('404')) {
            return null; // File doesn't exist
        }
        throw error;
    }
}

// Save file to repository
async function saveFileToRepo(path, content, message = 'Update SOP') {
    let sha = null;
    
    // Check if file exists
    try {
        const existing = await githubApiRequest(`/repos/${githubRepoStorage.owner}/${githubRepoStorage.repo}/contents/${path}`);
        sha = existing.sha;
    } catch (error) {
        // File doesn't exist, that's okay - we'll create it
        if (!error.message.includes('404')) {
            console.warn('Error checking file existence:', error);
        }
    }
    
    const encodedContent = btoa(JSON.stringify(content, null, 2));
    
    const body = {
        message: message,
        content: encodedContent,
        branch: 'main'
    };
    
    if (sha) {
        body.sha = sha; // Update existing file
    }
    
    await githubApiRequest(`/repos/${githubRepoStorage.owner}/${githubRepoStorage.repo}/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify(body)
    });
}

// Save SOP to GitHub repository - PRIMARY STORAGE
async function saveSopToGitHubRepo(sop) {
    if (!githubRepoStorage.isEnabled) {
        throw new Error('GitHub storage not enabled. Please check your repository configuration.');
    }
    
    // Check if repository exists first
    try {
        await githubApiRequest(`/repos/${githubRepoStorage.owner}/${githubRepoStorage.repo}`);
    } catch (error) {
        if (error.message.includes('404')) {
            throw new Error(`Repository ${githubRepoStorage.owner}/${githubRepoStorage.repo} does not exist. Please create it on GitHub.`);
        }
        if (error.message.includes('401') || error.message.includes('Bad credentials')) {
            throw new Error('GitHub authentication failed. Please check your token is valid and has the correct permissions (repo scope).');
        }
        throw error;
    }
    
    const sopId = sop.meta.sopId || `sop-${Date.now()}`;
    sop.meta.sopId = sopId; // Ensure SOP ID is set
    
    // Add savedAt timestamp if not present
    if (!sop.savedAt) {
        sop.savedAt = new Date().toISOString();
    }
    
    const fileName = `sops/${sopId}.json`;
    const message = `Save SOP: ${sop.meta.title || sopId}`;
    
    await saveFileToRepo(fileName, sop, message);
    console.log('✅ SOP saved to GitHub repository:', sopId);
    return true;
}

// Load all SOPs from GitHub repository (shared database)
async function loadAllSopsFromGitHubRepo() {
    if (!githubRepoStorage.isEnabled) {
        return null;
    }
    
    try {
        // First check if repository exists
        try {
            await githubApiRequest(`/repos/${githubRepoStorage.owner}/${githubRepoStorage.repo}`);
        } catch (error) {
            if (error.message.includes('404')) {
                console.log('📝 Repository does not exist yet - will use localStorage until repo is created');
                return null; // Return null to use localStorage
            }
            throw error;
        }
        
        // Get all files in sops/ directory
        let files = [];
        try {
            files = await githubApiRequest(`/repos/${githubRepoStorage.owner}/${githubRepoStorage.repo}/contents/sops`);
        } catch (error) {
            if (error.message.includes('404')) {
                // sops/ directory doesn't exist yet, that's okay
                console.log('📝 No SOPs directory found yet - will create on first save');
                return {}; // Return empty object, not null
            }
            throw error;
        }
        
        // Handle case where files is not an array
        if (!Array.isArray(files)) {
            files = [files];
        }
        
        const sops = {};
        
        // Load each SOP file
        for (const file of files) {
            if (file.type === 'file' && file.name.endsWith('.json')) {
                try {
                    const sop = await getFileFromRepo(file.path);
                    if (sop && sop.meta) {
                        const sopKey = sop.meta.sopId || file.name.replace('.json', '');
                        sops[sopKey] = sop;
                    }
                } catch (error) {
                    console.warn('Error loading SOP file:', file.name, error);
                }
            }
        }
        
        console.log(`✅ Loaded ${Object.keys(sops).length} SOPs from GitHub repository`);
        return sops;
    } catch (error) {
        // Don't throw - just return empty object so app continues working
        console.warn('⚠️ Could not load from GitHub:', error.message);
        return {}; // Return empty object, not null
    }
}

// Delete SOP from GitHub repository
async function deleteSopFromGitHubRepo(sopId) {
    if (!githubRepoStorage.isEnabled) {
        return false;
    }
    
    try {
        const fileName = `sops/${sopId}.json`;
        
        // Get file SHA first
        const file = await githubApiRequest(`/repos/${githubRepoStorage.owner}/${githubRepoStorage.repo}/contents/${fileName}`);
        
        // Delete file
        await githubApiRequest(`/repos/${githubRepoStorage.owner}/${githubRepoStorage.repo}/contents/${fileName}`, {
            method: 'DELETE',
            body: JSON.stringify({
                message: `Delete SOP: ${sopId}`,
                sha: file.sha,
                branch: 'main'
            })
        });
        
        console.log('✅ SOP deleted from GitHub repository:', sopId);
        return true;
    } catch (error) {
        if (error.message.includes('404')) {
            // File doesn't exist, that's okay
            return true;
        }
        console.error('❌ Error deleting SOP from GitHub:', error);
        throw error;
    }
}

// Initialize on page load - wait for config to be available
document.addEventListener('DOMContentLoaded', function() {
    // Small delay to ensure config is loaded
    setTimeout(() => {
        console.log('🔍 DIAG: Checking for githubRepoConfig...');
        console.log('🔍 DIAG: window.githubRepoConfig exists?', !!window.githubRepoConfig);
        if (window.githubRepoConfig) {
            console.log('🔍 DIAG: Config token preview:', window.githubRepoConfig.token ? window.githubRepoConfig.token.substring(0, 15) + '...' : 'MISSING');
            console.log('🔍 DIAG: Config owner:', window.githubRepoConfig.owner);
            console.log('🔍 DIAG: Config repo:', window.githubRepoConfig.repo);
        }
        
        const initialized = initGitHubRepoStorage();
        if (initialized) {
            console.log('🚀 GitHub Repository Storage initialized');
            console.log('Repository:', `${githubRepoStorage.owner}/${githubRepoStorage.repo}`);
            console.log('🔍 DIAG: Stored token preview:', githubRepoStorage.token ? githubRepoStorage.token.substring(0, 15) + '...' : 'MISSING');
            
            // Try to load from GitHub (non-blocking, silent failure)
            loadAllSopsFromGitHubRepo().then(sops => {
                if (sops && Object.keys(sops).length > 0) {
                    console.log(`✅ Loaded ${Object.keys(sops).length} SOPs from GitHub repository`);
                } else {
                    console.log('📝 No SOPs in GitHub repository yet');
                }
            }).catch(error => {
                // Show error details for debugging
                console.error('⚠️ GitHub load failed:', error.message);
                console.error('🔍 DIAG: Error details:', error);
            });
        } else {
            console.log('📝 Using localStorage only (GitHub not configured)');
        }
    }, 100);
});

// Make functions globally available
window.saveSopToGitHubRepo = saveSopToGitHubRepo;
window.loadAllSopsFromGitHubRepo = loadAllSopsFromGitHubRepo;
window.deleteSopFromGitHubRepo = deleteSopFromGitHubRepo;
window.useGitHubRepo = () => githubRepoStorage.isEnabled;

