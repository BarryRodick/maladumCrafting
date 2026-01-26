// Main app entry point
import { loadMaterials } from './materials.js';
import { loadItems } from './items.js';
import { renderHome } from './ui/components.js';
import { initializeFavourites } from './favourites.js';
import { setupTheme } from './ui/theme.js';
import { applyRippleEffect } from './ui/effects.js'; // Import ripple effect
import { initMobileNav } from './ui/mobileNav.js'; // Mobile bottom navigation
import './pwa.js';

const APP_VERSION = 'v2.1.0';

window.addEventListener('DOMContentLoaded', async () => {
  initializeFavourites();
  setupTheme();
  applyRippleEffect(); // Initialize ripple effect listeners globally

  const [materials, items] = await Promise.all([
    loadMaterials(),
    loadItems()
  ]);
  renderHome(materials, items, APP_VERSION); // This will render buttons that will now get the ripple
  initMobileNav(materials, items); // Initialize mobile bottom navigation
});
