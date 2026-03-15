/**
 * ═══════════════════════════════════════════════════════
 * VESTRA – Outfit Suggestions Module (outfits.js)
 * Smart outfit generation using wardrobe items.
 * Logic: combines tops + bottoms/shoes + optional layers.
 * ═══════════════════════════════════════════════════════
 */

/* ─── CATEGORY GROUPINGS ─── */
const TOP_CATEGORIES    = ['shirt', 'sweater'];
const BOTTOM_CATEGORIES = ['pants', 'dress'];
const LAYER_CATEGORIES  = ['jacket'];
const SHOE_CATEGORIES   = ['shoes'];
const ACC_CATEGORIES    = ['accessory'];

/* ─── COLOR HARMONY PAIRS ─── */
// Colors that tend to look good together
const HARMONY = {
  black:      ['white', 'gray', 'red', 'blue', 'green', 'yellow', 'pink', 'beige', 'multicolor'],
  white:      ['black', 'gray', 'blue', 'red', 'pink', 'green', 'beige', 'multicolor'],
  gray:       ['black', 'white', 'blue', 'red', 'yellow', 'pink'],
  blue:       ['white', 'gray', 'black', 'beige', 'brown'],
  red:        ['black', 'white', 'gray', 'beige'],
  green:      ['black', 'white', 'beige', 'brown'],
  yellow:     ['black', 'white', 'gray', 'blue'],
  pink:       ['black', 'white', 'gray', 'beige'],
  purple:     ['black', 'white', 'gray', 'beige'],
  brown:      ['beige', 'white', 'green', 'blue'],
  orange:     ['black', 'white', 'gray', 'brown'],
  beige:      ['black', 'white', 'brown', 'blue', 'green'],
  multicolor: ['black', 'white', 'gray'],
};

/* ═══════════════════════════════════════════════════════
   GENERATE OUTFITS
   ═══════════════════════════════════════════════════════ */
function generateOutfits() {
  const occasionFilter = document.getElementById('outfitOccasion').value;
  const seasonFilter   = document.getElementById('outfitSeason').value;
  const resultsDiv     = document.getElementById('outfitResults');
  const emptyDiv       = document.getElementById('emptyOutfits');

  // Use the global wardrobe state
  let items = [...allClothingItems];

  // Apply filters
  if (occasionFilter) {
    items = items.filter(i => !i.occasion || i.occasion === occasionFilter);
  }
  if (seasonFilter) {
    items = items.filter(i => !i.season || i.season === 'all' || i.season === seasonFilter);
  }

  if (items.length < 2) {
    resultsDiv.innerHTML = '';
    emptyDiv.classList.remove('hidden');
    return;
  }

  emptyDiv.classList.add('hidden');

  // Categorise items
  const tops     = items.filter(i => TOP_CATEGORIES.includes(i.category));
  const bottoms  = items.filter(i => BOTTOM_CATEGORIES.includes(i.category));
  const layers   = items.filter(i => LAYER_CATEGORIES.includes(i.category));
  const shoes    = items.filter(i => SHOE_CATEGORIES.includes(i.category));
  const accs     = items.filter(i => ACC_CATEGORIES.includes(i.category));

  const outfits = [];

  // ─── Strategy 1: Top + Bottom (+ optional layer) ───
  if (tops.length > 0 && bottoms.length > 0) {
    const maxCombos = Math.min(tops.length * bottoms.length, 6);
    let count = 0;

    for (const top of shuffle(tops)) {
      for (const bottom of shuffle(bottoms)) {
        if (count >= maxCombos) break;

        const outfit = {
          items: [top, bottom],
          score: scoreOutfit([top, bottom]),
          occasion: guessOccasion([top, bottom]),
          season:   guessSeason([top, bottom]),
        };

        // Add a layer if available and appropriate
        const matchLayer = layers.find(l => colorsHarmony(l.color, top.color));
        if (matchLayer) outfit.items.push(matchLayer);

        // Add shoes if available
        const matchShoe = shoes.find(s => colorsHarmony(s.color, bottom.color));
        if (matchShoe) outfit.items.push(matchShoe);

        // Add accessory
        if (accs.length > 0) outfit.items.push(accs[0]);

        outfits.push(outfit);
        count++;
      }
      if (count >= maxCombos) break;
    }
  }

  // ─── Strategy 2: Just tops + shoes (for items-light wardrobes) ───
  if (outfits.length === 0 && tops.length > 0 && shoes.length > 0) {
    shuffle(tops).slice(0, 3).forEach(top => {
      shuffle(shoes).slice(0, 2).forEach(shoe => {
        outfits.push({
          items: [top, shoe],
          score: scoreOutfit([top, shoe]),
          occasion: guessOccasion([top, shoe]),
          season:   guessSeason([top, shoe]),
        });
      });
    });
  }

  // ─── Strategy 3: Any random combos when wardrobe is small ───
  if (outfits.length === 0 && items.length >= 2) {
    const shuffled = shuffle(items);
    for (let i = 0; i < Math.min(shuffled.length - 1, 4); i++) {
      outfits.push({
        items: [shuffled[i], shuffled[i + 1]],
        score: scoreOutfit([shuffled[i], shuffled[i + 1]]),
        occasion: guessOccasion([shuffled[i], shuffled[i + 1]]),
        season:   guessSeason([shuffled[i], shuffled[i + 1]]),
      });
    }
  }

  if (outfits.length === 0) {
    resultsDiv.innerHTML = '';
    emptyDiv.classList.remove('hidden');
    return;
  }

  // Sort by score descending
  outfits.sort((a, b) => b.score - a.score);

  // Render outfit cards
  resultsDiv.innerHTML = '';
  outfits.slice(0, 6).forEach((outfit, idx) => {
    resultsDiv.appendChild(createOutfitCard(outfit, idx + 1));
  });
}

/* ═══════════════════════════════════════════════════════
   CREATE OUTFIT CARD
   ═══════════════════════════════════════════════════════ */
function createOutfitCard(outfit, num) {
  const card = document.createElement('div');
  card.className = 'outfit-card';
  card.style.animationDelay = `${(num - 1) * 0.08}s`;

  const scorePercent = outfit.score;
  const scoreLabel   = scorePercent >= 80 ? '🔥 Perfect Match'
                     : scorePercent >= 60 ? '✨ Great Look'
                     : scorePercent >= 40 ? '👍 Good Combo'
                     : '💡 Try It';

  const itemsHtml = outfit.items.slice(0, 4).map(item => {
    const imgUrl   = item.imageUrl ? getImageUrl(item.imageUrl) : null;
    const emoji    = getCategoryEmoji(item.category);
    const colorVal = getColorValue(item.color);

    return `
      <div class="outfit-item-mini">
        ${imgUrl
          ? `<img class="outfit-item-img" src="${imgUrl}" alt="${escapeHtml(item.name)}"
                 onerror="this.outerHTML='<div class=\\"outfit-item-placeholder\\" style=\\"background:${colorVal}22;\\">${emoji}</div>'">`
          : `<div class="outfit-item-placeholder" style="background:${colorVal}22;">${emoji}</div>`
        }
        <span class="outfit-item-label">${escapeHtml(item.name).slice(0, 12)}${item.name.length > 12 ? '…' : ''}</span>
      </div>
    `;
  }).join('');

  card.innerHTML = `
    <div class="outfit-header">
      <div class="outfit-title">
        <i class="fas fa-tshirt"></i> Outfit #${num}
      </div>
      <span class="outfit-score">${scorePercent}%</span>
    </div>
    <div class="outfit-items">${itemsHtml}</div>
    <div class="outfit-tags">
      <span class="outfit-tag score">${scoreLabel}</span>
      ${outfit.occasion ? `<span class="outfit-tag occasion">
        <i class="fas fa-star"></i> ${capitalise(outfit.occasion)}
      </span>` : ''}
      ${outfit.season && outfit.season !== 'all' ? `<span class="outfit-tag season">
        <i class="fas fa-cloud-sun"></i> ${capitalise(outfit.season)}
      </span>` : ''}
    </div>
  `;

  return card;
}

/* ═══════════════════════════════════════════════════════
   SCORING & LOGIC HELPERS
   ═══════════════════════════════════════════════════════ */

/** Score an outfit 0–100 based on color harmony */
function scoreOutfit(items) {
  if (items.length < 2) return 50;

  let harmonicPairs = 0;
  let totalPairs    = 0;

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      totalPairs++;
      if (colorsHarmony(items[i].color, items[j].color)) harmonicPairs++;
    }
  }

  const base = totalPairs > 0 ? (harmonicPairs / totalPairs) * 70 : 40;

  // Bonus for outfit completeness
  const categories = items.map(i => i.category);
  let bonus = 0;
  if (categories.some(c => TOP_CATEGORIES.includes(c)) &&
      categories.some(c => BOTTOM_CATEGORIES.includes(c))) bonus += 20;
  if (categories.some(c => SHOE_CATEGORIES.includes(c))) bonus += 10;

  return Math.min(100, Math.round(base + bonus));
}

/** Check if two colors are considered harmonious */
function colorsHarmony(colorA, colorB) {
  if (!colorA || !colorB) return true;
  if (colorA === colorB) return true; // Monochromatic
  const harmonics = HARMONY[colorA] || [];
  return harmonics.includes(colorB);
}

/** Infer best occasion from item occasions */
function guessOccasion(items) {
  const occasions = items
    .map(i => i.occasion)
    .filter(Boolean);
  if (occasions.length === 0) return 'casual';
  // Pick most common
  const freq = {};
  occasions.forEach(o => { freq[o] = (freq[o] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

/** Infer season from item seasons */
function guessSeason(items) {
  const seasons = items
    .map(i => i.season)
    .filter(s => s && s !== 'all');
  if (seasons.length === 0) return 'all';
  const freq = {};
  seasons.forEach(s => { freq[s] = (freq[s] || 0) + 1; });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
}

/** Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
