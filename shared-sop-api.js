/**
 * Shared SOP API – staff get SOPs from your backend with no API key or OAuth.
 * You set SOP_SHARED_API_URL once (e.g. in index.html); staff just open the app.
 */
(function () {
    'use strict';

    function getBaseUrl() {
        let url = typeof window !== 'undefined' && (window.SOP_SHARED_API_URL || window.sopSharedApiUrl);
        if (!url || typeof url !== 'string') url = '';
        if (!url && typeof window !== 'undefined' && window.location && /github\.io$/i.test(window.location.hostname))
            url = 'https://sop-backend-1065392834988.us-central1.run.app';
        return (url && typeof url === 'string') ? url.replace(/\/$/, '') : '';
    }

    function useSharedAccess() {
        return getBaseUrl().length > 0;
    }

    async function loadAllSopsFromSharedAPI() {
        const base = getBaseUrl();
        if (!base) return null;
        try {
            const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timeout = setTimeout(() => ctrl && ctrl.abort(), 15000);
            const res = await fetch(base + '/sops', {
                method: 'GET',
                mode: 'cors',
                credentials: 'omit',
                headers: { Accept: 'application/json' },
                signal: ctrl ? ctrl.signal : undefined
            });
            clearTimeout(timeout);
            const data = res.ok ? await res.json() : (await res.text().then(t => { try { return JSON.parse(t); } catch (_) { return {}; } }));
            if (!res.ok) {
                const msg = (data && data.error) ? data.error : (res.statusText || 'Failed to load SOPs');
                throw new Error(msg);
            }
            const sops = data.sops || data;
            if (typeof sops === 'object' && !Array.isArray(sops)) return sops;
            return {};
        } catch (e) {
            const msg = e.name === 'AbortError' ? 'Request timed out (try again on better connection)' : e.message;
            console.warn('Shared SOP API load failed:', msg);
            throw new Error(msg);
        }
    }

    async function saveSopToSharedAPI(sop) {
        const base = getBaseUrl();
        if (!base) return false;
        try {
            const res = await fetch(base + '/sops', {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify(sop)
            });
            const data = res.ok ? null : (await res.text().then(t => { try { return JSON.parse(t); } catch (_) { return {}; } }));
            if (!res.ok) {
                const msg = (data && data.error) ? data.error : (res.statusText || 'Failed to save SOP');
                throw new Error(msg);
            }
            return true;
        } catch (e) {
            console.error('Shared SOP API save failed:', e);
            throw e;
        }
    }

    async function deleteSopFromSharedAPI(sopId) {
        const base = getBaseUrl();
        if (!base) return false;
        try {
            const res = await fetch(base + '/sops/' + encodeURIComponent(sopId), { method: 'DELETE' });
            if (!res.ok) throw new Error(res.statusText || 'Failed to delete SOP');
            return true;
        } catch (e) {
            console.error('Shared SOP API delete failed:', e);
            throw e;
        }
    }

    async function loadUsersFromSharedAPI() {
        const base = getBaseUrl();
        if (!base) return [];
        try {
            const res = await fetch(base + '/users', { method: 'GET', mode: 'cors', credentials: 'omit', headers: { Accept: 'application/json' } });
            const data = res.ok ? await res.json() : {};
            const users = (data && data.users) || [];
            return Array.isArray(users) ? users : [];
        } catch (e) {
            console.warn('Shared users load failed:', e.message);
            return [];
        }
    }

    async function saveUsersToSharedAPI(users) {
        const base = getBaseUrl();
        if (!base) return false;
        try {
            const res = await fetch(base + '/users', {
                method: 'POST',
                mode: 'cors',
                credentials: 'omit',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({ users: Array.isArray(users) ? users : [] })
            });
            if (!res.ok) throw new Error(res.statusText || 'Failed to save users');
            return true;
        } catch (e) {
            console.error('Shared users save failed:', e);
            throw e;
        }
    }

    if (typeof window !== 'undefined') {
        window.useSharedAccess = useSharedAccess;
        window.loadAllSopsFromSharedAPI = loadAllSopsFromSharedAPI;
        window.saveSopToSharedAPI = saveSopToSharedAPI;
        window.deleteSopFromSharedAPI = deleteSopFromSharedAPI;
        window.loadUsersFromSharedAPI = loadUsersFromSharedAPI;
        window.saveUsersToSharedAPI = saveUsersToSharedAPI;
    }
})();
