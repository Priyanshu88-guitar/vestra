/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – Statistics Module (stats.js)
 * Renders KPI cards and bar/color charts from wardrobe data.
 * Pure client-side — no external chart library required.
 * ═══════════════════════════════════════════════════════
 */

/* ═══════════════════════════════════════════════════════
   MAIN ENTRY POINT
   ═══════════════════════════════════════════════════════ */
function renderStats(items) {
  if (!items || items.length === 0) {
    renderEmptyStats();
    return;
  }

  // Compute KPIs
  const totalItems    = items.length;
  const categories    = new Set(items.map(i => i.category)).size;
  const colors        = new Set(items.map(i => i.color)).size;
  const possibleOutfits = computePossibleOutfits(items);

  // Update KPI cards
  animateCounter('kpiTotal',      totalItems);
  animateCounter('kpiCategories', categories);
  animateCounter('kpiColors',     colors);
  animateCounter('kpiOutfits',    possibleOutfits);

  // Render charts
  renderBarChart('categoryChart', countBy(items, 'category'), CATEGORY_COLORS);
  renderColorSwatches('colorChart', countBy(items, 'color'));
  renderBarChart('seasonChart',   countBy(items, 'season'),   SEASON_COLORS);
  renderBarChart('occasionChart', countBy(items, 'occasion'), OCCASION_COLORS);
}

/* ─── EMPTY STATE ─── */
function renderEmptyStats() {
  animateCounter('kpiTotal', 0);
  animateCounter('kpiCategories', 0);
  animateCounter('kpiColors', 0);
  animateCounter('kpiOutfits', 0);
  ['categoryChart', 'colorChart', 'seasonChart', 'occasionChart'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<p style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:16px;">No data yet</p>`;
  });
}

/* ═══════════════════════════════════════════════════════
   COMPUTE POSSIBLE OUTFITS
   ═══════════════════════════════════════════════════════ */
function computePossibleOutfits(items) {
  const tops    = items.filter(i => ['shirt', 'sweater'].includes(i.category)).length;
  const bottoms = items.filter(i => ['pants', 'dress'].includes(i.category)).length;
  const shoes   = items.filter(i => i.category === 'shoes').length;

  if (tops > 0 && bottoms > 0) {
    return tops * bottoms * Math.max(shoes, 1);
  }
  return Math.max(0, items.length - 1);
}

/* ═══════════════════════════════════════════════════════
   COUNT BY FIELD
   ═══════════════════════════════════════════════════════ */
function countBy(items, field) {
  const counts = {};
  items.forEach(item => {
    const val = item[field] || 'unknown';
    counts[val] = (counts[val] || 0) + 1;
  });
  // Sort by count descending
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .reduce((obj, [k, v]) => { obj[k] = v; return obj; }, {});
}

/* ═══════════════════════════════════════════════════════
   BAR CHART RENDERER
   ═══════════════════════════════════════════════════════ */
function renderBarChart(containerId, counts, colorMap = {}) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const entries = Object.entries(counts);
  if (entries.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:16px;">No data</p>`;
    return;
  }

  const max = Math.max(...entries.map(([, v]) => v));

  container.innerHTML = entries.map(([label, count]) => {
    const pct     = max > 0 ? Math.round((count / max) * 100) : 0;
    const barColor = colorMap[label] || 'var(--grad-primary)';

    return `
      <div class="bar-row">
        <span class="bar-label" title="${label}">${capitalise(label)}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:0%; background:${barColor};"
               data-target="${pct}"></div>
        </div>
        <span class="bar-count">${count}</span>
      </div>
    `;
  }).join('');

  // Animate bars in on next frame
  requestAnimationFrame(() => {
    container.querySelectorAll('.bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  });
}

/* ═══════════════════════════════════════════════════════
   COLOR SWATCHES RENDERER
   ═══════════════════════════════════════════════════════ */
function renderColorSwatches(containerId, counts) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const entries = Object.entries(counts);
  if (entries.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);font-size:0.8rem;text-align:center;padding:16px;">No data</p>`;
    return;
  }

  container.innerHTML = entries.map(([colorName, count]) => {
    const colorVal = getColorValue(colorName);
    const isGradient = colorVal.startsWith('linear-gradient');

    return `
      <div class="color-swatch">
        <div class="swatch-circle"
             style="${isGradient ? 'background:' + colorVal : 'background:' + colorVal}"
             title="${colorName}">
        </div>
        <span class="swatch-label">${capitalise(colorName)}</span>
        <span class="swatch-count">${count}</span>
      </div>
    `;
  }).join('');
}

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNTER
   ═══════════════════════════════════════════════════════ */
function animateCounter(elementId, targetValue) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const start = parseInt(el.textContent) || 0;
  const duration = 600;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed  = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(start + (targetValue - start) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/* ═══════════════════════════════════════════════════════
   COLOR MAPS FOR CHARTS
   ═══════════════════════════════════════════════════════ */
const CATEGORY_COLORS = {
  shirt:     '#6C63FF',
  pants:     '#3B82F6',
  jacket:    '#8B5CF6',
  dress:     '#EC4899',
  shoes:     '#F59E0B',
  sweater:   '#10B981',
  accessory: '#FF6B6B',
  other:     '#9CA3AF',
};

const SEASON_COLORS = {
  spring: '#10B981',
  summer: '#F59E0B',
  autumn: '#F97316',
  winter: '#3B82F6',
  all:    '#9CA3AF',
};

const OCCASION_COLORS = {
  casual: '#6C63FF',
  formal: '#1A1A2E',
  sport:  '#10B981',
  party:  '#EC4899',
  work:   '#3B82F6',
  beach:  '#F59E0B',
};
