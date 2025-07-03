// Craftability algorithm
export function getCraftableItems(inventory, items) {
  return items.filter(item =>
    Object.entries(item.resources).every(([sym, qty]) =>
      (inventory[sym] ?? 0) >= qty));
}
