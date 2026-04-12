import { loadSettings } from '../storage.js';

// Dark mode and theming
export function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function setupTheme() {
  const settings = loadSettings();
  applyTheme(settings.darkMode);
}
