// Main app entry point
import { loadMaterials } from './materials.js';
import { loadItems } from './items.js';
import { renderHome } from './ui/components.js';
import { setupTheme } from './ui/theme.js';
import './pwa.js';

window.addEventListener('DOMContentLoaded', async () => {
  setupTheme();
  const [materials, items] = await Promise.all([
    loadMaterials(),
    loadItems()
  ]);
  renderHome(materials, items);
});
