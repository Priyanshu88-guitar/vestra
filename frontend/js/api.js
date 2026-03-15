/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – API Service Layer (api.js)
 * Handles all HTTP communication with the Express backend.
 * ═══════════════════════════════════════════════════════
 */

// ─── BASE URL ───
// In development: http://localhost:5000
// In production: change to your deployed backend URL
const API_BASE = "https://vestra-api-hp1c.onrender.com";

// ─── AUTH TOKEN MANAGEMENT ───
const TokenStore = {
  get:    ()      => localStorage.getItem('vestra_token'),
  set:    (token) => localStorage.setItem('vestra_token', token),
  remove: ()      => localStorage.removeItem('vestra_token'),
};

const UserStore = {
  get:    ()    => JSON.parse(localStorage.getItem('vestra_user') || 'null'),
  set:    (u)   => localStorage.setItem('vestra_user', JSON.stringify(u)),
  remove: ()    => localStorage.removeItem('vestra_user'),
};

/**
 * Core fetch wrapper that automatically attaches the JWT token
 * and handles common error cases.
 */
async function apiFetch(endpoint, options = {}) {
  const token = TokenStore.get();
  const headers = {
    ...options.headers,
  };

  // Attach auth header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set JSON content-type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkErr) {
    // Server unreachable or network error
    throw new Error('Cannot connect to server. Please ensure the backend is running.');
  }

  // Handle 401 – token expired or invalid
  if (response.status === 401) {
    TokenStore.remove();
    UserStore.remove();
    showToast('Session expired. Please sign in again.', 'warning');
    setTimeout(() => showAuthSection(), 1200);
    throw new Error('Unauthorized');
  }

  // Parse JSON if content-type is JSON
  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json();
  }

  if (!response.ok) {
    const msg = data?.message || `Request failed (${response.status})`;
    throw new Error(msg);
  }

  return data;
}

/* ═══════════════════════════════════════════════════════
   AUTH API
   ═══════════════════════════════════════════════════════ */

/**
 * POST /api/auth/signup
 * Register a new user.
 * @param {string} name
 * @param {string} email
 * @param {string} password
 * @returns {Object} { token, user }
 */
async function apiSignup(name, email, password) {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

/**
 * POST /api/auth/login
 * Authenticate an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {Object} { token, user }
 */
async function apiLogin(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

/* ═══════════════════════════════════════════════════════
   WARDROBE API
   ═══════════════════════════════════════════════════════ */

/**
 * GET /api/wardrobe
 * Fetch all wardrobe items for the authenticated user.
 * @returns {Array} clothing items
 */
async function apiFetchWardrobe() {
  const data = await apiFetch('/wardrobe');
  return Array.isArray(data) ? data : (data.items || []);
}

/**
 * POST /api/wardrobe
 * Upload a new clothing item with image + metadata.
 * Uses FormData so the image file can be sent as multipart.
 *
 * @param {Object} itemData - { name, category, color, season, occasion, notes }
 * @param {File|null} imageFile - optional image file
 * @returns {Object} created clothing item
 */
async function apiAddClothingItem(itemData, imageFile) {
  const formData = new FormData();

  // Append text fields
  Object.entries(itemData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  // Append image file if provided
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const token = TokenStore.get();
  let response;
  try {
    response = await fetch(`${API_BASE}/wardrobe`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
  } catch (err) {
    throw new Error('Cannot connect to server.');
  }

  if (response.status === 401) {
    TokenStore.remove();
    throw new Error('Unauthorized');
  }

  const data = await response.json();
  if (!response.ok) throw new Error(data?.message || 'Upload failed');
  return data;
}

/**
 * DELETE /api/wardrobe/:id
 * Delete a clothing item by ID.
 * @param {string} id
 */
async function apiDeleteClothingItem(id) {
  return apiFetch(`/wardrobe/${id}`, { method: 'DELETE' });
}

/**
 * PATCH /api/wardrobe/:id
 * Update clothing item metadata.
 * @param {string} id
 * @param {Object} updates
 * @returns {Object} updated item
 */
async function apiUpdateClothingItem(id, updates) {
  return apiFetch(`/wardrobe/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/* ═══════════════════════════════════════════════════════
   HELPERS — Image URL
   ═══════════════════════════════════════════════════════ */

/**
 * Returns the full URL for a clothing item's image.
 * Handles relative paths returned by the backend.
 */
function getImageUrl(imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  // Remove leading slash if present
  const clean = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${window.API_BASE_URL || 'http://localhost:5000'}/${clean}`;
}

/* ═══════════════════════════════════════════════════════
   COLOR MAP (name → CSS value)
   ═══════════════════════════════════════════════════════ */
const COLOR_MAP = {
  black:      '#1a1a1a',
  white:      '#f5f5f5',
  gray:       '#9CA3AF',
  red:        '#EF4444',
  blue:       '#3B82F6',
  green:      '#10B981',
  yellow:     '#F59E0B',
  pink:       '#EC4899',
  purple:     '#8B5CF6',
  brown:      '#92400E',
  orange:     '#F97316',
  beige:      '#D4B896',
  multicolor: 'linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF)',
};

function getColorValue(colorName) {
  return COLOR_MAP[colorName?.toLowerCase()] || '#e5e7eb';
}

/* ═══════════════════════════════════════════════════════
   CATEGORY EMOJI MAP
   ═══════════════════════════════════════════════════════ */
const CATEGORY_EMOJI = {
  shirt:     '👕',
  pants:     '👖',
  jacket:    '🧥',
  dress:     '👗',
  shoes:     '👟',
  accessory: '⌚',
  sweater:   '🧶',
  other:     '📦',
};

function getCategoryEmoji(category) {
  return CATEGORY_EMOJI[category?.toLowerCase()] || '👔';
}
