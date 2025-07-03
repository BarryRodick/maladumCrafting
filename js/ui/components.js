// UI rendering helpers (stub)
export function renderHome(materials, items) {
  const app = document.getElementById('app');
  app.innerHTML = `
    <header class="p-4 flex justify-between items-center">
      <h1 class="text-xl font-bold">Maladum Crafting</h1>
      <button id="settingsBtn" class="text-sm">⚙️</button>
    </header>
    <main class="p-4">
      <div id="materialsGrid" class="mb-4"></div>
      <div id="craftableList"></div>
    </main>
  `;
  // TODO: Render materials grid and craftable list
}
