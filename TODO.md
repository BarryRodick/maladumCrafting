# Maladum Crafting Companion - Technical Debt & Issues

> **Audit Date**: 2026-01-17  
> **Auditor**: Code Review Session  
> **Status**: In progress

---

## 🔴 HIGH PRIORITY - Bugs & Critical Issues

### 1. Missing Error Handling for JSON Fetches
- **Files**: `js/materials.js`, `js/items.js`, `js/tokenGallery.js`
- **Issue**: No `try/catch` or `.catch()` for fetch failures. If JSON files are unreachable (offline without SW cache), the app will crash silently.
- **Fix**: Add proper error handling with user-friendly error messages.
```javascript
// Example fix:
export async function loadMaterials() {
  try {
    const res = await fetch('materials.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.error('Failed to load materials:', err);
    return []; // Return empty array as fallback
  }
}
```
- [x] **FIXED** ✅

---

### 2. Missing PWA Icon (icon-512.png)
- **Files**: `manifest.webmanifest` references `images/icon-512.png`, `service-worker.js` references it
- **Issue**: The file doesn't exist in `images/` folder (only `icon-192.png` exists).
- **Impact**: PWA installation may fail or show broken icon on some devices.
- **Fix**: Generate a 512x512 icon and add it to `images/`.
- [x] **FIXED** ✅

---

### 3. Memory Leak: Event Listeners Not Cleaned Up
- **File**: `js/ui/components.js` function `renderMaterialsList()` (lines 229-258)
- **Issue**: Adds click listener to `listContainer` every time `renderHome()` is called. This can cause duplicate handler invocations over time.
- **Fix**: Use event delegation pattern properly or remove old listeners before adding new ones.
- [x] **FIXED** ✅ (Used AbortController to track and clean up listeners)

---

### 4. Rarity "*" Not Handled
- **File**: `materials.json` line 103, `js/ui/components.js`
- **Issue**: "NECROTIC FLUIDS" has `"rarity": "*"` which isn't handled in `rarityColors` object. Falls back to `Common`, but this is unclear behavior.
- **Fix**: Add explicit handling for special rarity types or standardize the data.
- [x] **FIXED** ✅ (Added purple color scheme for "*" rarity)

---

### 5. Version Mismatch
- **File**: `js/app.js` line 10 vs `index.html` line 100
- **Issue**: `APP_VERSION = 'v2.0.1'` in app.js, but sidebar shows hardcoded `v2.0.0` initially.
- **Fix**: Remove hardcoded version from HTML or sync them.
- [x] **FIXED** ✅ (Synced to v2.0.1)

---

## 🟡 MEDIUM PRIORITY - Code Quality & UX Issues

### 6. Duplicate CSS Keyframes
- **File**: `styles.css` lines 262-276 and 721-730
- **Issue**: `@keyframes fadeIn` is defined twice identically.
- **Fix**: Remove duplicate definition.
- [x] **FIXED** ✅

---

### 7. Theme CSS Variables Inconsistency
- **Files**: `theme.css` and `index.html` tailwind config
- **Issue**: Theme.css defines `--dark-bg: #121212` but Tailwind uses `background-dark: #102218`. There's also `--bg-dark: #1e1e1e` in theme.css. Three different "dark background" values.
- **Fix**: Consolidate to a single source of truth for color definitions.
- [x] **FIXED** ✅ (Standardized to #102218 across theme.css and Tailwind config)

---

### 8. Unused `storage.js` Functions
- **File**: `js/storage.js`
- **Issue**: `loadSettings()` and `saveSettings()` are imported in `components.js` but `saveSettings()` is never called. Settings are loaded but theme toggle doesn't exist in the UI.
- **Fix**: Either implement the theme toggle UI or remove unused code.
- [x] **FIXED** ✅ (Implemented Theme Toggle in Settings using loadSettings/saveSettings)

---

### 9. Hardcoded localStorage Key in renderSettings()
- **File**: `js/ui/components.js` line 564
- **Issue**: Uses `localStorage.removeItem('maladum_inventory')` directly instead of importing and using `clearInventory()` from `inventory.js`.
- **Fix**: Use the existing `clearInventory()` function for consistency.
- [x] **FIXED** ✅

---

### 10. toggleSidebar() Defined Twice
- **Files**: `index.html` line 141-146, `tokens.html` line 182-187
- **Issue**: Same function is defined inline in both HTML files.
- **Fix**: Move to a shared utility module and import in both pages.
- [x] **FIXED** ✅ (Created js/ui/utils.js with shared toggleSidebar)

---

### 11. Service Worker Path Issue
- **File**: `js/pwa.js` line 4
- **Issue**: `navigator.serviceWorker.register('service-worker.js')` uses relative path.
- **Fix**: Consider using absolute path or `./service-worker.js` with scope.
- [x] **FIXED** ✅ (Updated to './service-worker.js' with explicit scope)

---

### 12. Typo in Item Name
- **File**: `items.json` line 188
- **Issue**: `"Action Poition"` should be `"Action Potion"`.
- **Fix**: Correct the spelling.
- [x] **FIXED** ✅

---

### 13. Missing ARIA Labels
- **Files**: Multiple buttons in `components.js`
- **Issue**: The icon zoom modal's close button doesn't have an aria-label.
- **Fix**: Add `aria-label="Close modal"` to the close button.
- [x] **FIXED** ✅

---

## 🟢 LOW PRIORITY - Optimizations & Polish

### 14. Large Texture File
- **File**: `images/parchment-texture.png`
- **Size**: 2.2MB – Very large for a texture.
- **Fix**: Compress using WebP format or optimize PNG. Target: <200KB.
- [ ] **FIXED** (Pending manual optimization/tooling)

---

### 15. No Debounce on Search Input
- **Files**: `js/ui/components.js` line 401, `js/tokenGallery.js` line 142
- **Issue**: Search triggers on every keystroke, re-rendering the entire grid.
- **Fix**: Add debounce utility (300-500ms delay).
- [x] **FIXED** ✅ (Added 300ms debounce to search in both main app and gallery)

---

### 16. theme.css Not Linked in tokens.html
- **File**: `tokens.html`
- **Issue**: Links `styles.css` but not `theme.css`, causing inconsistent variable definitions.
- **Fix**: Add `<link rel="stylesheet" href="theme.css">` to tokens.html.
- [x] **FIXED** ✅

---

### 17. Duplicate CSS Properties
- **File**: `styles.css` lines 475-478
- **Issue**: `.items-toolbar` has `flex-wrap` and `gap` defined twice.
- **Fix**: Remove duplicate declarations.
- [x] **FIXED** ✅

---

## 📊 Summary

| Priority | Total Issues | Fixed |
|----------|-------------|-------|
| 🔴 High | 5 | 5 |
| 🟡 Medium | 8 | 8 |
| 🟢 Low | 4 | 3 |
| **Total** | **17** | **16** |

---

## Progress Log

| Date | Issues Fixed | Notes |
|------|-------------|-------|
| 2026-01-17 | 0 | Initial audit completed |
| 2026-01-17 | 11 | Fixed high priority issues #1-5, medium #6, #9, #12, #13, low #16, #17 |
| 2026-01-17 | 5 | Fixed medium #7, #8, #10, #11, low #15 |

---

*Last updated: 2026-01-17*
