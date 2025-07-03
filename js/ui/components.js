// UI rendering helpers
import { loadInventory, updateInventory } from '../inventory.js';
import { loadFavourites, toggleFavourite } from '../favourites.js';
import { getCraftableItems } from '../crafting.js';

let cachedMaterials = [];
let cachedItems = [];

export function renderHome(materials, items) {
  cachedMaterials = materials;
  cachedItems = items;

  const inventory = loadInventory();
  const favourites = loadFavourites();

  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="p-4 flex justify-between items-center">
      <h1 class="text-xl font-bold">Maladum Crafting</h1>
      <button id="settingsBtn" class="text-sm">⚙️</button>
    </header>
    <main class="p-4">
      <div id="materialsGrid" class="mb-4"></div>
      <div id="craftableList"></div>
    </main>
  `;

  renderMaterialsGrid(cachedMaterials, inventory);
  renderCraftableList(cachedItems, inventory, favourites);
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
          <div class="border rounded p-2 flex flex-col items-center text-center">
            <div class="font-bold">${m.symbol}</div>
            <div class="text-sm">${count}</div>
            <div class="mt-1 flex space-x-1">
              <button class="px-2 border rounded" data-action="dec" data-symbol="${m.symbol}">–</button>
              <button class="px-2 border rounded" data-action="inc" data-symbol="${m.symbol}">+</button>
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
      return `
        <div class="flex justify-between items-center border-b py-1">
          <span>${item.name}</span>
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
}
