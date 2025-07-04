// Inventory management
import { loadState, saveState } from './localStorageUtil.js';

const INVENTORY_KEY = 'maladum_inventory';
const DEFAULT_INVENTORY = {};

export function loadInventory() {
  return loadState(INVENTORY_KEY, DEFAULT_INVENTORY);
}

export function saveInventory(inventory) {
  saveState(INVENTORY_KEY, inventory);
}

export function updateInventory(symbol, delta) {
  const inv = loadInventory(); // Uses the new loadState with default {}
  inv[symbol] = (inv[symbol] || 0) + delta;
  if (inv[symbol] < 0) {
    inv[symbol] = 0;
  }
  // Consider if inv[symbol] === 0 and you want to remove the key
  // e.g. if (inv[symbol] === 0) delete inv[symbol];
  saveInventory(inv);
  return inv;
}

// Function to clear inventory might be useful here too, or can be handled by removeItem in localStorageUtil
export function clearInventory() {
  saveInventory(DEFAULT_INVENTORY); // Or use removeItem(INVENTORY_KEY) from localStorageUtil.js
                                  // For consistency with how loadInventory expects an object, saving default is safer.
  return DEFAULT_INVENTORY;
}
