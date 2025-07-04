# Maladum Crafting Companion

A simple, mobile-first tool for tracking crafting materials and items in the Maladum board game. The complete design goals and feature breakdown are recorded in [summary.md](summary.md), which specifies an entirely static site that works offline and stores data in the browser.

## Running locally

1. Install a small static server such as [`serve`](https://www.npmjs.com/package/serve):

   ```bash
   npm install -g serve
   ```

2. Start the server from the project folder and open `index.html` in your browser:

   ```bash
   serve .
   ```

   The default address is `http://localhost:3000`.

## Features

- Offline-first PWA with a service worker and web manifest.
- Dark‑mode toggle available from the **Settings** screen.
- Instant filtering of craftable items as you adjust inventory counts.

For layout ideas, see the [Maladum Event Cards repo](https://github.com/BarryRodick/MaladumEventCards).

