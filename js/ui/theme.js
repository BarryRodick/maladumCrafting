// Dark mode and theming
export function applyTheme(isDark) {
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function setupTheme() {
  const settings = JSON.parse(localStorage.getItem('maladum_settings') || '{}');
  applyTheme(settings.darkMode);
}
