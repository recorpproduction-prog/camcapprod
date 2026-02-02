// Firebase Authentication Module
// Handles login, signup, and authentication state

let firebaseApp = null;
let firebaseAuth = null;
let currentUser = null;

// Initialize Firebase
async function initFirebase() {
    if (!window.firebaseConfig) {
        console.error('Firebase config not found. Please add your Firebase config to index.html');
        return false;
    }

    try {
        // Import Firebase modules
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        
        firebaseApp = initializeApp(window.firebaseConfig);
        firebaseAuth = getAuth(firebaseApp);
        
        // Listen for auth state changes
        onAuthStateChanged(firebaseAuth, (user) => {
            currentUser = user;
            if (user) {
                // User is signed in
                showMainApp();
                console.log('User signed in:', user.email);
            } else {
                // User is signed out
                showLoginPage();
                console.log('User signed out');
            }
        });
        
        return true;
    } catch (error) {
        console.error('Firebase initialization error:', error);
        // If Firebase fails, show app anyway (fallback to localStorage)
        showMainApp();
        return false;
    }
}

// Show login page
function showLoginPage() {
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('mainApp');
    if (loginPage) loginPage.classList.remove('hidden');
    if (mainApp) mainApp.classList.add('hidden');
}

// Show main app
function showMainApp() {
    const loginPage = document.getElementById('loginPage');
    const mainApp = document.getElementById('mainApp');
    if (loginPage) loginPage.classList.add('hidden');
    if (mainApp) mainApp.classList.remove('hidden');
}

// Handle login
async function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    if (!email || !password) {
        showError(errorDiv, 'Please enter email and password');
        return;
    }
    
    if (!firebaseAuth) {
        showError(errorDiv, 'Firebase not initialized. Check console for errors.');
        return;
    }
    
    try {
        const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        await signInWithEmailAndPassword(firebaseAuth, email, password);
        // Auth state change will handle showing the app
        hideError(errorDiv);
    } catch (error) {
        console.error('Login error:', error);
        let errorMessage = 'Login failed. ';
        if (error.code === 'auth/user-not-found') {
            errorMessage += 'User not found.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage += 'Incorrect password.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage += 'Invalid email address.';
        } else {
            errorMessage += error.message;
        }
        showError(errorDiv, errorMessage);
    }
}

// Handle sign up
async function handleSignUp() {
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const name = document.getElementById('signupName').value.trim();
    const errorDiv = document.getElementById('signupError');
    
    if (!email || !password || !name) {
        showError(errorDiv, 'Please fill in all fields');
        return;
    }
    
    if (password.length < 6) {
        showError(errorDiv, 'Password must be at least 6 characters');
        return;
    }
    
    if (!firebaseAuth) {
        showError(errorDiv, 'Firebase not initialized. Check console for errors.');
        return;
    }
    
    try {
        const { createUserWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { getFirestore, collection, doc, setDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;
        
        // Save user info to Firestore
        const db = getFirestore(firebaseApp);
        await setDoc(doc(db, 'users', user.uid), {
            email: email,
            name: name,
            createdAt: new Date().toISOString()
        });
        
        // Auth state change will handle showing the app
        hideError(errorDiv);
        showNotification('Account created successfully!', 'success');
    } catch (error) {
        console.error('Signup error:', error);
        let errorMessage = 'Signup failed. ';
        if (error.code === 'auth/email-already-in-use') {
            errorMessage += 'Email already registered.';
        } else if (error.code === 'auth/weak-password') {
            errorMessage += 'Password is too weak.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage += 'Invalid email address.';
        } else {
            errorMessage += error.message;
        }
        showError(errorDiv, errorMessage);
    }
}

// Handle logout
async function handleLogout() {
    if (!firebaseAuth) return;
    
    try {
        const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        await signOut(firebaseAuth);
        showNotification('Signed out successfully', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Error signing out: ' + error.message, 'error');
    }
}

// Show signup form
function showSignUp() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signUpForm').classList.remove('hidden');
    hideError(document.getElementById('loginError'));
}

// Show login form
function showLogin() {
    document.getElementById('signUpForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    hideError(document.getElementById('signupError'));
}

// Helper functions
function showError(errorDiv, message) {
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

function hideError(errorDiv) {
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.classList.add('hidden');
    }
}

// Get current user
function getCurrentUser() {
    return currentUser;
}

// Check if user is authenticated
function isAuthenticated() {
    return currentUser !== null;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function() {
    const firebaseInitialized = await initFirebase();
    if (!firebaseInitialized) {
        // Fallback: show app anyway (will use localStorage)
        console.warn('Firebase not available, using localStorage fallback');
        showMainApp();
    }
});

// Make functions globally available
window.handleLogin = handleLogin;
window.handleSignUp = handleSignUp;
window.handleLogout = handleLogout;
window.showSignUp = showSignUp;
window.showLogin = showLogin;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;

