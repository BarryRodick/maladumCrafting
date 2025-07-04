import { setupTheme } from './ui/theme.js';

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
  modal.classList.add('icon-modal');
  modal.innerHTML = `
    <div class="icon-modal-content">
      <span class="icon-modal-close">&times;</span>
      <img src="${src}" alt="${alt}" class="zoomed-icon">
    </div>`;
  document.body.appendChild(modal);
  modal.querySelector('.icon-modal-close').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
}

function render(tokens) {
  const grid = document.getElementById('tokenGrid');
  grid.innerHTML = tokens
    .map(token => {
      const name = formatName(token);
      return `
        <div class="card flex flex-col items-center">
          <img src="images/tokens/${token}" alt="${name}" class="w-20 h-20 cursor-pointer token-img" data-name="${name}"/>
          <span class="mt-2 text-sm text-center">${name}</span>
        </div>`;
    })
    .join('');
  grid.querySelectorAll('.token-img').forEach(img => {
    img.addEventListener('click', () => {
      openModal(img.src, img.dataset.name);
    });
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  setupTheme();
  const tokens = await loadTokens();
  render(tokens);
});
