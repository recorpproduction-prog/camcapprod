// Firebase Firestore Database Module
// Handles shared SOP storage - all users see all SOPs

let firestoreDb = null;
let useFirebase = false;

// Initialize Firestore
async function initFirestore() {
    if (!firebaseApp) {
        console.log('Firebase not initialized, using localStorage');
        return false;
    }
    
    try {
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        firestoreDb = getFirestore(firebaseApp);
        useFirebase = true;
        console.log('Firestore initialized - using shared database');
        return true;
    } catch (error) {
        console.error('Firestore initialization error:', error);
        return false;
    }
}

// Save SOP to Firestore (shared database)
async function saveSopToFirestore(sop) {
    if (!useFirebase || !firestoreDb) {
        return false; // Fallback to localStorage
    }
    
    try {
        const { collection, doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const sopId = sop.meta.sopId || `sop-${Date.now()}`;
        const sopRef = doc(collection(firestoreDb, 'sops'), sopId);
        
        await setDoc(sopRef, {
            ...sop,
            sopId: sopId,
            savedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: getCurrentUser()?.email || 'unknown'
        }, { merge: true });
        
        console.log('SOP saved to Firestore:', sopId);
        return true;
    } catch (error) {
        console.error('Error saving to Firestore:', error);
        return false;
    }
}

// Load all SOPs from Firestore (shared - all users see all SOPs)
async function loadSopsFromFirestore() {
    if (!useFirebase || !firestoreDb) {
        return null; // Fallback to localStorage
    }
    
    try {
        const { collection, getDocs, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const sopsRef = collection(firestoreDb, 'sops');
        const q = query(sopsRef, orderBy('savedAt', 'desc'));
        const snapshot = await getDocs(q);
        
        const sops = {};
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore timestamps to ISO strings
            if (data.savedAt && data.savedAt.toDate) {
                data.savedAt = data.savedAt.toDate().toISOString();
            }
            if (data.updatedAt && data.updatedAt.toDate) {
                data.updatedAt = data.updatedAt.toDate().toISOString();
            }
            sops[doc.id] = data;
        });
        
        console.log('Loaded SOPs from Firestore:', Object.keys(sops).length);
        return sops;
    } catch (error) {
        console.error('Error loading from Firestore:', error);
        return null;
    }
}

// Delete SOP from Firestore
async function deleteSopFromFirestore(sopId) {
    if (!useFirebase || !firestoreDb) {
        return false;
    }
    
    try {
        const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const sopRef = doc(firestoreDb, 'sops', sopId);
        await deleteDoc(sopRef);
        console.log('SOP deleted from Firestore:', sopId);
        return true;
    } catch (error) {
        console.error('Error deleting from Firestore:', error);
        return false;
    }
}

// Listen for real-time updates
function subscribeToSops(callback) {
    if (!useFirebase || !firestoreDb) {
        return null;
    }
    
    try {
        const { collection, onSnapshot, query, orderBy } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const sopsRef = collection(firestoreDb, 'sops');
        const q = query(sopsRef, orderBy('savedAt', 'desc'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const sops = {};
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.savedAt && data.savedAt.toDate) {
                    data.savedAt = data.savedAt.toDate().toISOString();
                }
                if (data.updatedAt && data.updatedAt.toDate) {
                    data.updatedAt = data.updatedAt.toDate().toISOString();
                }
                sops[doc.id] = data;
            });
            callback(sops);
        });
        
        return unsubscribe;
    } catch (error) {
        console.error('Error setting up real-time listener:', error);
        return null;
    }
}

// Initialize Firestore when Firebase is ready
document.addEventListener('DOMContentLoaded', async function() {
    // Wait for Firebase auth to initialize
    setTimeout(async () => {
        if (firebaseApp) {
            await initFirestore();
        }
    }, 1000);
});

// Make functions globally available
window.saveSopToFirestore = saveSopToFirestore;
window.loadSopsFromFirestore = loadSopsFromFirestore;
window.deleteSopFromFirestore = deleteSopFromFirestore;
window.subscribeToSops = subscribeToSops;
window.useFirebase = () => useFirebase;

