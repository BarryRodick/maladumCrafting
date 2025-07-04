// UI rendering helpers
import { loadInventory, updateInventory } from '../inventory.js';
import { loadFavourites, toggleFavourite } from '../favourites.js';
import { getCraftableItems } from '../crafting.js';
import { loadSettings, saveSettings } from '../storage.js';
import { applyTheme } from './theme.js';

let cachedMaterials = [];
let cachedItems = [];

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

export function renderHome(materials, items) {
  cachedMaterials = materials;
  cachedItems = items;

  const inventory = loadInventory();
  const favourites = loadFavourites();

  const app = document.getElementById('app');
  // Clear previous content
  app.innerHTML = '';

  // Create Control Bar Section
  const controlSection = document.createElement('section');
  controlSection.id = 'controlsSection';
  // Added fade-in to sections
  controlSection.className = 'fade-in mb-6 p-4 rounded shadow-lg';
  controlSection.innerHTML = `
    <h2 class="text-xl font-heading mb-3 sr-only">Controls</h2> <!-- Screen-reader only title for now -->
    <div class="flex flex-wrap gap-2 items-center">
      <button id="viewToggleBtn" class="btn mr-2">All Items</button>
      <button id="settingsBtn" class="btn">⚙️ Settings</button>
    </div>
  `;
  app.appendChild(controlSection);

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
    <h2 class="text-2xl font-heading mb-4" id="itemsSectionTitle">Craftable Items</h2>
    <div id="itemsDisplayGrid" class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
      <!-- item cards will be rendered here -->
    </div>
  `;
  app.appendChild(itemsSection);

  // Initial renders
  renderMaterialsGrid(cachedMaterials, inventory);
  renderCraftableItemsView(cachedItems, inventory, favourites); // Default view

  // Setup Event Listeners for controls
  const viewToggleBtn = document.getElementById('viewToggleBtn');
  if (viewToggleBtn) {
    viewToggleBtn.addEventListener('click', () => {
      const itemsSectionTitle = document.getElementById('itemsSectionTitle');
      const currentViewText = viewToggleBtn.textContent;
      if (currentViewText === 'All Items') {
        renderAllItemsView(cachedItems, loadInventory(), loadFavourites());
        viewToggleBtn.textContent = 'Craftable Items';
        if (itemsSectionTitle) itemsSectionTitle.textContent = 'All Items';
      } else {
        renderCraftableItemsView(cachedItems, loadInventory(), loadFavourites());
        viewToggleBtn.textContent = 'All Items';
        if (itemsSectionTitle) itemsSectionTitle.textContent = 'Craftable Items';
      }
    });
  }

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      // Settings rendering will inject into 'app' or a modal, replacing current content.
      // For now, ensure it's called.
      renderSettings();
    });
  }
}

export function renderMaterialsGrid(materials, inventory) {
  const gridContainer = document.getElementById('materialsGrid');
  if (!gridContainer) return;

  // The parent div for grid is already in the HTML structure provided by renderHome.
  // So, we just set the innerHTML of materialsGrid itself.
  gridContainer.innerHTML = materials
    .map((m, index) => {
      const count = inventory[m.symbol] || 0;
      // Using the new .card class
      return `
        <div class="card fade-in flex flex-col items-center text-center p-2" style="animation-delay: ${index * 50}ms">
          <div class="font-bold text-lg">${m.symbol}</div>
          <div class="text-base my-1">${count}</div>
          <div class="mt-auto flex space-x-1">
            <button class="btn btn-sm" data-action="dec" data-symbol="${m.symbol}">–</button>
            <button class="btn btn-sm" data-action="inc" data-symbol="${m.symbol}">+</button>
          </div>
        </div>`;
    })
    .join('');

  gridContainer.querySelectorAll('button[data-action="inc"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sym = btn.dataset.symbol;
      const inv = updateInventory(sym, 1);
      renderMaterialsGrid(cachedMaterials, inv);
      // Update current view after inventory change
      const viewToggleBtn = document.getElementById('viewToggleBtn');
      if (viewToggleBtn.textContent === 'Craftable') { // This means "All Items" is active
        renderAllItemsView(cachedItems, inv, loadFavourites());
      } else { // This means "Craftable" is active
        renderCraftableItemsView(cachedItems, inv, loadFavourites());
      }
    });
  });

  gridContainer.querySelectorAll('button[data-action="dec"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sym = btn.dataset.symbol;
      const inv = updateInventory(sym, -1);
      renderMaterialsGrid(cachedMaterials, inv);
      // Update current view after inventory change
      const viewToggleBtn = document.getElementById('viewToggleBtn');
      if (viewToggleBtn.textContent === 'Craftable') { // This means "All Items" is active
        renderAllItemsView(cachedItems, inv, loadFavourites());
      } else { // This means "Craftable" is active
        renderCraftableItemsView(cachedItems, inv, loadFavourites());
      }
    });
  });
}

export function renderAllItemsView(items, inventory, favourites) {
  const displayGrid = document.getElementById('itemsDisplayGrid');
  if (!displayGrid) return;
  displayGrid.innerHTML = ''; // Clear previous content

  // Separate and sort items
  const favoriteItems = items.filter(item => favourites.includes(item.name));
  const otherItems = items.filter(item => !favourites.includes(item.name));

  // Assuming original order is desired for secondary sort, no explicit sort needed for subgroups yet.
  // If specific sorting (e.g., by name) is needed for favoriteItems and otherItems:
  // favoriteItems.sort((a, b) => a.name.localeCompare(b.name));
  // otherItems.sort((a, b) => a.name.localeCompare(b.name));

  const sortedItems = [...favoriteItems, ...otherItems];

  const cardsHtml = sortedItems
    .map((item, index) => { // Added index for animation delay
      const starred = favourites.includes(item.name) ? '⭐' : '☆'; // Still need this for the star icon
      const iconPath = `images/tokens/${item.resources.icon}`;
      const resourcesNeeded = Object.entries(item.resources).filter(([sym]) => sym !== 'icon');

      const required = resourcesNeeded
        .map(([sym, qty]) => `${sym}: ${qty}`)
        .join(', ');

      let missingText = 'None';
      if (resourcesNeeded.length > 0) {
        const missing = [];
        resourcesNeeded.forEach(([sym, qty]) => {
          const currentQty = inventory[sym] || 0;
          if (currentQty < qty) {
            missing.push(`${sym}: ${qty - currentQty}`);
          }
        });
        if (missing.length > 0) {
          missingText = missing.join(', ');
        }
      }

      const rarity = calculateItemRarity(item);
      const rarityCls = rarityClass(rarity);
      const rarityBorderCls = rarityBorderClass(rarity);
      return `
        <div class="card fade-in flex flex-col ${rarityBorderCls}" style="animation-delay: ${index * 75}ms">
          <div class="p-3">
            <div class="flex items-start mb-2">
              <h3 class="font-heading text-lg flex-grow text-black">${item.name}</h3>
              <button data-fav="${item.name}" data-view="all" class="text-2xl p-1 hover:text-yellow-400 transition-colors mr-2">${starred}</button>
              <div class="relative">
                <img src="${iconPath}" alt="${item.name} icon" class="item-icon w-24 h-24 cursor-pointer rounded">
                <span class="rarity-badge ${rarityCls}"></span>
              </div>
            </div>
            <div class="text-sm space-y-1">
              <p><strong class="font-semibold">Requires:</strong> ${required || 'None'}</p>
              <p><strong class="font-semibold">Missing:</strong> <span class="${missingText === 'None' ? '' : 'text-red-500'}">${missingText}</span></p>
              <p><strong class="font-semibold">Cost:</strong> ${item.total_cost}</p>
            </div>
          </div>
        </div>
      `;
    })
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

  const craftableItems = getCraftableItems(inventory, items);

  if (craftableItems.length === 0) {
    displayGrid.innerHTML = '<p class="italic text-center col-span-full">No craftable items currently.</p>'; // Added col-span-full for grid context
    return;
  }

  // Separate and sort items
  const favoriteCraftableItems = craftableItems.filter(item => favourites.includes(item.name));
  const otherCraftableItems = craftableItems.filter(item => !favourites.includes(item.name));
  const sortedCraftableItems = [...favoriteCraftableItems, ...otherCraftableItems];

  const cardsHtml = sortedCraftableItems
    .map((item, index) => { // Added index for animation delay
      const starred = favourites.includes(item.name) ? '⭐' : '☆';
      const iconPath = `images/tokens/${item.resources.icon}`;
      const resourcesNeeded = Object.entries(item.resources).filter(([sym]) => sym !== 'icon');
      const required = resourcesNeeded
        .map(([sym, qty]) => `${sym}: ${qty}`)
        .join(', ');

      const rarity = calculateItemRarity(item);
      const rarityCls = rarityClass(rarity);
      const rarityBorderCls = rarityBorderClass(rarity);
      return `
        <div class="card fade-in flex flex-col ${rarityBorderCls}" style="animation-delay: ${index * 75}ms">
          <div class="p-3">
            <div class="flex items-start mb-2">
              <h3 class="font-heading text-lg flex-grow text-black">${item.name}</h3>
              <button data-fav="${item.name}" data-view="craftable" class="text-2xl p-1 hover:text-yellow-400 transition-colors mr-2">${starred}</button>
              <div class="relative">
                <img src="${iconPath}" alt="${item.name} icon" class="item-icon w-24 h-24 cursor-pointer rounded">
                <span class="rarity-badge ${rarityCls}"></span>
              </div>
            </div>
            <div class="text-sm space-y-1">
              <p><strong class="font-semibold">Requires:</strong> ${required || 'None'}</p>
              <p><strong class="font-semibold">Cost:</strong> ${item.total_cost}</p>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  displayGrid.innerHTML = cardsHtml;

  displayGrid.querySelectorAll('button[data-fav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.fav;
      toggleFavourite(name);
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
