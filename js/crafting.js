// Craftability algorithm
export function getCraftableItems(inventory, items) {
  return items.filter(item => {
    const requiredResources = Object.entries(item.resources).filter(([key]) => key !== 'icon');
    return requiredResources.every(([sym, qty]) => (inventory[sym] ?? 0) >= qty);
  });
}
