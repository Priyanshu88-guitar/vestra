/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – Wardrobe Module (wardrobe.js)
 * Manages the clothing gallery, filtering, CRUD operations,
 * and item detail modal.
 * ═══════════════════════════════════════════════════════
 */

// ─── STATE ───
let allClothingItems   = [];   // Full wardrobe array from API
let filteredItems      = [];   // Currently displayed (after filters)
let activeCategoryFilter = 'all';
let pendingDeleteId    = null; // ID of item pending deletion

/* ═══════════════════════════════════════════════════════
   LOAD WARDROBE
   ═══════════════════════════════════════════════════════ */
async function loadWardrobe() {
  showGridSkeleton(true);
  document.getElementById('emptyWardrobe').classList.add('hidden');

  try {
    allClothingItems = await apiFetchWardrobe();
    renderWardrobe();
    updateWardrobeBadge();
    updateStatsCounts();
  } catch (err) {
    showToast('Failed to load wardrobe: ' + err.message, 'error');
    allClothingItems = [];
    renderWardrobe();
  } finally {
    showGridSkeleton(false);
  }
}

/* ═══════════════════════════════════════════════════════
   RENDER WARDROBE GRID
   ═══════════════════════════════════════════════════════ */
function renderWardrobe() {
  applyFilters();
}

function applyFilters() {
  const searchVal   = document.getElementById('searchInput').value.toLowerCase().trim();
  const colorFilter = document.getElementById('colorFilter').value;

  filteredItems = allClothingItems.filter(item => {
    // Category filter
    const catMatch = activeCategoryFilter === 'all' || item.category === activeCategoryFilter;
    // Color filter
    const colMatch = !colorFilter || item.color === colorFilter;
    // Search filter (name, notes, brand)
    const searchMatch = !searchVal ||
      (item.name   && item.name.toLowerCase().includes(searchVal))  ||
      (item.notes  && item.notes.toLowerCase().includes(searchVal)) ||
      (item.category && item.category.toLowerCase().includes(searchVal));

    return catMatch && colMatch && searchMatch;
  });

  displayFilteredItems();
}

function displayFilteredItems() {
  const grid = document.getElementById('clothingGrid');
  const empty = document.getElementById('emptyWardrobe');

  grid.innerHTML = '';

  if (filteredItems.length === 0) {
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    filteredItems.forEach((item, index) => {
      const card = createClothingCard(item, index);
      grid.appendChild(card);
    });
  }

  // Update stats pills
  document.getElementById('statTotal').textContent    = allClothingItems.length;
  document.getElementById('statFiltered').textContent = filteredItems.length;
}

/* ─── CREATE CLOTHING CARD DOM ELEMENT ─── */
function createClothingCard(item, index) {
  const card = document.createElement('div');
  card.className = 'clothing-card';
  card.style.animationDelay = `${index * 0.06}s`;
  card.onclick = () => openItemModal(item);

  const imageUrl  = item.imageUrl ? getImageUrl(item.imageUrl) : null;
  const colorVal  = getColorValue(item.color);
  const emoji     = getCategoryEmoji(item.category);

  card.innerHTML = `
    <div class="card-image-wrap">
      ${imageUrl
        ? `<img class="card-img" src="${imageUrl}" alt="${escapeHtml(item.name)}" loading="lazy"
               onerror="this.parentElement.innerHTML='<div class=\\"card-no-image\\"><i class=\\"fas fa-tshirt\\"></i><span>${escapeHtml(item.name)}</span></div>'" />`
        : `<div class="card-no-image">
             <i class="fas fa-tshirt" style="font-size:2.2rem;opacity:0.25;"></i>
             <span style="font-size:1.8rem;">${emoji}</span>
           </div>`
      }
      <div class="card-color-badge" style="background:${colorVal}" title="${item.color}"></div>
      <div class="card-overlay" onclick="event.stopPropagation()">
        <button class="btn-icon-sm btn-edit" onclick="openItemModal(${JSON.stringify(item).replace(/"/g,'&quot;')})" title="View">
          <i class="fas fa-eye"></i>
        </button>
        <button class="btn-icon-sm btn-delete" onclick="initiateDelete('${item._id}')" title="Delete">
          <i class="fas fa-trash"></i>
        </button>
      </div>
    </div>
    <div class="card-body">
      <div class="card-name">${escapeHtml(item.name)}</div>
      <div class="card-meta">
        <span class="meta-tag">${capitalise(item.category)}</span>
        ${item.season && item.season !== 'all'
          ? `<span class="meta-tag season">${capitalise(item.season)}</span>` : ''}
        ${item.occasion
          ? `<span class="meta-tag occasion">${capitalise(item.occasion)}</span>` : ''}
      </div>
    </div>
  `;

  return card;
}

/* ═══════════════════════════════════════════════════════
   FILTERING
   ═══════════════════════════════════════════════════════ */
function setCategoryFilter(category, chipEl) {
  activeCategoryFilter = category;

  // Update chip active state
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  if (chipEl) chipEl.classList.add('active');

  applyFilters();
}

function filterWardrobe() {
  applyFilters();
}

/* ═══════════════════════════════════════════════════════
   ADD CLOTHING ITEM
   ═══════════════════════════════════════════════════════ */
async function handleAddClothing(e) {
  e.preventDefault();

  const name     = document.getElementById('itemName').value.trim();
  const category = document.getElementById('itemCategory').value;
  const color    = document.getElementById('itemColor').value;
  const season   = document.getElementById('itemSeason').value;
  const occasion = document.getElementById('itemOccasion').value;
  const notes    = document.getElementById('itemNotes').value.trim();

  if (!name)     { showToast('Please enter an item name.',     'warning'); return; }
  if (!category) { showToast('Please select a category.',      'warning'); return; }
  if (!color)    { showToast('Please select a color.',         'warning'); return; }

  const imageFile = getCurrentImageFile();
  const submitBtn = document.getElementById('submitClothingBtn');

  // Set loading state
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<span class="spinner-ring" style="width:18px;height:18px;border-width:2px;"></span> Saving…`;

  try {
    const itemData = { name, category, color, season, occasion, notes };
    const newItem = await apiAddClothingItem(itemData, imageFile);

    // Add to local array and re-render
    allClothingItems.unshift(newItem);
    updateWardrobeBadge();
    updateStatsCounts();

    showToast(`"${name}" added to your wardrobe! ✓`, 'success');

    // Reset form and switch to wardrobe view
    resetAddForm();
    setTimeout(() => switchSection('wardrobe', null), 600);

  } catch (err) {
    showToast('Failed to add item: ' + err.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `<i class="fas fa-plus"></i><span class="btn-text">Add to Wardrobe</span>`;
  }
}

/* ─── RESET ADD FORM ─── */
function resetAddForm() {
  document.getElementById('addClothingForm').reset();
  clearImage();
  updateColorDot();
}

/* ═══════════════════════════════════════════════════════
   DELETE CLOTHING ITEM
   ═══════════════════════════════════════════════════════ */
function initiateDelete(itemId) {
  pendingDeleteId = itemId;
  document.getElementById('deleteModal').classList.remove('hidden');
}

async function confirmDelete() {
  if (!pendingDeleteId) return;

  const deleteBtn = document.getElementById('confirmDeleteBtn');
  deleteBtn.disabled = true;
  deleteBtn.innerHTML = `<span class="spinner-ring" style="width:16px;height:16px;border-width:2px;"></span>`;

  try {
    await apiDeleteClothingItem(pendingDeleteId);

    // Remove from local array
    allClothingItems = allClothingItems.filter(i => i._id !== pendingDeleteId);
    updateWardrobeBadge();
    updateStatsCounts();
    renderWardrobe();

    closeDeleteModal();
    closeItemModal();
    showToast('Item removed from wardrobe.', 'success');

  } catch (err) {
    showToast('Failed to delete: ' + err.message, 'error');
  } finally {
    deleteBtn.disabled = false;
    deleteBtn.innerHTML = `<i class="fas fa-trash"></i> Delete`;
    pendingDeleteId = null;
  }
}

function closeDeleteModal(e) {
  if (e && e.target !== document.getElementById('deleteModal')) return;
  document.getElementById('deleteModal').classList.add('hidden');
  pendingDeleteId = null;
}

/* ═══════════════════════════════════════════════════════
   ITEM DETAIL MODAL
   ═══════════════════════════════════════════════════════ */
function openItemModal(item) {
  const modal   = document.getElementById('itemModal');
  const content = document.getElementById('modalContent');
  const imageUrl = item.imageUrl ? getImageUrl(item.imageUrl) : null;
  const colorVal = getColorValue(item.color);
  const emoji    = getCategoryEmoji(item.category);

  content.innerHTML = `
    ${imageUrl
      ? `<img class="modal-item-image" src="${imageUrl}" alt="${escapeHtml(item.name)}"
             onerror="this.outerHTML='<div class=\\"modal-item-no-image\\">${emoji}</div>'" />`
      : `<div class="modal-item-no-image" style="background:${colorVal}22;">${emoji}</div>`
    }
    <div class="modal-body">
      <h2 class="modal-item-name">${escapeHtml(item.name)}</h2>
      <div class="modal-tags">
        <span class="modal-tag category">
          <i class="fas fa-tag"></i> ${capitalise(item.category)}
        </span>
        <span class="modal-tag color">
          <span class="card-color-badge" style="background:${colorVal};width:14px;height:14px;border:1px solid #ccc;display:inline-block;border-radius:50%;"></span>
          ${capitalise(item.color)}
        </span>
        ${item.season
          ? `<span class="modal-tag season"><i class="fas fa-cloud-sun"></i> ${capitalise(item.season)}</span>`
          : ''
        }
        ${item.occasion
          ? `<span class="modal-tag occasion"><i class="fas fa-star"></i> ${capitalise(item.occasion)}</span>`
          : ''
        }
      </div>
      ${item.notes
        ? `<div class="modal-notes"><i class="fas fa-sticky-note" style="color:var(--brand-primary);margin-right:6px;"></i>${escapeHtml(item.notes)}</div>`
        : ''
      }
      <div class="modal-actions">
        <button class="btn btn-outline" onclick="closeItemModal()">
          <i class="fas fa-times"></i> Close
        </button>
        <button class="btn btn-danger" onclick="initiateDelete('${item._id}');closeItemModal();">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeItemModal(e) {
  if (e && e.target !== document.getElementById('itemModal')) return;
  document.getElementById('itemModal').classList.add('hidden');
}

/* ═══════════════════════════════════════════════════════
   UTILITY
   ═══════════════════════════════════════════════════════ */
function updateWardrobeBadge() {
  document.getElementById('wardrobeBadge').textContent = allClothingItems.length;
}

function updateStatsCounts() {
  // Trigger stats refresh if stats section is visible
  if (typeof renderStats === 'function') {
    renderStats(allClothingItems);
  }
}

function showGridSkeleton(show) {
  document.getElementById('gridSkeleton').classList.toggle('hidden', !show);
  document.getElementById('clothingGrid').classList.toggle('hidden', show);
}

function resetWardrobeState() {
  allClothingItems = [];
  filteredItems    = [];
  activeCategoryFilter = 'all';
  document.getElementById('clothingGrid').innerHTML = '';
  document.getElementById('wardrobeBadge').textContent = '0';
}

/* ─── ESCAPE HTML ─── */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─── CAPITALISE FIRST LETTER ─── */
function capitalise(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
