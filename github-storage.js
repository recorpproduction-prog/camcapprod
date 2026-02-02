// GitHub Gists API Integration for SOP Storage
// Uses GitHub Personal Access Tokens (no backend required)
// Users create tokens at: https://github.com/settings/tokens

class GitHubStorage {
    constructor() {
        this.accessToken = null;
        this.gistIdMap = {}; // Maps SOP ID to Gist ID
        this.isEnabled = false;
    }

    // Initialize GitHub storage
    async initialize() {
        // Check if user has previously set a token
        const storedToken = localStorage.getItem('github_access_token');
        if (storedToken) {
            this.accessToken = storedToken;
            this.isEnabled = true;
            this.loadGistIdMap();
            return true;
        }
        return false;
    }

    // Load mapping of SOP IDs to Gist IDs
    loadGistIdMap() {
        const stored = localStorage.getItem('github_gist_map');
        if (stored) {
            this.gistIdMap = JSON.parse(stored);
        }
    }

    // Save mapping of SOP IDs to Gist IDs
    saveGistIdMap() {
        localStorage.setItem('github_gist_map', JSON.stringify(this.gistIdMap));
    }

    // Set Personal Access Token (user creates at github.com/settings/tokens)
    setAccessToken(token) {
        this.accessToken = token;
        localStorage.setItem('github_access_token', token);
        this.isEnabled = true;
        this.loadGistIdMap();
    }

    // Test if token is valid
    async testToken() {
        if (!this.accessToken) {
            return false;
        }

        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    // Save SOP to GitHub Gist
    async saveSopToGist(sop) {
        if (!this.isEnabled || !this.accessToken) {
            return null;
        }

        try {
            const sopId = sop.meta.sopId;
            const fileName = `${sopId}.json`;
            const content = JSON.stringify(sop, null, 2);
            const description = `SOP: ${sop.meta.title || sopId}`;

            let gistId = this.gistIdMap[sopId];

            if (gistId) {
                // Update existing gist
                const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `token ${this.accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        description: description,
                        files: {
                            [fileName]: {
                                content: content
                            }
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to update gist: ${response.statusText}`);
                }

                const gist = await response.json();
                return gist.id;
            } else {
                // Create new gist
                const response = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${this.accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        description: description,
                        public: false, // Private gists
                        files: {
                            [fileName]: {
                                content: content
                            }
                        }
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to create gist: ${response.statusText}`);
                }

                const gist = await response.json();
                this.gistIdMap[sopId] = gist.id;
                this.saveGistIdMap();
                return gist.id;
            }
        } catch (e) {
            console.error('Error saving to GitHub:', e);
            throw e;
        }
    }

    // Load SOP from GitHub Gist
    async loadSopFromGist(gistId) {
        if (!this.isEnabled || !this.accessToken) {
            throw new Error('GitHub storage not enabled');
        }

        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to load gist: ${response.statusText}`);
            }

            const gist = await response.json();
            const files = Object.values(gist.files);
            if (files.length === 0) {
                throw new Error('No files in gist');
            }

            const content = files[0].content;
            return JSON.parse(content);
        } catch (e) {
            console.error('Error loading from GitHub:', e);
            throw e;
        }
    }

    // List all user's SOP gists
    async listSopGists() {
        if (!this.isEnabled || !this.accessToken) {
            return [];
        }

        try {
            const response = await fetch('https://api.github.com/gists', {
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to list gists: ${response.statusText}`);
            }

            const gists = await response.json();
            // Filter for SOP gists (those with .json files)
            return gists.filter(gist => {
                const files = Object.keys(gist.files);
                return files.some(file => file.endsWith('.json') && file.match(/^[A-Z]+-\d{4}-\d{2}-\d{2}-\d{3}\.json$/));
            });
        } catch (e) {
            console.error('Error listing gists:', e);
            return [];
        }
    }

    // Delete SOP from GitHub
    async deleteSopFromGist(sopId) {
        if (!this.isEnabled || !this.accessToken) {
            return;
        }

        const gistId = this.gistIdMap[sopId];
        if (!gistId) {
            return;
        }

        try {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `token ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (response.ok) {
                delete this.gistIdMap[sopId];
                this.saveGistIdMap();
            }
        } catch (e) {
            console.error('Error deleting gist:', e);
        }
    }

    // Disconnect GitHub
    disconnect() {
        this.accessToken = null;
        this.isEnabled = false;
        localStorage.removeItem('github_access_token');
        // Keep gist map for reference, but don't sync
    }
}

// Global instance
const githubStorage = new GitHubStorage();

