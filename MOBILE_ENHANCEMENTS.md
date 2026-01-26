# Maladum Crafting Companion - Mobile Enhancement Plan

> **Created**: 2026-01-26  
> **Status**: Planning  
> **Goal**: Transform the web app into a native-feeling mobile experience for game-night use.

---

## 🎯 Executive Summary

The Maladum Crafting Companion is already a PWA with offline support, but the UI was designed with a desktop sidebar paradigm. This plan modernizes the mobile experience to feel like a native app, prioritizing **one-handed, thumb-zone-friendly** interactions during tabletop play.

---

## 📱 Enhancement Proposals (Prioritized)

### ⭐ TIER 1: HIGH IMPACT / MEDIUM EFFORT (Recommended First)

#### 1. Bottom Navigation Bar
- **Current State**: Navigation is split between a top header and a hidden left sidebar. On mobile, reaching the hamburger menu in the top-left is awkward.
- **Proposed Change**: Add a fixed bottom navigation bar with 4 tabs:
  - 🏠 **Items** (current main view)
  - 📦 **Inventory** (opens the material manager)
  - 🎨 **Gallery** (Token Gallery)
  - ⚙️ **Settings**
- **Why First**: This is the single most impactful change. It immediately signals "this is a mobile app" and puts all primary actions within the thumb zone. Every major mobile app (Instagram, Spotify, etc.) uses this pattern.
- **Effort**: ~2-3 hours
- **Files Affected**: `index.html`, `tokens.html`, `styles.css`, `js/ui/components.js`
- [x] **COMPLETE** ✅ (2026-01-26)

---

#### 2. Bottom Sheet Inventory Controller
- **Current State**: Users must open the sidebar to adjust materials, which covers the entire screen and hides the items list.
- **Proposed Change**: Replace the sidebar inventory with a **draggable bottom sheet** that:
  - Can be "peeked" (shows 2-3 materials) at the bottom of the screen.
  - Can be dragged to half-screen to show all materials while still seeing items behind it.
  - Updates the items list in real-time as you adjust counts.
- **Why Second**: This solves the core workflow friction—tweaking materials while seeing which items become craftable. It's the "killer feature" for game-night use.
- **Effort**: ~3-4 hours
- **Files Affected**: `index.html`, `styles.css`, `js/ui/components.js`, new `js/ui/mobileNav.js`
- [x] **COMPLETE** ✅ (2026-01-26)

---

### 🔷 TIER 2: MEDIUM IMPACT / LOW EFFORT (Quick Wins)

#### 3. Sticky Summary Footer
- **Current State**: Users must scroll through items to understand their crafting status.
- **Proposed Change**: A small, translucent sticky bar above the bottom nav showing:
  - *"✅ 3 Ready to Craft"* or *"⚠️ Missing 2 materials for 1 Favorite"*
- **Why**: Provides instant status awareness without any interaction.
- **Effort**: ~1 hour
- **Files Affected**: `index.html`, `styles.css`, `js/ui/components.js`
- [ ] Not Started

---

#### 4. View Density Toggle (List vs. Grid)
- **Current State**: Large, beautiful item cards. Great for browsing, but requires lots of scrolling with 60+ items.
- **Proposed Change**: Add a toggle in the header to switch between:
  - **Grid View** (current): Large cards with images.
  - **List View**: Compact rows with icon, name, rarity dot, and missing materials count.
- **Why**: Power users with large inventories can find items faster. Newcomers can still enjoy the visual cards.
- **Effort**: ~1.5 hours
- **Files Affected**: `js/ui/components.js`, `styles.css`
- [ ] Not Started

---

#### 5. PWA Polish: Safe Areas & Install Prompt
- **Current State**: PWA works but doesn't respect iPhone notch/home indicator safe areas. No custom install prompt.
- **Proposed Changes**:
  - Add `env(safe-area-inset-*)` CSS to respect device safe areas.
  - Create a beautiful "Add to Home Screen" banner that appears once, then remembers dismissal.
  - Add subtle "Offline" indicator when network is unavailable.
- **Why**: These small touches make the difference between "a website" and "my app."
- **Effort**: ~1.5 hours
- **Files Affected**: `index.html`, `styles.css`, `manifest.webmanifest`, `js/pwa.js`
- [ ] Not Started

---

### 🔹 TIER 3: LOWER IMPACT / HIGHER EFFORT (Future Polish)

#### 6. Haptic & Gesture Feedback
- **Haptics**: Use `navigator.vibrate(10)` for a subtle "click" on +/- buttons.
- **Gestures**: Swipe-right on an item card to favorite it. Swipe-left to see its details.
- **Page Transitions**: Smooth slide animations between views.
- **Why Later**: These are delightful polish features, but don't fundamentally change the workflow.
- **Effort**: ~3 hours
- **Files Affected**: `js/ui/components.js`, `js/ui/effects.js`
- [ ] Not Started

---

#### 7. Floating Action Button (FAB)
- **Proposed**: A primary green FAB in the bottom-right corner.
- **Options**:
  - Tap to focus search.
  - Long-press to open a quick-add material dial.
- **Why Later**: With Bottom Nav + Bottom Sheet, the FAB may become redundant. Re-evaluate after Tier 1 is complete.
- **Effort**: ~1 hour
- **Files Affected**: `index.html`, `styles.css`, `js/ui/components.js`
- [ ] Not Started

---

## 📋 Recommended Implementation Order

| Phase | Enhancements | Cumulative Effort |
|-------|--------------|-------------------|
| **Phase 1** | Bottom Navigation Bar | ~2-3 hours |
| **Phase 2** | Bottom Sheet Inventory | ~5-7 hours total |
| **Phase 3** | Sticky Summary + List View Toggle | ~8-10 hours total |
| **Phase 4** | PWA Polish (Safe Areas, Install Prompt) | ~10-12 hours total |
| **Phase 5** | Haptics, Gestures, FAB (optional polish) | ~14-16 hours total |

---

## 🏁 Success Criteria

After completing Phases 1-4, the app should:
1. ✅ Be usable entirely with one thumb on a phone.
2. ✅ Allow real-time inventory tweaking while viewing items.
3. ✅ Feel indistinguishable from a native app when installed to the home screen.
4. ✅ Scale gracefully from phone → tablet → desktop.

---

## 📝 Notes

- **No Breaking Changes**: All enhancements are additive. Desktop sidebar experience remains unchanged for large screens.
- **Progressive Enhancement**: Bottom Sheet and gestures will gracefully degrade if unsupported.
- **Testing**: Each phase should be tested on iOS Safari, Android Chrome, and desktop before moving to the next.

---

*Last updated: 2026-01-26*
