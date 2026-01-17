// Shared UI utilities

/**
 * Toggle sidebar visibility (mobile responsive)
 */
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar?.classList.toggle('sidebar-hidden');
    overlay?.classList.toggle('active');
}

/**
 * Debounce utility - delays function execution until after wait ms have elapsed
 * since the last time the debounced function was invoked.
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Auto-initialize sidebar toggle if running in browser context
if (typeof window !== 'undefined') {
    window.toggleSidebar = toggleSidebar;
}
