// Inventory management
const STORAGE_KEY = 'maladum_inventory';

export function loadInventory() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

export function saveInventory(inventory) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
}

export function updateInventory(symbol, delta) {
  const inv = loadInventory();
  inv[symbol] = (inv[symbol] || 0) + delta;
  if (inv[symbol] < 0) inv[symbol] = 0;
  saveInventory(inv);
  return inv;
}
