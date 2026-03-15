/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – Auth Module (auth.js)
 * Handles user login, signup, logout, and session management.
 * ═══════════════════════════════════════════════════════
 */

/* ─── AUTH TAB SWITCHER ─── */
function switchAuthTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.auth-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  // Toggle forms
  document.getElementById('loginForm').classList.toggle('active', tab === 'login');
  document.getElementById('signupForm').classList.toggle('active', tab === 'signup');
}

/* ─── TOGGLE PASSWORD VISIBILITY ─── */
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon  = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

/* ─── SET BUTTON LOADING STATE ─── */
function setButtonLoading(btnId, loading, originalText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.innerHTML = `<span class="spinner-ring" style="width:18px;height:18px;border-width:2px;"></span> Processing…`;
  } else {
    btn.disabled = false;
    btn.innerHTML = originalText;
  }
}

/* ═══════════════════════════════════════════════════════
   HANDLE LOGIN
   ═══════════════════════════════════════════════════════ */
async function handleLogin(e) {
  e.preventDefault();
  const email    = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showToast('Please fill in all fields.', 'warning');
    return;
  }

  setButtonLoading('loginBtn', true, '');

  try {
    const result = await apiLogin(email, password);

    // Persist auth data
    TokenStore.set(result.token);
    UserStore.set(result.user);

    showToast(`Welcome back, ${result.user.name}! 👋`, 'success');
    initializeApp();

  } catch (err) {
    showToast(err.message || 'Login failed. Check your credentials.', 'error');
  } finally {
    setButtonLoading('loginBtn', false,
      `<span class="btn-text">Sign In</span><i class="fas fa-arrow-right btn-icon"></i>`
    );
  }
}

/* ═══════════════════════════════════════════════════════
   HANDLE SIGNUP
   ═══════════════════════════════════════════════════════ */
async function handleSignup(e) {
  e.preventDefault();
  const name     = document.getElementById('signupName').value.trim();
  const email    = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  if (!name || !email || !password) {
    showToast('Please fill in all fields.', 'warning');
    return;
  }
  if (password.length < 6) {
    showToast('Password must be at least 6 characters.', 'warning');
    return;
  }
  if (!isValidEmail(email)) {
    showToast('Please enter a valid email address.', 'warning');
    return;
  }

  setButtonLoading('signupBtn', true, '');

  try {
    const result = await apiSignup(name, email, password);

    // Persist auth data
    TokenStore.set(result.token);
    UserStore.set(result.user);

    showToast(`Account created! Welcome to Vestra, ${result.user.name}! 🎉`, 'success');
    initializeApp();

  } catch (err) {
    showToast(err.message || 'Signup failed. Please try again.', 'error');
  } finally {
    setButtonLoading('signupBtn', false,
      `<span class="btn-text">Create Account</span><i class="fas fa-arrow-right btn-icon"></i>`
    );
  }
}

/* ═══════════════════════════════════════════════════════
   HANDLE LOGOUT
   ═══════════════════════════════════════════════════════ */
function handleLogout() {
  // Clear auth state
  TokenStore.remove();
  UserStore.remove();

  // Stop camera if active
  if (typeof stopCamera === 'function') stopCamera();

  // Reset wardrobe data
  if (typeof resetWardrobeState === 'function') resetWardrobeState();

  // Clear login form fields
  document.getElementById('loginEmail').value    = '';
  document.getElementById('loginPassword').value = '';

  // Show auth page
  showAuthSection();
  showToast('You have been signed out.', 'success');
}

/* ═══════════════════════════════════════════════════════
   SESSION CHECK
   ═══════════════════════════════════════════════════════ */
/**
 * Checks if a valid token and user exist in localStorage.
 * Returns true if session appears valid.
 */
function checkExistingSession() {
  const token = TokenStore.get();
  const user  = UserStore.get();
  return !!(token && user && user._id);
}

/* ─── VALIDATION HELPERS ─── */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
