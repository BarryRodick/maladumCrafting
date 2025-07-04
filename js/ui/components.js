// UI rendering helpers
import { loadInventory, updateInventory } from '../inventory.js';
import { loadFavourites, toggleFavourite } from '../favourites.js';
import { getCraftableItems } from '../crafting.js';
import { loadSettings, saveSettings } from '../storage.js';
import { applyTheme } from './theme.js';

let cachedMaterials = [];
let cachedItems = [];

export function renderHome(materials, items) {
  cachedMaterials = materials;
  cachedItems = items;

  const inventory = loadInventory();
  const favourites = loadFavourites();

  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="app-header flex justify-between items-center">
      <h1 class="app-title">Maladum Crafting</h1>
      <div>
        <button id="viewToggleBtn" class="btn mr-2">All Items</button>
        <button id="settingsBtn" class="btn">⚙️</button>
      </div>
    </header>
    <main class="app-main">
      <div id="materialsGrid" class="mb-4"></div>
      <div id="itemsListContainer"></div> {/* Container for both lists */}
    </main>
  `;

  renderMaterialsGrid(cachedMaterials, inventory);
  // Default to showing craftable items
  renderCraftableItemsView(cachedItems, inventory, favourites);

  const viewToggleBtn = document.getElementById('viewToggleBtn');
  viewToggleBtn.addEventListener('click', () => {
    const currentView = viewToggleBtn.textContent;
    if (currentView === 'All Items') {
      renderAllItemsView(cachedItems, loadInventory(), loadFavourites());
      viewToggleBtn.textContent = 'Craftable';
    } else {
      renderCraftableItemsView(cachedItems, loadInventory(), loadFavourites());
      viewToggleBtn.textContent = 'All Items';
    }
  });

  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      renderSettings();
    });
  }
}

export function renderMaterialsGrid(materials, inventory) {
  const grid = document.getElementById('materialsGrid');
  if (!grid) return;

  grid.innerHTML =
    '<div class="grid grid-cols-4 gap-2">' +
    materials
      .map(m => {
        const count = inventory[m.symbol] || 0;
        return `
          <div class="material-card flex flex-col items-center text-center">
            <div class="font-bold">${m.symbol}</div>
            <div class="text-sm">${count}</div>
            <div class="mt-1 flex space-x-1">
              <button class="btn" data-action="dec" data-symbol="${m.symbol}">–</button>
              <button class="btn" data-action="inc" data-symbol="${m.symbol}">+</button>
            </div>
          </div>`;
      })
      .join('') +
    '</div>';

  grid.querySelectorAll('button[data-action="inc"]').forEach(btn => {
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

  grid.querySelectorAll('button[data-action="dec"]').forEach(btn => {
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
  const listContainer = document.getElementById('itemsListContainer');
  if (!listContainer) return;

  // Separate and sort items
  const favoriteItems = items.filter(item => favourites.includes(item.name));
  const otherItems = items.filter(item => !favourites.includes(item.name));

  // Assuming original order is desired for secondary sort, no explicit sort needed for subgroups yet.
  // If specific sorting (e.g., by name) is needed for favoriteItems and otherItems:
  // favoriteItems.sort((a, b) => a.name.localeCompare(b.name));
  // otherItems.sort((a, b) => a.name.localeCompare(b.name));

  const sortedItems = [...favoriteItems, ...otherItems];

  const rowsHtml = sortedItems
    .map(item => {
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

      return `
        <tr class="border-b">
          <td class="p-2">
            <img src="${iconPath}" alt="${item.name} icon" class="item-icon w-8 h-8 cursor-pointer">
          </td>
          <td class="p-2">${item.name}</td>
          <td class="p-2 text-sm">${required}</td>
          <td class="p-2 text-sm">${missingText}</td>
          <td class="p-2 text-center">
            <button data-fav="${item.name}" data-view="all" class="text-xl p-1">${starred}</button>
          </td>
        </tr>`;
    })
    .join('');

  listContainer.innerHTML = `
    <table class="item-table min-w-full text-left text-sm">
      <thead class="border-b font-semibold">
        <tr>
          <th class="p-2">Icon</th>
          <th class="p-2">Item</th>
          <th class="p-2">Requires</th>
          <th class="p-2">Missing</th>
          <th class="p-2 text-center">Fav</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>`;

  listContainer.querySelectorAll('button[data-fav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.fav;
      toggleFavourite(name);
      // Re-render the current view
      renderAllItemsView(cachedItems, loadInventory(), loadFavourites());
    });
  });

  listContainer.querySelectorAll('.item-icon').forEach(icon => {
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

// Renamed from renderCraftableList
export function renderCraftableItemsView(items, inventory, favourites) {
  const listContainer = document.getElementById('itemsListContainer');
  if (!listContainer) return;

  const craftableItems = getCraftableItems(inventory, items);

  if (craftableItems.length === 0) {
    listContainer.innerHTML = '<p class="italic text-sm">No craftable items.</p>';
    return;
  }

  // Separate and sort items
  const favoriteCraftableItems = craftableItems.filter(item => favourites.includes(item.name));
  const otherCraftableItems = craftableItems.filter(item => !favourites.includes(item.name));

  // Assuming original order from getCraftableItems is desired for secondary sort.
  // If specific sorting (e.g., by name) is needed:
  // favoriteCraftableItems.sort((a, b) => a.name.localeCompare(b.name));
  // otherCraftableItems.sort((a, b) => a.name.localeCompare(b.name));

  const sortedCraftableItems = [...favoriteCraftableItems, ...otherCraftableItems];

  listContainer.innerHTML = sortedCraftableItems
    .map(item => {
      const starred = favourites.includes(item.name) ? '⭐' : '☆'; // Still need this for the star icon
      const iconPath = `images/tokens/${item.resources.icon}`;
      return `
        <div class="item-card border-b py-2 flex items-center">
          {/* Left Column: Icon */}
          <div class="w-10 mr-2 flex-shrink-0">
            <img src="${iconPath}" alt="${item.name} icon" class="item-icon w-8 h-8 cursor-pointer">
          </div>

          {/* Middle Column: Item Name */}
          <div class="flex-grow mr-2">
            <span class="text-sm">${item.name}</span>
          </div>

          {/* Right Column: Favourite Button */}
          <div class="w-8 flex-shrink-0 flex justify-center">
            <button data-fav="${item.name}" data-view="craftable" class="text-xl p-1">${starred}</button>
          </div>
        </div>`;
    })
    .join('');

  listContainer.querySelectorAll('button[data-fav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.fav;
      toggleFavourite(name); // favs are reloaded by the render function
      // Re-render the current view
      renderCraftableItemsView(cachedItems, loadInventory(), loadFavourites());
    });
  });

  listContainer.querySelectorAll('.item-icon').forEach(icon => {
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
  const app = document.getElementById('app');
  const settings = loadSettings();

  app.innerHTML = `
    <header class="app-header flex justify-between items-center">
      <button id="backBtn" class="btn">← Back</button>
      <h1 class="app-title flex-1 text-center">Settings</h1>
      <span class="w-6"></span>
    </header>
    <main class="app-main space-y-4">
      <label class="flex items-center space-x-2">
        <input type="checkbox" id="darkModeToggle" ${settings.darkMode ? 'checked' : ''}>
        <span>Dark mode</span>
      </label>
      <button id="clearInventoryBtn" class="btn">Clear inventory</button>
    </main>
  `;

  document.getElementById('backBtn').addEventListener('click', () => {
    renderHome(cachedMaterials, cachedItems);
  });

  document.getElementById('darkModeToggle').addEventListener('change', (e) => {
    const newSettings = { ...settings, darkMode: e.target.checked };
    saveSettings(newSettings);
    applyTheme(newSettings.darkMode);
  });

  document.getElementById('clearInventoryBtn').addEventListener('click', () => {
    if (confirm('Clear all inventory?')) {
      localStorage.removeItem('maladum_inventory');
    }
  });
}
