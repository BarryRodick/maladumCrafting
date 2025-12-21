// UI rendering helpers
import { loadInventory, updateInventory } from '../inventory.js';
import { loadFavourites, toggleFavourite } from '../favourites.js';
import { getCraftableItems } from '../crafting.js';
import { loadSettings, saveSettings } from '../storage.js';
import { applyTheme } from './theme.js';

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

const rarityOrder = { Common: 1, Uncommon: 2, Rare: 3 };

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

function rarityClass(rarity) {
  switch (rarity) {
    case 'Rare':
      return 'rarity-rare';
    case 'Uncommon':
      return 'rarity-uncommon';
    default:
      return 'rarity-common';
  }
}

function rarityBorderClass(rarity) {
  switch (rarity) {
    case 'Rare':
      return 'rarity-border-rare';
    case 'Uncommon':
      return 'rarity-border-uncommon';
    default:
      return 'rarity-border-common';
  }
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
      missing.push(`${sym}: ${qty - have}`);
      missingTotal += qty - have;
    } else {
      metResources += 1;
    }
  });

  const missingText = missing.length > 0 ? missing.join(', ') : 'None';
  const ribbonText = resourcesNeeded.length === 0
    ? ''
    : `Missing ${resourcesNeeded.length - metResources}/${resourcesNeeded.length}`;

  return { missingText, missingTotal, ribbonText };
}

function matchesFilters(item) {
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

function buildItemCard(item, index, inventory, favourites, viewContext) {
  const starred = favourites.includes(item.name);
  const iconPath = `images/tokens/${item.resources.icon}`;
  const resourcesNeeded = Object.entries(item.resources).filter(([sym]) => sym !== 'icon');
  const required = resourcesNeeded.map(([sym, qty]) => `${sym}: ${qty}`).join(', ');

  const { missingText, ribbonText } = getMissingSummary(item, inventory);
  const buildCost = calculateBuildCost(item, inventory);
  const rarity = calculateItemRarity(item);
  const rarityBorderCls = rarityBorderClass(rarity);
  const borderCls = item.relic > 0 ? 'relic-border' : rarityBorderCls;
  const isCraftable = isItemCraftable(item, inventory);
  const notCraftableFavouriteClass = !isCraftable && viewContext === 'craftable' && starred ? 'opacity-80' : '';
  const deficitRibbon = !isCraftable && ribbonText
    ? `<div class="deficit-ribbon ${rarityBorderCls}">${ribbonText}</div>`
    : '';

  return `
    <div class="card fade-in flex flex-col ${borderCls} ${notCraftableFavouriteClass}" style="animation-delay: ${index * 75}ms" data-item="${item.name}">
      <button data-fav="${item.name}" data-view="${viewContext}" class="favourite-toggle" aria-label="${starred ? 'Unstar' : 'Star'} ${item.name}">${starred ? '★' : '☆'}</button>
      ${deficitRibbon}
      <div class="p-3">
        <div class="flex items-start mb-2">
          <h3 class="font-heading text-lg flex-grow">${item.name}</h3>
          <div class="relative">
            <img src="${iconPath}" alt="${item.name} icon" class="item-icon w-24 h-24 cursor-pointer rounded">
          </div>
        </div>
        <div class="text-sm space-y-1">
          <p><strong class="font-semibold">Requires:</strong> ${required || 'None'}</p>
          <p><strong class="font-semibold">Missing:</strong> <span class="${missingText === 'None' ? 'text-green-700' : 'text-red-500'}">${missingText}</span></p>
          <p><strong class="font-semibold">Build Cost:</strong> <span class="text-red-500">${buildCost}</span></p>
          <p><strong class="font-semibold">Craft Cost:</strong> ${item.price}</p>
          ${item.relic > 0 ? `<p><strong class="font-semibold">Relic Token Required:</strong> ${item.relic}</p>` : ''}
          <p><strong class="font-semibold">Expansion:</strong> ${item.expansion}</p>
        </div>
      </div>
    </div>
  `;
}

function renderHeaderButtons() {
  const headerNav = document.getElementById('headerNavLinks');
  if (!headerNav) return;

  headerNav.innerHTML = `
    <div class="segmented-control" role="group" aria-label="Item view">
      <button id="craftableViewBtn" class="btn btn-ghost segmented active" data-view="craftable">Craftable</button>
      <button id="allItemsViewBtn" class="btn btn-ghost segmented" data-view="all">All Items</button>
    </div>
    <a href="tokens.html" class="btn btn-ghost icon-pill" aria-label="Token gallery">
      <span class="pill-icon">🪙</span>
      <span class="pill-label">Tokens</span>
    </a>
    <button id="settingsBtn" class="icon-btn" aria-label="Settings">
      ⚙️
    </button>
  `;
}

function setCurrentView(view) {
  currentView = view;
  const itemsSectionTitle = document.getElementById('itemsSectionTitle');
  const craftableBtn = document.getElementById('craftableViewBtn');
  const allItemsBtn = document.getElementById('allItemsViewBtn');

  if (craftableBtn) craftableBtn.classList.toggle('active', view === 'craftable');
  if (allItemsBtn) allItemsBtn.classList.toggle('active', view === 'all');
  if (itemsSectionTitle) itemsSectionTitle.textContent = view === 'craftable' ? 'Craftable Items' : 'All Items';

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

function renderItemsControls() {
  const controlsContainer = document.getElementById('itemsControls');
  if (!controlsContainer) return;

  const types = Array.from(new Set(cachedItems.map(item => item.type).filter(Boolean))).sort();
  const expansions = Array.from(new Set(cachedItems.map(item => item.expansion).filter(Boolean))).sort();
  const sizes = Array.from(new Set(cachedItems.map(item => item.size).filter(Boolean))).sort();

  controlsContainer.innerHTML = `
    <div class="filter-bar grid gap-2 md:grid-cols-2 lg:grid-cols-5 items-end">
      <label class="filter-field">
        <span class="filter-label">Type</span>
        <select data-filter="type" class="form-field">${buildOptions(types)}</select>
      </label>
      <label class="filter-field">
        <span class="filter-label">Expansion</span>
        <select data-filter="expansion" class="form-field">${buildOptions(expansions)}</select>
      </label>
      <label class="filter-field">
        <span class="filter-label">Size</span>
        <select data-filter="size" class="form-field">${buildOptions(sizes)}</select>
      </label>
      <label class="filter-field">
        <span class="filter-label">Relic</span>
        <select data-filter="relic" class="form-field">
          <option value="all">All</option>
          <option value="requires">Requires relic</option>
          <option value="none">No relic</option>
        </select>
      </label>
      <label class="filter-field">
        <span class="filter-label">Sort by</span>
        <select data-filter="sort" class="form-field">
          <option value="name">Name (A-Z)</option>
          <option value="rarity">Rarity</option>
          <option value="price">Craft cost</option>
        </select>
      </label>
    </div>
  `;

  controlsContainer.querySelectorAll('select[data-filter]').forEach(select => {
    const key = select.dataset.filter;
    select.value = currentFilters[key] || 'all';
    select.addEventListener('change', (e) => {
      currentFilters[key] = e.target.value;
      setCurrentView(currentView);
    });
  });
}

export function renderHome(materials, items, version = '') {
  cachedMaterials = materials;
  cachedItems = items;
  cachedVersion = version;
  currentView = 'craftable';

  const inventory = loadInventory();
  const favourites = loadFavourites();

  const app = document.getElementById('app');
  // Clear previous content
  app.innerHTML = '';

  // Place header buttons
  renderHeaderButtons();

  // Create Materials Section
  const materialsSection = document.createElement('section');
  materialsSection.id = 'materialsSection';
  materialsSection.className = 'fade-in mb-8'; // Added fade-in
  materialsSection.innerHTML = `
    <h2 class="text-2xl font-heading mb-4">Available Materials</h2>
    <div id="materialsGrid" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" style="grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));">
      <!-- materials grid will be rendered here by renderMaterialsGrid -->
    </div>
  `;
  app.appendChild(materialsSection);

  // Create Items Section
  const itemsSection = document.createElement('section');
  itemsSection.id = 'itemsSection';
  itemsSection.className = 'fade-in'; // Added fade-in
  itemsSection.innerHTML = `
    <div class="items-toolbar">
      <h2 class="text-2xl font-heading" id="itemsSectionTitle">Craftable Items</h2>
      <div id="itemsControls"></div>
    </div>
    <div id="itemsDisplayGrid" class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
      <!-- item cards will be rendered here -->
    </div>
  `;
  app.appendChild(itemsSection);

  // Initial renders
  renderMaterialsGrid(cachedMaterials, inventory);
  renderItemsControls();
  renderCraftableItemsView(cachedItems, inventory, favourites); // Default view

  // Setup Event Listeners for controls
  const craftableViewBtn = document.getElementById('craftableViewBtn');
  const allItemsViewBtn = document.getElementById('allItemsViewBtn');

  if (craftableViewBtn) {
    craftableViewBtn.addEventListener('click', () => setCurrentView('craftable'));
  }

  if (allItemsViewBtn) {
    allItemsViewBtn.addEventListener('click', () => setCurrentView('all'));
  }

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      // Settings rendering will inject into 'app' or a modal, replacing current content.
      // For now, ensure it's called.
      renderSettings();
    });
  }

  // Add Footer with Version
  if (cachedVersion) {
    const footer = document.createElement('footer');
    footer.className = 'text-center text-xs text-white mt-8 mb-4 opacity-40';
    footer.textContent = `Maladum Crafting Companion ${cachedVersion}`;
    app.appendChild(footer);
  }
}

export function renderMaterialsGrid(materials, inventory) {
  const gridContainer = document.getElementById('materialsGrid');
  if (!gridContainer) return;

  const getInventoryStateClass = (count) => {
    if (count === 0) return 'inventory-empty';
    if (count < 2) return 'inventory-low';
    return 'inventory-surplus';
  };

  const getInventoryLabel = (count) => {
    if (count === 0) return 'Out';
    if (count < 2) return 'Low';
    return 'Stocked';
  };

  // Render all material cards
  gridContainer.innerHTML = materials
    .map(m => {
      const count = inventory[m.symbol] || 0;
      const rarityCls = rarityClass(m.rarity);
      const rarityBorderCls = rarityBorderClass(m.rarity);
      const inventoryStateCls = getInventoryStateClass(count);
      const inventoryLabel = getInventoryLabel(count);
      return `
        <div class="card flex flex-col items-center text-center p-3 ${rarityBorderCls} ${inventoryStateCls}" data-material="${m.symbol}">
          <span class="rarity-badge ${rarityCls}"></span>
          <span class="inventory-state badge">${inventoryLabel}</span>
          <div class="relative w-24 h-24 mb-1">
            <img src="images/icons/crafting.png" alt="${m.name} icon" class="w-full h-full" />
            <span class="absolute inset-0 flex items-center justify-center text-lg font-bold pointer-events-none">${m.symbol}</span>
          </div>
          <div class="text-sm font-semibold mb-2 text-center">${m.name}</div>
          <div class="text-sm my-1">Cost: ${m.base_cost}</div>
          <div class="mt-auto flex flex-col items-center">
            <div class="text-base my-1 font-bold count">${count}</div>
            <div class="flex space-x-1">
              <button class="btn btn-sm" data-action="dec" data-symbol="${m.symbol}" aria-label="Decrease ${m.name} count">–</button>
              <button class="btn btn-sm" data-action="inc" data-symbol="${m.symbol}" aria-label="Increase ${m.name} count">+</button>
            </div>
          </div>
        </div>`;
    })
    .join('');

  // Single handler using event delegation
  gridContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const sym = btn.dataset.symbol;
    const delta = btn.dataset.action === 'inc' ? 1 : -1;
    const inv = updateInventory(sym, delta);

    const countEl = gridContainer.querySelector(`[data-material="${sym}"] .count`);
    if (countEl) countEl.textContent = inv[sym] || 0;

    const cardEl = gridContainer.querySelector(`[data-material="${sym}"]`);
    if (cardEl) {
      cardEl.classList.remove('inventory-empty', 'inventory-low', 'inventory-surplus');
      const newStateClass = getInventoryStateClass(inv[sym] || 0);
      cardEl.classList.add(newStateClass);
      const badge = cardEl.querySelector('.inventory-state');
      if (badge) badge.textContent = getInventoryLabel(inv[sym] || 0);
    }

    if (currentView === 'all') {
      renderAllItemsView(cachedItems, inv, loadFavourites());
    } else {
      renderCraftableItemsView(cachedItems, inv, loadFavourites());
    }
  });
}

export function renderAllItemsView(items, inventory, favourites) {
  const displayGrid = document.getElementById('itemsDisplayGrid');
  if (!displayGrid) return;
  displayGrid.innerHTML = ''; // Clear previous content

  const filteredItems = filterAndSortItems(items);

  // Separate and sort items
  const favoriteItems = filteredItems.filter(item => favourites.includes(item.name));
  const otherItems = filteredItems.filter(item => !favourites.includes(item.name));

  // Assuming original order is desired for secondary sort, no explicit sort needed for subgroups yet.
  // If specific sorting (e.g., by name) is needed for favoriteItems and otherItems:
  // favoriteItems.sort((a, b) => a.name.localeCompare(b.name));
  // otherItems.sort((a, b) => a.name.localeCompare(b.name));

  const sortedItems = [...favoriteItems, ...otherItems];

  const cardsHtml = sortedItems
    .map((item, index) => buildItemCard(item, index, inventory, favourites, 'all'))
    .join('');

  displayGrid.innerHTML = cardsHtml;

  displayGrid.querySelectorAll('button[data-fav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.fav;
      toggleFavourite(name);
      renderAllItemsView(cachedItems, loadInventory(), loadFavourites());
    });
  });

  displayGrid.querySelectorAll('.item-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.classList.add('icon-modal');
      modal.innerHTML = `
        <div class="icon-modal-content">
          <span class="icon-modal-close">&times;</span>
          <img src="${icon.src}" alt="${icon.alt}" class="zoomed-icon">
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('.icon-modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) { // Only close if clicking on the background
          document.body.removeChild(modal);
        }
      });
    });
  });
}

export function renderCraftableItemsView(items, inventory, favourites) {
  const displayGrid = document.getElementById('itemsDisplayGrid');
  if (!displayGrid) return;
  displayGrid.innerHTML = ''; // Clear previous content

  const filteredItems = filterAndSortItems(items);
  const craftableItems = getCraftableItems(inventory, filteredItems);
  const allFavouriteItems = filteredItems.filter(item => favourites.includes(item.name));

  // Combine favourited items and craftable items, ensuring favourites are listed first
  // and removing duplicates.
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
    displayGrid.innerHTML = '<p class="italic text-center col-span-full">No craftable or favourited items to display.</p>'; // Added col-span-full for grid context
    return;
  }

  const cardsHtml = combinedItems
    .map((item, index) => buildItemCard(item, index, inventory, favourites, 'craftable'))
    .join('');

  displayGrid.innerHTML = cardsHtml;

  displayGrid.querySelectorAll('button[data-fav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.fav;
      toggleFavourite(name);
      // When a favourite is toggled, we need to re-render using the updated favourites list
      // and current inventory to correctly display craftable/favourited items.
      renderCraftableItemsView(cachedItems, loadInventory(), loadFavourites());
    });
  });

  displayGrid.querySelectorAll('.item-icon').forEach(icon => {
    icon.addEventListener('click', () => {
      const modal = document.createElement('div');
      modal.classList.add('icon-modal');
      modal.innerHTML = `
        <div class="icon-modal-content">
          <span class="icon-modal-close">&times;</span>
          <img src="${icon.src}" alt="${icon.alt}" class="zoomed-icon">
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector('.icon-modal-close').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) { // Only close if clicking on the background
          document.body.removeChild(modal);
        }
      });
    });
  });
}

export function renderSettings() {
  const appContainer = document.getElementById('app'); // Target the main app container
  const settings = loadSettings();

  // Create a modal or a dedicated view for settings
  // For simplicity, this example replaces the app content.
  // A modal approach would be less disruptive.
  appContainer.innerHTML = `
    <section id="settingsView" class="p-4">
      <header class="flex items-center mb-4">
        <button id="backBtn" class="btn mr-4">← Back</button>
        <h1 class="text-2xl font-heading flex-grow text-center">Settings</h1>
        <div style="width: 60px;"></div>
      </header>
      <main class="space-y-6 max-w-md mx-auto">
        <div class="card p-4">
          <h2 class="font-heading text-lg mb-2">Data Management</h2>
          <button id="clearInventoryBtn" class="btn btn-danger">Clear Inventory</button>
          <p class="text-xs text-gray-500 mt-1">This will reset your tracked materials.</p>
        </div>
        <div class="text-center text-xs text-gray-500">
          Version: ${cachedVersion}
        </div>
      </main>
    </section>
  `;

  // Re-attach event listeners
  const backBtn = document.getElementById('backBtn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      renderHome(cachedMaterials, cachedItems); // Re-render the main home view
    });
  }

  // Event listener for darkModeToggle removed as the element is gone.

  const clearInventoryBtn = document.getElementById('clearInventoryBtn');
  if (clearInventoryBtn) {
    clearInventoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all inventory? This cannot be undone.')) {
        localStorage.removeItem('maladum_inventory');
        // Optionally, re-render or give feedback
        alert('Inventory cleared.');
        renderHome(cachedMaterials, cachedItems); // Re-render to reflect change
      }
    });
  }
}
