// UI rendering helpers
import { loadInventory, updateInventory, clearInventory } from '../inventory.js';
import { loadFavourites, toggleFavourite } from '../favourites.js';
import { getCraftableItems } from '../crafting.js';
import { loadSettings, saveSettings } from '../storage.js';
import { applyTheme } from './theme.js';
import { debounce } from './utils.js';

let cachedMaterials = [];
let cachedItems = [];
let cachedVersion = '';
let currentView = 'craftable';
let currentFilters = {
  type: 'all',
  expansion: 'all',
  size: 'all',
  relic: 'all',
  sort: 'name'
};
let searchQuery = '';
let shellControlsBound = false;
const debouncedSearch = debounce((value) => {
  searchQuery = value;
  setCurrentView(currentView);
}, 300);

const rarityOrder = { Common: 1, Uncommon: 2, Rare: 3 };

// Rarity color classes for Tailwind
const rarityColors = {
  Common: { bg: 'bg-rarity-common', text: 'text-rarity-common', shadow: 'shadow-[0_0_8px_rgba(34,197,94,0.8)]' },
  Uncommon: { bg: 'bg-rarity-uncommon', text: 'text-rarity-uncommon', shadow: 'shadow-[0_0_8px_rgba(234,179,8,0.8)]' },
  Rare: { bg: 'bg-rarity-rare', text: 'text-rarity-rare', shadow: 'shadow-[0_0_8px_rgba(59,130,246,0.8)]' },
  '*': { bg: 'bg-purple-500', text: 'text-purple-400', shadow: 'shadow-[0_0_8px_rgba(168,85,247,0.8)]' } // Special rarity
};

function calculateItemRarity(item) {
  let current = 'Common';
  Object.entries(item.resources).forEach(([sym]) => {
    if (sym === 'icon') return;
    const mat = cachedMaterials.find(m => m.symbol === sym);
    if (mat && rarityOrder[mat.rarity] > rarityOrder[current]) {
      current = mat.rarity;
    }
  });
  return current;
}

function calculateBuildCost(item, inventory) {
  let total = item.price || 0;
  Object.entries(item.resources).forEach(([sym, qty]) => {
    if (sym === 'icon') return;
    const have = inventory[sym] || 0;
    if (have < qty) {
      const mat = cachedMaterials.find(m => m.symbol === sym);
      if (mat) {
        total += (qty - have) * mat.base_cost;
      }
    }
  });
  return total;
}

function isItemCraftable(item, inventory) {
  return Object.entries(item.resources)
    .filter(([sym]) => sym !== 'icon')
    .every(([sym, qty]) => (inventory[sym] ?? 0) >= qty);
}

function getMissingSummary(item, inventory) {
  const resourcesNeeded = Object.entries(item.resources).filter(([sym]) => sym !== 'icon');
  const missing = [];
  let missingTotal = 0;
  let metResources = 0;

  resourcesNeeded.forEach(([sym, qty]) => {
    const have = inventory[sym] || 0;
    if (have < qty) {
      missing.push({ sym, need: qty - have });
      missingTotal += qty - have;
    } else {
      metResources += 1;
    }
  });

  return { missing, missingTotal, metResources, totalResources: resourcesNeeded.length };
}

function matchesFilters(item) {
  // Search filter
  if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
    return false;
  }
  if (currentFilters.type !== 'all' && item.type !== currentFilters.type) return false;
  if (currentFilters.expansion !== 'all' && item.expansion !== currentFilters.expansion) return false;
  if (currentFilters.size !== 'all' && item.size !== currentFilters.size) return false;
  if (currentFilters.relic === 'requires' && item.relic <= 0) return false;
  if (currentFilters.relic === 'none' && item.relic > 0) return false;
  return true;
}

function sortItems(items) {
  const rarityRank = { Rare: 3, Uncommon: 2, Common: 1 };
  switch (currentFilters.sort) {
    case 'rarity':
      return [...items].sort((a, b) => rarityRank[calculateItemRarity(b)] - rarityRank[calculateItemRarity(a)] || a.name.localeCompare(b.name));
    case 'price':
      return [...items].sort((a, b) => (a.price || 0) - (b.price || 0) || a.name.localeCompare(b.name));
    default:
      return [...items].sort((a, b) => a.name.localeCompare(b.name));
  }
}

function filterAndSortItems(items) {
  return sortItems(items.filter(matchesFilters));
}

function getMaterialMeta(symbol) {
  return cachedMaterials.find(material => material.symbol === symbol) || null;
}

function showItemArtFallback(icon) {
  if (!(icon instanceof HTMLImageElement) || icon.dataset.broken === 'true') {
    return;
  }

  icon.dataset.broken = 'true';
  icon.classList.add('hidden');

  const fallback = icon.parentElement?.querySelector('[data-missing-art]');
  if (fallback) {
    fallback.classList.remove('hidden');
    fallback.classList.add('flex');
  }
}

function openItemDetailModal(item, inventory) {
  const existingModal = document.querySelector('[data-item-detail-modal]');
  if (existingModal) {
    existingModal.remove();
  }

  const rarity = calculateItemRarity(item);
  const rarityColor = rarityColors[rarity] || rarityColors.Common;
  const isCraftable = isItemCraftable(item, inventory);
  const buildCost = calculateBuildCost(item, inventory);
  const { missing, missingTotal, metResources, totalResources } = getMissingSummary(item, inventory);
  const iconPath = `images/tokens/${item.resources.icon}`;
  const recipeRows = Object.entries(item.resources)
    .filter(([sym]) => sym !== 'icon')
    .map(([sym, qty]) => {
      const material = getMaterialMeta(sym);
      const materialRarity = material ? material.rarity : 'Common';
      const materialColor = rarityColors[materialRarity] || rarityColors.Common;
      const have = inventory[sym] || 0;
      const missingQty = Math.max(qty - have, 0);
      const statusClasses = missingQty > 0
        ? 'border-red-700/50 bg-red-950/20'
        : 'border-emerald-700/40 bg-emerald-950/20';
      const statusText = missingQty > 0
        ? `<span class="text-xs font-semibold uppercase tracking-wider text-red-300">Missing ${missingQty}</span>`
        : '<span class="text-xs font-semibold uppercase tracking-wider text-emerald-300">Ready</span>';

      return `
        <div class="flex items-center gap-3 rounded-2xl border ${statusClasses} p-3">
          <div class="size-10 shrink-0 rounded-full ${materialColor.bg} ${materialColor.shadow} flex items-center justify-center text-sm font-bold text-white">${sym}</div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-bold text-white">${material ? material.name : sym}</p>
            <p class="text-xs text-[#9db9a8]">${material ? `${material.rarity} • ${material.base_cost}g base cost` : 'Unknown material'}${material?.notes ? ` • ${material.notes}` : ''}</p>
          </div>
          <div class="text-right">
            <p class="text-sm font-bold text-white">${have}/${qty}</p>
            ${statusText}
          </div>
        </div>
      `;
    })
    .join('');

  const modal = document.createElement('div');
  modal.dataset.itemDetailModal = 'true';
  modal.className = 'fixed inset-0 z-50 bg-black/80 p-4 backdrop-blur-sm md:p-8';
  modal.innerHTML = `
    <div class="mx-auto flex h-full max-w-5xl items-center justify-center">
      <div role="dialog" aria-modal="true" aria-label="${item.name} details" class="relative max-h-[90vh] w-full overflow-hidden rounded-[28px] border border-[#2f4b3b] bg-[#0d1912] shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
        <button data-close-detail-modal class="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white transition-colors hover:border-primary/50 hover:text-primary" aria-label="Close item details">
          <span class="material-symbols-outlined">close</span>
        </button>

        <div class="grid max-h-[90vh] grid-cols-1 overflow-y-auto md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
          <div class="border-b border-[#1f3127] bg-gradient-to-br from-[#112117] via-[#0f1d15] to-black/70 p-5 md:border-b-0 md:border-r">
            <div class="mb-4 flex items-center justify-between">
              <span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-amber-100">
                <span class="size-2 rounded-full ${rarityColor.bg} ${rarityColor.shadow}"></span>
                ${rarity}
              </span>
              <span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${isCraftable ? 'bg-primary text-[#0c1a12]' : 'bg-red-950/40 text-red-200 border border-red-700/50'}">
                ${isCraftable ? 'Ready to Craft' : `Missing ${missingTotal}`}
              </span>
            </div>

            <div class="relative overflow-hidden rounded-[24px] border border-white/10 bg-black">
              <div class="aspect-[4/3] w-full">
                <div class="absolute inset-0 flex items-center justify-center p-6">
                  <img src="${iconPath}" alt="${item.name}" class="item-icon max-h-full max-w-full object-contain" data-detail-item-icon="true">
                  <div data-missing-art class="hidden absolute inset-5 rounded-[20px] border border-dashed border-amber-300/40 bg-gradient-to-br from-[#162e21] via-[#13251a] to-black/70 items-center justify-center p-4 text-center">
                    <div class="flex flex-col items-center gap-2">
                      <span class="material-symbols-outlined text-amber-300" style="font-size: 38px;">image_not_supported</span>
                      <span class="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-100">Art Pending</span>
                      <span class="text-sm font-semibold text-[#d5dfd8]">${item.name}</span>
                    </div>
                  </div>
                </div>
                <div class="absolute inset-0 bg-gradient-to-t from-[#0d1912] via-transparent to-transparent opacity-80"></div>
              </div>
            </div>

            <div class="mt-4 grid grid-cols-2 gap-3">
              <div class="rounded-2xl border border-white/5 bg-black/20 p-3">
                <p class="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9db9a8]">Market Price</p>
                <p class="mt-1 text-2xl font-bold text-white">${item.price || 0}g</p>
              </div>
              <div class="rounded-2xl border border-white/5 bg-black/20 p-3">
                <p class="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9db9a8]">Buy Missing</p>
                <p class="mt-1 text-2xl font-bold text-white">${buildCost}g</p>
              </div>
            </div>
          </div>

          <div class="p-5 md:p-6">
            <div class="mb-5">
              <p class="mb-2 text-sm font-semibold uppercase tracking-[0.28em] text-primary">Item Details</p>
              <div class="flex flex-wrap items-start gap-3">
                <div class="min-w-0 flex-1">
                  <h3 class="text-3xl font-bold tracking-tight text-white">${item.name}</h3>
                  <div class="mt-3 flex flex-wrap gap-2">
                    <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">${item.type || 'Unknown Type'}</span>
                    ${item.size ? `<span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">Size ${item.size}</span>` : ''}
                    <span class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white">${item.expansion || 'Base Game'}</span>
                    ${item.relic > 0 ? `<span class="rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200">Relic ${item.relic}</span>` : ''}
                  </div>
                </div>
                <div class="rounded-2xl border border-white/5 bg-black/20 px-4 py-3 text-right">
                  <p class="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9db9a8]">Coverage</p>
                  <p class="mt-1 text-2xl font-bold text-white">${metResources}/${totalResources}</p>
                </div>
              </div>
            </div>

            <div class="mb-5 rounded-[24px] border border-white/5 bg-black/20 p-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <h4 class="text-lg font-bold text-white">Crafting Recipe</h4>
                <span class="text-xs font-semibold uppercase tracking-[0.24em] text-[#9db9a8]">${totalResources} material${totalResources === 1 ? '' : 's'}</span>
              </div>
              <div class="space-y-3">
                ${recipeRows}
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-[24px] border border-white/5 bg-black/20 p-4">
                <h4 class="mb-3 text-lg font-bold text-white">Status</h4>
                <p class="text-sm leading-relaxed text-[#d5dfd8]">
                  ${isCraftable
                    ? 'Your current inventory covers every required material. This item can be crafted immediately.'
                    : `You are short ${missingTotal} material${missingTotal === 1 ? '' : 's'} across ${missing.length} requirement${missing.length === 1 ? '' : 's'}.`}
                </p>
              </div>
              <div class="rounded-[24px] border border-white/5 bg-black/20 p-4">
                <h4 class="mb-3 text-lg font-bold text-white">Quick Summary</h4>
                <div class="space-y-2 text-sm text-[#d5dfd8]">
                  <p><span class="font-semibold text-white">Expansion:</span> ${item.expansion || 'Base Game'}</p>
                  <p><span class="font-semibold text-white">Inventory-adjusted cost:</span> ${buildCost}g</p>
                  <p><span class="font-semibold text-white">Material rarity:</span> ${rarity}</p>
                  <p><span class="font-semibold text-white">Relic requirement:</span> ${item.relic > 0 ? `${item.relic}` : 'None'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => {
    document.removeEventListener('keydown', handleEscape);
    modal.remove();
  };

  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      closeModal();
    }
  };

  modal.addEventListener('click', (event) => {
    if (event.target === modal || event.target.closest('[data-close-detail-modal]')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', handleEscape);
  document.body.appendChild(modal);

  const detailIcon = modal.querySelector('[data-detail-item-icon]');
  if (detailIcon instanceof HTMLImageElement) {
    const handleMissingArt = () => showItemArtFallback(detailIcon);
    detailIcon.addEventListener('error', handleMissingArt, { once: true });
    if (detailIcon.complete && detailIcon.naturalWidth === 0) {
      handleMissingArt();
    }
  }

  modal.querySelector('[data-close-detail-modal]')?.focus();
}

function bindPersistentShellControls() {
  if (shellControlsBound) {
    return;
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  }

  const settingsBtn = document.getElementById('settingsSidebarBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      renderSettings();
    });
  }

  shellControlsBound = true;
}

// Build the new item card design
function buildItemCard(item, index, inventory, favourites, viewContext) {
  const starred = favourites.includes(item.name);
  const iconPath = `images/tokens/${item.resources.icon}`;
  const rarity = calculateItemRarity(item);
  const rarityColor = rarityColors[rarity] || rarityColors.Common;
  const isCraftable = isItemCraftable(item, inventory);
  const { missing } = getMissingSummary(item, inventory);
  const buildCost = calculateBuildCost(item, inventory);

  // Build resource dots
  const resourcesNeeded = Object.entries(item.resources).filter(([sym]) => sym !== 'icon');
  const resourceDots = resourcesNeeded.map(([sym, qty]) => {
    const mat = cachedMaterials.find(m => m.symbol === sym);
    const matRarity = mat ? mat.rarity : 'Common';
    const dotColor = rarityColors[matRarity] || rarityColors.Common;
    const have = inventory[sym] || 0;
    const isMissing = have < qty;
    return `
      <div class="flex items-center gap-1 px-2 py-1 rounded-full ${isMissing ? 'bg-red-900/30' : 'bg-white/5'}" title="${mat ? mat.name : sym}: ${have}/${qty}">
        <span class="size-5 rounded-full ${dotColor.bg} ${isMissing ? 'opacity-60' : dotColor.shadow} flex items-center justify-center text-[10px] font-bold text-white">${sym}</span>
        <span class="text-xs ${isMissing ? 'text-red-400' : 'text-white'} font-medium">x${qty}</span>
      </div>
    `;
  }).join('');

  const craftableClass = isCraftable ? 'ring-2 ring-primary/50' : '';
  const notCraftableClass = !isCraftable && viewContext === 'craftable' && starred ? 'opacity-70' : '';

  return `
    <div class="group relative bg-surface-dark rounded-[24px] p-3 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(19,236,109,0.2)] transition-all duration-300 border border-transparent hover:border-primary/50 cursor-pointer overflow-hidden ${craftableClass} ${notCraftableClass}" 
         style="animation: fadeIn 0.4s ease-out forwards; animation-delay: ${index * 50}ms; opacity: 0;"
         data-item="${item.name}"
         role="button"
         tabindex="0"
         aria-label="View details for ${item.name}">
      
      <!-- Favourite Toggle -->
      <button data-fav="${item.name}" data-view="${viewContext}" 
        class="absolute top-5 left-5 z-20 size-8 rounded-full ${starred ? 'bg-primary text-[#0c1a12]' : 'bg-black/40 text-[#9db9a8]'} flex items-center justify-center hover:scale-110 transition-all backdrop-blur-sm"
        aria-label="${starred ? 'Unstar' : 'Star'} ${item.name}">
        <span class="material-symbols-outlined" style="font-size: 18px;">${starred ? 'star' : 'star_border'}</span>
      </button>
      
      <!-- Image Container -->
      <div class="aspect-[4/3] w-full rounded-2xl bg-black relative overflow-hidden">
        <!-- Rarity Badge -->
        <div class="absolute top-3 right-3 z-10 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
          <div class="size-2 rounded-full ${rarityColor.bg} ${rarityColor.shadow}"></div>
          <span class="text-[10px] font-bold text-white uppercase">${rarity}</span>
        </div>
        
        <!-- Item Icon -->
        <div class="absolute inset-0 flex items-center justify-center p-4">
          <img src="${iconPath}" alt="${item.name}" class="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 item-icon">
          <div data-missing-art class="hidden absolute inset-4 rounded-2xl border border-dashed border-amber-300/40 bg-gradient-to-br from-[#162e21] via-[#13251a] to-black/70 items-center justify-center p-4 text-center">
            <div class="flex flex-col items-center gap-2">
              <span class="material-symbols-outlined text-amber-300" style="font-size: 32px;">image_not_supported</span>
              <span class="text-[11px] font-bold uppercase tracking-[0.3em] text-amber-100">Art Pending</span>
              <span class="text-xs font-medium text-[#d5dfd8] leading-relaxed">${item.name}</span>
            </div>
          </div>
        </div>
        
        <!-- Gradient overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent opacity-80"></div>
        
        ${!isCraftable && missing.length > 0 ? `
          <div class="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2 py-1 text-center">
            <span class="text-xs text-red-400 font-medium">Missing ${missing.length} material${missing.length > 1 ? 's' : ''}</span>
          </div>
        ` : ''}
      </div>
      
      <!-- Content -->
      <div class="px-2 pt-4 pb-2">
        <h3 class="text-white text-lg font-bold mb-1 group-hover:text-primary transition-colors truncate">${item.name}</h3>
        <p class="text-[#9db9a8] text-xs font-medium mb-3">
          ${item.type || ''} ${item.size ? `• ${item.size}` : ''} ${item.relic > 0 ? '• Relic' : ''}
        </p>
        
        <!-- Cost & Requirements -->
        <div class="flex items-center justify-between pt-3 border-t border-white/5">
          <div class="flex items-center gap-2 flex-wrap">
            ${resourceDots}
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs ${isCraftable ? 'text-primary' : 'text-[#9db9a8]'} font-bold">${buildCost}g</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Render materials list in sidebar
let materialsListController = null; // Track listener for cleanup

function renderMaterialsList(materials, inventory) {
  const listContainer = document.getElementById('materialsList');
  if (!listContainer) return;

  // Remove previous listener to prevent memory leak
  if (materialsListController) {
    materialsListController.abort();
  }
  materialsListController = new AbortController();

  const getStateClass = (count) => {
    if (count === 0) return { bg: 'bg-red-900/30', border: 'border-red-700/50', text: 'text-red-400' };
    if (count < 2) return { bg: 'bg-amber-900/20', border: 'border-amber-700/50', text: 'text-amber-400' };
    return { bg: 'bg-green-900/20', border: 'border-green-700/50', text: 'text-green-400' };
  };

  listContainer.innerHTML = materials.map(m => {
    const count = inventory[m.symbol] || 0;
    const rarityColor = rarityColors[m.rarity] || rarityColors.Common;
    const stateClass = getStateClass(count);

    return `
      <div class="flex items-center gap-2 px-3 py-2 rounded-xl ${stateClass.bg} border ${stateClass.border} transition-all hover:bg-white/5" data-material="${m.symbol}">
        <div class="size-6 rounded-full ${rarityColor.bg} ${rarityColor.shadow} flex items-center justify-center text-xs font-bold text-white">${m.symbol}</div>
        <div class="flex-1 min-w-0">
          <p class="text-white text-xs font-semibold truncate">${m.name}</p>
        </div>
        <div class="flex items-center gap-1">
          <button class="size-6 rounded-full bg-[#1a2e24] text-white hover:bg-primary hover:text-[#0c1a12] transition-colors flex items-center justify-center text-sm font-bold" 
                  data-action="dec" data-symbol="${m.symbol}" aria-label="Decrease ${m.name}">−</button>
          <span class="w-6 text-center text-sm font-bold ${stateClass.text} count">${count}</span>
          <button class="size-6 rounded-full bg-[#1a2e24] text-white hover:bg-primary hover:text-[#0c1a12] transition-colors flex items-center justify-center text-sm font-bold" 
                  data-action="inc" data-symbol="${m.symbol}" aria-label="Increase ${m.name}">+</button>
        </div>
      </div>
    `;
  }).join('');

  // Event delegation for inventory buttons with proper cleanup
  listContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const sym = btn.dataset.symbol;
    const delta = btn.dataset.action === 'inc' ? 1 : -1;
    const inv = updateInventory(sym, delta);

    // Update count display
    const countEl = listContainer.querySelector(`[data-material="${sym}"] .count`);
    if (countEl) countEl.textContent = inv[sym] || 0;

    // Update item state class
    const itemEl = listContainer.querySelector(`[data-material="${sym}"]`);
    if (itemEl) {
      const newState = getStateClass(inv[sym] || 0);
      itemEl.className = `flex items-center gap-2 px-3 py-2 rounded-xl ${newState.bg} border ${newState.border} transition-all hover:bg-white/5`;
      const countSpan = itemEl.querySelector('.count');
      if (countSpan) {
        countSpan.className = `w-6 text-center text-sm font-bold ${newState.text} count`;
      }
    }

    // Refresh items view
    if (currentView === 'all') {
      renderAllItemsView(cachedItems, inv, loadFavourites());
    } else {
      renderCraftableItemsView(cachedItems, inv, loadFavourites());
    }
  }, { signal: materialsListController.signal });
}

function renderHeaderButtons() {
  const headerNav = document.getElementById('headerNavLinks');
  if (!headerNav) return;

  headerNav.innerHTML = `
    <div class="flex items-center bg-[#1a2e24] rounded-full p-1 border border-[#28392f]">
      <button id="craftableViewBtn" class="px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${currentView === 'craftable' ? 'bg-primary text-[#0c1a12]' : 'text-[#9db9a8] hover:text-white'}" data-view="craftable">
        Ready to Craft
      </button>
      <button id="allItemsViewBtn" class="px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${currentView === 'all' ? 'bg-primary text-[#0c1a12]' : 'text-[#9db9a8] hover:text-white'}" data-view="all">
        All Items
      </button>
    </div>
  `;

  // Attach event listeners
  document.getElementById('craftableViewBtn')?.addEventListener('click', () => setCurrentView('craftable'));
  document.getElementById('allItemsViewBtn')?.addEventListener('click', () => setCurrentView('all'));
}

function setCurrentView(view) {
  currentView = view;
  renderHeaderButtons(); // Re-render to update active state

  if (view === 'all') {
    renderAllItemsView(cachedItems, loadInventory(), loadFavourites());
  } else {
    renderCraftableItemsView(cachedItems, loadInventory(), loadFavourites());
  }
}

function buildOptions(options, includeAll = true) {
  const opts = includeAll ? ['<option value="all">All</option>'] : [];
  options.forEach(opt => {
    opts.push(`<option value="${opt}">${opt}</option>`);
  });
  return opts.join('');
}

function renderItemsControls(container) {
  const types = Array.from(new Set(cachedItems.map(item => item.type).filter(Boolean))).sort();
  const expansions = Array.from(new Set(cachedItems.map(item => item.expansion).filter(Boolean))).sort();

  // Render filter chips
  const filtersHtml = `
    <div class="flex flex-wrap gap-2 mb-4">
      <button class="filter-chip ${currentFilters.type === 'all' ? 'active' : ''}" data-filter="type" data-value="all">
        <span class="material-symbols-outlined" style="font-size: 16px;">apps</span>
        All Types
      </button>
      ${types.map(t => `
        <button class="filter-chip ${currentFilters.type === t ? 'active' : ''}" data-filter="type" data-value="${t}">
          ${t}
        </button>
      `).join('')}
    </div>
    <div class="flex flex-wrap items-center gap-3 mb-6">
      <select data-filter="expansion" class="bg-[#1a2e24] text-white text-sm rounded-full px-4 py-2 border border-[#28392f] focus:border-primary focus:outline-none">
        <option value="all">All Expansions</option>
        ${expansions.map(e => `<option value="${e}" ${currentFilters.expansion === e ? 'selected' : ''}>${e}</option>`).join('')}
      </select>
      <select data-filter="relic" class="bg-[#1a2e24] text-white text-sm rounded-full px-4 py-2 border border-[#28392f] focus:border-primary focus:outline-none">
        <option value="all" ${currentFilters.relic === 'all' ? 'selected' : ''}>All Items</option>
        <option value="requires" ${currentFilters.relic === 'requires' ? 'selected' : ''}>Requires Relic</option>
        <option value="none" ${currentFilters.relic === 'none' ? 'selected' : ''}>No Relic</option>
      </select>
      <select data-filter="sort" class="bg-[#1a2e24] text-white text-sm rounded-full px-4 py-2 border border-[#28392f] focus:border-primary focus:outline-none">
        <option value="name" ${currentFilters.sort === 'name' ? 'selected' : ''}>Sort: Name</option>
        <option value="rarity" ${currentFilters.sort === 'rarity' ? 'selected' : ''}>Sort: Rarity</option>
        <option value="price" ${currentFilters.sort === 'price' ? 'selected' : ''}>Sort: Cost</option>
      </select>
    </div>
  `;

  container.innerHTML = filtersHtml;

  // Filter chip click handlers
  container.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const filter = chip.dataset.filter;
      const value = chip.dataset.value;
      currentFilters[filter] = value;
      setCurrentView(currentView);
    });
  });

  // Select change handlers
  container.querySelectorAll('select[data-filter]').forEach(select => {
    select.addEventListener('change', (e) => {
      currentFilters[e.target.dataset.filter] = e.target.value;
      setCurrentView(currentView);
    });
  });
}

export function renderHome(materials, items, version = '') {
  cachedMaterials = materials;
  cachedItems = items;
  cachedVersion = version;
  currentView = 'all';

  const inventory = loadInventory();
  const favourites = loadFavourites();

  // Update version in sidebar
  const versionEl = document.getElementById('sidebarVersion');
  if (versionEl) versionEl.textContent = version;

  // Render materials list in sidebar
  renderMaterialsList(cachedMaterials, inventory);

  // Render header buttons
  renderHeaderButtons();
  bindPersistentShellControls();

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.value = searchQuery;
  }

  // Render main content
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="flex flex-col gap-4">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p class="text-primary text-sm font-semibold uppercase tracking-widest mb-1">Crafting Companion</p>
          <h2 id="viewTitle" class="text-3xl md:text-4xl font-bold text-white tracking-tight">All Items</h2>
        </div>
      </div>
      <div id="filtersContainer"></div>
    </div>
    <div id="itemsDisplayGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
    </div>
  `;

  // Render filters
  const filtersContainer = document.getElementById('filtersContainer');
  renderItemsControls(filtersContainer);

  // Render items
  renderAllItemsView(cachedItems, inventory, favourites);
}

export function renderMaterialsGrid(materials, inventory) {
  // This function is now replaced by renderMaterialsList for the sidebar
  renderMaterialsList(materials, inventory);
}

export function renderAllItemsView(items, inventory, favourites) {
  const displayGrid = document.getElementById('itemsDisplayGrid');
  const viewTitle = document.getElementById('viewTitle');
  if (!displayGrid) return;

  if (viewTitle) viewTitle.textContent = 'All Items';
  displayGrid.innerHTML = '';

  const filteredItems = filterAndSortItems(items);

  const favoriteItems = filteredItems.filter(item => favourites.includes(item.name));
  const otherItems = filteredItems.filter(item => !favourites.includes(item.name));
  const sortedItems = [...favoriteItems, ...otherItems];

  if (sortedItems.length === 0) {
    displayGrid.innerHTML = '<p class="col-span-full text-center text-[#9db9a8] py-12">No items match your filters.</p>';
    return;
  }

  const cardsHtml = sortedItems
    .map((item, index) => buildItemCard(item, index, inventory, favourites, 'all'))
    .join('');

  displayGrid.innerHTML = cardsHtml;
  attachCardEventListeners(displayGrid, 'all');
}

export function renderCraftableItemsView(items, inventory, favourites) {
  const displayGrid = document.getElementById('itemsDisplayGrid');
  const viewTitle = document.getElementById('viewTitle');
  if (!displayGrid) return;

  if (viewTitle) viewTitle.textContent = 'Ready to Craft';
  displayGrid.innerHTML = '';

  const filteredItems = filterAndSortItems(items);
  const craftableItems = getCraftableItems(inventory, filteredItems);
  const allFavouriteItems = filteredItems.filter(item => favourites.includes(item.name));

  let combinedItems = [];
  const itemNames = new Set();

  allFavouriteItems.forEach(item => {
    if (!itemNames.has(item.name)) {
      combinedItems.push(item);
      itemNames.add(item.name);
    }
  });

  craftableItems.forEach(item => {
    if (!itemNames.has(item.name)) {
      combinedItems.push(item);
      itemNames.add(item.name);
    }
  });

  if (combinedItems.length === 0) {
    displayGrid.innerHTML = '<p class="col-span-full text-center text-[#9db9a8] py-12">No craftable or favourited items to display. Add materials using the sidebar!</p>';
    return;
  }

  const cardsHtml = combinedItems
    .map((item, index) => buildItemCard(item, index, inventory, favourites, 'craftable'))
    .join('');

  displayGrid.innerHTML = cardsHtml;
  attachCardEventListeners(displayGrid, 'craftable');
}

function attachCardEventListeners(container, viewContext) {
  container.querySelectorAll('.item-icon').forEach(icon => {
    const handleMissingArt = () => showItemArtFallback(icon);
    icon.addEventListener('error', handleMissingArt, { once: true });

    if (icon.complete && icon.naturalWidth === 0) {
      handleMissingArt();
    }
  });

  // Favourite toggle
  container.querySelectorAll('button[data-fav]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.dataset.fav;
      toggleFavourite(name);
      if (viewContext === 'all') {
        renderAllItemsView(cachedItems, loadInventory(), loadFavourites());
      } else {
        renderCraftableItemsView(cachedItems, loadInventory(), loadFavourites());
      }
    });
  });

  container.querySelectorAll('[data-item]').forEach(card => {
    card.addEventListener('click', () => {
      const item = cachedItems.find(entry => entry.name === card.dataset.item);
      if (!item) {
        return;
      }

      openItemDetailModal(item, loadInventory());
    });

    card.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      const item = cachedItems.find(entry => entry.name === card.dataset.item);
      if (!item) {
        return;
      }

      openItemDetailModal(item, loadInventory());
    });
  });
}

export function renderSettings() {
  const app = document.getElementById('app');
  const settings = loadSettings();

  app.innerHTML = `
    <div class="max-w-md mx-auto">
      <header class="flex items-center gap-4 mb-8">
        <button id="backBtn" class="size-10 rounded-full bg-[#1a2e24] text-white hover:bg-primary hover:text-[#0c1a12] transition-colors flex items-center justify-center">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 class="text-2xl font-bold text-white">Settings</h1>
      </header>
      
      <div class="bg-surface-dark rounded-2xl p-6 border border-[#28392f] space-y-6">
        <div>
          <h2 class="text-white font-bold mb-4">Appearance</h2>
          <div class="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-primary">dark_mode</span>
              <span class="text-white font-medium">Dark Mode</span>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="darkModeToggle" class="sr-only peer" ${settings.darkMode ? 'checked' : ''}>
              <div class="w-11 h-6 bg-[#1a2e24] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>

        <div class="pt-2">
          <h2 class="text-white font-bold mb-3">Data Management</h2>
          <button id="clearInventoryBtn" class="w-full bg-red-900/30 hover:bg-red-900/50 text-red-400 font-semibold py-3 px-4 rounded-xl border border-red-700/50 transition-colors">
            Clear All Inventory
          </button>
          <p class="text-[#9db9a8] text-xs mt-2">This will reset all your tracked materials to zero.</p>
        </div>
        
        <div class="pt-4 border-t border-[#28392f]">
          <p class="text-[#9db9a8] text-sm text-center">Version: ${cachedVersion}</p>
        </div>
      </div>
    </div>
  `;

  document.getElementById('backBtn')?.addEventListener('click', () => {
    renderHome(cachedMaterials, cachedItems, cachedVersion);
  });

  document.getElementById('darkModeToggle')?.addEventListener('change', (e) => {
    const isDark = e.target.checked;
    settings.darkMode = isDark;
    saveSettings(settings);
    applyTheme(isDark);
  });

  document.getElementById('clearInventoryBtn')?.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all inventory? This cannot be undone.')) {
      clearInventory();
      alert('Inventory cleared.');
      renderHome(cachedMaterials, cachedItems, cachedVersion);
    }
  });
}
