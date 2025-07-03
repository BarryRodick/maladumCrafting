# Maladum Crafting Companion App – Functional Specification (v1.1 – 2025‑07‑03)

## 1 Purpose

A **mobile‑first**, completely **static** web tool (deployed via **GitHub Pages**) that lets Maladum players enter their available **materials** and instantly see every **item** they can craft, plus any deficits for starred favourites. The app must run entirely in‑browser, with no servers, accounts, or file uploads.

## 2 Target Users & Personas

| Persona             | Needs                                                             |
| ------------------- | ----------------------------------------------------------------- |
| **Solo skirmisher** | Track a single hero’s growing stash on a phone during game nights |
| **Campaign host**   | Keep party‑wide stock on a tablet and share the screen            |
| **Collector**       | Explore “what‑if” builds, bookmark dream gear and calculate costs |

## 3 Core Feature List

* **Inventory manager** – add/remove material counts
* **Craftable list** – live filter of all items you can currently build
* **Favourites / wish‑list** – star items and highlight deficits
* **Missing‑material breakdown** – consolidated shopping list with rarity & estimated cost
* **Advanced filters** – by expansion, item type, size, relic requirement, rarity
* **Item detail panel** – art, description, full recipe, alternative recipes if variants exist
* **Relic & token tracking** – show token needs distinctly from normal materials
* **Offline‑first & PWA** – usable without signal at the club table (caches data in IndexedDB)

> **Removed**: any upload, import, export, cloud‑sync, or QR features

## 4 Detailed Feature Descriptions

### 4.1 Inventory Management

* Tap + / – buttons beside each material symbol (larger hit‑areas for thumbs)
* Materials grouped by rarity with colour badges

### 4.2 Crafting Suggestions

* Re‑computes instantly on every inventory change
* Sort presets: *Alphabetical*, *Fewest materials left*, *Highest relic value*, *Cost ascending*

### 4.3 Favourites & Wish‑List

* Any item card can be ⭐‑toggled
* Wish view displays **☒ missing** chips per material
* Option to **hide fulfilled favourites** once crafted

### 4.4 Missing‑Material Summary

| Column | Notes                                      |
| ------ | ------------------------------------------ |
| Symbol | links to Material page                     |
| Name   | rarity colour dot                          |
| Needed | aggregated shortfall across favourites     |
| In Bag | current inventory count                    |
| Cost   | `needed × base_cost` from `materials.json` |

### 4.5 Item Detail & Costs

* Pulls recipe from `items.json` fileciteturn0file1 and material metadata from `materials.json` fileciteturn0file0
* Shows **total\_cost** for reference; optional *dynamic cost* if house‑rules allow variable pricing

### 4.6 Filters & Sorting

* Type (Weapon/Armour/etc.)
* Expansion (Of Ale and Adventure, Oblivion’s Maw…)
* Size (XS – XL)
* Relic only / exclude relics
* Text search (fuzzy)

### 4.7 Expansion Toggle

Checkboxes per expansion hide unavailable gear, keeping UI small for new players.

### 4.8 Relic & Token Tracking

Separate counters for **relics** and **tokens** used by rare materials/items.

### 4.9 Offline Support

* Service worker precaches HTML/CSS/JS and JSON data
* Inventory, favourites, and settings saved to `localStorage` or `IndexedDB`

### 4.10 Settings / Preferences

* Toggle dark‑mode
* Choose currency symbol / region cost formatting
* Confirm before clearing inventory

## 5 Data Model

```mermaid
classDiagram
  class Material {
    string name
    string symbol PK
    string rarity
    number base_cost
    string notes
  }
  class Item {
    string name PK
    string expansion
    string type
    string size
    Map<String,int> resources  // symbol→qty
    number total_cost
    int relic
  }
  class UserInventory {
    Map<String,int> stock  // symbol→qty owned
  }
  class Favourite {
    string itemName FK→Item.name
  }
  Material "1" -- "*" Item : referenced by
  Item "*" -- "*" Favourite : starred
```

## 6 Craftability Algorithm (Vanilla JS)

```js
function getCraftableItems(inventory, items) {
  return items.filter(item =>
    Object.entries(item.resources).every(([sym, qty]) =>
      (inventory[sym] ?? 0) >= qty));
}
```

*Complexity*: *O(I × R)* where *I* = #items, *R* ≤ 5.

## 7 UI / UX Flow (mobile‑first wireframe outline)

```
[Home]
  ├─[Materials Grid]  (scrollable, thumb‑friendly)
  │    W 2   S 1  T 0 ...
  └─[Craftable List]
        ▸ Arrow – Viscous/Sharp
        ▸ Shillelagh (disabled – missing M)

[Item Detail Sheet]
  Image | Stats | ⭐
  Needed: W×1 S×1
  Craft (‑‑)

[Favourites]
  ▾ Missing materials table (§4.4)

[Settings]
  – Dark‑mode toggle
  – Clear inventory
```

## 8 Technology Stack (Static‑Site Friendly)

| Layer        | Recommendation                                          |
| ------------ | ------------------------------------------------------- |
| **Frontend** | **HTML5** + **Vanilla JavaScript** (ES6 modules)        |
| **Styling**  | Tailwind CSS via CDN (mobile‑first classes)             |
| **Build**    | None required – optional esbuild/env embroidery for dev |
| **PWA**      | Service Worker (Workbox CDN) + IndexedDB (`idb‑keyval`) |
| **Hosting**  | GitHub Pages (static)                                   |
| **Testing**  | Jest + Playwright (headless mobile emulation)           |

## 9 Future Enhancements

* **Group inventories** for co‑op campaigns
* **Material market** with price history and trading suggestions
* **Push reminders** (requires backend; stretch goal)
* **Accessibility** improvements (screen‑reader labels, larger hit‑areas)
* **Multilingual UI** driven by i18n JSON bundles

## 10 Appendix

* **Materials** in base game: 16 (common → rare)
* **Items** loaded: 60+ across 3 expansions (auto‑parsed from JSON)

― **End of Spec**
