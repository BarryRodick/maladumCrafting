// Main app entry point
import { loadMaterials } from './materials.js';
import { loadItems } from './items.js';
import { renderHome } from './ui/components.js';
import { setupTheme } from './ui/theme.js';
import { applyRippleEffect } from './ui/effects.js'; // Import ripple effect
import './pwa.js';

window.addEventListener('DOMContentLoaded', async () => {
  setupTheme();
  applyRippleEffect(); // Initialize ripple effect listeners globally

  const [materials, items] = await Promise.all([
    loadMaterials(),
    loadItems()
  ]);
  renderHome(materials, items); // This will render buttons that will now get the ripple
});
