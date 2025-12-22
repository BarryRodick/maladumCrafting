import { setupTheme } from './ui/theme.js';

let allTokens = [];
let searchQuery = '';

async function loadTokens() {
  const res = await fetch('tokens.json');
  return res.json();
}

function formatName(file) {
  return file
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function openModal(src, alt) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4';
  modal.innerHTML = `
    <div class="relative max-w-lg w-full bg-surface-dark rounded-2xl p-4">
      <button class="absolute top-4 right-4 text-white hover:text-primary">
        <span class="material-symbols-outlined">close</span>
      </button>
      <img src="${src}" alt="${alt}" class="w-full h-auto rounded-xl">
      <p class="text-center text-white font-bold mt-4">${alt}</p>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('click', (ev) => {
    if (ev.target === modal || ev.target.closest('button')) {
      document.body.removeChild(modal);
    }
  });
}

function getFilteredTokens() {
  if (!searchQuery) return allTokens;
  return allTokens.filter(token => {
    const name = formatName(token).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });
}

function render() {
  const grid = document.getElementById('tokenGrid');
  const emptyState = document.getElementById('emptyState');
  const tokenCount = document.getElementById('tokenCount');

  const filteredTokens = getFilteredTokens();

  // Update token count
  if (tokenCount) {
    tokenCount.textContent = `${filteredTokens.length} Token${filteredTokens.length !== 1 ? 's' : ''}`;
  }

  // Show/hide empty state
  if (filteredTokens.length === 0) {
    grid.innerHTML = '';
    emptyState?.classList.remove('hidden');
    return;
  }

  emptyState?.classList.add('hidden');

  grid.innerHTML = filteredTokens
    .map((token, index) => {
      const name = formatName(token);
      return `
        <div class="group relative bg-surface-dark rounded-[20px] p-3 hover:-translate-y-1 hover:shadow-[0_10px_30px_-10px_rgba(19,236,109,0.2)] transition-all duration-300 border border-transparent hover:border-primary/50 cursor-pointer overflow-hidden"
             style="animation: fadeIn 0.4s ease-out forwards; animation-delay: ${Math.min(index * 20, 500)}ms; opacity: 0;">
          <div class="aspect-square w-full rounded-xl bg-black/50 relative overflow-hidden flex items-center justify-center p-2">
            <img src="images/tokens/${token}" alt="${name}" 
                 class="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform duration-300 token-img" 
                 data-name="${name}"
                 loading="lazy"/>
          </div>
          <p class="mt-3 text-sm text-center text-white font-medium truncate group-hover:text-primary transition-colors" title="${name}">${name}</p>
        </div>`;
    })
    .join('');

  // Attach click handlers for modal
  grid.querySelectorAll('.token-img').forEach(img => {
    img.addEventListener('click', () => {
      openModal(img.src, img.dataset.name);
    });
  });
}

function renderLetterNav() {
  const letterNav = document.getElementById('letterNav');
  if (!letterNav) return;

  // Get unique first letters
  const letters = [...new Set(allTokens.map(token => {
    const name = formatName(token);
    return name.charAt(0).toUpperCase();
  }))].sort();

  letterNav.innerHTML = letters.map(letter => `
    <button class="size-7 rounded-lg bg-[#1a2e24] text-[#9db9a8] hover:bg-primary hover:text-[#0c1a12] transition-colors text-xs font-bold letter-btn" data-letter="${letter}">
      ${letter}
    </button>
  `).join('');

  // Attach click handlers
  letterNav.querySelectorAll('.letter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const letter = btn.dataset.letter;
      // Find first token starting with this letter
      const firstMatch = allTokens.find(token => formatName(token).charAt(0).toUpperCase() === letter);
      if (firstMatch) {
        const name = formatName(firstMatch);
        // Set search to the letter
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
          searchInput.value = letter;
          searchQuery = letter;
          render();
        }
      }
    });
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  setupTheme();
  allTokens = await loadTokens();

  // Sort tokens alphabetically by name
  allTokens.sort((a, b) => formatName(a).localeCompare(formatName(b)));

  render();
  renderLetterNav();

  // Setup search
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });
  }
});
