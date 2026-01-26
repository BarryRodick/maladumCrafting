// Mobile navigation and draggable bottom sheet controller
import { loadInventory, updateInventory } from '../inventory.js';
import { loadFavourites } from '../favourites.js';
import { renderSettings, renderAllItemsView } from './components.js';

let cachedMaterials = [];
let cachedItems = [];
let currentPanelState = 'peek'; // 'peek', 'half', 'full'

// Rarity colors for material display
const rarityColors = {
    Common: { bg: 'bg-rarity-common', text: 'text-rarity-common', shadow: 'shadow-[0_0_8px_rgba(34,197,94,0.8)]' },
    Uncommon: { bg: 'bg-rarity-uncommon', text: 'text-rarity-uncommon', shadow: 'shadow-[0_0_8px_rgba(234,179,8,0.8)]' },
    Rare: { bg: 'bg-rarity-rare', text: 'text-rarity-rare', shadow: 'shadow-[0_0_8px_rgba(59,130,246,0.8)]' },
    '*': { bg: 'bg-purple-500', text: 'text-purple-400', shadow: 'shadow-[0_0_8px_rgba(168,85,247,0.8)]' }
};

// Drag state
let isDragging = false;
let startY = 0;
let startTranslateY = 0;
let panelHeight = 0;

export function initMobileNav(materials, items) {
    cachedMaterials = materials;
    cachedItems = items;

    // Only initialize on mobile
    if (window.innerWidth >= 768) return;

    setupBottomNavListeners();
    setupDraggablePanel();
    renderMobileInventory();
    updateInventorySummary();
}

function setupBottomNavListeners() {
    const navItems = document.getElementById('navItems');
    const navInventory = document.getElementById('navInventory');
    const navSettings = document.getElementById('navSettings');

    navItems?.addEventListener('click', () => {
        setActiveNavItem('items');
        setPanelState('peek');
        // Re-render items view
        const inventory = loadInventory();
        const favourites = loadFavourites();
        renderAllItemsView(cachedItems, inventory, favourites);
    });

    navInventory?.addEventListener('click', () => {
        // Toggle between peek and half
        if (currentPanelState === 'peek') {
            setPanelState('half');
        } else {
            setPanelState('peek');
        }
    });

    navSettings?.addEventListener('click', () => {
        setActiveNavItem('settings');
        setPanelState('peek');
        renderSettings();
    });
}

function setActiveNavItem(tab) {
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.tab === tab) {
            item.classList.add('active');
        }
    });
}

function setupDraggablePanel() {
    const panel = document.getElementById('inventoryPanel');
    const dragHandle = document.getElementById('inventoryDragHandle');

    if (!panel || !dragHandle) return;

    // Calculate panel height
    panelHeight = panel.offsetHeight;

    // Touch events
    dragHandle.addEventListener('touchstart', handleDragStart, { passive: false });
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    // Mouse events for testing on desktop
    dragHandle.addEventListener('mousedown', handleDragStart);
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);

    // Tap on header to toggle states
    dragHandle.addEventListener('click', () => {
        if (!isDragging) {
            cycleState();
        }
    });
}

function handleDragStart(e) {
    const panel = document.getElementById('inventoryPanel');
    if (!panel) return;

    isDragging = true;
    panel.classList.add('dragging');

    startY = e.type === 'touchstart' ? e.touches[0].clientY : e.clientY;

    // Get current translateY value
    const transform = window.getComputedStyle(panel).transform;
    if (transform !== 'none') {
        const matrix = new DOMMatrix(transform);
        startTranslateY = matrix.m42;
    } else {
        startTranslateY = 0;
    }

    panelHeight = panel.offsetHeight;

    if (e.type === 'touchstart') {
        e.preventDefault();
    }
}

function handleDragMove(e) {
    if (!isDragging) return;

    const panel = document.getElementById('inventoryPanel');
    if (!panel) return;

    const currentY = e.type === 'touchmove' ? e.touches[0].clientY : e.clientY;
    const deltaY = currentY - startY;
    let newTranslateY = startTranslateY + deltaY;

    // Clamp to prevent dragging too far
    const maxTranslate = panelHeight - 56; // Peek state
    const minTranslate = 0; // Full state

    newTranslateY = Math.max(minTranslate, Math.min(maxTranslate, newTranslateY));

    panel.style.transform = `translateY(${newTranslateY}px)`;

    if (e.type === 'touchmove') {
        e.preventDefault();
    }
}

function handleDragEnd() {
    if (!isDragging) return;

    isDragging = false;
    const panel = document.getElementById('inventoryPanel');
    if (!panel) return;

    panel.classList.remove('dragging');

    // Get current position
    const transform = window.getComputedStyle(panel).transform;
    let currentTranslateY = 0;
    if (transform !== 'none') {
        const matrix = new DOMMatrix(transform);
        currentTranslateY = matrix.m42;
    }

    // Determine which state to snap to based on position
    const peekThreshold = panelHeight - 56;
    const halfThreshold = panelHeight * 0.5;
    const quarterThreshold = panelHeight * 0.25;

    if (currentTranslateY > halfThreshold + 50) {
        setPanelState('peek');
    } else if (currentTranslateY > quarterThreshold) {
        setPanelState('half');
    } else {
        setPanelState('full');
    }

    // Clear inline transform
    panel.style.transform = '';
}

function cycleState() {
    switch (currentPanelState) {
        case 'peek':
            setPanelState('half');
            break;
        case 'half':
            setPanelState('full');
            break;
        case 'full':
            setPanelState('peek');
            break;
    }
}

function setPanelState(state) {
    const panel = document.getElementById('inventoryPanel');
    if (!panel) return;

    panel.classList.remove('peek', 'half', 'full');
    panel.classList.add(state);
    currentPanelState = state;

    // Update nav button active state
    const navInventory = document.getElementById('navInventory');
    if (navInventory) {
        if (state === 'half' || state === 'full') {
            navInventory.classList.add('active');
            document.getElementById('navItems')?.classList.remove('active');
        } else {
            navInventory.classList.remove('active');
            document.getElementById('navItems')?.classList.add('active');
        }
    }
}

function renderMobileInventory() {
    const listContainer = document.getElementById('mobileInventoryList');
    if (!listContainer) return;

    const inventory = loadInventory();

    const getStateClass = (count) => {
        if (count === 0) return { bg: 'bg-red-900/30', border: 'border-red-700/50', text: 'text-red-400' };
        if (count < 2) return { bg: 'bg-amber-900/20', border: 'border-amber-700/50', text: 'text-amber-400' };
        return { bg: 'bg-green-900/20', border: 'border-green-700/50', text: 'text-green-400' };
    };

    listContainer.innerHTML = cachedMaterials.map(m => {
        const count = inventory[m.symbol] || 0;
        const rarityColor = rarityColors[m.rarity] || rarityColors.Common;
        const stateClass = getStateClass(count);

        return `
      <div class="flex items-center gap-3 px-4 py-3 rounded-xl ${stateClass.bg} border ${stateClass.border} transition-all" data-material="${m.symbol}">
        <div class="size-8 rounded-full ${rarityColor.bg} ${rarityColor.shadow} flex items-center justify-center text-sm font-bold text-white">${m.symbol}</div>
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-semibold truncate">${m.name}</p>
          <p class="text-xs text-[#9db9a8]">${m.rarity}</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="size-10 rounded-full bg-[#1a2e24] text-white hover:bg-primary hover:text-[#0c1a12] transition-colors flex items-center justify-center text-lg font-bold active:scale-95" 
                  data-action="dec" data-symbol="${m.symbol}" aria-label="Decrease ${m.name}">−</button>
          <span class="w-8 text-center text-lg font-bold ${stateClass.text} count">${count}</span>
          <button class="size-10 rounded-full bg-[#1a2e24] text-white hover:bg-primary hover:text-[#0c1a12] transition-colors flex items-center justify-center text-lg font-bold active:scale-95" 
                  data-action="inc" data-symbol="${m.symbol}" aria-label="Increase ${m.name}">+</button>
        </div>
      </div>
    `;
    }).join('');

    // Event delegation for inventory buttons
    listContainer.onclick = null; // Clear old listener
    listContainer.addEventListener('click', handleInventoryClick);
}

function handleInventoryClick(e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const sym = btn.dataset.symbol;
    const delta = btn.dataset.action === 'inc' ? 1 : -1;
    const inv = updateInventory(sym, delta);

    // Update mobile inventory display
    updateMaterialDisplay(sym, inv[sym] || 0);

    // Also update the desktop sidebar if visible
    const sidebarCountEl = document.querySelector(`#materialsList [data-material="${sym}"] .count`);
    if (sidebarCountEl) sidebarCountEl.textContent = inv[sym] || 0;

    // Update summary
    updateInventorySummary();

    // Refresh items view in background
    const favourites = loadFavourites();
    renderAllItemsView(cachedItems, inv, favourites);
}

function updateMaterialDisplay(sym, count) {
    const listContainer = document.getElementById('mobileInventoryList');
    if (!listContainer) return;

    const getStateClass = (count) => {
        if (count === 0) return { bg: 'bg-red-900/30', border: 'border-red-700/50', text: 'text-red-400' };
        if (count < 2) return { bg: 'bg-amber-900/20', border: 'border-amber-700/50', text: 'text-amber-400' };
        return { bg: 'bg-green-900/20', border: 'border-green-700/50', text: 'text-green-400' };
    };

    const countEl = listContainer.querySelector(`[data-material="${sym}"] .count`);
    if (countEl) countEl.textContent = count;

    const itemEl = listContainer.querySelector(`[data-material="${sym}"]`);
    if (itemEl) {
        const newState = getStateClass(count);
        itemEl.className = `flex items-center gap-3 px-4 py-3 rounded-xl ${newState.bg} border ${newState.border} transition-all`;
        const countSpan = itemEl.querySelector('.count');
        if (countSpan) {
            countSpan.className = `w-8 text-center text-lg font-bold ${newState.text} count`;
        }
    }
}

function updateInventorySummary() {
    const summaryContainer = document.getElementById('inventorySummary');
    if (!summaryContainer) return;

    const inventory = loadInventory();

    let totalItems = 0;
    let emptyCount = 0;
    let lowCount = 0;

    cachedMaterials.forEach(m => {
        const count = inventory[m.symbol] || 0;
        totalItems += count;
        if (count === 0) emptyCount++;
        else if (count < 2) lowCount++;
    });

    let badges = '';

    if (totalItems > 0) {
        badges += `<span class="inventory-summary-badge">${totalItems} total</span>`;
    }

    if (emptyCount > 0) {
        badges += `<span class="inventory-summary-badge danger">${emptyCount} empty</span>`;
    } else if (lowCount > 0) {
        badges += `<span class="inventory-summary-badge warning">${lowCount} low</span>`;
    }

    summaryContainer.innerHTML = badges;

    // Update nav indicator
    const navInventory = document.getElementById('navInventory');
    if (navInventory) {
        if (totalItems > 0) {
            navInventory.classList.add('has-items');
        } else {
            navInventory.classList.remove('has-items');
        }
    }
}

// Re-initialize on resize (desktop <-> mobile switch)
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        if (window.innerWidth >= 768) {
            setPanelState('peek');
        }
    }, 250);
});

export { setPanelState, updateInventorySummary };
