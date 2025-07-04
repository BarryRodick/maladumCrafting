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
      <button id="settingsBtn" class="btn">⚙️</button>
    </header>
    <main class="app-main">
      <div id="materialsGrid" class="mb-4"></div>
      <div id="craftableList"></div>
    </main>
  `;

  renderMaterialsGrid(cachedMaterials, inventory);
  renderCraftableList(cachedItems, inventory, favourites);

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
      const favs = loadFavourites();
      renderCraftableList(cachedItems, inv, favs);
    });
  });

  grid.querySelectorAll('button[data-action="dec"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const sym = btn.dataset.symbol;
      const inv = updateInventory(sym, -1);
      renderMaterialsGrid(cachedMaterials, inv);
      const favs = loadFavourites();
      renderCraftableList(cachedItems, inv, favs);
    });
  });
}

export function renderCraftableList(items, inventory, favourites) {
  const list = document.getElementById('craftableList');
  if (!list) return;

  const craftable = getCraftableItems(inventory, items);

  if (craftable.length === 0) {
    list.innerHTML = '<p class="italic text-sm">No craftable items.</p>';
    return;
  }

  list.innerHTML = craftable
    .map(item => {
      const starred = favourites.includes(item.name) ? '⭐' : '☆';
      const iconPath = `images/tokens/${item.resources.icon}`;
      return `
        <div class="flex justify-between items-center border-b py-1">
          <img src="${iconPath}" alt="${item.name} icon" class="item-icon w-8 h-8 mr-2 cursor-pointer">
          <span class="flex-grow">${item.name}</span>
          <button data-fav="${item.name}" class="text-xl">${starred}</button>
        </div>`;
    })
    .join('');

  list.querySelectorAll('button[data-fav]').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.fav;
      const favs = toggleFavourite(name);
      const inv = loadInventory();
      renderCraftableList(cachedItems, inv, favs);
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
