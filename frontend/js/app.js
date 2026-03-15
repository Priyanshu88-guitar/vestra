/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – Main App Controller (app.js)
 * Bootstraps the application, manages routing between
 * sections, and provides global UI utilities.
 * ═══════════════════════════════════════════════════════
 */

/* ═══════════════════════════════════════════════════════
   BOOTSTRAP — runs when DOM is ready
   ═══════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
  // Brief loading splash
  setTimeout(() => {
    const overlay = document.getElementById('loadingOverlay');
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.style.display = 'none', 500);
  }, 1200);

  // Check if user has an existing valid session
  if (checkExistingSession()) {
    await initializeApp();
  } else {
    showAuthSection();
  }
});

/* ═══════════════════════════════════════════════════════
   INITIALIZE APP (post-login)
   ═══════════════════════════════════════════════════════ */
async function initializeApp() {
  const user = UserStore.get();
  if (!user) {
    showAuthSection();
    return;
  }

  // Populate user info in sidebar
  document.getElementById('sidebarUserName').textContent = user.name || 'User';
  document.getElementById('userAvatarBtn').title          = user.name;

  // Show app, hide auth
  document.getElementById('authSection').style.display = 'none';
  document.getElementById('appSection').classList.remove('hidden');

  // Navigate to wardrobe section
  switchSection('wardrobe', null);

  // Load wardrobe data from server
  await loadWardrobe();

  // Auto-generate outfits whenever outfits section is active
  // (handled in switchSection)
}

/* ═══════════════════════════════════════════════════════
   SHOW AUTH SECTION
   ═══════════════════════════════════════════════════════ */
function showAuthSection() {
  document.getElementById('appSection').classList.add('hidden');
  document.getElementById('authSection').style.display = 'flex';
  switchAuthTab('login');
}

/* ═══════════════════════════════════════════════════════
   SECTION NAVIGATION
   ═══════════════════════════════════════════════════════ */
const SECTION_CONFIG = {
  'wardrobe':  { id: 'sectionWardrobe',  title: 'My Wardrobe',         icon: 'fas fa-th-large' },
  'add-item':  { id: 'sectionAddItem',   title: 'Add Clothing Item',   icon: 'fas fa-plus-circle' },
  'outfits':   { id: 'sectionOutfits',   title: 'Outfit Suggestions',  icon: 'fas fa-magic' },
  'stats':     { id: 'sectionStats',     title: 'Wardrobe Statistics', icon: 'fas fa-chart-pie' },
};

function switchSection(sectionKey, navLinkEl) {
  const config = SECTION_CONFIG[sectionKey];
  if (!config) return;

  // Hide all sections
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
  // Show target section
  const target = document.getElementById(config.id);
  if (target) target.classList.add('active');

  // Update header title
  document.getElementById('headerTitle').textContent = config.title;

  // Update nav link active states
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  if (navLinkEl) {
    navLinkEl.classList.add('active');
  } else {
    // Find the matching nav link
    const matching = document.querySelector(`.nav-link[data-section="${sectionKey}"]`);
    if (matching) matching.classList.add('active');
  }

  // Close sidebar on mobile
  closeSidebar();

  // Section-specific initialisation
  if (sectionKey === 'outfits') {
    generateOutfits();
  }
  if (sectionKey === 'stats') {
    renderStats(allClothingItems);
  }
}

/* ═══════════════════════════════════════════════════════
   SIDEBAR TOGGLE (Mobile)
   ═══════════════════════════════════════════════════════ */
function toggleSidebar() {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebarOverlay');
  const isOpen   = sidebar.classList.contains('open');
  if (isOpen) {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
  } else {
    sidebar.classList.add('open');
    overlay.classList.add('active');
  }
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

// Close sidebar on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeSidebar();
    // Close modals
    document.getElementById('itemModal').classList.add('hidden');
    document.getElementById('deleteModal').classList.add('hidden');
  }
});

/* ═══════════════════════════════════════════════════════
   TOAST NOTIFICATIONS
   ═══════════════════════════════════════════════════════ */
const TOAST_ICONS = {
  success: 'fas fa-check-circle',
  error:   'fas fa-times-circle',
  warning: 'fas fa-exclamation-triangle',
  info:    'fas fa-info-circle',
};

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  const toast     = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="${TOAST_ICONS[type] || TOAST_ICONS.info} toast-icon"></i>
    <span class="toast-msg">${message}</span>
  `;

  container.appendChild(toast);

  // Auto-remove
  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 320);
  }, duration);
}

/* ═══════════════════════════════════════════════════════
   HANDLE WINDOW RESIZE
   ═══════════════════════════════════════════════════════ */
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    closeSidebar();
  }
});
