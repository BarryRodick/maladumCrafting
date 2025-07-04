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

  listContainer.innerHTML = items
    .map(item => {
      const starred = favourites.includes(item.name) ? '⭐' : '☆';
      const iconPath = `images/tokens/${item.resources.icon}`;
      const resourcesNeeded = Object.entries(item.resources).filter(([sym, qty]) => sym !== 'icon');

      let requiredResourcesHtml = '';
      if (resourcesNeeded.length > 0) {
        requiredResourcesHtml = `
          <div class="mt-2 text-xs">
            <strong class="font-semibold text-gray-700 dark:text-gray-300">Requires:</strong>
            <ul class="list-disc list-inside ml-2 mt-1 space-y-0.5">`;
        resourcesNeeded.forEach(([sym, qty]) => {
          requiredResourcesHtml += `<li class="text-gray-600 dark:text-gray-400">${sym}: ${qty}</li>`;
        });
        requiredResourcesHtml += '</ul></div>';
      }

      let missingResourcesHtml = '';
      if (resourcesNeeded.length > 0) {
        const missing = [];
        resourcesNeeded.forEach(([sym, qty]) => {
          const currentQty = inventory[sym] || 0;
          if (currentQty < qty) {
            missing.push({ sym, needed: qty, has: currentQty });
          }
        });

        if (missing.length > 0) {
          missingResourcesHtml = `
            <div class="mt-1 text-xs">
              <strong class="font-semibold text-red-600 dark:text-red-400">Missing:</strong>
              <ul class="list-disc list-inside ml-2 mt-1 space-y-0.5">`;
          missing.forEach(m => {
            missingResourcesHtml += `<li class="text-red-500 dark:text-red-400">${m.sym}: ${m.needed - m.has} (You have ${m.has})</li>`;
          });
          missingResourcesHtml += '</ul></div>';
        } else {
          missingResourcesHtml = `
            <div class="mt-1 text-xs">
              <strong class="font-semibold text-green-600 dark:text-green-400">Missing:</strong>
              <span class="ml-1 text-green-500 dark:text-green-400">None</span>
            </div>`;
        }
      }

      return `
        <div class="item-card border-b py-3">
          <div class="flex justify-between items-center">
            <div class="flex items-center">
              <img src="${iconPath}" alt="${item.name} icon" class="item-icon w-10 h-10 mr-3 cursor-pointer">
              <span class="font-semibold text-base">${item.name}</span>
            </div>
            <button data-fav="${item.name}" data-view="all" class="text-2xl p-1">${starred}</button>
          </div>
          <div class="pl-13 pr-1"> <!-- Indent resource details to align with item name -->
            ${requiredResourcesHtml}
            ${missingResourcesHtml}
          </div>
        </div>`;
    })
    .join('');

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

  const craftable = getCraftableItems(inventory, items);

  if (craftable.length === 0) {
    listContainer.innerHTML = '<p class="italic text-sm">No craftable items.</p>';
    return;
  }

  listContainer.innerHTML = craftable
    .map(item => {
      const starred = favourites.includes(item.name) ? '⭐' : '☆';
      const iconPath = `images/tokens/${item.resources.icon}`;
      return `
        <div class="flex justify-between items-center border-b py-1">
          <img src="${iconPath}" alt="${item.name} icon" class="item-icon w-8 h-8 mr-2 cursor-pointer">
          <span class="flex-grow">${item.name}</span>
          <button data-fav="${item.name}" data-view="craftable" class="text-xl">${starred}</button>
        </div>`;
    })
    .join('');

  list.querySelectorAll('button[data-fav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.fav;
      toggleFavourite(name); // favs are reloaded by the render function
      // Re-render the current view
      renderCraftableItemsView(cachedItems, loadInventory(), loadFavourites());
    });
  });

  list.querySelectorAll('.item-icon').forEach(icon => {
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
